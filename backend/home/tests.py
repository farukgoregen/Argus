"""
Tests for home feed endpoint.

Tests cover:
- Authentication requirement (401 when unauthenticated)
- page_size capped at 20
- Pagination fields correct
- Ordering rules (in-stock first when included)
- Search ranking (name matches first)
- Recent searches functionality
- Filter combinations
"""
from decimal import Decimal
from datetime import timedelta
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.utils import timezone
import json

from products.models import Product
from home.models import SearchEvent

User = get_user_model()


class HomeFeedAuthenticationTestCase(TestCase):
    """Test cases for authentication requirements."""

    def setUp(self):
        """Set up test fixtures."""
        self.client = Client()
        self.home_feed_url = '/api/home-feed'

    def test_unauthenticated_returns_401(self):
        """Test that unauthenticated requests return 401."""
        response = self.client.get(self.home_feed_url)
        self.assertEqual(response.status_code, 401)


class HomeFeedTestCase(TestCase):
    """Test cases for home feed endpoint."""

    def setUp(self):
        """Set up test fixtures."""
        self.client = Client()
        self.home_feed_url = '/api/home-feed'
        
        # Create test user
        self.user = User.objects.create_user(
            email='buyer@example.com',
            username='buyer',
            password='TestPass123!',
            user_type='buyer'
        )
        
        # Create test sellers
        self.seller1 = User.objects.create_user(
            email='seller1@example.com',
            username='seller1',
            password='TestPass123!',
            user_type='supplier'
        )
        self.seller2 = User.objects.create_user(
            email='seller2@example.com',
            username='seller2',
            password='TestPass123!',
            user_type='supplier'
        )
        
        # Create products with different stock levels
        # In-stock product (recently updated)
        self.product_in_stock = Product.objects.create(
            owner=self.seller1,
            product_name='In Stock Product',
            product_category='Electronics',
            description='A product that is in stock',
            unit_price=Decimal('99.99'),
            stock_quantity=100,
            sell_quantity=1,
            is_active=True,
        )
        
        # Low stock product
        self.product_low_stock = Product.objects.create(
            owner=self.seller1,
            product_name='Low Stock Product',
            product_category='Electronics',
            description='A product with low stock',
            unit_price=Decimal('49.99'),
            stock_quantity=5,
            sell_quantity=1,
            is_active=True,
        )
        
        # Out of stock product
        self.product_out_of_stock = Product.objects.create(
            owner=self.seller1,
            product_name='Out of Stock Product',
            product_category='Electronics',
            description='A product that is out of stock',
            unit_price=Decimal('29.99'),
            stock_quantity=0,
            sell_quantity=1,
            is_active=True,
        )
        
        # Inactive product (should not appear)
        self.product_inactive = Product.objects.create(
            owner=self.seller1,
            product_name='Inactive Product',
            product_category='Electronics',
            description='An inactive product',
            unit_price=Decimal('19.99'),
            stock_quantity=50,
            sell_quantity=1,
            is_active=False,
        )
        
        # Product from seller2
        self.product_seller2 = Product.objects.create(
            owner=self.seller2,
            product_name='Seller2 Product',
            product_category='Clothing',
            description='A product from seller 2',
            unit_price=Decimal('39.99'),
            stock_quantity=25,
            sell_quantity=1,
            is_active=True,
        )
        
        # Get auth token
        self.access_token = self._get_access_token()
    
    def _get_access_token(self):
        """Get JWT access token for the test user."""
        response = self.client.post(
            '/api/auth/login',
            data=json.dumps({
                'email': 'buyer@example.com',
                'password': 'TestPass123!'
            }),
            content_type='application/json'
        )
        if response.status_code == 200:
            return response.json().get('access')
        return None
    
    def _auth_headers(self):
        """Get authorization headers."""
        return {'HTTP_AUTHORIZATION': f'Bearer {self.access_token}'}
    
    def test_authenticated_returns_200(self):
        """Test that authenticated requests return 200."""
        response = self.client.get(self.home_feed_url, **self._auth_headers())
        self.assertEqual(response.status_code, 200)
    
    def test_response_structure(self):
        """Test that response has correct structure."""
        response = self.client.get(self.home_feed_url, **self._auth_headers())
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertIn('sections', data)
        self.assertEqual(len(data['sections']), 2)
        
        # Check section keys
        section_keys = [s['key'] for s in data['sections']]
        self.assertIn('recent_searches', section_keys)
        self.assertIn('all_products', section_keys)
    
    def test_all_products_section_structure(self):
        """Test that all_products section has correct structure."""
        response = self.client.get(self.home_feed_url, **self._auth_headers())
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        all_products = next(s for s in data['sections'] if s['key'] == 'all_products')
        
        self.assertIn('title', all_products)
        self.assertIn('pagination', all_products)
        self.assertIn('items', all_products)
        
        # Check pagination structure
        pagination = all_products['pagination']
        self.assertIn('page', pagination)
        self.assertIn('page_size', pagination)
        self.assertIn('total', pagination)
        self.assertIn('total_pages', pagination)
        self.assertIn('has_next', pagination)
        self.assertIn('has_prev', pagination)
    
    def test_page_size_capped_at_20(self):
        """Test that page_size is capped at 20 even if larger value requested."""
        response = self.client.get(
            f'{self.home_feed_url}?page_size=50',
            **self._auth_headers()
        )
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        all_products = next(s for s in data['sections'] if s['key'] == 'all_products')
        self.assertEqual(all_products['pagination']['page_size'], 20)
    
    def test_inactive_products_excluded(self):
        """Test that inactive products are not returned."""
        response = self.client.get(self.home_feed_url, **self._auth_headers())
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        all_products = next(s for s in data['sections'] if s['key'] == 'all_products')
        
        product_ids = [str(item['id']) for item in all_products['items']]
        self.assertNotIn(str(self.product_inactive.id), product_ids)
    
    def test_hide_out_of_stock_filter(self):
        """Test that hide_out_of_stock filter works."""
        response = self.client.get(
            f'{self.home_feed_url}?hide_out_of_stock=true',
            **self._auth_headers()
        )
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        all_products = next(s for s in data['sections'] if s['key'] == 'all_products')
        
        product_ids = [str(item['id']) for item in all_products['items']]
        self.assertNotIn(str(self.product_out_of_stock.id), product_ids)
    
    def test_in_stock_products_first(self):
        """Test that in-stock products appear before out-of-stock."""
        response = self.client.get(self.home_feed_url, **self._auth_headers())
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        all_products = next(s for s in data['sections'] if s['key'] == 'all_products')
        
        items = all_products['items']
        
        # Find positions of in-stock and out-of-stock products
        in_stock_positions = []
        out_of_stock_positions = []
        
        for i, item in enumerate(items):
            if item['stock_status'] == 'out_of_stock':
                out_of_stock_positions.append(i)
            else:
                in_stock_positions.append(i)
        
        # All in-stock positions should be before out-of-stock positions
        if in_stock_positions and out_of_stock_positions:
            self.assertLess(max(in_stock_positions), min(out_of_stock_positions))
    
    def test_seller_id_filter(self):
        """Test that seller_id filter works."""
        response = self.client.get(
            f'{self.home_feed_url}?seller_id={self.seller1.id}',
            **self._auth_headers()
        )
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        all_products = next(s for s in data['sections'] if s['key'] == 'all_products')
        
        for item in all_products['items']:
            self.assertEqual(str(item['seller']['id']), str(self.seller1.id))
    
    def test_category_filter(self):
        """Test that category filter works."""
        response = self.client.get(
            f'{self.home_feed_url}?category=Clothing',
            **self._auth_headers()
        )
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        all_products = next(s for s in data['sections'] if s['key'] == 'all_products')
        
        # Should only find seller2's product
        self.assertEqual(len(all_products['items']), 1)
        self.assertEqual(str(all_products['items'][0]['id']), str(self.product_seller2.id))
    
    def test_pagination_works(self):
        """Test that pagination works correctly."""
        response = self.client.get(
            f'{self.home_feed_url}?page_size=2',
            **self._auth_headers()
        )
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        all_products = next(s for s in data['sections'] if s['key'] == 'all_products')
        
        self.assertEqual(len(all_products['items']), 2)
        self.assertEqual(all_products['pagination']['page'], 1)
        self.assertEqual(all_products['pagination']['page_size'], 2)
        self.assertTrue(all_products['pagination']['has_next'])
        self.assertFalse(all_products['pagination']['has_prev'])
    
    def test_pagination_page_2(self):
        """Test that page 2 returns different results."""
        response = self.client.get(
            f'{self.home_feed_url}?page=2&page_size=2',
            **self._auth_headers()
        )
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        all_products = next(s for s in data['sections'] if s['key'] == 'all_products')
        
        self.assertEqual(all_products['pagination']['page'], 2)
        self.assertTrue(all_products['pagination']['has_prev'])
    
    def test_product_card_fields(self):
        """Test that product cards have all required fields."""
        response = self.client.get(self.home_feed_url, **self._auth_headers())
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        all_products = next(s for s in data['sections'] if s['key'] == 'all_products')
        
        if all_products['items']:
            item = all_products['items'][0]
            
            required_fields = [
                'id',
                'product_name',
                'product_category',
                'description_preview',
                'photos',
                'unit_price',
                'sell_quantity',
                'stock_quantity',
                'stock_status',
                'seller',
                'created_at',
                'updated_at',
            ]
            
            for field in required_fields:
                self.assertIn(field, item, f"Missing required field: {field}")
            
            # Check seller structure
            self.assertIn('id', item['seller'])
            self.assertIn('display_name', item['seller'])


class HomeFeedSearchTestCase(TestCase):
    """Test cases for search functionality in home feed."""

    def setUp(self):
        """Set up test fixtures."""
        self.client = Client()
        self.home_feed_url = '/api/home-feed'
        
        # Create test user
        self.user = User.objects.create_user(
            email='searchuser@example.com',
            username='searchuser',
            password='TestPass123!',
            user_type='buyer'
        )
        
        # Create seller
        self.seller = User.objects.create_user(
            email='seller@example.com',
            username='seller',
            password='TestPass123!',
            user_type='supplier'
        )
        
        # Create products with various match types for "laptop"
        # Exact name match
        self.exact_match = Product.objects.create(
            owner=self.seller,
            product_name='Laptop',
            product_category='Electronics',
            unit_price=Decimal('999.99'),
            stock_quantity=10,
            is_active=True,
        )
        
        # Name starts with
        self.starts_with = Product.objects.create(
            owner=self.seller,
            product_name='Laptop Stand',
            product_category='Accessories',
            unit_price=Decimal('49.99'),
            stock_quantity=50,
            is_active=True,
        )
        
        # Name contains
        self.name_contains = Product.objects.create(
            owner=self.seller,
            product_name='Gaming Laptop Pro',
            product_category='Electronics',
            unit_price=Decimal('1499.99'),
            stock_quantity=5,
            is_active=True,
        )
        
        # Category only
        self.category_only = Product.objects.create(
            owner=self.seller,
            product_name='Keyboard',
            product_category='Laptop Accessories',
            unit_price=Decimal('79.99'),
            stock_quantity=100,
            is_active=True,
        )
        
        # Get auth token
        self.access_token = self._get_access_token()
    
    def _get_access_token(self):
        """Get JWT access token for the test user."""
        response = self.client.post(
            '/api/auth/login',
            data=json.dumps({
                'email': 'searchuser@example.com',
                'password': 'TestPass123!'
            }),
            content_type='application/json'
        )
        if response.status_code == 200:
            return response.json().get('access')
        return None
    
    def _auth_headers(self):
        """Get authorization headers."""
        return {'HTTP_AUTHORIZATION': f'Bearer {self.access_token}'}
    
    def test_search_returns_matching_products(self):
        """Test that search returns products matching the query."""
        response = self.client.get(
            f'{self.home_feed_url}?q=laptop',
            **self._auth_headers()
        )
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        all_products = next(s for s in data['sections'] if s['key'] == 'all_products')
        
        # Should find all 4 products
        self.assertEqual(len(all_products['items']), 4)
    
    def test_search_ranking_exact_first(self):
        """Test that exact name match comes first."""
        response = self.client.get(
            f'{self.home_feed_url}?q=laptop',
            **self._auth_headers()
        )
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        all_products = next(s for s in data['sections'] if s['key'] == 'all_products')
        items = all_products['items']
        
        # First item should be exact match
        self.assertEqual(str(items[0]['id']), str(self.exact_match.id))
    
    def test_search_ranking_name_before_category(self):
        """Test that name matches come before category-only matches."""
        response = self.client.get(
            f'{self.home_feed_url}?q=laptop',
            **self._auth_headers()
        )
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        all_products = next(s for s in data['sections'] if s['key'] == 'all_products')
        items = all_products['items']
        
        # Category-only match should be last
        product_ids = [str(item['id']) for item in items]
        category_only_pos = product_ids.index(str(self.category_only.id))
        
        # All name matches should be before category match
        for item in items[:category_only_pos]:
            self.assertIn('laptop', item['product_name'].lower())
    
    def test_short_query_ignored(self):
        """Test that queries shorter than 2 chars are ignored."""
        response = self.client.get(
            f'{self.home_feed_url}?q=l',
            **self._auth_headers()
        )
        self.assertEqual(response.status_code, 200)
        
        # Should return all products (search ignored)
        data = response.json()
        all_products = next(s for s in data['sections'] if s['key'] == 'all_products')
        self.assertEqual(len(all_products['items']), 4)


class RecentSearchesTestCase(TestCase):
    """Test cases for recent searches functionality."""

    def setUp(self):
        """Set up test fixtures."""
        self.client = Client()
        self.home_feed_url = '/api/home-feed'
        
        # Create test user
        self.user = User.objects.create_user(
            email='searchhistory@example.com',
            username='searchhistory',
            password='TestPass123!',
            user_type='buyer'
        )
        
        # Create seller with product
        self.seller = User.objects.create_user(
            email='seller@example.com',
            username='seller',
            password='TestPass123!',
            user_type='supplier'
        )
        
        Product.objects.create(
            owner=self.seller,
            product_name='Test Product',
            product_category='Test',
            unit_price=Decimal('10.00'),
            stock_quantity=10,
            is_active=True,
        )
        
        # Get auth token
        self.access_token = self._get_access_token()
    
    def _get_access_token(self):
        """Get JWT access token for the test user."""
        response = self.client.post(
            '/api/auth/login',
            data=json.dumps({
                'email': 'searchhistory@example.com',
                'password': 'TestPass123!'
            }),
            content_type='application/json'
        )
        if response.status_code == 200:
            return response.json().get('access')
        return None
    
    def _auth_headers(self):
        """Get authorization headers."""
        return {'HTTP_AUTHORIZATION': f'Bearer {self.access_token}'}
    
    def test_recent_searches_empty_initially(self):
        """Test that recent searches is empty for new user."""
        response = self.client.get(self.home_feed_url, **self._auth_headers())
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        recent_searches = next(s for s in data['sections'] if s['key'] == 'recent_searches')
        
        self.assertEqual(len(recent_searches['items']), 0)
    
    def test_search_query_stored(self):
        """Test that search query is stored as SearchEvent."""
        # Make a search
        response = self.client.get(
            f'{self.home_feed_url}?q=test',
            **self._auth_headers()
        )
        self.assertEqual(response.status_code, 200)
        
        # Check recent searches in next request
        response = self.client.get(self.home_feed_url, **self._auth_headers())
        data = response.json()
        recent_searches = next(s for s in data['sections'] if s['key'] == 'recent_searches')
        
        self.assertEqual(len(recent_searches['items']), 1)
        self.assertEqual(recent_searches['items'][0]['query'], 'test')
    
    def test_recent_searches_max_5(self):
        """Test that only last 5 searches are returned."""
        # Create 7 search events
        for i in range(7):
            SearchEvent.objects.create(
                user=self.user,
                query=f'search{i}'
            )
        
        response = self.client.get(self.home_feed_url, **self._auth_headers())
        data = response.json()
        recent_searches = next(s for s in data['sections'] if s['key'] == 'recent_searches')
        
        self.assertEqual(len(recent_searches['items']), 5)
    
    def test_recent_searches_structure(self):
        """Test that recent search items have correct structure."""
        SearchEvent.objects.create(user=self.user, query='test query')
        
        response = self.client.get(self.home_feed_url, **self._auth_headers())
        data = response.json()
        recent_searches = next(s for s in data['sections'] if s['key'] == 'recent_searches')
        
        item = recent_searches['items'][0]
        self.assertIn('query', item)
        self.assertIn('searched_at', item)


class SearchEventModelTestCase(TestCase):
    """Test cases for SearchEvent model."""

    def setUp(self):
        """Set up test fixtures."""
        self.user = User.objects.create_user(
            email='modeltest@example.com',
            username='modeltest',
            password='TestPass123!',
            user_type='buyer'
        )
    
    def test_record_search_creates_event(self):
        """Test that record_search creates a SearchEvent."""
        event = SearchEvent.record_search(self.user, 'test query')
        
        self.assertIsNotNone(event)
        self.assertEqual(event.query, 'test query')
        self.assertEqual(event.user, self.user)
    
    def test_record_search_empty_query_returns_none(self):
        """Test that empty query returns None."""
        event = SearchEvent.record_search(self.user, '')
        self.assertIsNone(event)
        
        event = SearchEvent.record_search(self.user, '   ')
        self.assertIsNone(event)
    
    def test_record_search_deduplicates(self):
        """Test that duplicate queries within window are deduplicated."""
        # Create first search
        event1 = SearchEvent.record_search(self.user, 'duplicate')
        self.assertIsNotNone(event1)
        
        # Immediate duplicate should be deduplicated
        event2 = SearchEvent.record_search(self.user, 'duplicate')
        self.assertIsNone(event2)
        
        # Case-insensitive duplicate
        event3 = SearchEvent.record_search(self.user, 'DUPLICATE')
        self.assertIsNone(event3)
    
    def test_get_recent_for_user(self):
        """Test getting recent searches for a user."""
        # Create searches
        SearchEvent.objects.create(user=self.user, query='search1')
        SearchEvent.objects.create(user=self.user, query='search2')
        SearchEvent.objects.create(user=self.user, query='search3')
        
        results = SearchEvent.get_recent_for_user(self.user, limit=2)
        
        self.assertEqual(len(results), 2)
    
    def test_get_recent_for_user_unique(self):
        """Test that duplicate queries are not repeated in results."""
        # Create duplicate searches at different times
        SearchEvent.objects.create(user=self.user, query='same')
        # Manually set different timestamp for second one
        old_event = SearchEvent.objects.create(user=self.user, query='different')
        SearchEvent.objects.filter(id=old_event.id).update(
            created_at=timezone.now() - timedelta(hours=1)
        )
        SearchEvent.objects.create(user=self.user, query='same')  # duplicate
        
        results = SearchEvent.get_recent_for_user(self.user, limit=5)
        queries = [r.query.lower() for r in results]
        
        # 'same' should only appear once
        self.assertEqual(queries.count('same'), 1)

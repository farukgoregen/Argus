"""
Tests for public product search endpoint.

Tests cover:
- Search query validation
- Name vs category match ranking
- Seller filtering
- Inactive product exclusion
- Pagination
"""
from decimal import Decimal
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
import json

from products.models import Product

User = get_user_model()


class PublicProductSearchTestCase(TestCase):
    """Test cases for public product search endpoint."""

    def setUp(self):
        """Set up test fixtures."""
        self.client = Client()
        self.search_url = '/api/public/products/search'
        
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
        
        # Create products for seller1
        # Product with exact name match for "Apple"
        self.product_apple_exact = Product.objects.create(
            owner=self.seller1,
            product_name='Apple',
            product_category='Fruits',
            description='Fresh red apples',
            unit_price=Decimal('2.99'),
            stock_quantity=100,
            sell_quantity=1,
            is_active=True,
        )
        
        # Product with name starting with "Apple"
        self.product_apple_starts = Product.objects.create(
            owner=self.seller1,
            product_name='Apple Juice',
            product_category='Beverages',
            description='Fresh apple juice',
            unit_price=Decimal('4.99'),
            stock_quantity=50,
            sell_quantity=1,
            is_active=True,
        )
        
        # Product with name containing "Apple"
        self.product_apple_contains = Product.objects.create(
            owner=self.seller1,
            product_name='Green Apple Candy',
            product_category='Candy',
            description='Apple flavored candy',
            unit_price=Decimal('1.99'),
            stock_quantity=200,
            sell_quantity=10,
            is_active=True,
        )
        
        # Product with category containing "Apple" but not in name
        self.product_apple_category = Product.objects.create(
            owner=self.seller1,
            product_name='Fruit Basket',
            product_category='Apple Products',
            description='A basket with various fruits',
            unit_price=Decimal('19.99'),
            stock_quantity=20,
            sell_quantity=1,
            is_active=True,
        )
        
        # Inactive product (should not appear in search)
        self.product_inactive = Product.objects.create(
            owner=self.seller1,
            product_name='Apple Pie',
            product_category='Bakery',
            description='Delicious apple pie',
            unit_price=Decimal('8.99'),
            stock_quantity=10,
            sell_quantity=1,
            is_active=False,
        )
        
        # Product from seller2
        self.product_seller2 = Product.objects.create(
            owner=self.seller2,
            product_name='Apple Watch Band',
            product_category='Electronics',
            description='Compatible with Apple Watch',
            unit_price=Decimal('29.99'),
            stock_quantity=30,
            sell_quantity=1,
            is_active=True,
        )
        
        # Another product from seller2 (no apple in name/category)
        self.product_seller2_other = Product.objects.create(
            owner=self.seller2,
            product_name='Banana',
            product_category='Fruits',
            description='Fresh bananas',
            unit_price=Decimal('1.49'),
            stock_quantity=150,
            sell_quantity=5,
            is_active=True,
        )

    def test_search_requires_query(self):
        """Test that search query is required."""
        response = self.client.get(self.search_url)
        self.assertEqual(response.status_code, 422)

    def test_search_query_min_length(self):
        """Test that search query must be at least 2 characters."""
        response = self.client.get(f'{self.search_url}?q=a')
        self.assertEqual(response.status_code, 422)
        self.assertIn('at least 2 characters', response.json()['detail'])

    def test_search_query_whitespace_only(self):
        """Test that whitespace-only query is rejected."""
        response = self.client.get(f'{self.search_url}?q=   ')
        self.assertEqual(response.status_code, 422)

    def test_search_returns_matching_products(self):
        """Test that search returns products matching the query."""
        response = self.client.get(f'{self.search_url}?q=apple')
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertIn('items', data)
        self.assertIn('total', data)
        self.assertIn('page', data)
        self.assertIn('page_size', data)
        self.assertIn('pages', data)
        
        # Should find 5 active products with "apple" in name or category
        self.assertEqual(data['total'], 5)

    def test_search_excludes_inactive_products(self):
        """Test that inactive products are not returned."""
        response = self.client.get(f'{self.search_url}?q=apple')
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        product_ids = [str(item['id']) for item in data['items']]
        
        # Inactive apple pie should not be in results
        self.assertNotIn(str(self.product_inactive.id), product_ids)

    def test_search_ranking_order(self):
        """Test that name matches appear before category-only matches."""
        response = self.client.get(f'{self.search_url}?q=apple')
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        items = data['items']
        
        # Get the positions of each product
        product_ids = [str(item['id']) for item in items]
        
        # Exact name match should be first
        exact_match_pos = product_ids.index(str(self.product_apple_exact.id))
        
        # Category-only match should be last among our seller1 products
        category_match_pos = product_ids.index(str(self.product_apple_category.id))
        
        # Name matches should come before category-only matches
        self.assertLess(exact_match_pos, category_match_pos)

    def test_search_exact_match_first(self):
        """Test that exact name match comes first."""
        response = self.client.get(f'{self.search_url}?q=apple')
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        items = data['items']
        
        # First item should be the exact "Apple" match
        self.assertEqual(str(items[0]['id']), str(self.product_apple_exact.id))

    def test_search_seller_filter(self):
        """Test that seller_id filter works correctly."""
        response = self.client.get(
            f'{self.search_url}?q=apple&seller_id={self.seller1.id}'
        )
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        
        # Should only find seller1's products (4 active apple products)
        self.assertEqual(data['total'], 4)
        
        # All products should belong to seller1
        for item in data['items']:
            self.assertEqual(str(item['seller_id']), str(self.seller1.id))

    def test_search_seller_filter_different_seller(self):
        """Test seller filter with seller2."""
        response = self.client.get(
            f'{self.search_url}?q=apple&seller_id={self.seller2.id}'
        )
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        
        # Should only find seller2's apple product
        self.assertEqual(data['total'], 1)
        self.assertEqual(str(data['items'][0]['id']), str(self.product_seller2.id))

    def test_search_no_results(self):
        """Test search with no matching products."""
        response = self.client.get(f'{self.search_url}?q=xyz123nonexistent')
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertEqual(data['total'], 0)
        self.assertEqual(len(data['items']), 0)

    def test_search_pagination(self):
        """Test that pagination works correctly."""
        # First page with small page size
        response = self.client.get(f'{self.search_url}?q=apple&page_size=2')
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertEqual(len(data['items']), 2)
        self.assertEqual(data['page'], 1)
        self.assertEqual(data['page_size'], 2)
        self.assertEqual(data['total'], 5)
        self.assertEqual(data['pages'], 3)  # 5 items / 2 per page = 3 pages

    def test_search_pagination_page_2(self):
        """Test that page 2 returns different results."""
        response1 = self.client.get(f'{self.search_url}?q=apple&page=1&page_size=2')
        response2 = self.client.get(f'{self.search_url}?q=apple&page=2&page_size=2')
        
        self.assertEqual(response1.status_code, 200)
        self.assertEqual(response2.status_code, 200)
        
        page1_ids = [item['id'] for item in response1.json()['items']]
        page2_ids = [item['id'] for item in response2.json()['items']]
        
        # Pages should have different products
        for pid in page1_ids:
            self.assertNotIn(pid, page2_ids)

    def test_search_response_fields(self):
        """Test that response contains all required fields."""
        response = self.client.get(f'{self.search_url}?q=apple')
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        item = data['items'][0]
        
        # Check required fields
        required_fields = [
            'id',
            'product_name',
            'product_category',
            'description',
            'photos',
            'unit_price',
            'stock_quantity',
            'stock_status',
            'sell_quantity',
            'is_active',
            'created_at',
            'updated_at',
            'seller_id',
            'seller_display_name',
        ]
        
        for field in required_fields:
            self.assertIn(field, item, f"Missing required field: {field}")

    def test_search_seller_display_name(self):
        """Test that seller_display_name is returned."""
        response = self.client.get(f'{self.search_url}?q=apple')
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        
        # Find a product from seller1
        seller1_products = [
            item for item in data['items']
            if str(item['seller_id']) == str(self.seller1.id)
        ]
        
        self.assertTrue(len(seller1_products) > 0)
        # Display name should be username since no supplier profile
        self.assertEqual(seller1_products[0]['seller_display_name'], 'seller1')

    def test_search_case_insensitive(self):
        """Test that search is case-insensitive."""
        response_lower = self.client.get(f'{self.search_url}?q=apple')
        response_upper = self.client.get(f'{self.search_url}?q=APPLE')
        response_mixed = self.client.get(f'{self.search_url}?q=ApPlE')
        
        self.assertEqual(response_lower.status_code, 200)
        self.assertEqual(response_upper.status_code, 200)
        self.assertEqual(response_mixed.status_code, 200)
        
        # All should return the same number of results
        self.assertEqual(
            response_lower.json()['total'],
            response_upper.json()['total']
        )
        self.assertEqual(
            response_lower.json()['total'],
            response_mixed.json()['total']
        )

    def test_search_category_match(self):
        """Test that category-only matches are found."""
        response = self.client.get(f'{self.search_url}?q=fruits')
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        
        # Should find products in "Fruits" category
        self.assertGreaterEqual(data['total'], 2)  # Apple and Banana

    def test_search_no_auth_required(self):
        """Test that search endpoint works without authentication."""
        # No auth headers, should still work
        response = self.client.get(f'{self.search_url}?q=apple')
        self.assertEqual(response.status_code, 200)

    def test_search_stock_status_included(self):
        """Test that stock_status is correctly computed and included."""
        response = self.client.get(f'{self.search_url}?q=apple')
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        
        for item in data['items']:
            self.assertIn(item['stock_status'], ['in_stock', 'low_stock', 'out_of_stock'])

    def test_search_empty_seller_filter(self):
        """Test that non-existent seller returns no results."""
        import uuid
        fake_seller_id = uuid.uuid4()
        response = self.client.get(
            f'{self.search_url}?q=apple&seller_id={fake_seller_id}'
        )
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertEqual(data['total'], 0)


class PublicProductSearchRankingTestCase(TestCase):
    """Detailed test cases for search ranking logic."""

    def setUp(self):
        """Set up test fixtures specifically for ranking tests."""
        self.client = Client()
        self.search_url = '/api/public/products/search'
        
        self.seller = User.objects.create_user(
            email='rankseller@example.com',
            username='rankseller',
            password='TestPass123!',
            user_type='supplier'
        )
        
        # Create products with various match types for "test"
        # Rank 0: Exact name match
        self.exact_match = Product.objects.create(
            owner=self.seller,
            product_name='Test',
            product_category='General',
            unit_price=Decimal('10.00'),
            is_active=True,
        )
        
        # Rank 1: Name starts with
        self.starts_with = Product.objects.create(
            owner=self.seller,
            product_name='Testing Kit',
            product_category='General',
            unit_price=Decimal('20.00'),
            is_active=True,
        )
        
        # Rank 2: Name contains
        self.name_contains = Product.objects.create(
            owner=self.seller,
            product_name='A Great Test Product',
            product_category='General',
            unit_price=Decimal('30.00'),
            is_active=True,
        )
        
        # Rank 3: Only category contains
        self.category_only = Product.objects.create(
            owner=self.seller,
            product_name='Special Item',
            product_category='Test Equipment',
            unit_price=Decimal('40.00'),
            is_active=True,
        )

    def test_ranking_exact_first(self):
        """Test exact match comes first."""
        response = self.client.get(f'{self.search_url}?q=test')
        self.assertEqual(response.status_code, 200)
        
        items = response.json()['items']
        self.assertEqual(str(items[0]['id']), str(self.exact_match.id))

    def test_ranking_starts_with_second(self):
        """Test starts-with match comes after exact."""
        response = self.client.get(f'{self.search_url}?q=test')
        self.assertEqual(response.status_code, 200)
        
        items = response.json()['items']
        ids = [str(item['id']) for item in items]
        
        exact_pos = ids.index(str(self.exact_match.id))
        starts_pos = ids.index(str(self.starts_with.id))
        
        self.assertLess(exact_pos, starts_pos)

    def test_ranking_contains_third(self):
        """Test name-contains match comes after starts-with."""
        response = self.client.get(f'{self.search_url}?q=test')
        self.assertEqual(response.status_code, 200)
        
        items = response.json()['items']
        ids = [str(item['id']) for item in items]
        
        starts_pos = ids.index(str(self.starts_with.id))
        contains_pos = ids.index(str(self.name_contains.id))
        
        self.assertLess(starts_pos, contains_pos)

    def test_ranking_category_last(self):
        """Test category-only match comes last."""
        response = self.client.get(f'{self.search_url}?q=test')
        self.assertEqual(response.status_code, 200)
        
        items = response.json()['items']
        ids = [str(item['id']) for item in items]
        
        contains_pos = ids.index(str(self.name_contains.id))
        category_pos = ids.index(str(self.category_only.id))
        
        self.assertLess(contains_pos, category_pos)

    def test_full_ranking_order(self):
        """Test complete ranking order: exact > starts > contains > category."""
        response = self.client.get(f'{self.search_url}?q=test')
        self.assertEqual(response.status_code, 200)
        
        items = response.json()['items']
        
        expected_order = [
            str(self.exact_match.id),
            str(self.starts_with.id),
            str(self.name_contains.id),
            str(self.category_only.id),
        ]
        
        actual_order = [str(item['id']) for item in items]
        
        self.assertEqual(actual_order, expected_order)

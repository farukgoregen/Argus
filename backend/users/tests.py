"""
Tests for user authentication endpoints.
Tests cover registration, login, logout, and token refresh functionality.
Also includes tests for profile creation during registration.
"""
from django.test import TestCase, Client, TransactionTestCase
from django.contrib.auth import get_user_model
from django.db import transaction
from unittest.mock import patch, MagicMock
import json

from users.models import SupplierProfile, BuyerProfile
from users.services import (
    create_user_with_profile,
    create_profile_for_user,
    UserRegistrationData,
    EmailAlreadyExistsError,
    UsernameAlreadyExistsError,
    PasswordValidationError,
    ProfileCreationError,
)

User = get_user_model()


class AuthenticationTestCase(TestCase):
    """Test cases for authentication endpoints."""

    def setUp(self):
        """Set up test fixtures."""
        self.client = Client()
        self.register_url = '/api/auth/register'
        self.login_url = '/api/auth/login'
        self.logout_url = '/api/auth/logout'
        self.refresh_url = '/api/auth/refresh'
        self.me_url = '/api/auth/me'
        
        # Create a test user
        self.test_user = User.objects.create_user(
            email='existing@example.com',
            username='existinguser',
            password='TestPass123!',
            user_type='buyer'
        )

    def test_register_success(self):
        """Test successful user registration."""
        data = {
            'email': 'newuser@example.com',
            'username': 'newuser',
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!',
            'user_type': 'buyer'
        }
        response = self.client.post(
            self.register_url,
            data=json.dumps(data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 201)
        response_data = response.json()
        self.assertIn('user', response_data)
        self.assertIn('access', response_data)
        self.assertIn('refresh', response_data)
        self.assertEqual(response_data['user']['email'], 'newuser@example.com')
        self.assertEqual(response_data['user']['username'], 'newuser')

    def test_register_passwords_mismatch(self):
        """Test registration fails when passwords don't match."""
        data = {
            'email': 'newuser@example.com',
            'username': 'newuser',
            'password': 'SecurePass123!',
            'password_confirm': 'DifferentPass123!',
            'user_type': 'buyer'
        }
        response = self.client.post(
            self.register_url,
            data=json.dumps(data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 400)
        self.assertIn('Passwords do not match', response.json()['detail'])

    def test_register_duplicate_email(self):
        """Test registration fails with duplicate email."""
        data = {
            'email': 'existing@example.com',
            'username': 'anotheruser',
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!',
            'user_type': 'buyer'
        }
        response = self.client.post(
            self.register_url,
            data=json.dumps(data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 400)
        self.assertIn('email already exists', response.json()['detail'])

    def test_register_duplicate_username(self):
        """Test registration fails with duplicate username."""
        data = {
            'email': 'unique@example.com',
            'username': 'existinguser',
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!',
            'user_type': 'buyer'
        }
        response = self.client.post(
            self.register_url,
            data=json.dumps(data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 400)
        self.assertIn('username already exists', response.json()['detail'])

    def test_register_weak_password(self):
        """Test registration fails with weak password."""
        data = {
            'email': 'newuser@example.com',
            'username': 'newuser',
            'password': '123',
            'password_confirm': '123',
            'user_type': 'buyer'
        }
        response = self.client.post(
            self.register_url,
            data=json.dumps(data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 400)

    def test_login_with_email_success(self):
        """Test successful login with email."""
        data = {
            'identifier': 'existing@example.com',
            'password': 'TestPass123!'
        }
        response = self.client.post(
            self.login_url,
            data=json.dumps(data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertIn('user', response_data)
        self.assertIn('access', response_data)
        self.assertIn('refresh', response_data)
        self.assertEqual(response_data['user']['email'], 'existing@example.com')

    def test_login_with_username_success(self):
        """Test successful login with username."""
        data = {
            'identifier': 'existinguser',
            'password': 'TestPass123!'
        }
        response = self.client.post(
            self.login_url,
            data=json.dumps(data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertIn('user', response_data)
        self.assertIn('access', response_data)
        self.assertIn('refresh', response_data)

    def test_login_invalid_credentials(self):
        """Test login fails with invalid credentials."""
        data = {
            'identifier': 'existing@example.com',
            'password': 'WrongPassword123!'
        }
        response = self.client.post(
            self.login_url,
            data=json.dumps(data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 401)
        self.assertIn('Invalid credentials', response.json()['detail'])

    def test_login_nonexistent_user(self):
        """Test login fails with non-existent user."""
        data = {
            'identifier': 'nonexistent@example.com',
            'password': 'SomePassword123!'
        }
        response = self.client.post(
            self.login_url,
            data=json.dumps(data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 401)

    def test_logout_success(self):
        """Test successful logout (token blacklisting)."""
        # First login to get tokens
        login_data = {
            'identifier': 'existing@example.com',
            'password': 'TestPass123!'
        }
        login_response = self.client.post(
            self.login_url,
            data=json.dumps(login_data),
            content_type='application/json'
        )
        tokens = login_response.json()
        
        # Now logout
        logout_data = {
            'refresh': tokens['refresh']
        }
        response = self.client.post(
            self.logout_url,
            data=json.dumps(logout_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 200)
        self.assertIn('Successfully logged out', response.json()['message'])

    def test_logout_invalid_token(self):
        """Test logout fails with invalid refresh token."""
        data = {
            'refresh': 'invalid_token_here'
        }
        response = self.client.post(
            self.logout_url,
            data=json.dumps(data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 400)

    def test_refresh_token_success(self):
        """Test successful token refresh."""
        # First login to get tokens
        login_data = {
            'identifier': 'existing@example.com',
            'password': 'TestPass123!'
        }
        login_response = self.client.post(
            self.login_url,
            data=json.dumps(login_data),
            content_type='application/json'
        )
        tokens = login_response.json()
        
        # Now refresh
        refresh_data = {
            'refresh': tokens['refresh']
        }
        response = self.client.post(
            self.refresh_url,
            data=json.dumps(refresh_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 200)
        self.assertIn('access', response.json())

    def test_refresh_token_invalid(self):
        """Test token refresh fails with invalid refresh token."""
        data = {
            'refresh': 'invalid_refresh_token'
        }
        response = self.client.post(
            self.refresh_url,
            data=json.dumps(data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 401)

    def test_protected_endpoint_with_valid_token(self):
        """Test accessing protected endpoint with valid token."""
        # First login to get tokens
        login_data = {
            'identifier': 'existing@example.com',
            'password': 'TestPass123!'
        }
        login_response = self.client.post(
            self.login_url,
            data=json.dumps(login_data),
            content_type='application/json'
        )
        tokens = login_response.json()
        
        # Access protected endpoint
        response = self.client.get(
            self.me_url,
            HTTP_AUTHORIZATION=f"Bearer {tokens['access']}"
        )
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['email'], 'existing@example.com')

    def test_protected_endpoint_without_token(self):
        """Test accessing protected endpoint without token fails."""
        response = self.client.get(self.me_url)
        
        self.assertEqual(response.status_code, 401)

    def test_protected_endpoint_with_invalid_token(self):
        """Test accessing protected endpoint with invalid token fails."""
        response = self.client.get(
            self.me_url,
            HTTP_AUTHORIZATION="Bearer invalid_token_here"
        )
        
        self.assertEqual(response.status_code, 401)

    def test_blacklisted_refresh_token_cannot_be_reused(self):
        """Test that blacklisted refresh token cannot be used for refresh."""
        # Login
        login_data = {
            'identifier': 'existing@example.com',
            'password': 'TestPass123!'
        }
        login_response = self.client.post(
            self.login_url,
            data=json.dumps(login_data),
            content_type='application/json'
        )
        tokens = login_response.json()
        
        # Logout (blacklist the refresh token)
        logout_data = {
            'refresh': tokens['refresh']
        }
        self.client.post(
            self.logout_url,
            data=json.dumps(logout_data),
            content_type='application/json'
        )
        
        # Try to use the blacklisted refresh token
        refresh_data = {
            'refresh': tokens['refresh']
        }
        response = self.client.post(
            self.refresh_url,
            data=json.dumps(refresh_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 401)


class ProfileCreationTestCase(TestCase):
    """Test cases for profile creation during registration."""

    def setUp(self):
        """Set up test fixtures."""
        self.client = Client()
        self.register_url = '/api/auth/register'

    def test_register_buyer_creates_buyer_profile(self):
        """Test that registering as buyer creates a BuyerProfile."""
        data = {
            'email': 'buyer@example.com',
            'username': 'buyeruser',
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!',
            'user_type': 'buyer'
        }
        response = self.client.post(
            self.register_url,
            data=json.dumps(data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 201)
        
        # Verify user was created
        user = User.objects.get(email='buyer@example.com')
        self.assertEqual(user.user_type, 'buyer')
        
        # Verify BuyerProfile was created
        self.assertTrue(hasattr(user, 'buyer_profile'))
        buyer_profile = user.buyer_profile
        self.assertIsInstance(buyer_profile, BuyerProfile)
        self.assertEqual(buyer_profile.company_name, 'buyeruser')  # defaults to username

    def test_register_supplier_creates_supplier_profile(self):
        """Test that registering as supplier creates a SupplierProfile."""
        data = {
            'email': 'supplier@example.com',
            'username': 'supplieruser',
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!',
            'user_type': 'supplier'
        }
        response = self.client.post(
            self.register_url,
            data=json.dumps(data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 201)
        
        # Verify user was created
        user = User.objects.get(email='supplier@example.com')
        self.assertEqual(user.user_type, 'supplier')
        
        # Verify SupplierProfile was created
        self.assertTrue(hasattr(user, 'supplier_profile'))
        supplier_profile = user.supplier_profile
        self.assertIsInstance(supplier_profile, SupplierProfile)
        self.assertEqual(supplier_profile.company_name, 'supplieruser')  # defaults to username

    def test_register_with_company_name(self):
        """Test that company_name is used when provided."""
        data = {
            'email': 'company@example.com',
            'username': 'companyuser',
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!',
            'user_type': 'buyer',
            'company_name': 'My Company Inc.'
        }
        response = self.client.post(
            self.register_url,
            data=json.dumps(data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 201)
        
        user = User.objects.get(email='company@example.com')
        self.assertEqual(user.buyer_profile.company_name, 'My Company Inc.')

    def test_register_duplicate_email_no_profile_created(self):
        """Test that duplicate email registration doesn't create extra profiles."""
        # First, create a user with profile
        data = {
            'email': 'duplicate@example.com',
            'username': 'firstuser',
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!',
            'user_type': 'buyer'
        }
        self.client.post(
            self.register_url,
            data=json.dumps(data),
            content_type='application/json'
        )
        
        initial_user_count = User.objects.count()
        initial_profile_count = BuyerProfile.objects.count()
        
        # Try to register with same email
        data['username'] = 'seconduser'
        response = self.client.post(
            self.register_url,
            data=json.dumps(data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 400)
        self.assertIn('email already exists', response.json()['detail'])
        
        # Verify no new user or profile was created
        self.assertEqual(User.objects.count(), initial_user_count)
        self.assertEqual(BuyerProfile.objects.count(), initial_profile_count)

    def test_invalid_user_type_returns_422(self):
        """Test that invalid user_type returns validation error."""
        data = {
            'email': 'invalid@example.com',
            'username': 'invaliduser',
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!',
            'user_type': 'invalid_type'
        }
        response = self.client.post(
            self.register_url,
            data=json.dumps(data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 422)


class UserServiceTestCase(TransactionTestCase):
    """Test cases for user service layer."""

    def test_create_user_with_profile_buyer(self):
        """Test create_user_with_profile creates buyer with profile."""
        data = UserRegistrationData(
            email='service_buyer@example.com',
            username='servicebuyer',
            password='SecurePass123!',
            user_type='buyer',
            company_name='Service Buyer Co.'
        )
        
        user = create_user_with_profile(data)
        
        self.assertEqual(user.email, 'service_buyer@example.com')
        self.assertEqual(user.user_type, 'buyer')
        self.assertTrue(hasattr(user, 'buyer_profile'))
        self.assertEqual(user.buyer_profile.company_name, 'Service Buyer Co.')

    def test_create_user_with_profile_supplier(self):
        """Test create_user_with_profile creates supplier with profile."""
        data = UserRegistrationData(
            email='service_supplier@example.com',
            username='servicesupplier',
            password='SecurePass123!',
            user_type='supplier',
            company_name='Service Supplier Co.'
        )
        
        user = create_user_with_profile(data)
        
        self.assertEqual(user.email, 'service_supplier@example.com')
        self.assertEqual(user.user_type, 'supplier')
        self.assertTrue(hasattr(user, 'supplier_profile'))
        self.assertEqual(user.supplier_profile.company_name, 'Service Supplier Co.')

    def test_create_user_with_profile_atomic_rollback(self):
        """Test that user creation is rolled back if profile creation fails."""
        data = UserRegistrationData(
            email='atomic_test@example.com',
            username='atomicuser',
            password='SecurePass123!',
            user_type='buyer',
        )
        
        initial_user_count = User.objects.count()
        initial_profile_count = BuyerProfile.objects.count()
        
        # Mock profile creation to fail
        with patch('users.services.BuyerProfile.objects.get_or_create') as mock_create:
            mock_create.side_effect = Exception("Database error")
            
            with self.assertRaises(ProfileCreationError):
                create_user_with_profile(data)
        
        # Verify user was NOT created (rolled back)
        self.assertEqual(User.objects.count(), initial_user_count)
        self.assertEqual(BuyerProfile.objects.count(), initial_profile_count)

    def test_create_profile_idempotent(self):
        """Test that create_profile_for_user is idempotent."""
        # Create a user without profile first
        user = User.objects.create_user(
            email='idempotent@example.com',
            username='idempotentuser',
            password='SecurePass123!',
            user_type='buyer'
        )
        
        # Create profile first time
        profile1 = create_profile_for_user(user, 'buyer', 'First Company')
        
        # Create profile second time (should return same profile)
        profile2 = create_profile_for_user(user, 'buyer', 'Different Company')
        
        # Should be the same profile
        self.assertEqual(profile1.id, profile2.id)
        # Company name should be from first creation
        self.assertEqual(profile2.company_name, 'First Company')
        # Only one profile should exist
        self.assertEqual(BuyerProfile.objects.filter(user=user).count(), 1)

    def test_email_already_exists_error(self):
        """Test EmailAlreadyExistsError is raised for duplicate email."""
        # Create first user
        User.objects.create_user(
            email='exists@example.com',
            username='firstuser',
            password='SecurePass123!',
            user_type='buyer'
        )
        
        data = UserRegistrationData(
            email='exists@example.com',
            username='seconduser',
            password='SecurePass123!',
            user_type='buyer',
        )
        
        with self.assertRaises(EmailAlreadyExistsError):
            create_user_with_profile(data)

    def test_username_already_exists_error(self):
        """Test UsernameAlreadyExistsError is raised for duplicate username."""
        # Create first user
        User.objects.create_user(
            email='first@example.com',
            username='sameusername',
            password='SecurePass123!',
            user_type='buyer'
        )
        
        data = UserRegistrationData(
            email='second@example.com',
            username='sameusername',
            password='SecurePass123!',
            user_type='buyer',
        )
        
        with self.assertRaises(UsernameAlreadyExistsError):
            create_user_with_profile(data)

    def test_password_validation_error(self):
        """Test PasswordValidationError is raised for weak password."""
        data = UserRegistrationData(
            email='weak@example.com',
            username='weakuser',
            password='123',  # Too weak
            user_type='buyer',
        )
        
        with self.assertRaises(PasswordValidationError):
            create_user_with_profile(data)

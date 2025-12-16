"""
User service layer for handling user creation and profile management.

This module contains business logic for user operations, keeping the API layer thin.
All user creation with profiles should go through these service functions.

Profile Creation Logic:
-----------------------
- user_type='buyer'    -> Creates BuyerProfile
- user_type='supplier' -> Creates SupplierProfile

Both profiles require a company_name. If not provided, username is used as default.
"""
import logging
from typing import Optional
from dataclasses import dataclass
from django.db import transaction
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError

from .models import SupplierProfile, BuyerProfile, UserType

logger = logging.getLogger(__name__)
User = get_user_model()


class UserCreationError(Exception):
    """Base exception for user creation errors."""
    pass


class EmailAlreadyExistsError(UserCreationError):
    """Raised when email already exists."""
    pass


class UsernameAlreadyExistsError(UserCreationError):
    """Raised when username already exists."""
    pass


class PasswordValidationError(UserCreationError):
    """Raised when password validation fails."""
    def __init__(self, messages: list[str]):
        self.messages = messages
        super().__init__("; ".join(messages))


class ProfileCreationError(UserCreationError):
    """Raised when profile creation fails."""
    pass


@dataclass
class UserRegistrationData:
    """Data class for user registration input."""
    email: str
    username: str
    password: str
    user_type: str
    company_name: Optional[str] = None


@dataclass
class UserWithTokens:
    """Data class for user creation result."""
    user: User
    access_token: str
    refresh_token: str


def validate_user_registration(data: UserRegistrationData) -> None:
    """
    Validate user registration data before creation.
    
    Raises:
        EmailAlreadyExistsError: If email is already registered
        UsernameAlreadyExistsError: If username is already taken
        PasswordValidationError: If password doesn't meet requirements
    """
    # Validate password strength
    try:
        validate_password(data.password)
    except DjangoValidationError as e:
        raise PasswordValidationError(e.messages)
    
    # Check if email already exists
    if User.objects.filter(email=data.email.lower()).exists():
        raise EmailAlreadyExistsError("A user with this email already exists")
    
    # Check if username already exists
    if User.objects.filter(username=data.username).exists():
        raise UsernameAlreadyExistsError("A user with this username already exists")


def create_profile_for_user(
    user: User,
    user_type: str,
    company_name: Optional[str] = None
) -> SupplierProfile | BuyerProfile:
    """
    Create the appropriate profile for a user based on user_type.
    
    This function is idempotent - if a profile already exists, it returns the existing one.
    
    Args:
        user: The User instance to create a profile for
        user_type: Either 'buyer' or 'supplier'
        company_name: Company name for the profile. Defaults to username if not provided.
    
    Returns:
        The created or existing profile instance
    
    Raises:
        ProfileCreationError: If profile creation fails
        ValueError: If user_type is invalid
    """
    # Use username as default company name if not provided
    effective_company_name = company_name or user.username
    
    try:
        if user_type == UserType.SUPPLIER or user_type == 'supplier':
            # Check if profile already exists (idempotency)
            profile, created = SupplierProfile.objects.get_or_create(
                user=user,
                defaults={'company_name': effective_company_name}
            )
            if created:
                logger.info(f"Created SupplierProfile for user {user.email}")
            else:
                logger.info(f"SupplierProfile already exists for user {user.email}")
            return profile
            
        elif user_type == UserType.BUYER or user_type == 'buyer':
            # Check if profile already exists (idempotency)
            profile, created = BuyerProfile.objects.get_or_create(
                user=user,
                defaults={'company_name': effective_company_name}
            )
            if created:
                logger.info(f"Created BuyerProfile for user {user.email}")
            else:
                logger.info(f"BuyerProfile already exists for user {user.email}")
            return profile
            
        else:
            raise ValueError(f"Invalid user_type: {user_type}")
            
    except Exception as e:
        if isinstance(e, ValueError):
            raise
        logger.error(f"Failed to create profile for user {user.email}: {str(e)}")
        raise ProfileCreationError(f"Failed to create profile: {str(e)}")


def create_user_with_profile(data: UserRegistrationData) -> User:
    """
    Create a new user with the corresponding profile in a single atomic transaction.
    
    This is the main entry point for user registration. It ensures that:
    1. User and profile are created together atomically
    2. If profile creation fails, user creation is rolled back
    3. Proper validation is performed before any database operations
    
    Args:
        data: UserRegistrationData containing all registration fields
    
    Returns:
        The created User instance
    
    Raises:
        EmailAlreadyExistsError: If email is already registered
        UsernameAlreadyExistsError: If username is already taken
        PasswordValidationError: If password doesn't meet requirements
        ProfileCreationError: If profile creation fails
    """
    # Validate first (before starting transaction)
    validate_user_registration(data)
    
    # Create user and profile atomically
    with transaction.atomic():
        try:
            # Create the user
            user = User.objects.create_user(
                email=data.email.lower(),
                username=data.username,
                password=data.password,
                user_type=data.user_type,
            )
            logger.info(f"Created user: {user.email} with type: {data.user_type}")
            
            # Create the corresponding profile
            create_profile_for_user(
                user=user,
                user_type=data.user_type,
                company_name=data.company_name
            )
            
            return user
            
        except (EmailAlreadyExistsError, UsernameAlreadyExistsError, PasswordValidationError):
            # Re-raise validation errors as-is
            raise
        except ProfileCreationError:
            # Profile creation failed - transaction will rollback
            logger.error(f"Profile creation failed for user {data.email}, rolling back")
            raise
        except Exception as e:
            # Unexpected error - log and re-raise as ProfileCreationError
            logger.error(f"Unexpected error during user creation: {str(e)}")
            raise ProfileCreationError(f"User creation failed: {str(e)}")


def get_user_profile(user: User) -> SupplierProfile | BuyerProfile | None:
    """
    Get the profile for a user based on their user_type.
    
    Args:
        user: The User instance
    
    Returns:
        The user's profile or None if not found
    """
    if user.user_type == UserType.SUPPLIER or user.user_type == 'supplier':
        return getattr(user, 'supplier_profile', None)
    elif user.user_type == UserType.BUYER or user.user_type == 'buyer':
        return getattr(user, 'buyer_profile', None)
    return None


def ensure_user_has_profile(user: User, company_name: Optional[str] = None) -> SupplierProfile | BuyerProfile:
    """
    Ensure a user has a profile. Creates one if it doesn't exist.
    
    This is useful for existing users who may not have a profile yet.
    
    Args:
        user: The User instance
        company_name: Company name for new profile. Defaults to username.
    
    Returns:
        The user's profile (existing or newly created)
    """
    return create_profile_for_user(
        user=user,
        user_type=user.user_type,
        company_name=company_name
    )

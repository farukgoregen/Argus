"""
Authentication router for user registration, login, and logout.
Implements JWT-based authentication with access and refresh tokens.
"""
import logging
from ninja import Router
from ninja.errors import HttpError
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError
from ninja_jwt.tokens import RefreshToken

from .schemas import (
    RegisterInputSchema,
    RegisterResponseSchema,
    LoginInputSchema,
    LoginResponseSchema,
    LogoutInputSchema,
    MessageSchema,
    ErrorSchema,
    UserSchema,
    TokenRefreshInputSchema,
    TokenRefreshResponseSchema,
)
from .authentication import JWTAuth
from .services import (
    create_user_with_profile,
    UserRegistrationData,
    EmailAlreadyExistsError,
    UsernameAlreadyExistsError,
    PasswordValidationError,
    ProfileCreationError,
)

logger = logging.getLogger(__name__)
User = get_user_model()

router = Router(tags=["auth"])


def get_tokens_for_user(user) -> dict:
    """Generate JWT tokens for a user."""
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


@router.post("/register", response={201: RegisterResponseSchema, 400: ErrorSchema, 422: ErrorSchema})
def register(request, payload: RegisterInputSchema):
    """
    Register a new user with corresponding profile.
    
    Creates a new user account with the provided credentials and automatically
    creates the appropriate profile based on user_type:
    - user_type='buyer' -> Creates BuyerProfile
    - user_type='supplier' -> Creates SupplierProfile
    
    The operation is atomic: if profile creation fails, user creation is rolled back.
    
    - **email**: Valid email address (must be unique)
    - **username**: Unique username (3-150 characters, alphanumeric and underscores)
    - **password**: Password meeting Django's password validation requirements
    - **password_confirm**: Must match password
    - **user_type**: Either "buyer" or "supplier" (default: "buyer")
    - **company_name**: Optional company name for profile (defaults to username)
    """
    # Validate passwords match (before service call)
    if payload.password != payload.password_confirm:
        raise HttpError(400, "Passwords do not match")
    
    # Prepare registration data
    registration_data = UserRegistrationData(
        email=payload.email,
        username=payload.username,
        password=payload.password,
        user_type=payload.user_type,
        company_name=payload.company_name,
    )
    
    try:
        # Create user with profile using service layer
        user = create_user_with_profile(registration_data)
        
        # Generate tokens
        tokens = get_tokens_for_user(user)
        
        logger.info(f"User registered successfully: {user.email} as {user.user_type}")
        
        return 201, {
            "user": UserSchema.from_orm(user),
            "access": tokens["access"],
            "refresh": tokens["refresh"],
        }
        
    except EmailAlreadyExistsError as e:
        raise HttpError(400, str(e))
    except UsernameAlreadyExistsError as e:
        raise HttpError(400, str(e))
    except PasswordValidationError as e:
        raise HttpError(400, str(e))
    except ProfileCreationError as e:
        logger.error(f"Profile creation failed during registration: {str(e)}")
        raise HttpError(400, "Unable to create user profile. Please try again.")
    except Exception as e:
        logger.error(f"Unexpected error during registration: {str(e)}")
        raise HttpError(400, "Unable to create user. Please try again.")


@router.post("/login", response={200: LoginResponseSchema, 400: ErrorSchema, 401: ErrorSchema})
def login(request, payload: LoginInputSchema):
    """
    Authenticate a user and return JWT tokens.
    
    Accepts either email or username as the identifier.
    
    - **identifier**: Email address or username
    - **password**: User's password
    """
    identifier = payload.identifier.strip()
    password = payload.password
    
    # Try to find user by email or username
    user = None
    
    # Check if identifier looks like an email
    if "@" in identifier:
        try:
            user_obj = User.objects.get(email=identifier.lower())
            # Authenticate using email
            user = authenticate(request, email=user_obj.email, password=password)
        except User.DoesNotExist:
            pass
    
    # If not found by email, try username
    if user is None:
        try:
            user_obj = User.objects.get(username=identifier)
            # Authenticate using email (since USERNAME_FIELD is email)
            user = authenticate(request, email=user_obj.email, password=password)
        except User.DoesNotExist:
            pass
    
    if user is None:
        raise HttpError(401, "Invalid credentials")
    
    if not user.is_active:
        raise HttpError(401, "User account is disabled")
    
    # Generate tokens
    tokens = get_tokens_for_user(user)
    
    return {
        "user": UserSchema.from_orm(user),
        "access": tokens["access"],
        "refresh": tokens["refresh"],
    }


@router.post("/logout", response={200: MessageSchema, 400: ErrorSchema})
def logout(request, payload: LogoutInputSchema):
    """
    Logout user by blacklisting the refresh token.
    
    This invalidates the refresh token so it cannot be used to obtain new access tokens.
    Note: The access token will remain valid until it expires.
    
    - **refresh**: The refresh token to invalidate
    """
    try:
        token = RefreshToken(payload.refresh)
        token.blacklist()
    except Exception as e:
        raise HttpError(400, "Invalid or expired refresh token")
    
    return {"message": "Successfully logged out"}


@router.post("/refresh", response={200: TokenRefreshResponseSchema, 400: ErrorSchema, 401: ErrorSchema})
def refresh_token(request, payload: TokenRefreshInputSchema):
    """
    Refresh an access token using a valid refresh token.
    
    - **refresh**: Valid refresh token
    """
    try:
        refresh = RefreshToken(payload.refresh)
        access_token = str(refresh.access_token)
    except Exception as e:
        raise HttpError(401, "Invalid or expired refresh token")
    
    return {"access": access_token}


@router.get("/me", auth=JWTAuth(), response={200: UserSchema, 401: ErrorSchema})
def get_current_user(request):
    """
    Get the current authenticated user's information.
    
    Requires a valid JWT access token in the Authorization header.
    """
    user = request.auth
    return UserSchema.from_orm(user)

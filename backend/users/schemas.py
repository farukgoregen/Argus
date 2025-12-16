"""
Pydantic schemas for user authentication and user-related API endpoints.
"""
from typing import Optional
from uuid import UUID
from ninja import Schema
from pydantic import EmailStr, field_validator, model_validator
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError


class UserSchema(Schema):
    """Schema for user response data."""
    id: UUID
    email: str
    username: str
    user_type: str
    is_active: bool


class RegisterInputSchema(Schema):
    """
    Schema for user registration input.
    
    Profile Creation:
    - user_type='buyer' -> Creates BuyerProfile
    - user_type='supplier' -> Creates SupplierProfile
    
    The company_name field is optional. If not provided, username is used as default.
    """
    email: EmailStr
    username: str
    password: str
    password_confirm: str
    user_type: Optional[str] = "buyer"
    company_name: Optional[str] = None  # Optional: defaults to username if not provided
    
    @field_validator('username')
    @classmethod
    def validate_username(cls, v: str) -> str:
        if len(v) < 3:
            raise ValueError('Username must be at least 3 characters long')
        if len(v) > 150:
            raise ValueError('Username must be at most 150 characters long')
        # Allow alphanumeric, underscores, and hyphens
        import re
        if not re.match(r'^[\w-]+$', v):
            raise ValueError('Username can only contain alphanumeric characters, underscores, and hyphens')
        return v
    
    @field_validator('user_type')
    @classmethod
    def validate_user_type(cls, v: str) -> str:
        if v not in ['buyer', 'supplier']:
            raise ValueError('User type must be either "buyer" or "supplier"')
        return v
    
    @field_validator('company_name')
    @classmethod
    def validate_company_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if len(v) < 2:
                raise ValueError('Company name must be at least 2 characters long')
            if len(v) > 255:
                raise ValueError('Company name must be at most 255 characters long')
        return v


class RegisterResponseSchema(Schema):
    """Schema for registration response."""
    user: UserSchema
    access: str
    refresh: str


class LoginInputSchema(Schema):
    """Schema for login input. Accepts email or username."""
    identifier: str  # Can be email or username
    password: str


class LoginResponseSchema(Schema):
    """Schema for login response."""
    user: UserSchema
    access: str
    refresh: str


class LogoutInputSchema(Schema):
    """Schema for logout input."""
    refresh: str


class MessageSchema(Schema):
    """Generic message response schema."""
    message: str


class ErrorSchema(Schema):
    """Schema for error responses."""
    detail: str


class TokenRefreshInputSchema(Schema):
    """Schema for token refresh input."""
    refresh: str


class TokenRefreshResponseSchema(Schema):
    """Schema for token refresh response."""
    access: str


# Profile Schemas
class BuyerProfileSchema(Schema):
    """Schema for buyer profile response data."""
    id: UUID
    company_name: str
    phone: Optional[str] = None
    payment_method: Optional[str] = None
    logo: Optional[str] = None  # URL to the logo
    created_at: str
    updated_at: str
    
    @staticmethod
    def resolve_logo(obj) -> Optional[str]:
        """Return the logo URL if it exists."""
        if obj.logo and hasattr(obj.logo, 'url'):
            return obj.logo.url
        return None
    
    @staticmethod
    def resolve_created_at(obj) -> str:
        return obj.created_at.isoformat()
    
    @staticmethod
    def resolve_updated_at(obj) -> str:
        return obj.updated_at.isoformat()


class BuyerProfileUpdateSchema(Schema):
    """Schema for buyer profile update input."""
    phone: Optional[str] = None
    payment_method: Optional[str] = None


class SupplierProfileSchema(Schema):
    """Schema for supplier profile response data."""
    id: UUID
    company_name: str
    phone: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None
    main_production_location: Optional[str] = None
    return_policy: Optional[str] = None
    payment_method: Optional[str] = None
    logo: Optional[str] = None  # URL to the logo
    trust_score: float
    on_time_delivery_rate: float
    avg_response_time: int
    cancellation_rate: float
    certifications: list
    created_at: str
    updated_at: str
    
    @staticmethod
    def resolve_logo(obj) -> Optional[str]:
        """Return the logo URL if it exists."""
        if obj.logo and hasattr(obj.logo, 'url'):
            return obj.logo.url
        return None
    
    @staticmethod
    def resolve_trust_score(obj) -> float:
        return float(obj.trust_score)
    
    @staticmethod
    def resolve_on_time_delivery_rate(obj) -> float:
        return float(obj.on_time_delivery_rate)
    
    @staticmethod
    def resolve_cancellation_rate(obj) -> float:
        return float(obj.cancellation_rate)
    
    @staticmethod
    def resolve_created_at(obj) -> str:
        return obj.created_at.isoformat()
    
    @staticmethod
    def resolve_updated_at(obj) -> str:
        return obj.updated_at.isoformat()


class SupplierProfileUpdateSchema(Schema):
    """Schema for supplier profile update input."""
    phone: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None
    main_production_location: Optional[str] = None
    return_policy: Optional[str] = None
    payment_method: Optional[str] = None

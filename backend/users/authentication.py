"""
JWT Authentication class for Django Ninja.
Provides reusable JWTAuth for protecting endpoints.
"""
from ninja.security import HttpBearer
from ninja_jwt.authentication import JWTAuth as NinjaJWTAuth
from django.http import HttpRequest
from typing import Optional, Any


# Re-export the built-in JWTAuth from ninja_jwt
JWTAuth = NinjaJWTAuth


class OptionalJWTAuth(HttpBearer):
    """
    Optional JWT Authentication - doesn't fail if no token provided.
    Use this for endpoints that work with or without authentication.
    """
    
    def __init__(self):
        super().__init__()
        self._jwt_auth = NinjaJWTAuth()
    
    def authenticate(self, request: HttpRequest, token: str) -> Optional[Any]:
        """
        Authenticate the request using the JWT token.
        Returns the user if valid, None if no token or invalid.
        """
        if not token:
            return None
        try:
            return self._jwt_auth.authenticate(request, token)
        except Exception:
            return None


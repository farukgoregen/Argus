"""
Django Ninja API Configuration

This module configures the main API instance with:
- Custom JSON renderer (ORJSON for performance)
- Global exception handlers
- OpenAPI documentation settings
- Router mounting
"""
import orjson
from ninja import NinjaAPI, Swagger
from ninja.renderers import BaseRenderer
from ninja.errors import HttpError, ValidationError as NinjaValidationError
from django.http import Http404, HttpRequest, HttpResponse
from django.conf import settings
from pydantic import ValidationError as PydanticValidationError
from ninja_jwt.exceptions import InvalidToken, TokenError, AuthenticationFailed


from users.auth_router import router as auth_router
from users.profile_router import router as profile_router
from ai.api_router import router as ai_router
from products.api_router import router as products_router
from products.public_router import router as public_products_router
from home.api_router import router as home_router
from home.watchlist_router import router as watchlist_router
from chat.api_router import router as chat_router


# Custom ORJSON Renderer for better performance
class ORJSONRenderer(BaseRenderer):
    """
    Custom JSON renderer using orjson for faster serialization.
    Supports native serialization of dataclasses, datetime, numpy, UUID, and Decimal.
    """
    media_type = "application/json"

    def render(self, request: HttpRequest, data, *, response_status: int) -> bytes:
        from decimal import Decimal
        
        def default(obj):
            if isinstance(obj, Decimal):
                return float(obj)
            raise TypeError(f"Object of type {type(obj)} is not JSON serializable")
        
        return orjson.dumps(
            data,
            default=default,
            option=orjson.OPT_SERIALIZE_NUMPY | orjson.OPT_SERIALIZE_UUID
        )


# Initialize API with configuration
api = NinjaAPI(
    title="Argus API",
    version="1.0.0",
    description="""
## Argus API

A powerful B2B Supplier-Buyer Platform API.

### Features:
- **Authentication**: JWT-based authentication with access and refresh tokens
- **User Management**: Registration, login, logout, and profile management

### Authentication:
All protected endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <access_token>
```

### Error Responses:
All errors follow a consistent format:
```json
{
    "detail": "Error message description"
}
```
    """,
    docs=Swagger(settings={"persistAuthorization": True}),
    renderer=ORJSONRenderer(),
    # URLs configuration
    urls_namespace="api",
)


# ============================================
# Custom Exception Handlers
# ============================================

@api.exception_handler(Http404)
def handle_404(request: HttpRequest, exc: Http404) -> HttpResponse:
    """Handle Django's Http404 exception."""
    return api.create_response(
        request,
        {"detail": str(exc) if str(exc) else "Resource not found"},
        status=404,
    )


@api.exception_handler(HttpError)
def handle_http_error(request: HttpRequest, exc: HttpError) -> HttpResponse:
    """Handle Ninja's HttpError exception."""
    return api.create_response(
        request,
        {"detail": exc.message},
        status=exc.status_code,
    )


@api.exception_handler(InvalidToken)
def handle_invalid_token(request: HttpRequest, exc: InvalidToken) -> HttpResponse:
    """Handle JWT InvalidToken exception."""
    return api.create_response(
        request,
        {"detail": "Invalid or expired token"},
        status=401,
    )


@api.exception_handler(AuthenticationFailed)
def handle_auth_failed(request: HttpRequest, exc: AuthenticationFailed) -> HttpResponse:
    """Handle JWT AuthenticationFailed exception."""
    return api.create_response(
        request,
        {"detail": "Authentication failed"},
        status=401,
    )


@api.exception_handler(TokenError)
def handle_token_error(request: HttpRequest, exc: TokenError) -> HttpResponse:
    """Handle JWT TokenError exception."""
    return api.create_response(
        request,
        {"detail": "Token error"},
        status=401,
    )


@api.exception_handler(NinjaValidationError)
def handle_validation_error(request: HttpRequest, exc: NinjaValidationError) -> HttpResponse:
    """Handle validation errors with consistent format."""
    errors = exc.errors
    # Format validation errors into a readable message
    if isinstance(errors, list) and len(errors) > 0:
        error_messages = []
        for error in errors:
            if isinstance(error, dict):
                loc = error.get("loc", [])
                msg = error.get("msg", "Validation error")
                field = ".".join(str(l) for l in loc if l != "body")
                if field:
                    error_messages.append(f"{field}: {msg}")
                else:
                    error_messages.append(msg)
            else:
                error_messages.append(str(error))
        detail = "; ".join(error_messages)
    else:
        detail = "Validation error"
    
    return api.create_response(
        request,
        {"detail": detail, "errors": errors},
        status=422,
    )


@api.exception_handler(Exception)
def handle_generic_exception(request: HttpRequest, exc: Exception) -> HttpResponse:
    """Handle any unhandled exceptions."""
    if settings.DEBUG:
        # In debug mode, return the exception details
        import traceback
        return api.create_response(
            request,
            {
                "detail": str(exc),
                "type": type(exc).__name__,
                "traceback": traceback.format_exc(),
            },
            status=500,
        )
    # In production, return a generic error message
    return api.create_response(
        request,
        {"detail": "An internal server error occurred"},
        status=500,
    )


# ============================================
# Mount Routers
# ============================================


# Authentication router
api.add_router("/auth", auth_router, tags=["Authentication"])

# Profile management router
api.add_router("/profile", profile_router, tags=["Profile"])

# AI router
api.add_router("/ai", ai_router, tags=["AI"])

# Products router
api.add_router("/products", products_router, tags=["Products"])

# Public products router (no authentication required)
api.add_router("/public/products", public_products_router, tags=["Public Products"])

# Home feed router (authentication required)
api.add_router("/home-feed", home_router, tags=["Home"])

# Watchlist router (authentication required)
api.add_router("/watchlist", watchlist_router, tags=["Watchlist"])

# Chat router (authentication required)
api.add_router("/chat", chat_router, tags=["Chat"])


# ============================================
# Health Check / Utility Endpoints
# ============================================

@api.get("/health", tags=["Health"])
def health_check(request: HttpRequest) -> dict:
    """
    Health check endpoint for monitoring and load balancers.
    Returns the API status and version.
    """
    return {
        "status": "healthy",
        "version": api.version,
    }


@api.get("/", tags=["Health"])
def root(request: HttpRequest) -> dict:
    """
    Root endpoint with API information.
    """
    return {
        "message": "Welcome to Argus API",
        "version": api.version,
        "docs": "/api/docs",
    }

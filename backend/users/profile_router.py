"""
Profile management router for buyer and supplier profiles.
Implements endpoints for viewing and editing user profiles.
"""
import logging
from typing import Optional
from ninja import Router, File, Form
from ninja.files import UploadedFile
from ninja.errors import HttpError

from .authentication import JWTAuth
from .models import BuyerProfile, SupplierProfile
from .schemas import (
    BuyerProfileSchema,
    BuyerProfileUpdateSchema,
    SupplierProfileSchema,
    SupplierProfileUpdateSchema,
    MessageSchema,
    ErrorSchema,
)
from .image_utils import convert_to_webp, validate_image_file

logger = logging.getLogger(__name__)

router = Router(tags=["profile"])


@router.get(
    "/buyer",
    auth=JWTAuth(),
    response={200: BuyerProfileSchema, 401: ErrorSchema, 404: ErrorSchema}
)
def get_buyer_profile(request):
    """
    Get the current authenticated buyer's profile.
    
    Requires a valid JWT access token. Only accessible by users with user_type='buyer'.
    """
    user = request.auth
    
    if user.user_type != 'buyer':
        raise HttpError(403, "Only buyers can access buyer profile")
    
    try:
        profile = user.buyer_profile
    except BuyerProfile.DoesNotExist:
        raise HttpError(404, "Buyer profile not found")
    
    return profile


@router.patch(
    "/buyer",
    auth=JWTAuth(),
    response={200: BuyerProfileSchema, 400: ErrorSchema, 401: ErrorSchema, 404: ErrorSchema}
)
def update_buyer_profile(
    request,
    phone: Form[Optional[str]] = None,
    payment_method: Form[Optional[str]] = None,
    logo: File[UploadedFile] = None,
):
    """
    Update the current authenticated buyer's profile.
    
    Only the following fields can be updated:
    - **phone**: Phone number (max 20 characters)
    - **payment_method**: Preferred payment method (max 100 characters)
    - **logo**: Profile logo image (optional file upload)
    
    Requires a valid JWT access token. Only accessible by users with user_type='buyer'.
    Send as multipart/form-data if uploading a logo, otherwise application/x-www-form-urlencoded.
    """
    user = request.auth
    
    if user.user_type != 'buyer':
        raise HttpError(403, "Only buyers can update buyer profile")
    
    try:
        profile = user.buyer_profile
    except BuyerProfile.DoesNotExist:
        raise HttpError(404, "Buyer profile not found")
    
    # Track if any field was updated
    updated = False
    
    # Update phone if provided
    if phone is not None:
        phone = phone.strip()
        if len(phone) > 20:
            raise HttpError(400, "Phone number must be at most 20 characters")
        profile.phone = phone if phone else None
        updated = True
        logger.info(f"Updated phone for buyer: {user.email}")
    
    # Update payment_method if provided
    if payment_method is not None:
        payment_method = payment_method.strip()
        if len(payment_method) > 100:
            raise HttpError(400, "Payment method must be at most 100 characters")
        profile.payment_method = payment_method if payment_method else None
        updated = True
        logger.info(f"Updated payment_method for buyer: {user.email}")
    
    # Update logo if provided
    if logo is not None:
        # Validate file type
        is_valid, error_msg = validate_image_file(logo)
        if not is_valid:
            raise HttpError(400, error_msg)
        
        # Convert to WebP format
        try:
            webp_logo = convert_to_webp(logo)
            profile.logo.save(webp_logo.name, webp_logo, save=False)
            updated = True
            logger.info(f"Updated logo (converted to WebP) for buyer: {user.email}")
        except ValueError as e:
            raise HttpError(400, str(e))
    
    if updated:
        profile.save()
    
    return profile


@router.get(
    "/supplier",
    auth=JWTAuth(),
    response={200: SupplierProfileSchema, 401: ErrorSchema, 404: ErrorSchema}
)
def get_supplier_profile(request):
    """
    Get the current authenticated supplier's profile.
    
    Requires a valid JWT access token. Only accessible by users with user_type='supplier'.
    """
    user = request.auth
    
    if user.user_type != 'supplier':
        raise HttpError(403, "Only suppliers can access supplier profile")
    
    try:
        profile = user.supplier_profile
    except SupplierProfile.DoesNotExist:
        raise HttpError(404, "Supplier profile not found")
    
    return profile


@router.patch(
    "/supplier",
    auth=JWTAuth(),
    response={200: SupplierProfileSchema, 400: ErrorSchema, 401: ErrorSchema, 404: ErrorSchema}
)
def update_supplier_profile(
    request,
    phone: Form[Optional[str]] = None,
    website: Form[Optional[str]] = None,
    description: Form[Optional[str]] = None,
    main_production_location: Form[Optional[str]] = None,
    return_policy: Form[Optional[str]] = None,
    payment_method: Form[Optional[str]] = None,
    logo: File[UploadedFile] = None,
):
    """
    Update the current authenticated supplier's profile.
    
    Only the following fields can be updated:
    - **phone**: Phone number (max 20 characters)
    - **website**: Website URL (max 255 characters)
    - **description**: Business description (text)
    - **main_production_location**: Main production location (max 255 characters)
    - **return_policy**: Return and warranty terms (text)
    - **payment_method**: Preferred payment method (max 100 characters)
    - **logo**: Profile logo image (optional file upload)
    
    Requires a valid JWT access token. Only accessible by users with user_type='supplier'.
    Send as multipart/form-data if uploading a logo, otherwise application/x-www-form-urlencoded.
    """
    user = request.auth
    
    if user.user_type != 'supplier':
        raise HttpError(403, "Only suppliers can update supplier profile")
    
    try:
        profile = user.supplier_profile
    except SupplierProfile.DoesNotExist:
        raise HttpError(404, "Supplier profile not found")
    
    # Track if any field was updated
    updated = False
    
    # Update phone if provided
    if phone is not None:
        phone = phone.strip()
        if len(phone) > 20:
            raise HttpError(400, "Phone number must be at most 20 characters")
        profile.phone = phone if phone else None
        updated = True
        logger.info(f"Updated phone for supplier: {user.email}")
    
    # Update website if provided
    if website is not None:
        website = website.strip()
        if len(website) > 255:
            raise HttpError(400, "Website URL must be at most 255 characters")
        profile.website = website if website else None
        updated = True
        logger.info(f"Updated website for supplier: {user.email}")
    
    # Update description if provided
    if description is not None:
        description = description.strip()
        profile.description = description if description else None
        updated = True
        logger.info(f"Updated description for supplier: {user.email}")
    
    # Update main_production_location if provided
    if main_production_location is not None:
        main_production_location = main_production_location.strip()
        if len(main_production_location) > 255:
            raise HttpError(400, "Main production location must be at most 255 characters")
        profile.main_production_location = main_production_location if main_production_location else None
        updated = True
        logger.info(f"Updated main_production_location for supplier: {user.email}")
    
    # Update return_policy if provided
    if return_policy is not None:
        return_policy = return_policy.strip()
        profile.return_policy = return_policy if return_policy else None
        updated = True
        logger.info(f"Updated return_policy for supplier: {user.email}")
    
    # Update payment_method if provided
    if payment_method is not None:
        payment_method = payment_method.strip()
        if len(payment_method) > 100:
            raise HttpError(400, "Payment method must be at most 100 characters")
        profile.payment_method = payment_method if payment_method else None
        updated = True
        logger.info(f"Updated payment_method for supplier: {user.email}")
    
    # Update logo if provided
    if logo is not None:
        # Validate file type
        is_valid, error_msg = validate_image_file(logo)
        if not is_valid:
            raise HttpError(400, error_msg)
        
        # Convert to WebP format
        try:
            webp_logo = convert_to_webp(logo)
            profile.logo.save(webp_logo.name, webp_logo, save=False)
            updated = True
            logger.info(f"Updated logo (converted to WebP) for supplier: {user.email}")
        except ValueError as e:
            raise HttpError(400, str(e))
    
    if updated:
        profile.save()
    
    return profile

"""
Image utilities for processing and converting uploaded images.
"""
import io
import logging
import os
from PIL import Image
from django.core.files.uploadedfile import InMemoryUploadedFile

logger = logging.getLogger(__name__)

# WebP conversion settings
WEBP_QUALITY = 85
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


def convert_to_webp(uploaded_file, max_size=MAX_FILE_SIZE, quality=WEBP_QUALITY):
    """
    Convert an uploaded image file to WebP format.
    
    Args:
        uploaded_file: The uploaded file (UploadedFile from Django/Ninja)
        max_size: Maximum file size in bytes (default 5MB)
        quality: WebP quality (0-100, default 85)
    
    Returns:
        InMemoryUploadedFile: The converted WebP image file
        
    Raises:
        ValueError: If the image cannot be converted
    """
    try:
        # Open the image
        image = Image.open(uploaded_file)
        
        # Convert to RGB if necessary (handles RGBA, P mode, etc.)
        if image.mode in ('RGBA', 'LA', 'P'):
            # Create a white background for transparent images
            background = Image.new('RGB', image.size, (255, 255, 255))
            if image.mode == 'P':
                image = image.convert('RGBA')
            background.paste(image, mask=image.split()[-1] if image.mode == 'RGBA' else None)
            image = background
        elif image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Create a BytesIO buffer for the output
        output_buffer = io.BytesIO()
        
        # Save as WebP with specified quality
        current_quality = quality
        min_quality = 50
        
        while current_quality >= min_quality:
            output_buffer.seek(0)
            output_buffer.truncate(0)
            
            image.save(output_buffer, format='WEBP', quality=current_quality, optimize=True)
            
            # Check file size
            file_size = output_buffer.tell()
            if file_size <= max_size:
                break
            
            # Reduce quality and try again
            current_quality -= 10
            logger.info(f"Image too large ({file_size} bytes), reducing quality to {current_quality}")
        
        if output_buffer.tell() > max_size:
            raise ValueError(f"Unable to compress image below {max_size / 1024 / 1024:.1f}MB")
        
        # Reset buffer position
        output_buffer.seek(0)
        
        # Generate new filename with .webp extension
        original_name = getattr(uploaded_file, 'name', 'image.jpg')
        base_name = os.path.splitext(original_name)[0]
        new_filename = f"{base_name}.webp"
        
        # Create InMemoryUploadedFile
        converted_file = InMemoryUploadedFile(
            file=output_buffer,
            field_name=None,
            name=new_filename,
            content_type='image/webp',
            size=output_buffer.tell(),
            charset=None
        )
        
        logger.info(f"Converted image to WebP: {original_name} -> {new_filename} ({output_buffer.tell()} bytes)")
        
        return converted_file
        
    except Exception as e:
        logger.error(f"Failed to convert image to WebP: {str(e)}")
        raise ValueError(f"Failed to convert image: {str(e)}")


def validate_image_file(uploaded_file, allowed_types=None, max_size=MAX_FILE_SIZE):
    """
    Validate an uploaded image file.
    
    Args:
        uploaded_file: The uploaded file to validate
        allowed_types: List of allowed MIME types (default: jpeg, png, gif, webp)
        max_size: Maximum file size in bytes (default 5MB)
    
    Returns:
        tuple: (is_valid, error_message)
    """
    if allowed_types is None:
        allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    
    # Check content type
    content_type = getattr(uploaded_file, 'content_type', None)
    if content_type not in allowed_types:
        return False, f"Invalid file type: {content_type}. Allowed types: {', '.join(allowed_types)}"
    
    # Check file size
    file_size = getattr(uploaded_file, 'size', 0)
    if file_size > max_size * 2:  # Allow 2x for pre-conversion
        return False, f"File too large. Maximum size is {max_size / 1024 / 1024:.1f}MB"
    
    return True, None

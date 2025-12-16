import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin


class UserType(models.TextChoices):
    """User type choices for the platform."""
    BUYER = 'buyer', 'Buyer'
    SUPPLIER = 'supplier', 'Supplier'


class CustomUserManager(BaseUserManager):
    """Custom user manager for email-based authentication."""
    
    def create_user(self, email, username, password=None, **extra_fields):
        """Create and save a regular user with the given email and password."""
        if not email:
            raise ValueError('Users must have an email address')
        if not username:
            raise ValueError('Users must have a username')
        
        email = self.normalize_email(email)
        user = self.model(email=email, username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, username, password=None, **extra_fields):
        """Create and save a superuser with the given email and password."""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('user_type', UserType.SUPPLIER)
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        
        return self.create_user(email, username, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom User model for B2B Supplier-Buyer Platform.
    Uses email for authentication and UUID as primary key.
    """
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    email = models.EmailField(
        verbose_name='email address',
        max_length=255,
        unique=True
    )
    username = models.CharField(max_length=150, unique=True)
    user_type = models.CharField(
        max_length=10,
        choices=UserType.choices,
        default=UserType.BUYER
    )
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    objects = CustomUserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    class Meta:
        verbose_name = 'user'
        verbose_name_plural = 'users'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.email
    
    def get_full_name(self):
        return self.username
    
    def get_short_name(self):
        return self.username


class Region(models.Model):
    """
    Region model for working regions and preferred regions.
    Used by both suppliers and buyers.
    """
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=10, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'region'
        verbose_name_plural = 'regions'
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.code})"


class Category(models.Model):
    """
    Category model for product categories.
    Used by buyers for preferred categories.
    """
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True, null=True)
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='subcategories'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'category'
        verbose_name_plural = 'categories'
        ordering = ['name']
    
    def __str__(self):
        return self.name


class SupplierProfile(models.Model):
    """
    Supplier profile model containing business-specific information.
    Linked to User via OneToOne relationship.
    """
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='supplier_profile'
    )
    company_name = models.CharField(max_length=255)
    logo = models.ImageField(
        upload_to='supplier_logos/',
        blank=True,
        null=True
    )
    phone = models.CharField(max_length=20, blank=True, null=True)
    website = models.URLField(max_length=255, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    working_regions = models.ManyToManyField(
        Region,
        related_name='suppliers',
        blank=True
    )
    main_production_location = models.CharField(
        max_length=255,
        blank=True,
        null=True
    )
    
    # Trust and performance metrics
    trust_score = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        default=0.00,
        help_text='Trust score (0-100) calculated from response time, cancellation rate, stock consistency'
    )
    on_time_delivery_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0.00,
        help_text='On-time delivery percentage (0-100)'
    )
    avg_response_time = models.PositiveIntegerField(
        default=0,
        help_text='Average response time in hours'
    )
    cancellation_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0.00,
        help_text='Order cancellation rate percentage (0-100)'
    )
    
    # Policies and certifications
    return_policy = models.TextField(
        blank=True,
        null=True,
        help_text='Return and warranty terms'
    )
    certifications = models.JSONField(
        default=list,
        blank=True,
        help_text='Certifications like ISO, CE, etc.'
    )
    payment_method = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text='Preferred payment method'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'supplier profile'
        verbose_name_plural = 'supplier profiles'
        ordering = ['-trust_score', '-created_at']
    
    def __str__(self):
        return f"{self.company_name} ({self.user.email})"
    
    def calculate_trust_score(self):
        """
        Calculate trust score based on:
        - Response time (lower is better)
        - Cancellation rate (lower is better)
        - On-time delivery rate (higher is better)
        """
        # Weighted calculation
        response_score = max(0, 100 - (self.avg_response_time * 2))  # Penalty for slow response
        cancellation_score = 100 - float(self.cancellation_rate)
        delivery_score = float(self.on_time_delivery_rate)
        
        # Weighted average: delivery 40%, cancellation 35%, response 25%
        self.trust_score = (
            (delivery_score * 0.40) +
            (cancellation_score * 0.35) +
            (response_score * 0.25)
        )
        return self.trust_score


class BuyerProfile(models.Model):
    """
    Buyer profile model containing buyer-specific information.
    Linked to User via OneToOne relationship.
    """
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='buyer_profile'
    )
    company_name = models.CharField(max_length=255)
    logo = models.ImageField(
        upload_to='buyer_logos/',
        blank=True,
        null=True
    )
    phone = models.CharField(max_length=20, blank=True, null=True)
    preferred_regions = models.ManyToManyField(
        Region,
        related_name='buyers',
        blank=True
    )
    preferred_categories = models.ManyToManyField(
        Category,
        related_name='interested_buyers',
        blank=True
    )
    payment_method = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text='Preferred payment method'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'buyer profile'
        verbose_name_plural = 'buyer profiles'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.company_name} ({self.user.email})"

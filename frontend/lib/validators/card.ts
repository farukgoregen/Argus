/**
 * Card Validation Utilities
 * 
 * Frontend-only validation for payment card details.
 * This is a UI placeholder - NO backend payment endpoint exists.
 * 
 * TODO: When payment backend is implemented, replace with actual payment flow.
 */

// Card type detection based on card number prefix
export type CardType = 'visa' | 'mastercard' | 'amex' | 'discover' | 'unknown';

/**
 * Detect card type from card number
 */
export function detectCardType(cardNumber: string): CardType {
  const cleaned = cardNumber.replace(/\s/g, '');
  
  // Visa: starts with 4
  if (/^4/.test(cleaned)) return 'visa';
  
  // Mastercard: starts with 51-55 or 2221-2720
  if (/^5[1-5]/.test(cleaned) || /^2[2-7]/.test(cleaned)) return 'mastercard';
  
  // Amex: starts with 34 or 37
  if (/^3[47]/.test(cleaned)) return 'amex';
  
  // Discover: starts with 6011, 65, or 644-649
  if (/^6(?:011|5|4[4-9])/.test(cleaned)) return 'discover';
  
  return 'unknown';
}

/**
 * Luhn algorithm (Mod 10) for validating card numbers
 * @param cardNumber - Card number (spaces will be stripped)
 * @returns true if the card number passes the Luhn check
 */
export function validateLuhn(cardNumber: string): boolean {
  const cleaned = cardNumber.replace(/\s/g, '');
  
  if (!/^\d+$/.test(cleaned)) return false;
  if (cleaned.length < 13 || cleaned.length > 19) return false;
  
  let sum = 0;
  let isEven = false;
  
  // Loop through digits from right to left
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i], 10);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
}

/**
 * Validate card number format and checksum
 */
export function validateCardNumber(cardNumber: string): { valid: boolean; error?: string } {
  const cleaned = cardNumber.replace(/\s/g, '');
  
  if (!cleaned) {
    return { valid: false, error: 'Card number is required' };
  }
  
  if (!/^\d+$/.test(cleaned)) {
    return { valid: false, error: 'Card number must contain only digits' };
  }
  
  const cardType = detectCardType(cleaned);
  
  // Check length based on card type
  if (cardType === 'amex' && cleaned.length !== 15) {
    return { valid: false, error: 'American Express cards must have 15 digits' };
  }
  
  if (cardType !== 'amex' && (cleaned.length < 16 || cleaned.length > 19)) {
    return { valid: false, error: 'Card number must be 16-19 digits' };
  }
  
  if (!validateLuhn(cleaned)) {
    return { valid: false, error: 'Invalid card number' };
  }
  
  return { valid: true };
}

/**
 * Validate expiry date (MM/YY format)
 */
export function validateExpiryDate(expiry: string): { valid: boolean; error?: string } {
  if (!expiry) {
    return { valid: false, error: 'Expiry date is required' };
  }
  
  // Accept MM/YY or MM/YYYY
  const match = expiry.match(/^(\d{2})\/(\d{2,4})$/);
  
  if (!match) {
    return { valid: false, error: 'Invalid format. Use MM/YY' };
  }
  
  const month = parseInt(match[1], 10);
  let year = parseInt(match[2], 10);
  
  // Convert 2-digit year to 4-digit
  if (year < 100) {
    year += 2000;
  }
  
  if (month < 1 || month > 12) {
    return { valid: false, error: 'Invalid month (01-12)' };
  }
  
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  // Check if card is expired
  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return { valid: false, error: 'Card has expired' };
  }
  
  // Check if year is too far in future (max 20 years)
  if (year > currentYear + 20) {
    return { valid: false, error: 'Invalid expiry year' };
  }
  
  return { valid: true };
}

/**
 * Validate CVV/CVC
 */
export function validateCVV(cvv: string, cardType: CardType = 'unknown'): { valid: boolean; error?: string } {
  if (!cvv) {
    return { valid: false, error: 'Security code is required' };
  }
  
  if (!/^\d+$/.test(cvv)) {
    return { valid: false, error: 'Security code must contain only digits' };
  }
  
  // Amex has 4-digit CVV, others have 3
  const expectedLength = cardType === 'amex' ? 4 : 3;
  const validLengths = cardType === 'amex' ? [4] : [3, 4];
  
  if (!validLengths.includes(cvv.length)) {
    return { 
      valid: false, 
      error: cardType === 'amex' 
        ? 'Security code must be 4 digits for Amex' 
        : 'Security code must be 3 digits'
    };
  }
  
  return { valid: true };
}

/**
 * Validate cardholder name
 */
export function validateCardholderName(name: string): { valid: boolean; error?: string } {
  if (!name || !name.trim()) {
    return { valid: false, error: 'Cardholder name is required' };
  }
  
  const trimmed = name.trim();
  
  if (trimmed.length < 2) {
    return { valid: false, error: 'Name is too short' };
  }
  
  if (trimmed.length > 50) {
    return { valid: false, error: 'Name is too long' };
  }
  
  // Allow letters, spaces, hyphens, apostrophes
  if (!/^[a-zA-Z\s\-']+$/.test(trimmed)) {
    return { valid: false, error: 'Name contains invalid characters' };
  }
  
  return { valid: true };
}

/**
 * Format card number with spaces (groups of 4, or 4-6-5 for Amex)
 */
export function formatCardNumber(value: string): string {
  const cleaned = value.replace(/\D/g, '');
  const cardType = detectCardType(cleaned);
  
  if (cardType === 'amex') {
    // Amex format: 4-6-5
    const groups = [
      cleaned.slice(0, 4),
      cleaned.slice(4, 10),
      cleaned.slice(10, 15),
    ].filter(Boolean);
    return groups.join(' ');
  }
  
  // Default format: groups of 4
  const groups = cleaned.match(/.{1,4}/g) || [];
  return groups.join(' ');
}

/**
 * Format expiry date as MM/YY
 */
export function formatExpiryDate(value: string): string {
  const cleaned = value.replace(/\D/g, '');
  
  if (cleaned.length >= 2) {
    return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
  }
  
  return cleaned;
}

/**
 * Validate complete card details
 */
export interface CardDetails {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
}

export interface CardValidationResult {
  valid: boolean;
  errors: {
    cardNumber?: string;
    expiryDate?: string;
    cvv?: string;
    cardholderName?: string;
  };
}

export function validateCardDetails(card: CardDetails): CardValidationResult {
  const cardType = detectCardType(card.cardNumber);
  
  const cardNumberResult = validateCardNumber(card.cardNumber);
  const expiryResult = validateExpiryDate(card.expiryDate);
  const cvvResult = validateCVV(card.cvv, cardType);
  const nameResult = validateCardholderName(card.cardholderName);
  
  const errors: CardValidationResult['errors'] = {};
  
  if (!cardNumberResult.valid) errors.cardNumber = cardNumberResult.error;
  if (!expiryResult.valid) errors.expiryDate = expiryResult.error;
  if (!cvvResult.valid) errors.cvv = cvvResult.error;
  if (!nameResult.valid) errors.cardholderName = nameResult.error;
  
  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

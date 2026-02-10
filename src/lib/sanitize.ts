/**
 * Security utilities for input sanitization and validation
 */

/**
 * Sanitize string input to prevent XSS attacks
 * Removes HTML tags and special characters
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';

  return input
    .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
    .replace(/<[^>]*>/g, '') // Remove all HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Sanitize URL to prevent malicious URLs
 */
export function sanitizeUrl(url: string): string {
  if (typeof url !== 'string') return '';

  const sanitized = url.trim();

  // Allow empty strings
  if (!sanitized) return '';

  // Check for dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  const lowerUrl = sanitized.toLowerCase();

  for (const protocol of dangerousProtocols) {
    if (lowerUrl.startsWith(protocol)) {
      return '';
    }
  }

  // Ensure URL starts with http:// or https:// or mailto: or tel:
  const allowedProtocols = ['http://', 'https://', 'mailto:', 'tel:'];
  const hasAllowedProtocol = allowedProtocols.some(p => lowerUrl.startsWith(p));

  if (!hasAllowedProtocol && sanitized.includes('.')) {
    // If it looks like a domain but no protocol, add https://
    return `https://${sanitized}`;
  }

  return sanitized;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  if (typeof email !== 'string') return false;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (basic validation for international formats)
 */
export function isValidPhone(phone: string): boolean {
  if (typeof phone !== 'string') return false;

  // Remove common separators
  const cleaned = phone.replace(/[\s\-\(\)\+]/g, '');

  // Check if it contains only digits and is 7-15 characters long
  return /^\d{7,15}$/.test(cleaned);
}

/**
 * Sanitize and validate email
 */
export function sanitizeEmail(email: string): string {
  const sanitized = sanitizeString(email);
  return isValidEmail(sanitized) ? sanitized : '';
}

/**
 * Sanitize and validate phone number
 */
export function sanitizePhone(phone: string): string {
  const sanitized = sanitizeString(phone);
  return isValidPhone(sanitized) ? sanitized : '';
}

/**
 * Sanitize text area input (allow line breaks but remove HTML)
 */
export function sanitizeTextArea(input: string): string {
  if (typeof input !== 'string') return '';

  return input
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

/**
 * Sanitize array of strings
 */
export function sanitizeStringArray(arr: string[]): string[] {
  if (!Array.isArray(arr)) return [];

  return arr
    .filter(item => typeof item === 'string')
    .map(item => sanitizeString(item))
    .filter(item => item.length > 0);
}

/**
 * Input sanitization utilities
 * 
 * Sanitizes user inputs to prevent XSS attacks in stored data
 * Removes or escapes potentially dangerous characters
 */

/**
 * Sanitizes a string by removing HTML tags and escaping special characters
 * Use this for plain text inputs that should not contain HTML
 * 
 * @param input - String to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return String(input);
  }

  // Remove HTML tags
  const withoutHtml = input.replace(/<[^>]*>/g, '');
  
  // Escape special characters that could be used for XSS
  return withoutHtml
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitizes HTML content by allowing only safe HTML tags
 * Use this if you need to preserve some HTML formatting
 * 
 * @param input - HTML string to sanitize
 * @returns Sanitized HTML string
 */
export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') {
    return String(input);
  }

  // List of allowed HTML tags (whitelist approach)
  const allowedTags = ['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
  const allowedTagsRegex = new RegExp(`</?(?:${allowedTags.join('|')})(?:\\s[^>]*)?>`, 'gi');
  
  // Remove all tags except allowed ones
  const sanitized = input.replace(/<[^>]*>/g, (match) => {
    if (allowedTagsRegex.test(match)) {
      return match;
    }
    return '';
  });

  // Escape remaining special characters in attributes
  return sanitized
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}

/**
 * Sanitizes an object by recursively sanitizing all string values
 * 
 * @param obj - Object to sanitize
 * @param sanitizeFunction - Function to use for sanitization (default: sanitizeString)
 * @returns Sanitized object
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  sanitizeFunction: (input: string) => string = sanitizeString
): T {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => 
      typeof item === 'string' ? sanitizeFunction(item) : sanitizeObject(item, sanitizeFunction)
    ) as T;
  }

  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeFunction(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value, sanitizeFunction);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}

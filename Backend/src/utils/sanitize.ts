/**
 * Sanitization utilities for input validation and data cleaning
 */

/**
 * Trim leading and trailing whitespace from a string
 */
export function trimString(value: string): string {
  return value.trim();
}

/**
 * Normalize email: lowercase and trim whitespace
 */
export function normalizeEmail(value: string): string {
  return value.toLowerCase().trim();
}

/**
 * Sanitize input against XSS attacks by escaping HTML entities
 */
export function sanitizeInput(value: string): string {
  const htmlEscapeMap: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
    "/": "&#x2F;",
  };
  return value.replace(/[&<>"'\/]/g, (char) => htmlEscapeMap[char]);
}

/**
 * Validate phone number format (E.164 compatible)
 * Allows: +[1-9]{1,3}[0-9]{6,14} or [0-9]{7,15}
 */
export function validatePhoneFormat(phone: string): boolean {
  // E.164 format: optional + followed by 1-3 country digits, then 6-14 subscriber digits
  // OR just digits 7-15 characters long
  const e164Regex = /^\+?[1-9]\d{6,14}$/;
  return e164Regex.test(phone.replace(/\s/g, ""));
}

/**
 * Validate password strength
 * Requires: 10+ chars, 1+ uppercase, 1+ lowercase, 1+ digit, 1+ special char
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 10) {
    errors.push("Password must be at least 10 characters");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must include at least one uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must include at least one lowercase letter");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password must include at least one number");
  }
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push(
      "Password must include at least one special character (!@#$%^&*)",
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate username format
 * Allows: alphanumeric, underscore, hyphen. Length 3-30
 */
export function validateUsernameFormat(username: string): boolean {
  // Alphanumeric, underscore, hyphen only. 3-30 characters
  const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
  return usernameRegex.test(username);
}

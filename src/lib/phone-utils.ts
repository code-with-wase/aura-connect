/**
 * Phone number normalization utilities
 * Handles different phone formats across countries, especially India (+91)
 */

/**
 * Normalize phone numbers to a standard format for matching
 * - Remove non-digit characters except leading +
 * - Handle country codes (especially +91 for India)
 * - Support formats: +91XXXXXXXXXX, 91XXXXXXXXXX, 0XXXXXXXXXX, XXXXXXXXXX
 */
export function normalizePhoneNumber(phone: string | undefined | null): string | null {
  if (!phone || typeof phone !== "string") return null;

  // Remove whitespace and common separators
  let normalized = phone.trim().replace(/[\s\-().]/g, "");

  if (!normalized) return null;

  // Remove leading zeros and handle different formats
  // If it starts with +, keep it
  if (normalized.startsWith("+")) {
    return normalized;
  }

  // If it starts with country code (91), add +
  if (normalized.startsWith("91") && normalized.length >= 12) {
    return "+" + normalized;
  }

  // If it starts with 0 (common in India), assume India and replace with +91
  if (normalized.startsWith("0") && normalized.length === 10) {
    return "+91" + normalized.substring(1);
  }

  // If it's 10 digits without country code, assume India
  if (!normalized.startsWith("+") && !normalized.startsWith("91") && normalized.length === 10) {
    return "+91" + normalized;
  }

  // If already in international format without +, add it
  if (normalized.length >= 11 && /^\d+$/.test(normalized)) {
    return "+" + normalized;
  }

  return normalized.startsWith("+") ? normalized : null;
}

/**
 * Check if two phone numbers are the same after normalization
 */
export function phonesMatch(phone1: string | undefined | null, phone2: string | undefined | null): boolean {
  const normalized1 = normalizePhoneNumber(phone1);
  const normalized2 = normalizePhoneNumber(phone2);

  if (!normalized1 || !normalized2) return false;

  return normalized1 === normalized2;
}

/**
 * Extract just the digits from a normalized phone number
 */
export function getPhoneDigits(normalizedPhone: string): string {
  return normalizedPhone.replace(/\D/g, "");
}

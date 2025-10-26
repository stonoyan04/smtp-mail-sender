/**
 * Environment configuration helper
 * Provides type-safe access to environment variables
 */

/**
 * Server-side only environment variables (NOT exposed to browser)
 * Use this in API routes and server components for sensitive validation
 */
export const serverEnv = {
  /**
   * Get the allowed email domain for validation (e.g., "example.com")
   * This should be set via ALLOWED_EMAIL_DOMAIN env variable
   */
  domain: process.env.ALLOWED_EMAIL_DOMAIN || 'example.com',
} as const;

/**
 * Client-side environment variables (exposed to browser)
 * Use this ONLY for UI display purposes (placeholders, templates)
 * For security validation, always use serverEnv on the server side
 */
export const env = {
  /**
   * Get the configured domain for UI display (e.g., "example.com")
   * This is used for email placeholders and examples in the UI
   * Falls back to NEXT_PUBLIC_DOMAIN for backward compatibility, then to serverEnv
   */
  domain: process.env.NEXT_PUBLIC_DOMAIN || serverEnv.domain,
} as const;

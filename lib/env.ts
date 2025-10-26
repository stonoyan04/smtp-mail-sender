/**
 * Environment configuration helper
 * Provides type-safe access to environment variables
 */

export const env = {
  /**
   * Get the configured domain (e.g., "example.com")
   * This is used for email placeholders and examples throughout the app
   */
  domain: process.env.NEXT_PUBLIC_DOMAIN || 'example.com',
} as const;

/**
 * Safely retrieve and validate the Nano Banana API key from environment
 */

export function getApiKey(): string {
  const apiKey = process.env.NANO_BANANA_API_KEY;

  if (!apiKey) {
    throw new Error(
      'NANO_BANANA_API_KEY environment variable is not set. ' +
      'Please set it in your .env file before running the application.'
    );
  }

  if (apiKey.trim().length === 0) {
    throw new Error('NANO_BANANA_API_KEY environment variable is empty.');
  }

  return apiKey.trim();
}

/**
 * Check if API key is configured (doesn't throw, returns boolean)
 */
export function isApiKeyConfigured(): boolean {
  const apiKey = process.env.NANO_BANANA_API_KEY;
  return apiKey !== undefined && apiKey.trim().length > 0;
}

/**
 * Get a masked version of the API key for logging (safety)
 */
export function getMaskedApiKey(): string {
  const apiKey = process.env.NANO_BANANA_API_KEY || '';
  if (apiKey.length <= 4) {
    return '****';
  }
  return apiKey.substring(0, 2) + '****' + apiKey.substring(apiKey.length - 2);
}

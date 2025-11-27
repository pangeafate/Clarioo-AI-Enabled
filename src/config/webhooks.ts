/**
 * Webhook Configuration Service
 *
 * Centralizes all n8n webhook URLs with support for production/testing modes.
 * Mode selection persists in localStorage.
 *
 * @module config/webhooks
 */

// ===========================================
// Webhook Mode Management
// ===========================================

const WEBHOOK_MODE_KEY = 'clarioo_webhook_mode';

export type WebhookMode = 'production' | 'testing';

/**
 * Get current webhook mode from localStorage
 * @returns Current mode (defaults to 'production')
 */
export const getWebhookMode = (): WebhookMode => {
  const stored = localStorage.getItem(WEBHOOK_MODE_KEY);
  return (stored === 'testing' ? 'testing' : 'production') as WebhookMode;
};

/**
 * Set webhook mode in localStorage
 * @param mode - Mode to set ('production' | 'testing')
 */
export const setWebhookMode = (mode: WebhookMode): void => {
  localStorage.setItem(WEBHOOK_MODE_KEY, mode);
  console.log(`[webhooks] Mode changed to: ${mode}`);
};

// ===========================================
// Webhook URL Definitions
// ===========================================

const PRODUCTION_WEBHOOKS = {
  PROJECT_CREATION: 'https://n8n.lakestrom.com/webhook/clarioo-project-creation',
  CRITERIA_CHAT: 'https://n8n.lakestrom.com/webhook/clarioo-criteria-chat',
  FIND_VENDORS: 'https://n8n.lakestrom.com/webhook/clarioo-find-vendors',
  COMPARE_VENDORS: 'https://n8n.lakestrom.com/webhook/clarioo-compare-vendors',
  EXECUTIVE_SUMMARY: 'https://n8n.lakestrom.com/webhook/clarioo-executive-summary',
  EMAIL_COLLECTION: 'https://n8n.lakestrom.com/webhook/clarioo-email-collection',
} as const;

const TESTING_WEBHOOKS = {
  PROJECT_CREATION: 'https://n8n.lakestrom.com/webhook/c53c2c35-08ea-4171-8e71-ac06c6628115',
  CRITERIA_CHAT: 'https://n8n.lakestrom.com/webhook/7b57ec80-4343-43f0-9cb3-36e0dc383c0a',
  FIND_VENDORS: 'https://n8n.lakestrom.com/webhook/059d83e9-5a1e-4303-b29c-41212ebb9f55',
  COMPARE_VENDORS: 'https://n8n.lakestrom.com/webhook/9243e868-56df-4b64-a98c-2bc56a087d77',
  EXECUTIVE_SUMMARY: 'https://n8n.lakestrom.com/webhook/11b92992-7c97-40d1-b6d1-037ce4743667',
  EMAIL_COLLECTION: 'https://n8n.lakestrom.com/webhook/755744fd-7b51-4979-af1f-acfa3cd95963',
} as const;

// ===========================================
// Webhook URL Getters
// ===========================================

/**
 * Get webhook URLs based on current mode
 * @returns Webhook URLs object for current mode
 */
export const getWebhookUrls = () => {
  const mode = getWebhookMode();
  return mode === 'testing' ? TESTING_WEBHOOKS : PRODUCTION_WEBHOOKS;
};

/**
 * Get specific webhook URL by key
 * @param key - Webhook key
 * @returns Webhook URL for current mode
 */
export const getWebhookUrl = (key: keyof typeof PRODUCTION_WEBHOOKS): string => {
  const urls = getWebhookUrls();
  return urls[key];
};

// Export individual webhook getters for convenience
export const getProjectCreationUrl = () => getWebhookUrl('PROJECT_CREATION');
export const getCriteriaChatUrl = () => getWebhookUrl('CRITERIA_CHAT');
export const getFindVendorsUrl = () => getWebhookUrl('FIND_VENDORS');
export const getCompareVendorsUrl = () => getWebhookUrl('COMPARE_VENDORS');
export const getExecutiveSummaryUrl = () => getWebhookUrl('EXECUTIVE_SUMMARY');
export const getEmailCollectionUrl = () => getWebhookUrl('EMAIL_COLLECTION');

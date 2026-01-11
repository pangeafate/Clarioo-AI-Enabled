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
  COMPARE_VENDOR_CRITERION: 'https://n8n.lakestrom.com/webhook/find-criterion-vendor-stage1', // Stage 1: Individual cell research (Production)
  RANK_CRITERION_RESULTS: 'https://n8n.lakestrom.com/webhook/rank-criteria-stage2', // Stage 2: Comparative ranking (Production)
  EXECUTIVE_SUMMARY: 'https://n8n.lakestrom.com/webhook/clarioo-executive-summary',
  VENDOR_SUMMARY: 'https://n8n.lakestrom.com/webhook/Vendor-Card-Summary', // Vendor card summary generator (Perplexity)
  EMAIL_COLLECTION: 'https://n8n.lakestrom.com/webhook/clarioo-email-collection',
  BATTLECARD_ROW: 'https://n8n.lakestrom.com/webhook/clarioo-battlecard-row', // Battlecard row generator (Production)
  SUMMARIZE_CRITERION_ROW: 'https://n8n.lakestrom.com/webhook/summarize-criterion-row-production', // SP_025: Cell summaries (Production)
  VENDOR_SCATTERPLOT: 'https://n8n.lakestrom.com/webhook/clarioo-vendor-scatterplot', // SP_026: Vendor positioning scatter plot (Production)
} as const;

const TESTING_WEBHOOKS = {
  PROJECT_CREATION: 'https://n8n.lakestrom.com/webhook/c53c2c35-08ea-4171-8e71-ac06c6628115',
  CRITERIA_CHAT: 'https://n8n.lakestrom.com/webhook/7b57ec80-4343-43f0-9cb3-36e0dc383c0a',
  FIND_VENDORS: 'https://n8n.lakestrom.com/webhook/059d83e9-5a1e-4303-b29c-41212ebb9f55',
  COMPARE_VENDORS: 'https://n8n.lakestrom.com/webhook/9243e868-56df-4b64-a98c-2bc56a087d77',
  COMPARE_VENDOR_CRITERION: 'https://n8n.lakestrom.com/webhook/a7f3e891-2d4b-4c5e-9a1f-8b3c6d7e9f2a', // Stage 1: Testing webhook
  RANK_CRITERION_RESULTS: 'https://n8n.lakestrom.com/webhook/b2c4d8f1-3e5a-4f6b-8c9d-1a2b3c4d5e6f', // Stage 2: Testing webhook
  EXECUTIVE_SUMMARY: 'https://n8n.lakestrom.com/webhook/11b92992-7c97-40d1-b6d1-037ce4743667',
  VENDOR_SUMMARY: 'https://n8n.lakestrom.com/webhook/6e32f3ef-1103-404b-ac0b-8ce2da70b7b4', // Modified workflow: Vendor card summary generator
  EMAIL_COLLECTION: 'https://n8n.lakestrom.com/webhook/755744fd-7b51-4979-af1f-acfa3cd95963',
  BATTLECARD_ROW: 'https://n8n.lakestrom.com/webhook/e08eae12-70d9-4669-8ee5-f31ffe5b1407', // Testing webhook UUID
  SUMMARIZE_CRITERION_ROW: 'https://n8n.lakestrom.com/webhook/summarize-criterion-row-testing', // SP_025: Cell summaries (Testing)
  VENDOR_SCATTERPLOT: 'https://n8n.lakestrom.com/webhook/3f7a9e2b-4c8d-4f1a-9b6e-7d3c5e8f1a2b', // SP_026: Vendor positioning scatter plot (Testing)
} as const;

// ===========================================
// Local Development Override (Optional)
// ===========================================

/**
 * Optional local development URLs for testing n8n workflows locally
 * Set WEBHOOK_MODE to 'local' in localStorage to use these
 */
const LOCAL_DEVELOPMENT_WEBHOOKS = {
  ...PRODUCTION_WEBHOOKS,
  BATTLECARD_ROW: 'http://localhost:8080/webhook/clarioo-battlecard-row', // Local n8n instance
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

  // Check for local development override (for testing n8n workflows locally)
  const localOverride = localStorage.getItem('WEBHOOK_LOCAL_OVERRIDE');
  if (localOverride === 'true') {
    console.warn('[webhooks] 🔧 Using LOCAL_DEVELOPMENT_WEBHOOKS (localhost)');
    return LOCAL_DEVELOPMENT_WEBHOOKS;
  }

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
export const getCompareVendorCriterionUrl = () => getWebhookUrl('COMPARE_VENDOR_CRITERION'); // Stage 1
export const getRankCriterionResultsUrl = () => getWebhookUrl('RANK_CRITERION_RESULTS'); // Stage 2
export const getExecutiveSummaryUrl = () => getWebhookUrl('EXECUTIVE_SUMMARY');
export const getVendorSummaryUrl = () => getWebhookUrl('VENDOR_SUMMARY'); // Vendor card summary
export const getEmailCollectionUrl = () => getWebhookUrl('EMAIL_COLLECTION');
export const getBattlecardRowUrl = () => getWebhookUrl('BATTLECARD_ROW'); // Battlecard row generator
export const getSummarizeCriterionRowUrl = () => getWebhookUrl('SUMMARIZE_CRITERION_ROW'); // SP_025: Cell summaries
export const getVendorScatterplotUrl = () => getWebhookUrl('VENDOR_SCATTERPLOT'); // SP_026: Vendor positioning scatter plot

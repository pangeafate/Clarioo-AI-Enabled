/**
 * useWebhookMode Hook
 *
 * React hook for managing webhook mode (production/testing) with localStorage persistence.
 *
 * @module hooks/useWebhookMode
 */

import { useState, useEffect, useCallback } from 'react';
import { getWebhookMode, setWebhookMode, type WebhookMode } from '@/config/webhooks';

/**
 * Hook for managing webhook mode state
 *
 * @returns Object containing mode, setMode function, and isTestMode boolean
 *
 * @example
 * ```typescript
 * const { mode, setMode, isTestMode } = useWebhookMode();
 *
 * // Toggle mode
 * setMode(isTestMode ? 'production' : 'testing');
 * ```
 */
export const useWebhookMode = () => {
  const [mode, setModeState] = useState<WebhookMode>(getWebhookMode());

  // Listen for storage changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'clarioo_webhook_mode') {
        const newMode = getWebhookMode();
        setModeState(newMode);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Wrapped setter that updates both state and localStorage
  const setMode = useCallback((newMode: WebhookMode) => {
    setWebhookMode(newMode);
    setModeState(newMode);
  }, []);

  return {
    mode,
    setMode,
    isTestMode: mode === 'testing',
  };
};

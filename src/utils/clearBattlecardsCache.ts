/**
 * Utility to clear battlecards cache from localStorage
 * Run this in browser console to reset corrupted battlecard data
 */

export function clearAllBattlecardsCache(): void {
  const keys = Object.keys(localStorage);
  const battlecardKeys = keys.filter(key =>
    key.includes('clarioo_battlecards_state') ||
    key.includes('clarioo_battlecards_rows')
  );

  console.log('[clearBattlecardsCache] Found battlecard keys:', battlecardKeys);

  battlecardKeys.forEach(key => {
    localStorage.removeItem(key);
    console.log('[clearBattlecardsCache] Removed:', key);
  });

  console.log('[clearBattlecardsCache] ✅ Cleared', battlecardKeys.length, 'battlecard cache entries');
  console.log('[clearBattlecardsCache] Reload page to start fresh');
}

// Make it available on window for easy console access
if (typeof window !== 'undefined') {
  (window as any).clearAllBattlecardsCache = clearAllBattlecardsCache;
}

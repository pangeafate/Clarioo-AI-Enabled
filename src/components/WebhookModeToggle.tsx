/**
 * WebhookModeToggle Component
 *
 * A subtle toggle switch in the bottom-right corner for switching between
 * production and testing webhook modes. Shows toast notification on switch.
 *
 * @module components/WebhookModeToggle
 */

import { useWebhookMode } from '@/hooks/useWebhookMode';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

export const WebhookModeToggle = () => {
  const { isTestMode, setMode } = useWebhookMode();

  const handleToggle = (checked: boolean) => {
    const newMode = checked ? 'testing' : 'production';
    setMode(newMode);

    toast.success(
      `Switched to ${newMode.toUpperCase()} mode`,
      {
        description: `All webhooks now use ${newMode} endpoints`,
        duration: 3000,
      }
    );
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="flex items-center gap-2 px-3 py-2 bg-background/80 backdrop-blur-sm border rounded-lg shadow-lg">
        <span className="text-xs font-medium text-muted-foreground">
          Test Mode
        </span>
        <Switch
          checked={isTestMode}
          onCheckedChange={handleToggle}
          aria-label="Toggle webhook mode"
        />
      </div>
    </div>
  );
};

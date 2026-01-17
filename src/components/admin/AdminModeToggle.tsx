/**
 * AdminModeToggle Component
 * Sprint: SP_028 - Template Management n8n Migration
 *
 * @purpose Toggle admin mode with 5-digit passcode protection
 * @design Simple toggle with passcode dialog
 *
 * FEATURES:
 * - 5-digit passcode (71956)
 * - localStorage persistence
 * - Lock/unlock icon
 * - Admin mode enables template management (upload, delete)
 */

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Lock, Unlock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const ADMIN_CODE = '71956';

export function AdminModeToggle() {
  const [isAdmin, setIsAdmin] = useState(
    localStorage.getItem('clarioo_admin_mode') === 'true'
  );
  const [showDialog, setShowDialog] = useState(false);
  const [code, setCode] = useState('');
  const { toast } = useToast();

  const handleToggle = (checked: boolean) => {
    if (checked) {
      // Enabling admin mode - show passcode dialog
      setShowDialog(true);
    } else {
      // Disabling admin mode
      setIsAdmin(false);
      localStorage.setItem('clarioo_admin_mode', 'false');

      // Dispatch custom event for same-window updates (SP_029)
      window.dispatchEvent(new Event('adminModeChanged'));

      toast({
        title: 'Admin mode disabled',
        duration: 2000
      });
    }
  };

  const handleSubmitCode = () => {
    if (code === ADMIN_CODE) {
      setIsAdmin(true);
      localStorage.setItem('clarioo_admin_mode', 'true');
      setShowDialog(false);
      setCode('');

      // Dispatch custom event for same-window updates (SP_029)
      window.dispatchEvent(new Event('adminModeChanged'));

      toast({
        title: '✅ Admin mode activated',
        description: 'Template management unlocked',
        duration: 2000
      });
    } else {
      toast({
        title: '❌ Invalid code',
        description: 'Please try again',
        variant: 'destructive',
        duration: 2000
      });
      setCode('');
    }
  };

  return (
    <>
      <div className="flex items-center gap-3">
        <Label className="flex items-center gap-2">
          {isAdmin ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
          Admin Mode
        </Label>
        <Switch checked={isAdmin} onCheckedChange={handleToggle} />
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Admin Access Required</DialogTitle>
            <DialogDescription>
              Enter the 5-digit admin code to enable template management
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="password"
              placeholder="Enter 5-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={5}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmitCode();
              }}
            />
            <div className="flex gap-2">
              <Button onClick={handleSubmitCode} className="flex-1">
                Unlock
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDialog(false);
                  setCode('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

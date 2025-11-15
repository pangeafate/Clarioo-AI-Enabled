/**
 * AuthModal Component - Authentication Modal Dialog
 *
 * @prototype Visual demonstration component with mock authentication
 * @purpose Modal dialog for Sign In and Sign Up forms
 *
 * FEATURES (SP_007):
 * - Modal dialog with smooth animations
 * - Toggle between Sign In and Sign Up forms
 * - Mock authentication (always succeeds)
 * - Form validation (basic email/password format)
 * - Success state with auto-close
 *
 * DESIGN SPECS:
 * - Modal: White bg, rounded-2xl, shadow-elevated-combined
 * - Forms: Stacked layout with gradient submit buttons
 * - Inputs: rounded-xl with focus states
 * - Mobile-friendly responsive layout
 *
 * BEHAVIOR:
 * - PROTOTYPE: Always succeeds with any valid credentials
 * - FUTURE: Replace with real Supabase authentication
 * - Simulates 800ms delay for realism
 * - Auto-closes on successful authentication
 *
 * @see SP_007 Sprint Plan - Phase 1, Task 1.3 (Authentication Modal)
 * @see /src/services/mock/authService.ts - Mock authentication service
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { TYPOGRAPHY } from '@/styles/typography-config';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'signin' | 'signup';
  onModeChange: (mode: 'signin' | 'signup') => void;
}

export const AuthModal = ({ isOpen, onClose, mode, onModeChange }: AuthModalProps) => {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isSignUp = mode === 'signup';

  /**
   * PROTOTYPE: Mock authentication handler
   * Always succeeds with valid input format
   *
   * FIXED (SP_010): Now closes modal and lets LandingPage handle state change
   * - No navigation needed - LandingPage detects auth state change via useAuth
   * - Maintains single-page experience
   * - Smooth transition from marketing to workflow content
   *
   * PREVIOUS (GAP-2): Used to navigate to /dashboard
   * NEW (SP_010): Just close modal - LandingPage will show ProjectDashboard automatically
   *
   * FUTURE INTEGRATION:
   * Replace with real Supabase auth:
   * ```typescript
   * const { data, error } = await supabase.auth.signInWithPassword({ email, password });
   * ```
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // PROTOTYPE: Use mock authentication service
      if (isSignUp) {
        const response = await signUp(email, password, fullName, companyName);
        if (response.error) {
          setError(response.error.message);
        } else {
          setSuccess(true);
          // Auto-dismiss after 1 second
          setTimeout(() => {
            onClose();
          }, 1000);
        }
      } else {
        const response = await signIn(email, password);
        if (response.error) {
          setError(response.error.message);
        } else {
          setSuccess(true);
          // Auto-dismiss after 1 second
          setTimeout(() => {
            onClose();
          }, 1000);
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setCompanyName('');
    setError(null);
    setSuccess(false);
  };

  const handleModeSwitch = () => {
    resetForm();
    onModeChange(isSignUp ? 'signin' : 'signup');
  };

  /**
   * Reset modal state when it closes or opens
   * Fixes: Modal getting stuck in "Welcome back! Loading..." state
   * This ensures clean state on every modal open
   */
  useEffect(() => {
    if (!isOpen) {
      // Reset all state when modal closes
      resetForm();
      setIsLoading(false);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-2xl shadow-elevated-combined">
        <DialogHeader>
          <DialogTitle className={`${TYPOGRAPHY.heading.h4} bg-gradient-to-r from-brand-blue to-brand-blueLight bg-clip-text text-transparent`}>
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </DialogTitle>
          <DialogDescription className={TYPOGRAPHY.muted.default}>
            {isSignUp
              ? 'Sign up to start discovering perfect vendors with AI'
              : 'Sign in to continue your vendor discovery journey'}
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {success ? (
            // Success State
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center justify-center py-8 space-y-4"
            >
              <CheckCircle className="h-16 w-16 text-green-500" />
              <p className={TYPOGRAPHY.body.large}>
                {isSignUp ? 'Account created successfully!' : 'Welcome back!'}
              </p>
              <p className={TYPOGRAPHY.muted.small}>
                Loading your projects...
              </p>
            </motion.div>
          ) : (
            // Form State
            <motion.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleSubmit}
              className="space-y-4 mt-4"
            >
              {/* Sign Up Only Fields */}
              {isSignUp && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required={isSignUp}
                      className="rounded-xl h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      type="text"
                      placeholder="Acme Corporation"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="rounded-xl h-12"
                    />
                  </div>
                </>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="rounded-xl h-12"
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="rounded-xl h-12"
                />
                {isSignUp && (
                  <p className={TYPOGRAPHY.form.helper}>
                    Minimum 6 characters
                  </p>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700"
                >
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <p className={TYPOGRAPHY.body.small}>{error}</p>
                </motion.div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className={`w-full h-12 rounded-xl bg-gradient-button text-white ${TYPOGRAPHY.button.default} shadow-button-glow hover:shadow-elevated-combined transition-all duration-300`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isSignUp ? 'Creating Account...' : 'Signing In...'}
                  </>
                ) : (
                  <>{isSignUp ? 'Create Account' : 'Sign In'}</>
                )}
              </Button>

              {/* Mode Switch */}
              <div className={`text-center ${TYPOGRAPHY.muted.small}`}>
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                {' '}
                <button
                  type="button"
                  onClick={handleModeSwitch}
                  className={`text-brand-blue ${TYPOGRAPHY.button.small} hover:underline`}
                >
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </button>
              </div>

              {/* Prototype Notice */}
              <div className={`text-center ${TYPOGRAPHY.muted.xs} bg-gray-50 p-3 rounded-xl`}>
                🎨 <strong>Prototype Mode:</strong> Any email/password will work for demonstration
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

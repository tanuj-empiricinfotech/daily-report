import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { IconEye, IconEyeOff } from '@tabler/icons-react';
import { useChangePassword } from '@/lib/query/hooks/useAuth';

interface ChangePasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangePasswordModal({ open, onOpenChange }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const changePasswordMutation = useChangePassword();

  const resetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setValidationError(null);
    setSuccessMessage(null);
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setSuccessMessage(null);

    // Client-side validation
    if (newPassword.length < 6) {
      setValidationError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    if (currentPassword === newPassword) {
      setValidationError('New password must be different from current password');
      return;
    }

    try {
      await changePasswordMutation.mutateAsync({
        currentPassword,
        newPassword,
      });

      setSuccessMessage('Password updated successfully');

      // Close modal after a short delay to show success message
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (error) {
      // Error will be displayed via changePasswordMutation.error
    }
  };

  const isLoading = changePasswordMutation.isPending;
  const apiError = changePasswordMutation.error;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Password */}
          <div>
            <label className="text-sm font-medium mb-2 block">Current Password</label>
            <div className="relative">
              <Input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                placeholder="Enter current password"
                className="pr-10"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                disabled={isLoading}
              >
                {showCurrentPassword ? (
                  <IconEyeOff className="h-5 w-5" />
                ) : (
                  <IconEye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="text-sm font-medium mb-2 block">New Password</label>
            <div className="relative">
              <Input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="Enter new password"
                minLength={6}
                className="pr-10"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                disabled={isLoading}
              >
                {showNewPassword ? (
                  <IconEyeOff className="h-5 w-5" />
                ) : (
                  <IconEye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="text-sm font-medium mb-2 block">Confirm New Password</label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirm new password"
                minLength={6}
                className="pr-10"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                disabled={isLoading}
              >
                {showConfirmPassword ? (
                  <IconEyeOff className="h-5 w-5" />
                ) : (
                  <IconEye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Error Display */}
          {(validationError || apiError) && (
            <ErrorDisplay error={validationError || apiError} />
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="p-3 bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-md">
              <p className="text-sm text-green-800 dark:text-green-300">{successMessage}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? <LoadingSpinner size="sm" /> : 'Update Password'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

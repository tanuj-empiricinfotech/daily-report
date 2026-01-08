/**
 * Settings Page
 * User settings and preferences
 * Available to all authenticated users
 */

import { useState } from 'react';
import { IconKey, IconUser, IconMail, IconShield, IconSun, IconMoon, IconDeviceDesktop } from '@tabler/icons-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { ChangePasswordModal } from '@/components/auth/ChangePasswordModal';
import { ThemeSelector } from '@/components/ThemeSelector';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

/**
 * Get user initials for avatar
 */
function getUserInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Mode Toggle Component
 * Allows switching between light, dark, and system color modes
 */
function ModeToggle() {
  const { mode, setMode } = useTheme();

  const modes = [
    { value: 'light' as const, label: 'Light', icon: IconSun },
    { value: 'dark' as const, label: 'Dark', icon: IconMoon },
    { value: 'system' as const, label: 'System', icon: IconDeviceDesktop },
  ];

  return (
    <div className="inline-flex rounded-md shadow-sm" role="group">
      {modes.map((modeOption) => {
        const Icon = modeOption.icon;
        const isActive = mode === modeOption.value;

        return (
          <Button
            key={modeOption.value}
            type="button"
            variant={isActive ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode(modeOption.value)}
            className={cn(
              'gap-2',
              modeOption.value === 'light' && 'rounded-r-none',
              modeOption.value === 'system' && 'rounded-l-none',
              modeOption.value === 'dark' && 'rounded-none border-l-0 border-r-0'
            )}
          >
            <Icon className="h-4 w-4" />
            {modeOption.label}
          </Button>
        );
      })}
    </div>
  );
}

export function Settings() {
  const { user } = useAuth();
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Your account details and role
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg">
                {getUserInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">{user.name}</h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <IconMail className="h-3 w-3" />
                {user.email}
              </p>
            </div>
            <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
              <IconShield className="mr-1 h-3 w-3" />
              {user.role === 'admin' ? 'Admin' : 'Member'}
            </Badge>
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                User ID
              </label>
              <p className="mt-1">{user.id}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Role
              </label>
              <p className="mt-1 capitalize">{user.role}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Member Since
              </label>
              <p className="mt-1">
                {new Date(user.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Last Updated
              </label>
              <p className="mt-1">
                {new Date(user.updated_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>
            Manage your password and security settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-2">
                <IconKey className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Password</p>
                <p className="text-sm text-muted-foreground">
                  Change your password to keep your account secure
                </p>
              </div>
            </div>
            <Button onClick={() => setIsChangePasswordModalOpen(true)}>
              Change Password
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>
            Additional account details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-muted p-2">
              <IconUser className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Full Name</p>
              <p className="text-sm text-muted-foreground mt-1">{user.name}</p>
            </div>
          </div>

          <Separator />

          <div className="flex items-start gap-3">
            <div className="rounded-full bg-muted p-2">
              <IconMail className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Email Address</p>
              <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
            </div>
          </div>

          <Separator />

          <div className="flex items-start gap-3">
            <div className="rounded-full bg-muted p-2">
              <IconShield className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Account Type</p>
              <p className="text-sm text-muted-foreground mt-1 capitalize">
                {user.role} User
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Customize the look and feel of your dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Color Mode Toggle */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Color Mode</Label>
            <ModeToggle />
          </div>

          <Separator />

          {/* Theme Selector */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Theme</Label>
            <ThemeSelector />
          </div>
        </CardContent>
      </Card>

      {/* Change Password Modal */}
      <ChangePasswordModal
        open={isChangePasswordModalOpen}
        onOpenChange={setIsChangePasswordModalOpen}
      />
    </div>
  );
}

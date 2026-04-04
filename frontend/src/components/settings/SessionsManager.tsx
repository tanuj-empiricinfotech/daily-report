/**
 * SessionsManager Component
 * Displays active sessions and allows revoking them
 */

import { IconDeviceDesktop, IconDeviceMobile, IconShield, IconTrash } from '@tabler/icons-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useSessions, useRevokeSession, useRevokeOtherSessions } from '@/lib/query/hooks/useSessions';

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

function parseDeviceInfo(userAgent: string | null): { browser: string; os: string; icon: React.ReactNode } {
  if (!userAgent) {
    return { browser: 'Unknown', os: 'Unknown', icon: <IconDeviceDesktop className="h-5 w-5" /> };
  }

  let browser = 'Unknown Browser';
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) browser = 'Chrome';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
  else if (userAgent.includes('Edg')) browser = 'Edge';

  let os = 'Unknown OS';
  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac')) os = 'macOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';

  const isMobile = os === 'Android' || os === 'iOS';
  const icon = isMobile
    ? <IconDeviceMobile className="h-5 w-5" />
    : <IconDeviceDesktop className="h-5 w-5" />;

  return { browser, os, icon };
}

function SessionSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-8 w-16" />
    </div>
  );
}

export function SessionsManager() {
  const { data: sessions, isLoading } = useSessions();
  const revokeSession = useRevokeSession();
  const revokeOtherSessions = useRevokeOtherSessions();

  const otherSessionCount = sessions?.filter((s) => !s.is_current).length ?? 0;

  function handleRevokeSession(sessionId: number) {
    if (!window.confirm('Are you sure you want to revoke this session? The device will be logged out.')) {
      return;
    }
    revokeSession.mutate(sessionId);
  }

  function handleRevokeOtherSessions() {
    if (!window.confirm('Are you sure you want to revoke all other sessions? All other devices will be logged out.')) {
      return;
    }
    revokeOtherSessions.mutate();
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <IconShield className="h-5 w-5" />
              Active Sessions
            </CardTitle>
            <CardDescription>
              Manage your active sessions across devices
            </CardDescription>
          </div>
          {otherSessionCount > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRevokeOtherSessions}
              disabled={revokeOtherSessions.isPending}
            >
              <IconTrash className="mr-1 h-4 w-4" />
              Revoke all other sessions
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && (
          <>
            <SessionSkeleton />
            <SessionSkeleton />
          </>
        )}

        {!isLoading && (!sessions || sessions.length === 0) && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No active sessions found.
          </p>
        )}

        {sessions?.map((session) => {
          const { browser, os, icon } = parseDeviceInfo(session.device_info);

          return (
            <div
              key={session.id}
              className="flex items-center gap-4 p-4 rounded-lg border"
            >
              <div className="rounded-full bg-muted p-2.5">
                {icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm truncate">
                    {browser} on {os}
                  </p>
                  {session.is_current && (
                    <Badge variant="default" className="bg-green-600 hover:bg-green-600 text-white shrink-0">
                      This device
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {session.is_current ? 'Active now' : formatRelativeTime(session.created_at)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRevokeSession(session.id)}
                disabled={session.is_current || revokeSession.isPending}
                className={session.is_current ? 'invisible' : ''}
              >
                <IconTrash className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

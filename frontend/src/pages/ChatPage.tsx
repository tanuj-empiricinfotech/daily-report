/**
 * Chat Page Component
 *
 * Main page for AI-powered chat about daily work logs.
 * Features date range filtering and admin user selection.
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ChatThread } from '@/components/chat/ChatThread';
import { useAuth } from '@/hooks/useAuth';
import { useUsersByTeam } from '@/lib/query/hooks/useUsers';
import { useTeams } from '@/lib/query/hooks/useTeams';
import { useChatContext } from '@/lib/query/hooks/useChat';
import { formatDate, formatDateRange } from '@/utils/formatting';
import { istToIso } from '@/utils/date';
import { IconMessageCircle, IconCalendar, IconUser, IconFileText } from '@tabler/icons-react';
import { endpoints } from '@/lib/api/endpoints';
import type { ChatContextOptions } from '@/lib/api/types';

const DEFAULT_DATE_RANGE_DAYS = 7;

export function ChatPage() {
  const { user, isAdmin } = useAuth();

  // Date range state - default to last 7 days
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date } | undefined>(() => {
    const today = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(today.getDate() - DEFAULT_DATE_RANGE_DAYS);
    return { from: weekAgo, to: today };
  });

  // Admin: Selected user to chat about
  const [selectedUserId, setSelectedUserId] = useState<number | undefined>(undefined);

  // Fetch teams for admin
  const { data: teams = [] } = useTeams({ isAdmin });

  // Determine team ID for fetching users
  const teamId = useMemo(() => {
    if (!isAdmin) return null;
    if (user?.team_id) return user.team_id;
    if (teams.length > 0) return teams[0].id;
    return null;
  }, [isAdmin, user?.team_id, teams]);

  // Fetch team users for admin dropdown
  const { data: teamUsers = [], isLoading: usersLoading } = useUsersByTeam(teamId, isAdmin);

  // Convert dates for API
  const startDate = dateRange?.from ? formatDate(dateRange.from) : undefined;
  const endDate = dateRange?.to ? formatDate(dateRange.to) : undefined;

  // Build chat context options
  const chatContext: ChatContextOptions = useMemo(() => ({
    startDate,
    endDate,
    targetUserId: selectedUserId,
  }), [startDate, endDate, selectedUserId]);

  // Fetch chat context metadata for display
  const { data: contextMetadata, isLoading: contextLoading } = useChatContext(
    {
      startDate: startDate ? istToIso(startDate) : undefined,
      endDate: endDate ? istToIso(endDate) : undefined,
      targetUserId: selectedUserId,
    },
    Boolean(startDate && endDate)
  );


  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] gap-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <IconMessageCircle className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Chat with Logs</h1>
            <p className="text-sm text-muted-foreground">
              Ask questions about your work logs using AI
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Chat Area */}
        <Card className="flex-1 flex flex-col min-h-0">
          <CardContent className="flex-1 p-0 min-h-0">
            <ChatThread
              apiEndpoint={endpoints.chat.send}
              context={chatContext}
              className="h-full"
            />
          </CardContent>
        </Card>

        {/* Context Panel */}
        <div className="w-80 flex-shrink-0 space-y-4">
          {/* Date Range Filter */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <IconCalendar className="w-4 h-4" />
                Date Range
              </CardTitle>
              <CardDescription className="text-xs">
                Select the date range for logs context
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <DateRangePicker
                value={dateRange}
                onChange={setDateRange}
              />
            </CardContent>
          </Card>

          {/* Admin: User Selector */}
          {isAdmin && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <IconUser className="w-4 h-4" />
                  Team Member
                </CardTitle>
                <CardDescription className="text-xs">
                  Select whose logs to chat about
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Select
                  value={selectedUserId?.toString() || 'self'}
                  onValueChange={(value) =>
                    setSelectedUserId(value === 'self' ? undefined : parseInt(value, 10))
                  }
                  disabled={usersLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select team member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="self">
                      <span className="flex items-center gap-2">
                        My Logs
                        <Badge variant="secondary" className="text-xs">You</Badge>
                      </span>
                    </SelectItem>
                    {teamUsers.map((teamUser) => (
                      <SelectItem key={teamUser.id} value={teamUser.id.toString()}>
                        {teamUser.name}
                        {teamUser.id === user?.id && (
                          <Badge variant="secondary" className="ml-2 text-xs">You</Badge>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}

          {/* Context Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <IconFileText className="w-4 h-4" />
                Loaded Context
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {contextLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : contextMetadata ? (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">User</span>
                    <span className="font-medium">{contextMetadata.userName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Logs loaded</span>
                    <Badge variant="secondary">{contextMetadata.logCount}</Badge>
                  </div>
                  {contextMetadata.dateRange.startDate && contextMetadata.dateRange.endDate && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Period</span>
                      <span className="text-xs">
                        {formatDateRange(
                          contextMetadata.dateRange.startDate,
                          contextMetadata.dateRange.endDate
                        )}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Select a date range to load logs
                </p>
              )}
            </CardContent>
          </Card>

          {/* Tips Card */}
          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <h4 className="text-sm font-medium mb-2">Try asking:</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>"Summarize my work this week"</li>
                <li>"What projects took the most time?"</li>
                <li>"Generate a status report"</li>
                <li>"Compare tracked vs actual time"</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default ChatPage;

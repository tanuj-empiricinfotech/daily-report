/**
 * New Conversation Dialog
 *
 * Modal for selecting a team member to start a new conversation.
 */

import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { IconSearch, IconUser, IconLoader2 } from '@tabler/icons-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useUsersWithProjectsByTeam } from '@/lib/query/hooks/useUsers';
import { useCreateConversation } from '@/lib/query/hooks/useTeamChat';
import { useAuth } from '@/hooks/useAuth';
import { setActiveConversation, addConversation } from '@/store/slices/teamChatSlice';

interface NewConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewConversationDialog({ open, onOpenChange }: NewConversationDialogProps) {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: teamMembers = [], isLoading } = useUsersWithProjectsByTeam(user?.team_id || null);
  const createConversationMutation = useCreateConversation();

  // Filter out current user and apply search
  const filteredMembers = teamMembers
    .filter((member) => member.id !== user?.id)
    .filter((member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const handleSelectMember = async (memberId: number, memberName: string) => {
    try {
      const result = await createConversationMutation.mutateAsync(memberId);

      // Add conversation to store if newly created
      if (result.created) {
        dispatch(addConversation({
          ...result,
          other_participant_id: memberId,
          other_participant_name: memberName,
          unread_count: 0,
          last_message_preview: null,
        }));
      }

      // Set as active conversation
      dispatch(setActiveConversation(result.id));

      // Close dialog
      onOpenChange(false);
      setSearchQuery('');
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Conversation</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search team members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            autoFocus
          />
        </div>

        {/* Member List */}
        <div className="max-h-[300px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <IconLoader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              {searchQuery ? 'No team members found' : 'No team members available'}
            </div>
          ) : (
            <div className="divide-y">
              {filteredMembers.map((member) => (
                <button
                  key={member.id}
                  onClick={() => handleSelectMember(member.id, member.name)}
                  disabled={createConversationMutation.isPending}
                  className="w-full p-3 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left disabled:opacity-50"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <IconUser className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{member.name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {member.email}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default NewConversationDialog;

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/layout/Loading';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Loader2, Mail, LogOut, UserMinus } from 'lucide-react';
import type { Room } from '@/types/rooms';
import { getSupabase } from '@/services/supabase/client';
import { getUserProfile } from '@/services/supabase/user';
import { useAuth } from '@/hooks/useAuth';
import { useRooms } from '@/hooks/useRooms';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/useToast';

interface RoomMembersProps {
  room: Room;
  onBack: () => void;
  onLeave?: () => void;
}

interface RoomMember {
  user_id: string;
  role: 'owner' | 'member';
  username?: string | null;
  email?: string;
}

export function RoomMembers({ room, onBack, onLeave }: RoomMembersProps) {
  const { user: currentUser } = useAuth();
  const { leaveRoom, removeMember } = useRooms();
  const toast = useToast();
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<RoomMember | null>(null);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabase();
      logger.debug('Loading members for room', { roomId: room.id });
      const { data: membersData, error: membersError } = await supabase
        .from('room_members')
        .select('user_id, role')
        .eq('room_id', room.id)
        .order('role', { ascending: false }) // Owners first
        .order('user_id', { ascending: true });

      if (membersError) {
        logger.error('Error loading members', membersError);
        throw membersError;
      }

      if (!membersData || membersData.length === 0) {
        logger.debug('No members found for room', { roomId: room.id });
        setMembers([]);
        setLoading(false);
        return;
      }

      logger.debug('Found members', { count: membersData.length });

      // Get user profiles (usernames) for all members
      const membersWithProfiles = await Promise.all(
        (membersData || []).map(async (m) => {
          // Fetch user profile to get username
          const profileResult = await getUserProfile(m.user_id);
          let username: string | null | undefined = null;
          let email: string | undefined;

          if (profileResult.data) {
            username = profileResult.data.username;
          }

          // Get email from current session if it matches (for current user)
          if (currentUser?.id === m.user_id) {
            email = currentUser.email;
          }

          return {
            user_id: m.user_id,
            role: m.role,
            username,
            email,
          };
        }),
      );

      setMembers(membersWithProfiles);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load members';
      logger.error('Failed to load members', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [room.id, currentUser?.id]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const handleLeaveRoom = async () => {
    setLeaving(true);
    try {
      const success = await leaveRoom(room.id);
      if (success) {
        toast.showSuccess('Left room successfully');
        // Redirect to dashboard (rooms list)
        if (onLeave) {
          onLeave();
        } else {
          onBack(); // Fallback to onBack if onLeave not provided
        }
      } else {
        toast.showError('Failed to leave room');
      }
    } catch (err) {
      logger.error('Error leaving room', err);
      toast.showError('Failed to leave room');
    } finally {
      setLeaving(false);
      setShowLeaveDialog(false);
    }
  };

  const isCurrentUserMember = members.some((m) => m.user_id === currentUser?.id);
  const currentUserMember = members.find((m) => m.user_id === currentUser?.id);
  const isCurrentUserOwner = currentUserMember?.role === 'owner';

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    setRemoving(true);
    try {
      const success = await removeMember(room.id, memberToRemove.user_id);
      if (success) {
        toast.showSuccess('Member removed successfully');
        // Reload members list
        await loadMembers();
      } else {
        toast.showError('Failed to remove member');
      }
    } catch (err) {
      logger.error('Error removing member', err);
      toast.showError('Failed to remove member');
    } finally {
      setRemoving(false);
      setShowRemoveDialog(false);
      setMemberToRemove(null);
    }
  };

  return (
    <div className="px-4 py-4">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-semibold text-[#111827]">Room Members</h2>
          {isCurrentUserMember && !isCurrentUserOwner && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowLeaveDialog(true)}
              className="text-xs"
            >
              <LogOut className="h-3 w-3 mr-1" />
              Leave Room
            </Button>
          )}
        </div>
        <p className="text-xs text-[#6B7280]">{room.name}</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loading text="Loading members..." subtitle="Fetching room participants" fullScreen={false} size="default" />
        </div>
      ) : error ? (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      ) : members.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="rounded-full bg-[#F8F9FA] p-4 mb-3">
            <Mail className="h-8 w-8 text-[#6B7280]" />
          </div>
          <h3 className="text-sm font-semibold text-[#111827] mb-1">No members</h3>
        </div>
      ) : (
        <div className="space-y-2">
          {members.map((member) => (
            <Card key={member.user_id} className="border border-[#E5E7EB]">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-[#E40046] flex items-center justify-center text-white text-xs font-medium">
                      {member.username
                        ? member.username.charAt(0).toUpperCase()
                        : member.email
                          ? member.email.charAt(0).toUpperCase()
                          : member.user_id.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#111827]">
                        {member.username || member.email || `User ${member.user_id.slice(0, 8)}...`}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {member.role === 'owner' && (
                          <span className="text-xs text-[#E40046] font-medium">Owner</span>
                        )}
                        {member.username && member.email && (
                          <span className="text-xs text-[#6B7280]">{member.email}</span>
                        )}
                        {!member.username && !member.email && (
                          <span className="text-xs text-[#6B7280]">ID: {member.user_id.slice(0, 8)}...</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {isCurrentUserOwner && 
                   member.role !== 'owner' && 
                   member.user_id !== currentUser?.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setMemberToRemove(member);
                        setShowRemoveDialog(true);
                      }}
                      className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <UserMinus className="h-3 w-3 mr-1" />
                      Remove
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={showLeaveDialog}
        onOpenChange={(open) => {
          if (!leaving) {
            setShowLeaveDialog(open);
          }
        }}
        title="Leave Room"
        description="Are you sure you want to leave this room? You will no longer have access to it."
        confirmText={leaving ? 'Leaving...' : 'Leave Room'}
        cancelText="Cancel"
        onConfirm={handleLeaveRoom}
        variant="destructive"
      />

      <ConfirmDialog
        open={showRemoveDialog}
        onOpenChange={(open) => {
          if (!removing) {
            setShowRemoveDialog(open);
            if (!open) {
              setMemberToRemove(null);
            }
          }
        }}
        title="Remove Member"
        description={
          memberToRemove
            ? `Are you sure you want to remove ${memberToRemove.username || memberToRemove.email || 'this member'} from the room?`
            : 'Are you sure you want to remove this member from the room?'
        }
        confirmText={removing ? 'Removing...' : 'Remove'}
        cancelText="Cancel"
        onConfirm={handleRemoveMember}
        variant="destructive"
      />
    </div>
  );
}

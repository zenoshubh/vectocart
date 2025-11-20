import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loading } from '@/components/layout/Loading';
import { CreateRoomSchema, JoinRoomSchema } from '@/schemas/rooms';
import { useAuth } from '@/hooks/useAuth';
import { useRooms } from '@/hooks/useRooms';
import { useToast } from '@/hooks/useToast';
import { shareRoom } from '@/lib/share';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  ArrowRight,
  Loader2,
  Share2,
  Trash2,
  Plus,
  LogIn,
  ShoppingCart,
  Copy,
  Check,
} from 'lucide-react';
import { ROOM_CODE_LENGTH } from '@/lib/constants';
import type { Room } from '@/types/rooms';

interface RoomsViewProps {
  onRoomClick: (room: Room) => void;
  onRefresh?: () => void;
  loading: boolean;
  refreshTrigger?: number;
}

export function RoomsView({
  onRoomClick,
  onRefresh,
  loading: externalLoading,
  refreshTrigger,
}: RoomsViewProps) {
  const { isAuthenticated, user } = useAuth();
  const { rooms, loading: roomsLoading, loadRooms, createRoom, joinRoom, deleteRoom } = useRooms();
  const toast = useToast();

  // Helper function to check if user can delete a room
  const canDeleteRoom = (room: Room): boolean => {
    if (!user) return false;
    // Only room owners can delete rooms
    return room.createdBy === user.id;
  };

  const [roomName, setRoomName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [deleteRoomId, setDeleteRoomId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [sharingRoomId, setSharingRoomId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [copiedRoomId, setCopiedRoomId] = useState<string | null>(null);

  const loading = roomsLoading || externalLoading;

  useEffect(() => {
    if (isAuthenticated) {
      loadRooms();
    }
  }, [isAuthenticated, loadRooms]);

  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0 && isAuthenticated) {
      loadRooms();
    }
  }, [refreshTrigger, isAuthenticated, loadRooms]);

  async function handleCreate() {
    if (!isAuthenticated) {
      toast.showWarning('Please sign in to create a room.');
      return;
    }

    setCreating(true);
    try {
      const parsed = CreateRoomSchema.parse({ name: roomName });
      const room = await createRoom(parsed.name);
      if (room) {
        setRoomName('');
        toast.showSuccess(`Room "${room.name}" created successfully!`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create room';
      toast.showError(errorMessage);
    } finally {
      setCreating(false);
    }
  }

  async function handleJoin() {
    if (!isAuthenticated) {
      toast.showWarning('Please sign in to join a room.');
      return;
    }

    setJoining(true);
    try {
      const parsed = JoinRoomSchema.parse({ code: joinCode.toUpperCase() });
      const room = await joinRoom(parsed.code);
      if (room) {
        setJoinCode('');
        toast.showSuccess(`Joined room "${room.name}" successfully!`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to join room';
      toast.showError(errorMessage);
    } finally {
      setJoining(false);
    }
  }

  function handleDeleteClick(roomId: string) {
    setDeleteRoomId(roomId);
    setShowDeleteDialog(true);
  }

  async function handleDeleteConfirm() {
    if (!deleteRoomId) return;

    const success = await deleteRoom(deleteRoomId);
    if (success) {
      toast.showSuccess('Room deleted successfully');
      setDeleteRoomId(null);
    }
    setShowDeleteDialog(false);
  }

  async function handleShare(room: { name: string; code: string }) {
    setSharingRoomId(room.code);
    try {
      await shareRoom(room.name, room.code);
      toast.showSuccess('Room shared successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to share room';
      toast.showError(errorMessage);
    } finally {
      setSharingRoomId(null);
    }
  }

  async function handleCopyCode(roomCode: string, roomId: string) {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopiedRoomId(roomId);
      toast.showSuccess('Room code copied to clipboard!');
      setTimeout(() => setCopiedRoomId(null), 2000);
    } catch (err) {
      toast.showError('Failed to copy room code');
    }
  }

  const hasRooms = rooms.length > 0;
  const isLoading = loading && !hasRooms;

  return (
    <>
      <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 max-w-full">
        {/* Empty State - Show when no rooms */}
        {!hasRooms && !isLoading && (
          <div className="text-center py-8 sm:py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#E40046] to-[#B00037] mb-4 sm:mb-6 shadow-lg">
              <ShoppingCart className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#111827] mb-2">Create Your First Room</h2>
            <p className="text-[#6B7280] text-xs sm:text-sm mb-6 sm:mb-8 max-w-md mx-auto px-4">
              Start collaborating with your team by creating a shared shopping room or joining an existing one
            </p>
          </div>
        )}

        {/* Create and Join Cards - Always visible */}
        <div className="grid grid-cols-1 gap-3 sm:gap-4">
          {/* Create Room Card */}
          <Card className="border border-[#E5E7EB] shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm sm:text-base font-semibold text-[#111827] mb-1">Create a New Room</h3>
                  <p className="text-xs sm:text-sm text-[#6B7280] mb-3 sm:mb-4">
                    Start a fresh shopping room and invite your team to collaborate in real-time
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && roomName.trim().length >= 2 && isAuthenticated && !creating) {
                          handleCreate();
                        }
                      }}
                      placeholder="e.g., Marketing Sprint"
                      className="flex-1 rounded-lg border border-[#E5E7EB] px-3 sm:px-4 py-2 sm:py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E40046] focus:border-transparent"
                      disabled={creating}
                    />
                    <Button
                      onClick={handleCreate}
                      disabled={creating || roomName.trim().length < 2 || !isAuthenticated}
                      className="bg-[#E40046] hover:bg-[#CC003F] active:bg-[#B00037] text-white px-4 sm:px-6 whitespace-nowrap"
                    >
                      {creating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Create
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Join Room Card */}
          <Card className="border border-[#E5E7EB] shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm sm:text-base font-semibold text-[#111827] mb-1">Join an Existing Room</h3>
                  <p className="text-xs sm:text-sm text-[#6B7280] mb-3 sm:mb-4">
                    Enter a room code to join a room that someone has shared with you
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      onKeyDown={(e) => {
                        if (
                          e.key === 'Enter' &&
                          joinCode.trim().length === ROOM_CODE_LENGTH &&
                          isAuthenticated &&
                          !joining
                        ) {
                          handleJoin();
                        }
                      }}
                      placeholder={`${ROOM_CODE_LENGTH}-character code`}
                      maxLength={ROOM_CODE_LENGTH}
                      className="flex-1 uppercase tracking-widest rounded-lg border border-[#E5E7EB] px-3 sm:px-4 py-2 sm:py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E40046] focus:border-transparent"
                      disabled={joining}
                    />
                    <Button
                      onClick={handleJoin}
                      disabled={joining || joinCode.trim().length !== ROOM_CODE_LENGTH || !isAuthenticated}
                      className="bg-[#111827] hover:bg-[#374151] text-white px-4 sm:px-6 whitespace-nowrap"
                    >
                      {joining ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <LogIn className="h-4 w-4 mr-2" />
                          Join
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rooms List - Show when rooms exist */}
        {hasRooms && (
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base sm:text-lg font-semibold text-[#111827]">Your Rooms</h3>
              {onRefresh && (
                <Button
                  variant="outline"
                  onClick={onRefresh}
                  disabled={loading}
                  className="border-[#E5E7EB] text-xs sm:text-sm shrink-0"
                  size="sm"
                >
                  {loading ? <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" /> : 'Refresh'}
                </Button>
              )}
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8 sm:py-12">
                <Loading text="Loading rooms..." subtitle="Fetching your shopping rooms" fullScreen={false} size="default" />
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {rooms.map((room) => (
                  <Card
                    key={room.id}
                    className="border border-[#E5E7EB] hover:border-[#E40046] hover:shadow-md transition-all cursor-pointer group"
                    onClick={() => onRoomClick(room)}
                  >
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-center justify-between gap-2 sm:gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
                            <h3 className="text-sm font-semibold text-[#111827] truncate max-w-[200px] sm:max-w-none">{room.name}</h3>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-xs text-[#6B7280] bg-[#F8F9FA] px-1.5 sm:px-2 py-0.5 rounded font-mono">
                                {room.code}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyCode(room.code, room.id);
                                }}
                                className="h-5 w-5 p-0 hover:bg-[#F8F9FA] shrink-0"
                                aria-label="Copy room code"
                              >
                                {copiedRoomId === room.id ? (
                                  <Check className="h-3 w-3 text-[#10B981]" />
                                ) : (
                                  <Copy className="h-3 w-3 text-[#6B7280]" />
                                )}
                              </Button>
                            </div>
                          </div>
                          <p className="text-xs text-[#6B7280]">Click to view details</p>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 ml-2 sm:ml-4 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShare(room);
                            }}
                            disabled={loading || sharingRoomId === room.code}
                            className="border-[#E5E7EB] hover:bg-[#F8F9FA] h-8 w-8 sm:h-9 sm:w-auto sm:px-3 p-0"
                            aria-label="Share room"
                          >
                            {sharingRoomId === room.code ? (
                              <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                            ) : (
                              <Share2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            )}
                          </Button>
                          {canDeleteRoom(room) && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(room.id);
                              }}
                              disabled={loading}
                              className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3 p-0"
                              aria-label="Delete room"
                            >
                              <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </Button>
                          )}
                          <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-[#6B7280] group-hover:text-[#E40046] transition-colors shrink-0" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Room"
        description="Are you sure you want to delete this room? This action cannot be undone and all members will lose access."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}


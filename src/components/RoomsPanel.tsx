import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CreateRoomSchema, JoinRoomSchema } from '@/schemas/rooms';
import { useAuth } from '@/hooks/useAuth';
import { useRooms } from '@/hooks/useRooms';
import { useToast } from '@/hooks/useToast';
import { shareRoom } from '@/lib/share';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Share2, Loader2, Trash2 } from 'lucide-react';
import { ROOM_CODE_LENGTH } from '@/lib/constants';

export function RoomsPanel() {
  const { isAuthenticated } = useAuth();
  const { rooms, loading, error, loadRooms, createRoom, joinRoom, deleteRoom } = useRooms();
  const toast = useToast();

  const [roomName, setRoomName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [deleteRoomId, setDeleteRoomId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [sharingRoomId, setSharingRoomId] = useState<string | null>(null);

  const codeHint = useMemo(() => `${ROOM_CODE_LENGTH}-char code (A-Z, 2-9)`, []);

  // Load rooms on mount and when auth state changes
  React.useEffect(() => {
    if (isAuthenticated) {
      loadRooms();
      }
  }, [isAuthenticated, loadRooms]);

  async function handleCreate() {
    if (!isAuthenticated) {
      toast.showWarning('Please sign in above to create a room.');
      return;
    }

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
    }
  }

  async function handleJoin() {
    if (!isAuthenticated) {
      toast.showWarning('Please sign in above to join a room.');
      return;
    }

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

  return (
    <>
    <div className="mt-5 grid grid-cols-1 gap-3">
      <Card className="border border-[#E5E7EB]">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="block text-xs text-[#6B7280] mb-1">Room name</label>
                <input
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && roomName.trim().length >= 2 && isAuthenticated) {
                        handleCreate();
                      }
                    }}
                  placeholder="Marketing Sprint"
                    className="w-full rounded border border-[#E5E7EB] px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#E40046] focus:border-transparent"
                />
              </div>
              <Button
                onClick={handleCreate}
                  disabled={loading || roomName.trim().length < 2 || !isAuthenticated}
                className="bg-[#E40046] hover:bg-[#CC003F] active:bg-[#B00037] text-white"
              >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
              </Button>
            </div>

            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="block text-xs text-[#6B7280] mb-1">
                  Join by code <span className="text-[#9CA3AF]">({codeHint})</span>
                </label>
                <input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && joinCode.trim().length === ROOM_CODE_LENGTH && isAuthenticated) {
                        handleJoin();
                      }
                    }}
                  placeholder="ABC123"
                    maxLength={ROOM_CODE_LENGTH}
                    className="w-full uppercase tracking-widest rounded border border-[#E5E7EB] px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#E40046] focus:border-transparent"
                />
              </div>
              <Button
                onClick={handleJoin}
                  disabled={loading || joinCode.trim().length !== ROOM_CODE_LENGTH || !isAuthenticated}
                className="bg-[#111827] hover:bg-[#111827]/90 text-white"
              >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Join'}
              </Button>
            </div>

              {!isAuthenticated ? (
                <p className="text-sm text-[#6B7280]">Sign in above to create or join rooms.</p>
            ) : null}
              {error ? (
                <p className="text-sm text-[#EF4444]">{error}</p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card className="border border-[#E5E7EB]">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Your rooms</h3>
            <Button
              variant="outline"
                onClick={loadRooms}
              disabled={loading}
              className="border-[#E5E7EB]"
                size="sm"
            >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
            </Button>
          </div>
          <div className="flex flex-col gap-2">
            {rooms.length === 0 ? (
              <p className="text-sm text-[#6B7280]">No rooms yet.</p>
            ) : (
              rooms.map((r) => (
                <div
                  key={r.id}
                    className="flex items-center justify-between rounded border border-[#E5E7EB] px-3 py-2 hover:bg-[#F8F9FA] transition-colors"
                >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{r.name}</div>
                    <div className="text-xs text-[#6B7280]">Code: {r.code}</div>
                  </div>
                    <div className="flex items-center gap-2 ml-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleShare(r)}
                        disabled={loading || sharingRoomId === r.code}
                      className="border-[#E5E7EB] hover:bg-[#F8F9FA]"
                    >
                        {sharingRoomId === r.code ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Share2 className="h-4 w-4" />
                        )}
                    </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteClick(r.id)}
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
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

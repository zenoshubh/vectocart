import React, { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Users, Loader2 } from 'lucide-react';
import type { Room } from '@/types/rooms';
import { useAuth } from '@/hooks/useAuth';
import { useRooms } from '@/hooks/useRooms';

interface RoomsListProps {
  onRoomClick: (room: Room) => void;
  onRefresh?: () => void;
  loading: boolean;
  refreshTrigger?: number;
}

export function RoomsList({ onRoomClick, onRefresh, loading, refreshTrigger }: RoomsListProps) {
  const { isAuthenticated } = useAuth();
  const { rooms, loadRooms, loading: roomsLoading } = useRooms();

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

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-[#6B7280]">Please sign in to view your rooms</p>
      </div>
    );
  }

  if ((loading || roomsLoading) && rooms.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 text-[#E40046] animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 py-4">
      {rooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="rounded-full bg-[#F8F9FA] p-4 mb-3">
            <Users className="h-8 w-8 text-[#6B7280]" />
          </div>
          <h3 className="text-sm font-semibold text-[#111827] mb-1">No rooms yet</h3>
          <p className="text-sm text-[#6B7280]">Create or join a room to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rooms.map((room) => (
            <Card
              key={room.id}
              className="border border-[#E5E7EB] hover:border-[#E40046] transition-colors cursor-pointer"
              onClick={() => onRoomClick(room)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-[#111827] mb-1 truncate">
                      {room.name}
                    </h3>
                    <p className="text-xs text-[#6B7280]">Code: {room.code}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-[#6B7280] ml-3 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

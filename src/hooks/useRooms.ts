/**
 * Custom hook for room operations
 */

import { useState, useCallback } from 'react';
import { listMyRooms, createRoom, joinRoomByCode, deleteRoom, leaveRoom, removeMember } from '@/services/supabase/rooms';
import type { Room } from '@/types/rooms';
import { logger } from '@/lib/logger';
import { formatSupabaseError } from '@/lib/errors';
import { sendMessage, withFallback } from '@/lib/messaging';
import type { CreateRoomMessage, JoinRoomMessage, DeleteRoomMessage, LeaveRoomMessage, RemoveMemberMessage } from '@/types/messaging';

export function useRooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRooms = useCallback(async () => {
    setLoading(true);
    setError(null);
    logger.debug('useRooms:loadRooms:request');

    try {
      const response = await withFallback(
        () => sendMessage({ type: 'rooms:list', payload: {} }),
        () => listMyRooms(),
      );

      if (!response.ok || response.error) {
        throw response.error || new Error('Failed to load rooms');
      }

      setRooms(response.data || []);
      logger.debug('useRooms:loadRooms:success', { count: response.data?.length || 0 });
    } catch (err) {
      const errorMessage = formatSupabaseError(err);
      logger.error('useRooms:loadRooms:error', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const createRoomHandler = useCallback(async (name: string): Promise<Room | null> => {
    setLoading(true);
    setError(null);
    logger.debug('useRooms:createRoom:request', { name });

    try {
      const message: CreateRoomMessage = {
        type: 'rooms:create',
        payload: { name },
      };

      const response = await withFallback(
        () => sendMessage(message),
        () => createRoom(name),
      );

      if (!response.ok || response.error || !response.data) {
        throw response.error || new Error('Failed to create room');
      }

      await loadRooms();
      logger.debug('useRooms:createRoom:success', { roomId: response.data.id });
      return response.data;
    } catch (err) {
      const errorMessage = formatSupabaseError(err);
      logger.error('useRooms:createRoom:error', err);
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadRooms]);

  const joinRoom = useCallback(async (code: string): Promise<Room | null> => {
    setLoading(true);
    setError(null);
    logger.debug('useRooms:joinRoom:request', { code });

    try {
      const message: JoinRoomMessage = {
        type: 'rooms:join',
        payload: { code: code.toUpperCase() },
      };

      const response = await withFallback(
        () => sendMessage(message),
        () => joinRoomByCode(code.toUpperCase()),
      );

      if (!response.ok || response.error || !response.data) {
        throw response.error || new Error('Failed to join room');
      }

      await loadRooms();
      logger.debug('useRooms:joinRoom:success', { roomId: response.data.id });
      return response.data;
    } catch (err) {
      const errorMessage = formatSupabaseError(err);
      logger.error('useRooms:joinRoom:error', err);
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadRooms]);

  const deleteRoomHandler = useCallback(async (roomId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    logger.debug('useRooms:deleteRoom:request', { roomId });

    try {
      const message: DeleteRoomMessage = {
        type: 'rooms:delete',
        payload: { roomId },
      };

      const response = await withFallback(
        () => sendMessage(message),
        () => deleteRoom(roomId),
      );

      if (!response.ok || response.error) {
        throw response.error || new Error('Failed to delete room');
      }

      await loadRooms();
      logger.debug('useRooms:deleteRoom:success', { roomId });
      return true;
    } catch (err) {
      const errorMessage = formatSupabaseError(err);
      logger.error('useRooms:deleteRoom:error', err);
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadRooms]);

  const leaveRoomHandler = useCallback(async (roomId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    logger.debug('useRooms:leaveRoom:request', { roomId });

    try {
      const message: LeaveRoomMessage = {
        type: 'rooms:leave',
        payload: { roomId },
      };

      const response = await withFallback(
        () => sendMessage(message),
        () => leaveRoom(roomId),
      );

      if (!response.ok || response.error) {
        throw response.error || new Error('Failed to leave room');
      }

      await loadRooms();
      logger.debug('useRooms:leaveRoom:success', { roomId });
      return true;
    } catch (err) {
      const errorMessage = formatSupabaseError(err);
      logger.error('useRooms:leaveRoom:error', err);
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadRooms]);

  const removeMemberHandler = useCallback(async (roomId: string, userId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    logger.debug('useRooms:removeMember:request', { roomId, userId });

    try {
      const message: RemoveMemberMessage = {
        type: 'rooms:removeMember',
        payload: { roomId, userId },
      };

      const response = await withFallback(
        () => sendMessage(message),
        () => removeMember(roomId, userId),
      );

      if (!response.ok || response.error) {
        throw response.error || new Error('Failed to remove member');
      }

      logger.debug('useRooms:removeMember:success', { roomId, userId });
      return true;
    } catch (err) {
      const errorMessage = formatSupabaseError(err);
      logger.error('useRooms:removeMember:error', err);
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    rooms,
    loading,
    error,
    loadRooms,
    createRoom: createRoomHandler,
    joinRoom,
    deleteRoom: deleteRoomHandler,
    leaveRoom: leaveRoomHandler,
    removeMember: removeMemberHandler,
  };
}


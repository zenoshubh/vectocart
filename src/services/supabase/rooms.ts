import { getSupabase } from './client';
import type { Room, RoomMember, RoomRole, ServiceResult } from '@/types/rooms';
import { logger } from '@/lib/logger';
import { ROOM_CODE_LENGTH, ROOM_CODE_ALPHABET, ROOM_CODE_RETRY_ATTEMPTS } from '@/lib/constants';

function generateRoomCode(): string {
  let code = '';
  const bytes = new Uint8Array(ROOM_CODE_LENGTH);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += ROOM_CODE_ALPHABET[bytes[i] % ROOM_CODE_ALPHABET.length];
  }
  return code;
}

async function getCurrentUserId(): Promise<string> {
  const supabase = getSupabase();
  logger.debug('getSession:request');
  const { data: sessionData, error } = await supabase.auth.getSession();
  logger.debug('getSession:response', { hasSession: !!sessionData.session, error: error?.message });
  if (error) throw error;
  const userId = sessionData.session?.user?.id;
  if (!userId) throw new Error('Not authenticated');
  return userId;
}

export async function createRoom(name: string): Promise<ServiceResult<Room>> {
  const supabase = getSupabase();
  try {
    logger.debug('createRoom:request', { name });
    const createdBy = await getCurrentUserId();
    // Ensure unique code
    let code = generateRoomCode();
    for (let i = 0; i < ROOM_CODE_RETRY_ATTEMPTS; i++) {
      logger.debug('checkUniqueCode:request', { codeAttempt: code, attempt: i + 1 });
      const { data: existing, error: checkErr } = await supabase
        .from('rooms')
        .select('id')
        .eq('code', code)
        .maybeSingle();
      logger.debug('checkUniqueCode:response', { exists: !!existing, error: checkErr?.message });
      if (checkErr) throw checkErr;
      if (!existing) break;
      code = generateRoomCode();
    }
    logger.debug('insertRoom:request', { name, code, createdBy });
    const { data: insertRoom, error: insertErr } = await supabase
      .from('rooms')
      .insert({
        name,
        code,
        created_by: createdBy,
      })
      .select('id, name, code, created_by, created_at')
      .single();
    logger.debug('insertRoom:response', { roomId: insertRoom?.id, error: insertErr?.message });
    if (insertErr) throw insertErr;

    // Creator becomes owner in room_members
    logger.debug('insertMember:request', {
      room_id: insertRoom.id,
      user_id: createdBy,
      role: 'owner',
    });
    const { error: memberErr } = await supabase.from('room_members').insert({
      room_id: insertRoom.id,
      user_id: createdBy,
      role: 'owner' as RoomRole,
    });
    logger.debug('insertMember:response', { error: memberErr?.message });
    if (memberErr) throw memberErr;

    const room: Room = {
      id: insertRoom.id,
      name: insertRoom.name,
      code: insertRoom.code,
      createdBy: insertRoom.created_by,
      createdAt: insertRoom.created_at,
    };
    logger.debug('createRoom:success', { roomId: room.id, code: room.code });
    return { data: room, error: null };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error('createRoom:error', error);
    return { data: null, error };
  }
}

export async function joinRoomByCode(code: string): Promise<ServiceResult<Room>> {
  const supabase = getSupabase();
  try {
    logger.debug('joinRoomByCode:request', { code });
    const userId = await getCurrentUserId();
    logger.debug('selectRoomByCode:request', { code });
    const { data: room, error: roomErr } = await supabase
      .from('rooms')
      .select('id, name, code, created_by, created_at')
      .eq('code', code)
      .single();
    logger.debug('selectRoomByCode:response', { roomId: room?.id, error: roomErr?.message });
    if (roomErr) throw roomErr;
    // Upsert membership
    logger.debug('upsertMember:request', {
      room_id: room.id,
      user_id: userId,
      role: 'member',
    });
    const { error: memberErr } = await supabase.from('room_members').upsert(
      {
        room_id: room.id,
        user_id: userId,
        role: 'member' as RoomRole,
      },
      { onConflict: 'room_id,user_id' },
    );
    logger.debug('upsertMember:response', { error: memberErr?.message });
    if (memberErr) throw memberErr;
    const result: Room = {
      id: room.id,
      name: room.name,
      code: room.code,
      createdBy: room.created_by,
      createdAt: room.created_at,
    };
    logger.debug('joinRoomByCode:success', { roomId: result.id, code: result.code });
    return { data: result, error: null };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error('joinRoomByCode:error', error);
    return { data: null, error };
  }
}

export async function listMyRooms(): Promise<ServiceResult<Room[]>> {
  const supabase = getSupabase();
  try {
    logger.debug('listMyRooms:request');
    const userId = await getCurrentUserId();
    
    // First, get room memberships with joined_at for ordering
    logger.debug('selectMyMemberships:request', { userId });
    const { data: memberships, error: membershipsError } = await supabase
      .from('room_members')
      .select('room_id, joined_at')
      .eq('user_id', userId)
      .order('joined_at', { ascending: false });
    logger.debug('selectMyMemberships:response', { count: memberships?.length, error: membershipsError?.message });
    if (membershipsError) throw membershipsError;
    
    if (!memberships || memberships.length === 0) {
      logger.debug('listMyRooms:success', { count: 0 });
      return { data: [], error: null };
    }
    
    // Extract room IDs and fetch rooms
    const roomIds = memberships.map((m) => m.room_id);
    logger.debug('selectRooms:request', { roomIds, count: roomIds.length });
    const { data: roomsData, error: roomsError } = await supabase
      .from('rooms')
      .select('id, name, code, created_by, created_at')
      .in('id', roomIds);
    logger.debug('selectRooms:response', { count: roomsData?.length, error: roomsError?.message });
    if (roomsError) throw roomsError;
    
    // Preserve order from memberships (most recently joined first)
    const roomMap = new Map((roomsData ?? []).map((r) => [r.id, r]));
    const rooms = memberships
      .map((m) => roomMap.get(m.room_id))
      .filter((r): r is NonNullable<typeof r> => r !== undefined)
      .map(
        (r): Room => ({
          id: r.id,
          name: r.name,
          code: r.code,
          createdBy: r.created_by,
          createdAt: r.created_at,
        }),
      );
    
    logger.debug('listMyRooms:success', { count: rooms.length });
    return { data: rooms, error: null };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error('listMyRooms:error', error);
    return { data: null, error };
  }
}

export async function removeMember(
  roomId: string,
  userIdToRemove: string,
): Promise<ServiceResult<null>> {
  const supabase = getSupabase();
  try {
    logger.debug('removeMember:request', { roomId, userIdToRemove });
    const callerId = await getCurrentUserId();
    // Check caller role
    logger.debug('getCallerRole:request', { roomId, callerId });
    const { data: callerMember, error: callerErr } = await supabase
      .from('room_members')
      .select('role')
      .eq('room_id', roomId)
      .eq('user_id', callerId)
      .single();
    logger.debug('getCallerRole:response', { role: callerMember?.role, error: callerErr?.message });
    if (callerErr) throw callerErr;
    if (callerMember?.role !== 'owner') {
      throw new Error('Only owner can remove members');
    }
    logger.debug('deleteMember:request', { roomId, userIdToRemove });
    const { error: delErr } = await supabase
      .from('room_members')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', userIdToRemove);
    logger.debug('deleteMember:response', { error: delErr?.message });
    if (delErr) throw delErr;
    logger.debug('removeMember:success');
    return { data: null, error: null };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error('removeMember:error', error);
    return { data: null, error };
  }
}

export async function deleteRoom(roomId: string): Promise<ServiceResult<null>> {
  const supabase = getSupabase();
  try {
    logger.debug('deleteRoom:request', { roomId });
    const callerId = await getCurrentUserId();
    // Verify owner
    logger.debug('getCallerRole:request', { roomId, callerId });
    const { data: callerMember, error: callerErr } = await supabase
      .from('room_members')
      .select('role')
      .eq('room_id', roomId)
      .eq('user_id', callerId)
      .single();
    logger.debug('getCallerRole:response', { role: callerMember?.role, error: callerErr?.message });
    if (callerErr) throw callerErr;
    if (callerMember?.role !== 'owner') {
      throw new Error('Only owner can delete the room');
    }
    // Delete room cascades if FK is set; fallback manual deletes
    logger.debug('deleteMembers:request', { roomId });
    const { error: rmMembersErr } = await supabase
      .from('room_members')
      .delete()
      .eq('room_id', roomId);
    logger.debug('deleteMembers:response', { error: rmMembersErr?.message });
    if (rmMembersErr) throw rmMembersErr;
    logger.debug('deleteRoomRow:request', { roomId });
    const { error: rmRoomErr } = await supabase.from('rooms').delete().eq('id', roomId);
    logger.debug('deleteRoomRow:response', { error: rmRoomErr?.message });
    if (rmRoomErr) throw rmRoomErr;
    logger.debug('deleteRoom:success', { roomId });
    return { data: null, error: null };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error('deleteRoom:error', error);
    return { data: null, error };
  }
}

export async function createInviteLink(
  roomId: string,
  invitedEmail?: string,
): Promise<ServiceResult<{ link: string }>> {
  const supabase = getSupabase();
  try {
    logger.debug('createInviteLink:request', { roomId, hasInvitedEmail: !!invitedEmail });
    // Ensure caller is a member (owner or member)
    const callerId = await getCurrentUserId();
    logger.debug('checkMembership:request', { roomId, callerId });
    const { data: membership, error: memErr } = await supabase
      .from('room_members')
      .select('role')
      .eq('room_id', roomId)
      .eq('user_id', callerId)
      .single();
    logger.debug('checkMembership:response', { hasMembership: !!membership, error: memErr?.message });
    if (memErr) throw memErr;
    if (!membership) throw new Error('Not a member of this room');

    // Fetch room to get code
    logger.debug('selectRoom:request', { roomId });
    const { data: room, error: roomErr } = await supabase
      .from('rooms')
      .select('code')
      .eq('id', roomId)
      .single();
    logger.debug('selectRoom:response', { hasCode: !!room?.code, error: roomErr?.message });
    if (roomErr) throw roomErr;

    const link = `https://vectocart.app/join/${room.code}`;
    logger.debug('createInviteLink:success', { linkPreview: link.slice(0, 40) + '...' });
    return { data: { link }, error: null };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error('createInviteLink:error', error);
    return { data: null, error };
  }
}



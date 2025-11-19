export interface Room {
  id: string;
  name: string;
  code: string;
  createdBy: string;
  createdAt: string;
}

export type RoomRole = 'owner' | 'member';

export interface RoomMember {
  roomId: string;
  userId: string;
  role: RoomRole;
  joinedAt: string;
}

export interface InvitePayload {
  roomId: string;
  invitedEmail?: string;
}

export interface ServiceResult<T> {
  data: T | null;
  error: Error | null;
}



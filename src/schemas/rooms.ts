import { z } from 'zod';

export const CreateRoomSchema = z.object({
  name: z.string().min(2, 'Room name too short').max(64, 'Room name too long'),
});
export type CreateRoomInput = z.infer<typeof CreateRoomSchema>;

export const JoinRoomSchema = z.object({
  code: z.string().regex(/^[A-Z0-9]{6}$/, 'Invalid room code'),
});
export type JoinRoomInput = z.infer<typeof JoinRoomSchema>;

export const DeleteRoomSchema = z.object({
  roomId: z.string().uuid('Invalid room id'),
});
export type DeleteRoomInput = z.infer<typeof DeleteRoomSchema>;

export const RemoveMemberSchema = z.object({
  roomId: z.string().uuid('Invalid room id'),
  userId: z.string().uuid('Invalid user id'),
});
export type RemoveMemberInput = z.infer<typeof RemoveMemberSchema>;

export const LeaveRoomSchema = z.object({
  roomId: z.string().uuid('Invalid room id'),
});
export type LeaveRoomInput = z.infer<typeof LeaveRoomSchema>;

export const InviteSchema = z.object({
  roomId: z.string().uuid('Invalid room id'),
  invitedEmail: z.string().email('Invalid email').optional(),
});
export type InviteInput = z.infer<typeof InviteSchema>;

export const ListRoomsSchema = z.object({});
export type ListRoomsInput = z.infer<typeof ListRoomsSchema>;



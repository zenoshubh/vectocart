/**
 * Message types for background script communication
 */

export type MessageType =
  | 'vc:ping'
  | 'rooms:create'
  | 'rooms:join'
  | 'rooms:list'
  | 'rooms:delete'
  | 'rooms:removeMember';

export interface BaseMessage {
  type: MessageType;
  payload?: Record<string, unknown>;
}

export interface CreateRoomMessage extends BaseMessage {
  type: 'rooms:create';
  payload: {
    name: string;
  };
}

export interface JoinRoomMessage extends BaseMessage {
  type: 'rooms:join';
  payload: {
    code: string;
  };
}

export interface ListRoomsMessage extends BaseMessage {
  type: 'rooms:list';
  payload?: Record<string, never>;
}

export interface DeleteRoomMessage extends BaseMessage {
  type: 'rooms:delete';
  payload: {
    roomId: string;
  };
}

export interface RemoveMemberMessage extends BaseMessage {
  type: 'rooms:removeMember';
  payload: {
    roomId: string;
    userId: string;
  };
}

export interface PingMessage extends BaseMessage {
  type: 'vc:ping';
  payload?: Record<string, never>;
}

export type Message = 
  | CreateRoomMessage
  | JoinRoomMessage
  | ListRoomsMessage
  | DeleteRoomMessage
  | RemoveMemberMessage
  | PingMessage;

export interface MessageResponse<T = unknown> {
  ok: boolean;
  data: T | null;
  error: Error | null;
}


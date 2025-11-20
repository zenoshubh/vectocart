/**
 * Message types for background script communication
 */

export type MessageType =
  | 'vc:ping'
  | 'rooms:create'
  | 'rooms:join'
  | 'rooms:list'
  | 'rooms:delete'
  | 'rooms:removeMember'
  | 'products:add'
  | 'products:list'
  | 'products:delete'
  | 'auth:check'
  | 'sidepanel:open';

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

export interface AddProductMessage extends BaseMessage {
  type: 'products:add';
  payload: {
    roomId: string;
    name: string;
    price?: number | null;
    currency?: string | null;
    rating?: number | null;
    image?: string | null;
    url: string;
    platform: 'amazon' | 'flipkart' | 'meesho';
  };
}

export interface ListProductsMessage extends BaseMessage {
  type: 'products:list';
  payload: {
    roomId: string;
  };
}

export interface DeleteProductMessage extends BaseMessage {
  type: 'products:delete';
  payload: {
    productId: string;
  };
}

export interface AuthCheckMessage extends BaseMessage {
  type: 'auth:check';
  payload?: Record<string, never>;
}

export interface OpenSidepanelMessage extends BaseMessage {
  type: 'sidepanel:open';
  payload?: Record<string, never>;
}

export type Message = 
  | CreateRoomMessage
  | JoinRoomMessage
  | ListRoomsMessage
  | DeleteRoomMessage
  | RemoveMemberMessage
  | PingMessage
  | AddProductMessage
  | ListProductsMessage
  | DeleteProductMessage
  | AuthCheckMessage
  | OpenSidepanelMessage;

export interface MessageResponse<T = unknown> {
  ok: boolean;
  data: T | null;
  error: Error | null;
}


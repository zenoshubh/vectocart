-- VectoCart Database Schema
-- This schema matches the current codebase implementation
-- Note: RLS policies are not included - add them separately if needed

-- ============================================================================
-- USER PROFILES TABLE
-- ============================================================================
-- Stores additional user profile information
CREATE TABLE public.user_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  username text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT user_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT user_profiles_user_id_key UNIQUE (user_id),
  CONSTRAINT user_profiles_username_key UNIQUE (username),
  CONSTRAINT user_profiles_user_id_fkey FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Username validation: 3-20 characters, alphanumeric and underscores only
  CONSTRAINT user_profiles_username_length_check CHECK (char_length(username) >= 3 AND char_length(username) <= 20),
  CONSTRAINT user_profiles_username_format_check CHECK (username ~ '^[a-zA-Z0-9_]+$'),
  
  -- Username cannot start or end with underscore
  CONSTRAINT user_profiles_username_edges_check CHECK (username !~ '^_|_$')
);

-- Index for fast username lookups
CREATE INDEX idx_user_profiles_username ON public.user_profiles(username);

-- Index for finding profile by user_id
CREATE INDEX idx_user_profiles_user_id ON public.user_profiles(user_id);

-- ============================================================================
-- ROOMS TABLE
-- ============================================================================
-- Stores room information with unique codes for joining
CREATE TABLE public.rooms (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT rooms_pkey PRIMARY KEY (id),
  CONSTRAINT rooms_code_key UNIQUE (code),
  CONSTRAINT rooms_created_by_fkey FOREIGN KEY (created_by) 
    REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Ensure room name is not empty
  CONSTRAINT rooms_name_check CHECK (char_length(trim(name)) >= 2),
  
  -- Ensure code is exactly 6 characters (matches ROOM_CODE_LENGTH constant)
  CONSTRAINT rooms_code_length_check CHECK (char_length(code) = 6),
  
  -- Ensure code contains only valid characters (A-Z, 2-9, excludes ambiguous)
  CONSTRAINT rooms_code_format_check CHECK (code ~ '^[A-Z2-9]{6}$')
);

-- Index for fast room code lookups (used in joinRoomByCode)
CREATE INDEX idx_rooms_code ON public.rooms(code);

-- Index for finding rooms by creator
CREATE INDEX idx_rooms_created_by ON public.rooms(created_by);

-- Index for sorting by creation date
CREATE INDEX idx_rooms_created_at ON public.rooms(created_at DESC);

-- ============================================================================
-- ROOM MEMBERS TABLE
-- ============================================================================
-- Stores membership information for users in rooms
CREATE TABLE public.room_members (
  room_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT room_members_pkey PRIMARY KEY (room_id, user_id),
  CONSTRAINT room_members_room_id_fkey FOREIGN KEY (room_id) 
    REFERENCES public.rooms(id) ON DELETE CASCADE,
  CONSTRAINT room_members_user_id_fkey FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Ensure role is either 'owner' or 'member' (matches RoomRole type)
  CONSTRAINT room_members_role_check CHECK (role IN ('owner', 'member'))
);

-- Index for finding all rooms a user belongs to (used in listMyRooms)
CREATE INDEX idx_room_members_user_id ON public.room_members(user_id);

-- Index for finding all members of a room (used in RoomMembers component)
CREATE INDEX idx_room_members_room_id ON public.room_members(room_id);

-- Index for sorting by join date (used in listMyRooms ordering)
CREATE INDEX idx_room_members_joined_at ON public.room_members(joined_at DESC);

-- Composite index for checking membership (used in permission checks)
CREATE INDEX idx_room_members_room_user ON public.room_members(room_id, user_id);

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================
COMMENT ON TABLE public.user_profiles IS 'Stores user profile information including username. Required for all users.';
COMMENT ON COLUMN public.user_profiles.username IS 'Unique username, 3-20 characters, alphanumeric and underscores only';
COMMENT ON COLUMN public.user_profiles.user_id IS 'References auth.users(id), one profile per user';

COMMENT ON TABLE public.rooms IS 'Stores shopping room information. Each room has a unique 6-character code for joining.';
COMMENT ON COLUMN public.rooms.code IS 'Unique 6-character alphanumeric code (A-Z, 2-9, excludes ambiguous characters like 0, O, I, 1)';
COMMENT ON COLUMN public.rooms.name IS 'Room name, minimum 2 characters';

COMMENT ON TABLE public.room_members IS 'Stores user membership in rooms. Each user can be either owner or member.';
COMMENT ON COLUMN public.room_members.role IS 'User role: owner (can delete room, remove members) or member (can add products, vote)';
COMMENT ON COLUMN public.room_members.joined_at IS 'Timestamp when user joined the room, used for ordering rooms by most recently joined';


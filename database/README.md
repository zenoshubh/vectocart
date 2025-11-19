# VectoCart Database Schema

This directory contains the database schema for VectoCart.

## Schema Overview

The database consists of two main tables:

1. **`rooms`** - Stores room information with unique codes
2. **`room_members`** - Stores user membership in rooms

## Tables

### `rooms`
- `id` (uuid, PK) - Unique room identifier
- `name` (text) - Room name (min 2 chars)
- `code` (text, UNIQUE) - 6-character join code (A-Z, 2-9)
- `created_by` (uuid, FK → auth.users) - User who created the room
- `created_at` (timestamptz) - Room creation timestamp

### `room_members`
- `room_id` (uuid, FK → rooms) - Room identifier
- `user_id` (uuid, FK → auth.users) - User identifier
- `role` (text) - Either 'owner' or 'member'
- `joined_at` (timestamptz) - When user joined the room

## Indexes

### Performance Indexes
- `idx_rooms_code` - Fast room code lookups (join by code)
- `idx_rooms_created_by` - Find rooms by creator
- `idx_room_members_user_id` - Find all rooms for a user
- `idx_room_members_room_id` - Find all members of a room
- `idx_room_members_joined_at` - Sort by join date

## Constraints

- Room codes must be exactly 6 characters
- Room codes must match pattern `^[A-Z2-9]{6}$` (excludes ambiguous chars)
- Room names must be at least 2 characters
- Room member roles must be either 'owner' or 'member'
- Foreign keys cascade on delete

## Usage in Codebase

- **Room creation**: `createRoom()` inserts into `rooms` and `room_members`
- **Room joining**: `joinRoomByCode()` finds room by code, upserts into `room_members`
- **Room listing**: `listMyRooms()` queries `room_members` then `rooms`
- **Member listing**: Queries `room_members` filtered by `room_id`

## Migration Notes

If you need to migrate from an existing schema:

1. The `room_invites` table is **not used** in the current codebase
2. All timestamps use `timestamptz` (timestamp with time zone)
3. All UUIDs use `gen_random_uuid()` as default
4. Foreign keys cascade on delete for data consistency


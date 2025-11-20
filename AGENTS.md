# VectoCart - AI Coding Agent Guide

This guide provides essential information for AI coding agents working on the VectoCart codebase.

## Tech Stack

- **Framework**: WXT (`^0.20.6`) with React 19, TypeScript 5.9
- **UI**: Tailwind CSS 4, shadcn/ui components, Radix UI primitives
- **Backend**: Supabase (Auth, PostgreSQL, Storage)
- **Validation**: Zod schemas for all external data
- **State**: React hooks, contexts

## Project Structure

```
src/
├── assets/              # CSS, images
├── components/          # React components (organized by feature)
│   ├── auth/           # AuthForm, UsernameSetup
│   ├── rooms/          # RoomDetail, RoomMembers, RoomsList, RoomsView
│   ├── products/       # ProductVoting
│   ├── layout/         # Header, ErrorBoundary
│   └── ui/             # shadcn/ui primitives
├── entrypoints/        # WXT entry points
│   ├── background.ts   # Service worker
│   ├── content.ts      # Content script
│   └── sidepanel/      # React app
├── hooks/              # Custom React hooks
├── services/supabase/   # Backend service layer
├── lib/                # Utilities
│   ├── content-script/ # Content script utilities
│   ├── parsers/        # Product parsers
│   └── ...            # Other utilities
├── schemas/            # Zod validation schemas
├── types/              # TypeScript type definitions
└── contexts/           # React contexts
```

## Path Aliases

- `@/` → `src/` (configured in `tsconfig.json` and `wxt.config.ts`)
- Always use `@/` for imports: `@/components`, `@/lib`, `@/services`, etc.

## Core Principles

### 1. Type Safety
- Use TypeScript interfaces (not types) for public contracts
- Validate all external data with Zod schemas
- No `any` - use `unknown` + type narrowing
- All service functions return `ServiceResult<T> = { data: T | null; error: Error | null }`

### 2. Component Organization
- Group components by feature in subfolders: `auth/`, `rooms/`, `products/`, `layout/`
- UI primitives stay in `ui/`
- Use descriptive, PascalCase component names

### 3. Service Layer Pattern
- All Supabase calls go through `services/supabase/*`
- Background script handles all backend operations
- UI/content scripts communicate via messaging (see below)
- Services return `ServiceResult<T>` pattern

### 4. Messaging Architecture
- Content script and side panel → Background script (via `sendMessage`)
- Background script → Supabase backend
- All messages validated with Zod schemas in `schemas/*`
- Message types defined in `types/messaging.ts`

### 5. Error Handling
- Services return `{ data, error }` pattern
- Use `formatSupabaseError()` from `@/lib/errors` for user-friendly messages
- Show toasts for transient errors, inline errors for forms
- Never swallow errors silently

## Coding Guidelines

### File Naming
- Components: PascalCase (e.g., `AuthForm.tsx`)
- Utilities: camelCase (e.g., `utils.ts`, `logger.ts`)
- Types: camelCase (e.g., `products.ts`, `rooms.ts`)

### Imports Order
1. React/React DOM
2. Third-party libraries
3. Internal components (`@/components`)
4. Hooks (`@/hooks`)
5. Services (`@/services`)
6. Utilities (`@/lib`)
7. Types (`@/types`)
8. Schemas (`@/schemas`)

### Component Structure
```tsx
// 1. Imports
import React from 'react';
import { Button } from '@/components/ui/button';

// 2. Types/Interfaces
interface ComponentProps {
  // ...
}

// 3. Component
export function Component({ ... }: ComponentProps) {
  // Hooks first
  // State
  // Effects
  // Handlers
  // Render
}
```

### Service Functions
```ts
import type { ServiceResult } from '@/types/rooms';

export async function serviceFunction(): Promise<ServiceResult<DataType>> {
  try {
    // Implementation
    return { data: result, error: null };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    return { data: null, error };
  }
}
```

## Key Conventions

### Constants
- Define in `@/lib/constants.ts`
- Use UPPER_SNAKE_CASE for constants
- Export only what's used

### Logging
- Use `logger` from `@/lib/logger` (dev-only)
- Structured logging with context objects
- No PII in logs

### Styling
- Use Tailwind utility classes
- Design tokens: `#E40046` (primary), `#F8F9FA` (surface-2), etc.
- See `@/lib/constants.ts` for color constants

### Content Scripts
- Utilities in `@/lib/content-script/`
- Use Shadow DOM for style isolation
- Handle SPA navigation with `wxt:locationchange` events

## Database Schema (Supabase)

### Tables
- `user_profiles` - User usernames
- `rooms` - Shopping rooms with unique 6-char codes
- `room_members` - Room membership (owner/member roles)
- `products` - Products in rooms
- `votes` - Product votes (upvote/downvote)

### Security
- Row Level Security (RLS) policies enforce access
- Owner-only operations: delete room, remove members
- Product deletion: product owner or room owner only

## Common Patterns

### Authentication Check
```ts
const { isAuthenticated, loading } = useAuth();
if (!isAuthenticated) {
  // Show auth form
}
```

### Toast Notifications
```ts
const toast = useToast();
toast.showSuccess('Success message');
toast.showError('Error message');
```

### Room Operations
```ts
const { rooms, createRoom, joinRoom, deleteRoom } = useRooms();
```

### Product Parsing
```ts
import { detectPlatform, parseProduct } from '@/lib/parsers';
const platform = detectPlatform(hostname);
const productData = parseProduct(platform);
```

## What NOT to Do

- ❌ Don't use `any` types
- ❌ Don't bypass service layer (direct Supabase calls from UI)
- ❌ Don't create duplicate `ServiceResult` interfaces
- ❌ Don't add unused dependencies
- ❌ Don't mix component categories (keep auth/rooms/products/layout separate)
- ❌ Don't use inline styles (use Tailwind classes)
- ❌ Don't create empty catch blocks
- ❌ Don't store secrets in extension storage

## Environment Variables

- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `WXT_GOOGLE_OAUTH_CLIENT_ID` - Google OAuth2 client ID

## Extension ID Consistency

- The extension has a fixed `"key"` field in the manifest (configured in `wxt.config.ts`)
- This ensures the extension ID is **identical across all machines and builds**
- Critical for:
  - OAuth redirect URIs: `https://{extension-id}.chromiumapp.org`
  - Storage persistence across reloads
  - Team development (same ID for all developers)
- The extension ID is calculated from the public key, so it's deterministic

## Quick Reference

### Import Paths
- Components: `@/components/{category}/{ComponentName}`
- Services: `@/services/supabase/{service}`
- Types: `@/types/{domain}`
- Schemas: `@/schemas/{domain}`
- Utils: `@/lib/{util}`

### Build Commands
- `pnpm dev` - Development (Chrome)
- `pnpm build` - Production build
- `pnpm compile` - Type check only

---

**Remember**: When in doubt, follow existing patterns in the codebase. Consistency is key.

# VectoCart - Browser Extension Engineering Guide

VectoCart is a cross‑browser, MV3 WebExtensions project built with WXT and TypeScript. It injects an “Add to VectoCart” button on supported e‑commerce sites, syncs shared carts via a backend, and provides a side panel UI for rooms, products, and voting.

## Tech Stack
- MV3 WebExtensions via WXT (Vite + TS, typed manifest, multi‑entry)
- TypeScript (strict), ESLint + Prettier
- UI: React 19 + Tailwind v4 for side panel/options pages
- Messaging: chrome.runtime message ports with zod schemas
- Storage:
  - In‑extension: chrome.storage.local/session and IndexedDB (idb)
  - Backend: Firebase (Firestore, Auth, Functions), via HTTPS callable/REST where appropriate

## Design System
- Colors (from the provided UI reference):
  - primary: #E40046
  - primary-600: #CC003F
  - primary-700: #B00037
  - surface: #FFFFFF
  - surface-2: #F8F9FA
  - border: #E5E7EB
  - text: #111827
  - text-muted: #6B7280
  - icon: #6B7280
  - success: #10B981
  - danger: #EF4444
- Usage:
  - Use primary for top bars, primary actions, and brand elements; use white text/icons on primary.
  - Use surface/surface-2 for panels and inputs; border for dividers.
  - Maintain accessible contrast (WCAG AA) for text on colored backgrounds.
  - Do not change element sizes on hover; use color/opacity for affordances.
- Tailwind theme mapping (to add in Tailwind config):

```ts
// tailwind theme extension (example)
theme: {
  extend: {
    colors: {
      primary: {
        DEFAULT: '#E40046',
        600: '#CC003F',
        700: '#B00037',
      },
      surface: {
        DEFAULT: '#FFFFFF',
        2: '#F8F9FA',
      },
      border: '#E5E7EB',
      text: {
        DEFAULT: '#111827',
        muted: '#6B7280',
      },
      icon: '#6B7280',
      success: '#10B981',
      danger: '#EF4444',
    },
  },
}
```

## Project Layout (WXT)
WXT follows a strict, flat project structure. Key directories at the project root:
- `.output/`               // build artifacts
- `.wxt/`                  // generated WXT TS config
- `assets/`                // CSS, images, assets processed by WXT
- `components/`            // auto‑imported UI components
- `entrypoints/`           // background/content/sidepanel/options entry files
- `hooks/`                 // auto‑imported React/Solid hooks
- `modules/`               // local WXT modules
- `public/`                // copied as‑is
- `utils/`                 // auto‑imported utilities
- `.env`, `.env.publish`   // environment variables
- `app.config.ts`          // runtime config
- `wxt.config.ts`          // main WXT config (typed)
- `web-ext.config.ts`      // browser startup config
- `tsconfig.json`          // TypeScript config
- `package.json`

If you prefer a `src/` directory, enable it in `wxt.config.ts`:

```ts
export default defineConfig({
  srcDir: 'src',
});
```

With `srcDir`, WXT expects these under `src/`:
- `assets/`, `components/`, `entrypoints/`, `hooks/`, `utils/`, plus `app.config.ts`

You can customize directories in `wxt.config.ts`:

```ts
export default defineConfig({
  // Relative to project root
  srcDir: 'src',             // default: '.'
  modulesDir: 'wxt-modules', // default: 'modules'
  outDir: 'dist',            // default: '.output'
  publicDir: 'static',       // default: 'public'

  // Relative to srcDir
  entrypointsDir: 'entries', // default: 'entrypoints'
});
```

## Core Principles
1. Type Safety First
   - Use interfaces over types for external/public contracts.
   - Use zod to validate all cross‑context messages and external data.
   - No `any`. Prefer `unknown` + narrowing for untrusted inputs.
2. MV3 Lifecycle Correctness
   - Background is event‑driven and stateless; offload heavy/DOM work to offscreen docs or the side panel.
   - Prefer dynamic content script registration and narrow host permissions.
3. Security & Privacy
   - Principle of least privilege: minimal permissions and host matches; use optional permissions when possible.
   - Validate every message boundary. Never trust content‑script data.
   - No remote code execution. Respect CSP; no inline scripts.
   - Transparent data practices; easy data export/delete paths.
4. Performance
   - Small content scripts; lazy load heavy logic and site rules.
   - Throttle DOM observers; detach on navigation.
   - Use alarms/events over setInterval in background.
5. Reliability
   - Idempotent operations; guard against duplicate room joins and vote races.
   - Use backend atomic increments or transactions where needed.
   - Feature flag risky scrapers; fail soft with user feedback.

## Features (Scope v1)
- Rooms
  - Create/join via short codes; owner badge; remove members (owner only).
  - Share code via Web Share API or clipboard.
- Shared Cart
  - Real‑time list, sort/filter, open product links, remove items (policy‑bound).
- Product Voting
  - Single vote per user per product (up/down), change/remove.
- Content Scripts
  - Supported sites: Amazon (.in/.com), Flipkart, Myntra, AJIO, Meesho.
  - Inject “Add to VectoCart” button; robust selectors + fallbacks.
- Side Panel
  - Auth gate, rooms page, cart page, members page.

## Messaging Contracts (zod‑validated)
- content → background: AddProduct { name, url, price?, image?, platform }
- background → backend: createProduct(roomId, payload)
- panel ↔ background: session/room state sync, auth events
- background → content: optional toast/feedback

All messages live in `src/messaging` with:
- Schema: zod definitions
- Types: inferred TS types
- Router: background message router with per‑message auth and permission checks

## Storage & Caching
- chrome.storage.session for ephemeral session state where available, local otherwise.
- IndexedDB for large caches (e.g., rule sets); wrap with `idb`.
- Namespaced keys: `vc:*` to avoid collisions.
- Do not store secrets in extension storage.

## Backend Contracts (Draft)
- Auth: Firebase Auth (Web Extension SDK). Use ID tokens; never pass raw credentials cross‑context.
- Rooms:
  - Create: { name } → { id, code, createdBy, createdAt }
  - Join: { code } → { room }
  - Members subcollection with role, joinedAt
- Products:
  - Add: { roomId, product } → document with vote counters
  - Remove: owner/member‑policy enforced by rules
- Votes:
  - Upsert per user per product; atomic counter updates or server‑side triggers
- Security Rules/Policies:
  - Read/write limited to room members; owner‑only destructive ops
  - One vote per user per product

## Permissions (Minimum)
- "sidePanel", "storage", "scripting"
- host_permissions: only the domains we actively support (per environment)
- optional host permissions for future sites
- clipboardWrite only if share fallback requires it

## Error Handling & UX
- Every async action returns `{ data, error }` from services.
- Toasts/snackbars for transient outcomes; inline errors for forms.
- Detect and communicate site rule failures with actionable messages.

## Coding Guidelines
- Functional, modular code; avoid classes unless mandated by APIs.
- Descriptive names: `isEnabled`, `hasPermission`, `currentRoomId`.
- Early returns; minimal nesting; no empty catch blocks.
- Comments only for non‑obvious rationale, invariants, or caveats.

## Implementation Order (Milestones)
1) Base setup: WXT, TS, lint, tailwind, typed manifest
2) Messaging skeleton with zod; background router
3) Side panel scaffold (auth gate, rooms UI, toasts)
4) Content script injector + per‑site rule modules
5) Backend service adapters (Auth, Rooms, Products, Votes)
6) Voting and counters (atomic updates or server function)
7) Security hardening (permissions, validation, rules)
8) Store assets

## Operational Notes
- Keep Firebase/keys public‑safe; enforce access in rules, not secrets.
- Site rule updates should be data‑driven when feasible (remote JSON with signature) and cached.
- Log sparingly; no user PII in logs. Disable verbose logs in production.

This document describes the engineering contract for VectoCart. Changes to architecture, permissions, or data contracts must be reviewed and reflected here before implementation.



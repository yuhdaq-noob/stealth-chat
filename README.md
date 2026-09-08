# Stealth Chat

A private one-room chat for two users, with a local notepad and a Google Form link for file sharing.

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local`.
3. Fill in the Supabase URL, anon key, and service role key. The service role key is server-only and must never be exposed to the browser.
4. Run `supabase/schema.sql` in the Supabase SQL Editor.
5. Start the app with `npm run dev`.

The initial passwords are provided separately during setup. They are intentionally not stored in this repository. Change them before production by generating new bcrypt hashes and updating the two rows in `app_users`. Never place plain passwords in source code.

## Security model

- Login uses the user name and numeric password through a server Route Handler.
- Passwords are stored as bcrypt hashes in Supabase.
- Sessions are random tokens stored as hashes in Supabase and exposed only through an HttpOnly cookie.
- Browser message requests go through `/api/messages`; the service role key is never sent to the browser.
- RLS blocks direct public access to `messages`, `app_users`, and `auth_sessions`.
- The File action intentionally opens the configured Google Form and does not upload files to Supabase.

## Validation

```bash
npm run lint
npm run typecheck
npm run build
```

## Getting Started

First, run the development server:

````bash
npm run dev
# or
yarn dev
# or
pnpm dev
# Stealth Chat

Private one-room chat for two users, with a local notepad and a Google Form link for file sharing.

## Setup

1. Install dependencies: `npm install`.
2. Copy `.env.example` to `.env.local`.
3. Add the Supabase URL, anon key, and server-only service role key.
4. Run [supabase/schema.sql](supabase/schema.sql) in the Supabase SQL Editor.
5. Start development: `npm run dev`.

The service role key must never use a `NEXT_PUBLIC_` prefix or be exposed to the browser. The initial user passwords are provided separately and are not stored in this repository. Change them before production by replacing their bcrypt hashes in `app_users`.

## Architecture

- Login uses a server Route Handler with user name and numeric password.
- Passwords use bcrypt hashes in Supabase.
- Sessions use random hashed tokens stored in `auth_sessions` and an HttpOnly cookie.
- Browser message requests go through `/api/messages`; the service role key stays server-side.
- RLS blocks direct public access to `messages`, `app_users`, and `auth_sessions`.
- Messages are limited to the latest 100 records per request and 2,000 characters each.
- The File action intentionally opens the configured Google Form instead of uploading to Supabase Storage.

## Commands

```bash
npm run dev       # local development
npm run lint      # ESLint
npm run typecheck # TypeScript
npm run build     # production build
npm run validate  # lint + typecheck + build
````

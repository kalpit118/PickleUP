# System Architecture

## Architecture Goal

Keep the system close to ₹0, portable, easy to maintain, and capable of surviving long periods of inactivity.

## High-Level Architecture

```text
                         GitHub
                           |
                           v
                    React + TypeScript
                           |
                     Responsive PWA
                           |
                    Cloudflare Pages
                           |
                           v
                      Supabase
             +-------------+-------------+
             |             |             |
           Auth        PostgreSQL     Storage
                           |
                     Application Data
                           |
                +----------+----------+
                |                     |
          Backup A                Backup B
          Local PC               Cloud Drive
```

## Frontend

React + TypeScript + Vite.

Use responsive components so the same application works on desktop and mobile. Use PWA capabilities for installation and offline-friendly shell behavior.

## Backend/Data Layer

Start with Supabase because it provides PostgreSQL, authentication, storage, APIs, and realtime capabilities without requiring a custom server for the MVP.

Application code should isolate database operations behind service/repository modules so Supabase can later be replaced without rewriting the UI.

Example:

```text
src/
  components/
  pages/
  services/
    auth.ts
    players.ts
    matches.ts
    tournaments.ts
    friends.ts
    analytics.ts
  lib/
    supabase.ts
```

## Hosting

Cloudflare Pages can host the frontend. The GitHub repository remains the source of truth for the application code.

## Portability Requirement

Do not scatter Supabase queries throughout UI components. Centralize database access in service modules.

The database must remain standard PostgreSQL where practical.

## Failure/Recovery Model

If the live Supabase project becomes unavailable:

1. Create or restore a PostgreSQL/Supabase project.
2. Restore the latest SQL backup.
3. Reconfigure environment variables.
4. Redeploy the frontend.

The product must not depend on an unrecoverable provider-specific data format.

# Free / Near-Zero-Cost Infrastructure Plan

## Objective

Keep the project at approximately ₹0 during development and early adoption while minimizing vendor lock-in and protecting data.

## Recommended Services

| Area | Service | Purpose |
|---|---|---|
| Source code | GitHub | Code and version control |
| Frontend | Cloudflare Pages | Static frontend/PWA hosting |
| Database | Supabase PostgreSQL | Primary application database |
| Authentication | Supabase Auth | Login/session management |
| Storage | Supabase Storage initially | Avatars and small assets |
| Backups | Local + cloud drive | Independent database backups |
| Domain | None initially | Use free hosting subdomain |

## Cost Strategy

Do not buy a domain, paid hosting, Apple Developer membership, Google Play membership, paid email/SMS provider, or paid API until the product needs it.

## Data Safety Strategy

Supabase is the live database, not the only copy of the data.

Maintain periodic PostgreSQL backups outside Supabase.

Suggested structure:

```text
backups/
  2026/
    2026-09-23.sql
    2026-10-23.sql
```

Keep at least two independent backup locations where practical.

## Inactivity Strategy

The application must remain recoverable even if the free database project is paused or a hosting provider changes its free-tier policy.

Recovery requirements:

- Source code exists in GitHub.
- Environment configuration is documented.
- Database backup exists outside the live provider.
- Database schema/migrations are version controlled.
- Deployment instructions are documented.

## Avoid Early Dependencies

Do not make the core product dependent on paid:

- SMS
- transactional email
- AI APIs
- maps APIs
- payment gateways
- proprietary analytics platforms

Use browser-native or free alternatives wherever reasonable.

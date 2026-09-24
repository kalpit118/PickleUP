# Security and Data Safety

## Authentication

Use Supabase Auth. Never store passwords in the application database yourself.

## Authorization

Use PostgreSQL Row Level Security (RLS) for user-owned data.

Examples:

- A user can edit their own profile.
- Only authorized users can modify a game they created.
- Match results cannot be silently changed after verification.
- Tournament organizers can manage their tournaments.
- Public tournament pages expose only intentionally public data.

## Match Integrity

Maintain a result state machine:

```text
DRAFT
  ↓
SUBMITTED
  ↓
CONFIRMED
  ↓
VERIFIED
```

Possible alternate state:

```text
SUBMITTED → DISPUTED
```

Do not update official player statistics from unverified results.

## Secrets

Never commit:

- Supabase service-role keys
- private API keys
- database passwords
- production credentials

Only public client-side configuration intended by the provider should be included in the frontend.

## Backups

Database backups must not be stored in the public Git repository.

## Data Portability

Maintain schema migrations and backup/restore documentation in the repository so the database can be recreated on another PostgreSQL provider.

Invitations migration and API

- Migration: `data/migrations/2025_10_21_create_invitations_table.sql` creates the `invitations` table with `sent_at`, `token`, and `created_at`.
- API route: `src/app/api/invite/route.ts` implements an endpoint to create or resend invitations.

Usage
- POST /api/invite with JSON { "email": "user@example.com", "role": "user" }
- The endpoint will upsert an invitation and will only re-send if `sent_at` is older than the configured TTL (24 hours by default).

Notes
- The actual email sending is currently a stub (`sendInviteEmail`). Replace it with your email provider (SendGrid, SES, etc.) and use environment variables for keys.
- Run the SQL migration against your Supabase/Postgres instance before using the API.

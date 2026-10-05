# Database security tests

These SQL checks are intentionally read-only and are meant for a privileged Supabase SQL Editor session after migrations are applied. They verify RLS is enabled and that browser roles have no direct data privileges on sensitive tables.

The Vitest tests live separately because they exercise shared TypeScript validation code rather than live database permissions.

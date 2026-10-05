# Privacy model

CalmCompanion V1 is designed so partially completed sensitive intake content remains local until explicit submission.

## Local draft

The draft contains only the questionnaire version, answers, current step, and timestamp. It is stored with localStorage. localStorage is not a secure vault, so the application does not describe it as encrypted or as equivalent to a password manager.

## Network behavior

No incomplete draft is sent to Supabase.

Only an explicit completed submission is sent to `/api/intake`.

## Analytics

Analytics is behavioral only. The allowlist prevents intake answer objects and common sensitive fields from reaching persistence.

## Server secrets

`SUPABASE_SECRET_KEY` is imported only by server-only code and is never exposed to client components.

## Regulatory wording

This implementation does not claim HIPAA, GDPR, Indian DPDP Act, or other regulatory compliance. Final legal/compliance status depends on the real deployment, organization, contracts, policies, retention rules, access controls, and jurisdiction-specific requirements.

# CalmCompanion architecture

## Public journey

`app/page.tsx` is the V1 public entry point. It resolves the Ayushi therapist profile server-side, then renders the client-side journey in `components/intake-form.tsx`.

The UI state is kept in memory during the journey. Incomplete answers are persisted only to localStorage under:

```text
calmcompanion:intake:v1:ayushi-pushkarna
```

## Questionnaire engine

The questionnaire definition lives outside the UI:

```text
config/questionnaires/intake.ts
lib/questionnaire/types.ts
lib/questionnaire/engine.ts
```

The engine knows about question types, visibility conditions, and validation. It does not contain therapist-specific UI assumptions.

## Submission boundary

The browser sends a single completed payload to:

```text
POST /api/intake
```

The route:

1. checks same-origin requests
2. enforces a request-size cap
3. validates the payload shape
4. validates question IDs and answer value types
5. re-validates the questionnaire using the same configuration
6. resolves the active therapist/questionnaire/version in Supabase
7. creates a server-side UUID
8. persists the submission and response rows

The browser never receives the Supabase secret key.

## Supabase model

```text
therapists
  └── therapist_profiles
  └── questionnaires
        └── questionnaire_versions
              └── submissions
                    └── responses
```

Every submission references a specific questionnaire version so historical records remain interpretable after future edits.

## Therapist access

V1 uses Supabase Auth for a small therapist-only viewing page. The signed-in Auth UUID must match `therapists.auth_user_id`.

The therapist page reads submissions server-side through the secret key after verifying the Auth token with `getClaims()`.

## Analytics

The browser sends only allowlisted behavioral metadata to `/api/analytics`. The analytics table has no response fields and is inaccessible directly to `anon` or `authenticated` roles.

# CalmCompanion

CalmCompanion is a warm, privacy-conscious intake experience for mental-health professionals. V1 provides a focused public intake journey for **Ayushi Pushkarna — Mental Health Professional**, while keeping the questionnaire engine, database model, and therapist identity model ready for future therapist-specific intake forms.

## What the application does

The public journey is deliberately simple:

**Splash → Introduction → About Ayushi → Begin → Multi-step intake → Review → Submit → Confirmation**

Incomplete answers are stored locally on the user's device. They are not sent to Supabase until the user explicitly submits the completed intake.

## Technology

- Next.js 16.3.x (App Router)
- React 19.2
- TypeScript
- Tailwind CSS
- shadcn/ui-style component primitives
- Supabase
- Vercel

Next.js 16.3.8 is pinned because it is the current active-LTS security patch line as of this release package. Next.js 16 uses `proxy.ts` instead of the older `middleware.ts` convention.

Supabase's current documentation uses `NEXT_PUBLIC_SUPABASE_URL` plus `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for browser/SSR clients and recommends secret keys for trusted server-side work.

## Features

- Warm, calm, human-first UX
- Mobile-first layout from 320px upward
- Multi-step intake with accessible validation
- Configuration-driven questionnaire engine
- Conditional questions
- Required/optional fields and field-specific validation
- Local draft persistence without account creation
- UUID-based submissions
- Exact questionnaire-version references for historical consistency
- Secure server-side Supabase submission boundary
- Privacy-conscious behavioral analytics with an explicit allowlist
- Basic authenticated therapist submission view
- Future-ready therapist/questionnaire data model

## Project structure

```text
calmcompanion/
├── app/
│   ├── api/
│   │   ├── analytics/        # Server-side analytics ingestion
│   │   └── intake/           # Secure intake submission endpoint
│   ├── therapist/             # Basic authenticated therapist view
│   ├── error.tsx
│   ├── globals.css
│   ├── layout.tsx
│   ├── not-found.tsx
│   └── page.tsx               # V1 public Ayushi journey
├── components/
│   ├── ui/                    # shadcn-style primitives
│   ├── intake-form.tsx        # Journey + questionnaire UI
│   └── sign-out-button.tsx
├── config/
│   ├── therapists/            # Therapist-specific presentation/config
│   └── questionnaires/        # Questionnaire configurations
├── lib/
│   ├── analytics/              # Privacy-filtered analytics
│   ├── questionnaire/          # Generic questionnaire engine
│   ├── supabase/               # Browser/server/admin clients
│   ├── intake-server.ts        # Server validation + persistence
│   └── public-profile.ts       # Public therapist profile lookup
├── public/
├── supabase/
│   ├── migrations/             # Core schema, analytics, initial seed
│   ├── seed/
│   └── tests/
├── .env.example
├── .gitignore
├── SUPABASE_SETUP.md
├── VERCEL_DEPLOYMENT.md
└── TESTING_CHECKLIST.md
```

## Local development

### 1. Install Node.js

Use Node.js 20.9+; Node.js 22 is the recommended local version for this release.

### 2. Install dependencies

From the repository root:

```bash
npm install
```

### 3. Configure environment variables

Copy `.env.example` to `.env.local` and fill the three values described below.

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
SUPABASE_SECRET_KEY=your_supabase_secret_key
```

The first two are browser-safe Supabase configuration values. `SUPABASE_SECRET_KEY` is server-only and must never be renamed with a `NEXT_PUBLIC_` prefix. Supabase currently distinguishes publishable keys for public clients from secret keys for trusted server code.

### 4. Start the app

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

The public page can render the bundled V1 Ayushi fallback profile even before Supabase is configured. Final submission, analytics persistence, and therapist viewing require the Supabase server configuration.

## Environment variables

| Variable | Exposure | Required | Purpose |
|---|---|---:|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public | Yes for therapist auth | Supabase publishable key used by browser/SSR auth clients |
| `SUPABASE_SECRET_KEY` | Server-only | Yes for submission/analytics/profile DB | Elevated server credential; never sent to the browser |

## Supabase setup

Follow [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md). It uses the actual migrations and schema in this repository rather than a generic example.

The database contains:

- `therapists`
- `therapist_profiles`
- `questionnaires`
- `questionnaire_versions`
- `submissions`
- `responses`
- `analytics_events`

The first three migration files are applied in timestamp order. Historical submissions point to the exact questionnaire version used at submission time.

## Vercel deployment

Follow [`VERCEL_DEPLOYMENT.md`](./VERCEL_DEPLOYMENT.md). Vercel detects Next.js automatically; no special `vercel.json` file is required for the default deployment path.

## Privacy and security

This project is designed to minimize data exposure, but it is **not a declaration of regulatory compliance**. Compliance depends on the final operating environment, policies, data-retention rules, contracts, access controls, deployment configuration, and applicable law.

Important implementation guarantees include:

- No incomplete intake is sent to Supabase.
- No intake answers are sent to analytics.
- Sensitive answers are not placed in URLs.
- The Supabase secret key is server-only.
- Sensitive tables are protected with RLS and no anonymous/authenticated table privileges.
- Submission validation is performed again on the server.
- Analytics accepts only an explicit behavioral event schema.

The public analytics endpoint is intentionally non-blocking. In a high-traffic deployment, add platform-level rate limiting/WAF controls rather than relying on process-local counters in serverless functions.

## Testing and release validation

Run:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Or:

```bash
npm run validate
```

Use [`TESTING_CHECKLIST.md`](./TESTING_CHECKLIST.md) for browser/device verification.

## Important V1 limitation

The exact long-form Ayushi bio, specialties, session copy, and professional contact details were not present in the project requirements available to this build. The repository therefore includes neutral, non-invented seed copy and keeps those fields editable in the `therapist_profiles` row. Replace that seed copy with Ayushi's approved wording before public launch.

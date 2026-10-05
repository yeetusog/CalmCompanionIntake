# Supabase setup — CalmCompanion V1

This guide matches the actual repository files and uses Supabase's current publishable/secret key terminology.

## 1. Create the Supabase project

1. Open the Supabase dashboard.
2. Create a new project.
3. Wait for the project to finish provisioning.
4. Open the project **Connect** panel.

Supabase's current Next.js quickstart uses the project URL and **publishable key** for the public/SSR client.

## 2. Copy the Project URL

From the Supabase Connect panel copy **Project URL**.

Put it in your local `.env.local` as:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
```

Example format only:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
```

Do not copy a dashboard URL. The value must be the project's API/Project URL.

## 3. Copy the publishable client key

In the Supabase Connect panel, choose the Next.js/JavaScript connection information and copy the **Publishable key**.

Put it in:

```env
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

The publishable key is allowed in public/browser code; database access is still controlled by your Supabase permissions and RLS.

## 4. Copy the server-only secret key

Open **Settings → API Keys** and use the **Secret key** for trusted server-side access.

Put it in:

```env
SUPABASE_SECRET_KEY=your_supabase_secret_key
```

Never name it `NEXT_PUBLIC_SUPABASE_SECRET_KEY` and never expose it in client code. Supabase's current guidance maps the older `service_role` concept to secret keys and recommends the new naming going forward.

If an older project only exposes the legacy `service_role` key, that legacy value can be used temporarily as the value of `SUPABASE_SECRET_KEY`; the application code still keeps it server-only. Prefer the new secret key for new projects.

## 5. Create `.env.local`

From the repository root:

```bash
cp .env.example .env.local
```

Then fill:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
SUPABASE_SECRET_KEY=your_supabase_secret_key
```

## 6. Apply the database migrations

There are three migrations and they must be applied in this order:

```text
supabase/migrations/20261003000000_core_schema.sql
supabase/migrations/20261003000100_product_analytics.sql
supabase/migrations/20261003000200_seed_ayushi.sql
```

### Option A — Supabase CLI

Install the Supabase CLI using the official method for your operating system, then:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

`YOUR_PROJECT_REF` is the short project reference shown in the Supabase project URL, for example `abcdefg` in `https://abcdefg.supabase.co`.

Because the migrations are timestamped, `supabase db push` applies them in order.

### Option B — SQL Editor

In Supabase:

**SQL Editor → New query**

Paste and run the entire contents of:

1. `supabase/migrations/20261003000000_core_schema.sql`
2. `supabase/migrations/20261003000100_product_analytics.sql`
3. `supabase/migrations/20261003000200_seed_ayushi.sql`

Run each file as a separate SQL Editor query, in that order.

## 7. Verify the tables

Open **Table Editor**. You should see:

- `therapists`
- `therapist_profiles`
- `questionnaires`
- `questionnaire_versions`
- `submissions`
- `responses`
- `analytics_events`

## 8. Verify RLS and browser permissions

The core migration enables RLS on all application tables. It also revokes direct privileges from `anon` and `authenticated` on the sensitive intake tables.

Run `supabase/tests/security.sql` in a privileged SQL session to inspect the resulting state.

Expected security posture:

- anonymous clients cannot read submissions
- anonymous clients cannot insert submissions directly
- browser-authenticated users cannot read responses directly
- anonymous clients cannot insert analytics directly
- trusted server code uses the secret key

## 9. Create the initial Ayushi therapist record

The seed migration automatically creates:

```text
name: Ayushi Pushkarna
slug: ayushi-pushkarna
status: active
```

No guessed personal email or contact information is inserted.

## 10. Configure Ayushi's approved profile copy

Open `public.therapist_profiles` in Table Editor and update the row for Ayushi.

Set the final approved values for:

- `display_name`
- `introduction`
- `specialties`
- `session_details`
- `contact_details`
- `visual_config`

The public V1 application reads these values server-side.

## 11. Create the therapist Auth user

Open:

**Authentication → Users → Add user**

Create Ayushi's professional login account with a strong password.

After the user is created, copy the new **User UID**.

The application does not store the password in the `therapists` table.

## 12. Link the Auth user to Ayushi

In SQL Editor run:

```sql
update public.therapists
set
  auth_user_id = 'PASTE_AUTH_USER_UUID_HERE',
  email = 'AYUSHI_PROFESSIONAL_EMAIL_HERE',
  updated_at = now()
where slug = 'ayushi-pushkarna';
```

Replace the placeholders with the real Supabase Auth UUID and approved professional email.

The UUID must be the Auth user's UID, not an email address.

## 13. Create the initial questionnaire

The seed migration creates:

```text
questionnaire slug: intake
name: CalmCompanion Intake
status: active
```

The configuration stored in `questionnaire_versions.schema` mirrors `config/questionnaires/intake.ts`.

## 14. Publish questionnaire version 1

The seed migration creates and publishes version 1 automatically:

```text
version: 1
published_at: <migration timestamp>
```

Verify with:

```sql
select q.slug, q.status, v.version, v.published_at
from public.questionnaires q
join public.questionnaire_versions v on v.questionnaire_id = q.id
where q.slug = 'intake'
order by v.version;
```

Do not change the version number for an existing historical questionnaire. Create a new version when questionnaire structure changes.

## 15. Start the Next.js app

From the repository root:

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

## 16. Test a submission

Complete the full intake with test data.

Important: do not use a real patient's sensitive information for testing.

Confirm:

- every required field validates
- diagnosis details appear only after `Yes`
- previous therapy experience appears only after `Yes`
- refresh restores the local draft
- clearing the draft removes it locally
- review/edit works
- submit displays confirmation

## 17. Confirm the submission in Supabase

In Table Editor:

1. Open `submissions`.
2. Find the newly created UUID.
3. Confirm `status = submitted`.
4. Confirm `therapist_id`, `questionnaire_id`, and `questionnaire_version_id` are populated.
5. Open `responses`.
6. Confirm each answer row references the same `submission_id`.

## 18. Verify therapist viewing

Open:

```text
http://localhost:3000/therapist/login
```

Sign in with the Supabase Auth user.

The app then verifies that the signed-in user's Auth UUID matches `therapists.auth_user_id` before reading submissions through the server-only Supabase secret key.

## 19. Verify analytics

After using the public flow, inspect `analytics_events`.

You should see only allowlisted behavioral metadata such as:

- event name
- session UUID
- therapist/questionnaire slugs
- step identifiers/indexes
- duration/error metadata

You should **not** see intake answers, name, email, phone, diagnosis, medication, therapy history, location, or other free text.

## 20. Configure Vercel

In Vercel, create a project from the GitHub repository and add the same three environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
SUPABASE_SECRET_KEY=your_supabase_secret_key
```

Apply them to the environments you use for the deployment, normally Preview and Production as appropriate.

## 21. Redeploy

After adding or changing environment variables, redeploy the project so the deployment uses the new values.

## 22. Production smoke test

Open the production URL and test:

1. splash
2. introduction
3. Ayushi profile
4. intake
5. conditional questions
6. review
7. submit
8. therapist login
9. Supabase submission
10. analytics event row

Use the manual checklist in `TESTING_CHECKLIST.md`.

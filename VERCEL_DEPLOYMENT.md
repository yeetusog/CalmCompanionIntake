# Vercel deployment — CalmCompanion V1

## 1. Push the repository to GitHub

From the extracted project directory:

```bash
git init
git add .
git commit -m "Initial CalmCompanion release"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

Do not commit `.env.local`. The repository's `.gitignore` excludes local environment files while keeping `.env.example`.

## 2. Import the repository into Vercel

1. Sign in to Vercel.
2. Choose **Add New → Project**.
3. Import the GitHub repository.
4. Let Vercel detect the framework as **Next.js**.

The application uses the App Router and requires no custom Vercel server configuration.

## 3. Project settings

The standard settings are sufficient:

```text
Framework Preset: Next.js
Build Command: npm run build
Install Command: npm install
Output Directory: automatic
```

There is no `vercel.json` requirement in this repository.

## 4. Add environment variables

In Vercel:

**Project → Settings → Environment Variables**

Add:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
SUPABASE_SECRET_KEY=your_supabase_secret_key
```

Use the real values from Supabase. The first two are public client configuration; the final value is a server-only secret.

Apply the variables to Preview and Production according to your deployment workflow.

## 5. Deploy

Click **Deploy**.

After the build finishes, open the generated deployment URL.

## 6. Test the public flow

Run the entire sequence:

```text
Splash
→ Introduction
→ About Ayushi
→ Begin
→ Form
→ Review
→ Submit
→ Confirmation
```

## 7. Confirm Supabase persistence

Check:

- `submissions`
- `responses`
- `questionnaire_versions`

The response rows must reference the completed submission UUID.

## 8. Confirm therapist access

Open:

```text
https://YOUR_DOMAIN/therapist/login
```

Sign in with the Supabase Auth credentials for the therapist whose `auth_user_id` is linked to the `therapists` row.

The protected page reads intake data only through the server-side secret-key client.

## 9. Confirm analytics

Use one test session and confirm `analytics_events` receives behavioral events.

Do not expect analytics to block submission: the analytics route intentionally fails open from the user's perspective, while logging only safe diagnostic metadata.

## 10. Re-deploy after environment changes

Vercel environment variables are applied to deployments. After changing them, create a new deployment/redeploy.

## Troubleshooting

### Public page says the intake is unavailable

Check:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- the Ayushi row exists
- `therapists.status = 'active'`

The repository also contains a local fallback profile for development when server Supabase configuration is absent.

### Submission returns a server error

Check:

- `SUPABASE_SECRET_KEY` is present in the deployment
- migrations were applied
- Ayushi therapist exists and is active
- `questionnaires.slug = 'intake'` and status is active
- version 1 has a non-null `published_at`
- browser request is being sent from the same origin

### Therapist login works but access is not linked

Check:

```sql
select id, slug, auth_user_id, status
from public.therapists
where slug = 'ayushi-pushkarna';
```

The `auth_user_id` must match the Supabase Auth user's UID.

### Analytics rows are missing

Analytics is intentionally non-blocking. Check:

- `SUPABASE_SECRET_KEY`
- the `analytics_events` migration
- Vercel function logs for `analytics_persistence_failed`

### Do not add the secret key to `NEXT_PUBLIC_*`

If a secret is accidentally added to a `NEXT_PUBLIC_` variable, remove it from Vercel and rotate the secret in Supabase. The browser must never receive it.

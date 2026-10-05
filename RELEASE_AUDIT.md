# CalmCompanion release audit

## Implemented

- Next.js App Router with TypeScript
- Tailwind CSS + shadcn-style component primitives
- V1 Ayushi public intake journey
- Configuration-driven questionnaire model
- 16 configured V1 questions with stable IDs
- Conditional rendering for diagnosis and previous therapy follow-ups
- Client-side and server-side required/format/value validation
- Local-only draft persistence until explicit submission
- Secure server-only Supabase submission boundary
- UUID submission IDs and historical questionnaire-version references
- RLS enabled on application and analytics tables
- No direct browser access to submissions/responses/analytics tables
- Supabase Auth-protected therapist view
- Privacy-conscious analytics allowlist and 8 KiB analytics body cap
- Mobile safe-area support and responsive layouts
- Reduced-motion support and focus management
- Required setup/deployment/testing documentation

## Packaging/static audit completed

- Required repository files present
- Local `@/` import targets checked structurally
- Questionnaire seed JSON parsed and checked
- Questionnaire condition definitions checked
- Supabase RLS/privilege invariants checked
- Public-secret environment naming checked
- No real `.env` files present
- No `node_modules`, `.next`, build output, or coverage directories present
- Required release documentation present

## Executable validation limitation

The packaging environment cannot resolve the npm registry (`registry.npmjs.org`), so dependency installation could not complete. Consequently, the following commands could not be truthfully certified in this environment:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

The source was statically audited and known code-level defects found during that audit were corrected, but this is **not a successful production-build certification**.

After extraction, run:

```bash
npm install
npm run validate
```

and resolve any environment-specific dependency/toolchain issue before deployment if one appears.

## Content limitation

The exact approved long-form Ayushi biography, specialties, session copy, and professional contact details were not available in the provided requirements. Neutral seed copy is included so the application remains functional without inventing credentials or contact information. Replace those fields with approved copy before public launch.

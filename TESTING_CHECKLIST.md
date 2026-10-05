# CalmCompanion final manual testing checklist

## Landing

- [ ] Splash loads
- [ ] Logo typography looks correct
- [ ] Animation works
- [ ] Reduced motion works

## Introduction

- [ ] Introduction loads
- [ ] About Ayushi loads
- [ ] Contact information/placeholder section is present
- [ ] Begin intake works

## Form

- [ ] All V1 questions appear
- [ ] Required validation works
- [ ] Optional questions work
- [ ] Conditional diagnosis question works
- [ ] Conditional previous therapy question works
- [ ] Email validation works
- [ ] Phone validation works
- [ ] Age validation works
- [ ] Long text inputs remain usable

## Navigation

- [ ] Next works
- [ ] Back works
- [ ] Answers persist while navigating
- [ ] Review works
- [ ] Edit works
- [ ] Returning from review with validation errors works

## Local Save

- [ ] Refresh restores draft
- [ ] Closing/reopening browser restores draft where local storage permits
- [ ] Draft can be cleared
- [ ] Conditional answers are cleared when their condition is no longer true
- [ ] No incomplete draft is sent to Supabase

## Submission

- [ ] Submission succeeds
- [ ] UUID is generated server-side
- [ ] Supabase receives the submission
- [ ] Responses are correctly associated
- [ ] Questionnaire version is recorded
- [ ] Submission confirmation is shown
- [ ] Local draft is cleared after success

## Security

- [ ] No service/secret key appears in browser source or network payloads
- [ ] RLS is enabled on all intake tables
- [ ] Sensitive data is absent from analytics payloads
- [ ] Sensitive data is absent from URLs
- [ ] Secrets are absent from Git
- [ ] Anonymous clients cannot read submissions
- [ ] Anonymous clients cannot directly insert submissions
- [ ] Authenticated users cannot directly read responses through Supabase table access
- [ ] Therapist access is authenticated and linked by Auth UUID

## Analytics

- [ ] splash_viewed recorded
- [ ] introduction_viewed recorded
- [ ] intake_started recorded
- [ ] step_viewed recorded
- [ ] step_completed recorded
- [ ] validation_error recorded when validation fails
- [ ] draft_restored recorded when a saved draft is restored
- [ ] draft_cleared recorded when draft is cleared
- [ ] review_viewed recorded
- [ ] submission_started recorded
- [ ] submission_completed recorded
- [ ] submission_failed recorded on simulated failure
- [ ] intake_abandoned recorded on real page exit during an active intake
- [ ] Analytics does not contain answers

## Mobile

- [ ] 320px viewport
- [ ] 375px viewport
- [ ] 390px viewport
- [ ] 430px viewport
- [ ] No horizontal overflow
- [ ] Keyboard does not permanently obscure bottom navigation
- [ ] Touch targets are comfortable
- [ ] Safe-area inset behaves correctly on supported devices
- [ ] Long questions wrap cleanly
- [ ] Long answers scroll correctly
- [ ] Review screen remains readable
- [ ] Submission state remains reachable

## Desktop

- [ ] Laptop
- [ ] Desktop
- [ ] Wide desktop
- [ ] Form remains centered and readable
- [ ] No excessive stretching on wide displays

## Accessibility

- [ ] Keyboard-only navigation works
- [ ] Visible focus states are present
- [ ] Labels are associated with controls
- [ ] Choice controls are keyboard accessible
- [ ] Validation errors are announced/readable
- [ ] Focus moves to the new step heading
- [ ] Contrast is readable
- [ ] Reduced motion is respected
- [ ] Screen reader walkthrough is usable

## Build validation

Run:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

- [ ] TypeScript passes
- [ ] ESLint passes
- [ ] Unit tests pass
- [ ] Production build passes

## Release hygiene

- [ ] No `.env.local` in repository
- [ ] No `node_modules/`
- [ ] No `.next/`
- [ ] No debug logs except intentionally safe diagnostics
- [ ] No screenshots or temporary files
- [ ] No real patient/test data
- [ ] ZIP contains only release files

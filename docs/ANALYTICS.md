# Privacy-conscious analytics

CalmCompanion analytics measures interaction with the intake experience rather than collecting intake content.

## Allowed events

```text
splash_viewed
introduction_viewed
intake_started
step_viewed
step_completed
validation_error
draft_restored
draft_cleared
review_viewed
submission_started
submission_completed
submission_failed
intake_abandoned
```

## Persisted metadata

Only allowlisted behavioral metadata is accepted:

- event name
- anonymous session UUID
- therapist slug
- questionnaire slug/version
- stable non-sensitive step ID/index/count
- bounded duration
- bounded validation error category/count
- timestamp

## Explicitly prohibited

Analytics code has no schema field or accepted payload property for:

- name
- email
- phone
- diagnosis
- medication
- therapy history
- location
- free-text answers
- the complete answer map

The browser sends analytics to `POST /api/analytics`; it does not write directly to the Supabase analytics table.

Analytics failures are intentionally non-blocking so a telemetry outage cannot prevent an intake submission.

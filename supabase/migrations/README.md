# Migration order

Apply these files in timestamp order:

1. `20261003000000_core_schema.sql`
2. `20261003000100_product_analytics.sql`
3. `20261003000200_seed_ayushi.sql`

The seed creates the V1 Ayushi therapist, profile, active questionnaire, and published questionnaire version. It intentionally leaves `auth_user_id` unset until the Supabase Auth user is created.

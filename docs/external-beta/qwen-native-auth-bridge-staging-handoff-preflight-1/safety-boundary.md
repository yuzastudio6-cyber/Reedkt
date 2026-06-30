# Safety Boundary

Allowed in this packet:

- Cloud Build for the merged staging API source.
- Cloud Run service update for `reeditpro-staging-api`.
- Secret-level IAM grant for `SUPABASE_ANON_KEY` to `reeditpro-stg-api-sa@reeditpro.iam.gserviceaccount.com`.
- Secret payload access in a temporary local runner for `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `REEDITPRO_STAGING_BETA_OPERATOR_EMAIL`, and `REEDITPRO_STAGING_BETA_OPERATOR_PASSWORD`.
- Supabase Auth token request for the staged tester account.
- Cloud Run identity token fetch for the private staging route call.
- One bounded route invocation of `POST /api/providers/qwen2-5-vl/structured-visual-metadata`.

Not allowed and not performed:

- QWEN provider/model execution.
- Worker dispatch or worker execution.
- Cloud Run job execution.
- Supabase mutation or SQL execution.
- Media processing.
- Signed/public artifact creation.
- Credit mutation.
- Stripe checkout/webhook/payment processing.
- Final render/export.
- Broad external beta, paid production, or production unlock.

No token value, secret value, Supabase URL, database URL, private media, generated asset, signed URL, or public artifact was committed.

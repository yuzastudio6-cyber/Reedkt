# QWEN Staging API Route Deployment Alignment Runtime Boundary

This phase aligned the deployed staging API route surface only.

Allowed in this phase:

- Confirmed Cloud Build for `Dockerfile.backend`.
- Confirmed Cloud Run image-only update for `reeditpro-staging-api`.
- Cloud Run service metadata readback for `reeditpro-staging-api` and `reeditpro-qwen2-5-vl-l4-worker`.
- Identity token fetch in memory for bounded Cloud Run invocation.
- One bounded structured-metadata-only POST to the staging API route after each image update.

Not allowed and not performed:

- QWEN2.5-VL execution.
- Provider call.
- Model call.
- Worker execution.
- Worker dispatch.
- Service-role route execution.
- Supabase mutation.
- SQL execution.
- Secret Manager payload access.
- Signed URL creation.
- Public artifact creation.
- Generated asset creation.
- Credit mutation.
- Stripe checkout/webhook/payment processing.
- Broad external beta audience unlock.
- Paid production unlock.
- Production unlock.
- Raw prompt execution.
- Final render/export.
- Private media processing.
- User media processing.
- Remotion execution.
- Dependency mutation.
- Package-lock mutation.
- Dockerfile install-source change.
- Requirements install-source change.
- IAM mutation.
- Group membership mutation.
- Broad service-role handler.

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, QWEN2.5-VL execution, worker execution, worker dispatch, service-role route execution, browser capture, signed URL creation, public artifact creation, generated asset creation, credit mutation, Stripe checkout/webhook/payment processing, broad external beta audience unlock, paid production unlock, production unlock, raw prompt execution, final render/export, private media processing, user media processing, Remotion execution, dependency mutation, package-lock mutation, Dockerfile install-source change, requirements install-source change, IAM mutation, group membership mutation, or broad service-role handler was enabled. This phase performed confirmed Cloud Build, confirmed image-only Cloud Run staging API updates, and bounded route transport preflight only.

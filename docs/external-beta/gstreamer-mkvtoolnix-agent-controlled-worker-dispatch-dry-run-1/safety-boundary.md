# Safety Boundary

This phase is a metadata-only controlled worker dispatch dry run.

Allowed:

- Validate the accepted controlled worker queue metadata from PR #1902.
- Create a local mock dispatch dry-run envelope.
- Preserve idempotency, approved snapshot, approval record, no-spend/credit policy, job, lease, private manifest, output manifest, QA, cleanup, retention, failure, retry, audit, and non-public artifact references.
- Write sanitized local `/tmp` report files and commit only summaries/checksums.

Not allowed:

- Route execution.
- Worker dispatch.
- Worker execution.
- Worker lease claim.
- GStreamer execution.
- MKVToolNix execution.
- FFmpeg/FFprobe execution.
- Docker execution.
- Remotion execution.
- Media processing.
- Persistent queue write.
- Supabase mutation.
- SQL execution.
- Secret payload access.
- Provider/model call.
- Signed/public artifact creation.
- External beta expansion unlock.
- Paid production unlock.
- Production unlock.
- Final render/export.

GStreamer execution in this dispatch dry run: `false`

MKVToolNix execution in this dispatch dry run: `false`

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, worker dispatch, worker lease claim, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, private media processing, user media processing, GStreamer execution, MKVToolNix execution, FFmpeg/FFprobe execution, Docker execution, Remotion execution, package installation, dependency mutation, persistent job queue write, or broad service-role handler was enabled.

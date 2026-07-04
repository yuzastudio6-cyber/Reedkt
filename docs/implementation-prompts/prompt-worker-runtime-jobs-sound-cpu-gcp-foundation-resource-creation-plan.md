# WORKER_RUNTIME_JOBS-SOUND-CPU-GCP-FOUNDATION-RESOURCE-CREATION-PLAN: create missing SOUND CPU GCP foundation resources safely, no Cloud Run execution

Repository: `yuzastudio6-cyber/Reedkt`

Goal:
Create the next implementation packet or controlled execution gate to close the live Google Cloud foundation blockers found by `worker_runtime_jobs_sound_cpu_read_only_gcp_preflight_completed_with_blockers_ready_for_foundation_resource_creation_plan`.

Source evidence:
- PR #2406 is merged at `7adc9e38fbb5e38c72184837b9e5ceee9d696c2c`.
- The 15 SOUND CPU tools are mapped to CPU-only Cloud Run Job templates.
- Read-only GCP preflight found project `reeditpro` active, Artifact Registry repo `reeditpro-workers` present in `us-central1`, and core APIs enabled for Artifact Registry, Cloud Build, Resource Manager, IAM, Cloud Run, and Secret Manager.
- Read-only GCP preflight also found:
  - project environment tag missing or unverified
  - `containerscanning.googleapis.com` not enabled
  - `reeditpro-cpu-worker-sa@reeditpro.iam.gserviceaccount.com` missing
  - `reeditpro-sound-cpu-analysis-worker` image missing
  - `reeditpro-sound-audio-metadata-worker` image missing
  - both SOUND CPU Cloud Run Jobs missing

Required decision:
- Prefer the smallest proper GCP mutation path that follows existing repo scripts and avoids broad unrelated resource creation.
- If the existing production service-account script would create broader resources than needed, split or add a SOUND CPU focused script before execution.
- Do not deploy or execute Cloud Run Jobs in the same step as service-account/foundation creation unless a later prompt explicitly authorizes that exact action.

Allowed next planning/mutation targets:
- Project environment tag fix or verification.
- Container scanning API enablement decision.
- Least-privilege CPU worker service account creation.
- Minimal IAM roles required for a future disabled SOUND CPU Cloud Run Job deployment.

Still prohibited until later gates:
- Docker build, Docker push, Docker run.
- Cloud Run deployment or execution.
- Worker/route/tool runtime execution.
- Media processing, Supabase/SQL, Secret Manager value writes, artifacts, signed URLs, external beta unlock, production unlock.

Supabase classification:
update required `no`; environment touched `no`; SQL executed `no`; migration deployed `no`; next action `none`.

No Supabase mutation, SQL execution, Secret Manager value write, provider call, model call, worker execution, route execution, browser capture, Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, or broad service-role handler may be enabled. Google Cloud mutation must be limited to the explicitly reviewed foundation-resource action in the next gate.

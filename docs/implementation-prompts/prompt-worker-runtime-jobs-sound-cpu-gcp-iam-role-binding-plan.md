# WORKER_RUNTIME_JOBS-SOUND-CPU-GCP-IAM-ROLE-BINDING-PLAN: bind minimal SOUND CPU worker IAM roles, no Cloud Run execution

Repository: `yuzastudio6-cyber/Reedkt`

Goal:
Create the next controlled gate for the SOUND CPU worker service account created by `worker_runtime_jobs_sound_cpu_gcp_foundation_resource_creation_result_completed_with_blockers_ready_for_iam_role_binding_plan`.

Source evidence:
- PR #2408 is merged at `85c5ce26093a52e2751d7da47f4d52c2ae5f2aec`.
- The CPU worker service account now exists:
  `reeditpro-cpu-worker-sa@reeditpro.iam.gserviceaccount.com`.
- The service account currently has no project-level IAM roles bound.
- SOUND CPU images and Cloud Run Jobs are still absent.

Required decision:
- Inspect existing repo IAM scripts and owner-lane docs before choosing roles.
- Prefer least-privilege IAM for future disabled SOUND CPU Cloud Run Job deployment and controlled no-media proof.
- If a repo script would grant unrelated storage, Secret Manager, broad service-role, media, Supabase, or production permissions, do not run it as-is; split or document a narrower step.

Allowed next targets:
- Minimal project-level logging/monitoring or execution-support roles if required by existing repo policy.
- Artifact Registry or Cloud Run permissions only if required for the next image/deploy gate and narrowly scoped.
- Documentation and diagnostics that record role bindings and remaining blockers.

Still prohibited until later gates:
- Docker build, Docker push, Docker run.
- Cloud Run deployment or execution.
- Worker/route/tool runtime execution.
- Media processing, Supabase/SQL, Secret Manager value writes, artifacts, signed URLs, external beta unlock, production unlock.

Supabase classification:
update required `no`; environment touched `no`; SQL executed `no`; migration deployed `no`; next action `none`.

No Supabase mutation, SQL execution, Secret Manager value write, provider call, model call, worker execution, route execution, browser capture, Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, or broad service-role handler may be enabled. Google Cloud mutation must be limited to explicitly reviewed IAM role binding for the SOUND CPU worker service account.

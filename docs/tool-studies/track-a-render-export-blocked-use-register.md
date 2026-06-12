# TRACK_A_RENDER_EXPORT Blocked-Use Register

Every item in this register remains blocked in TOOL-STUDY-0.

| Blocked Use | Status | Reason | Required Future Approval |
| --- | --- | --- | --- |
| Real final render/export | blocked | This packet is docs/diagnostics only. | Track A render/export execution milestone plus Worker Runtime approval. |
| Real preview render execution | blocked | Private preview is a planning/review contract only. | Controlled private preview execution packet. |
| Real FFmpeg execution | blocked | FFmpeg remains worker/runtime-only and is not invoked. | FFmpeg runtime, license, sandbox, and worker approval. |
| Real Remotion execution | blocked | Remotion remains a future compositor/runtime path. | Remotion runtime, dependency, worker, and QA approval. |
| libass caption burn-in execution | blocked | Caption burn-in is policy-only here. | Caption render worker approval. |
| OpenTimelineIO interchange execution | blocked | Interchange is a future handoff concept only. | Render/export interop milestone. |
| Worker Runtime execution | blocked | WORKER-1 proved deterministic dry-run planning only. | Transactional claim/lease backend runtime approval. |
| Provider/model execution | blocked | Provider outputs are proposal/spec evidence only. | Explicit provider execution phase. |
| Tool execution | blocked | TOOL-STUDY-0 defines routing only. | TOOL-ROUTE controlled dry-run and execution approvals. |
| Route execution | blocked | No route is enabled by this study. | TOOL-ROUTE-1 or later approved route plan. |
| Raw media processing | blocked | Track B owns future media analysis/runtime. | TRACK_B owner study and controlled runtime approval. |
| Public artifact delivery | blocked | Artifacts remain private by default. | Delivery/access-control policy and compliance approval. |
| Signed URLs as source-of-truth | blocked | Signed URLs may expire and expose delivery concerns. | Separate delivery-only policy if ever approved. |
| Raw prompt execution | blocked | Workers must execute approved snapshots and manifests, not raw prompts. | None; raw prompt execution remains disallowed. |
| Broad media processing | blocked | No broad media scope is approved. | Owner-specific controlled media runtime approval. |
| Production unlock | blocked | This packet cannot approve production. | Production readiness and compliance gates. |
| External beta unlock | blocked | This packet cannot approve external beta. | External beta readiness gate. |
| Internal beta unlock | blocked | Track A runtime and owner studies remain incomplete. | Internal beta gate after owner reviews. |
| Paid production unlock | blocked | Billing/export production paths are not in scope. | Billing/credits/export production approval. |
| Unapproved dependency mutation | blocked | No packages are added or installed by this study. | Dependency/security/license approval. |
| Supabase mutation | blocked | No writer exists or is added. | Explicit Supabase owner path. |
| Credit/billing mutation | blocked | Billing is outside Track A study scope. | Billing/Stripe/credits milestone. |

## Safety Decision

This blocked-use register is intentionally conservative. Safety language that says a path is blocked must not be interpreted as readiness to execute it.

## No-Scope Statement

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.

# TRACK_B_MEDIA_PROCESSING Internal Beta Gap Map

Status: `ready_for_TOOL_ROUTE_1_route_dry_run_planning_after_owner_review`

| Area | Current Status | Evidence Exists | Evidence Missing | Before Internal Beta | Can Wait Until External Beta | Must Wait Until Production |
| --- | --- | --- | --- | --- | --- | --- |
| Owner routing contract | ready | yes | owner review | Review in TOOL-ROUTE-1 planning. | N/A | N/A |
| OCR/text-in-frame planning | ready-with-warnings | prior restricted OCR evidence | runtime approval and model policy | Define fixture/schema gates only. | Controlled OCR runtime review. | Production OCR privacy/model/license hardening. |
| Frame/image analysis planning | ready-with-warnings | Track B capability/readiness docs | OpenCV runtime approval | Define safe-zone and derivative schemas. | Controlled frame-analysis fixture. | Production native dependency sandbox. |
| Scene/shot planning | ready-with-warnings | route-manifest metadata | PyAV/PySceneDetect runtime approval | Define candidate manifest schema. | Controlled scene fixture. | Production media sandbox/SLO. |
| Media metadata planning | ready-with-warnings | route manifest, metadata dry-run evidence | broad media scope | Keep metadata-only. | Controlled metadata route. | Production storage/retention policy. |
| Image derivative planning | ready-with-warnings | Sharp/libvips candidate docs | dependency/security approval | Define derivative policy only. | Controlled derivative fixture. | Production untrusted image handling. |
| Audio cleanup planning | ready-with-warnings | DeepFilterNet bounded evidence | runtime rerun approval | Sound handoff and QA policy. | Controlled audio cleanup route. | Production audio QA/SLO. |
| Time-stretch planning | ready-with-warnings | Signalsmith bounded evidence | runtime rerun approval | Track A/Sound handoff policy. | Controlled stretch fixture. | Production audio quality benchmarks. |
| DuckDB/Polars metadata planning | ready-with-warnings | metadata route evidence | runtime approval | Keep sanitized metadata only. | Controlled table route. | Production memory/isolation controls. |
| Private artifact manifest policy | ready-with-warnings | route-manifest policy | storage/Supabase writer | Keep private refs/checksums policy. | Artifact-scope dry-run. | Production retention/access-control. |
| Demucs stem separation | blocked | provenance/blocker records | human/legal/model approval | Keep blocked. | Legal/provenance review. | Production model/runtime governance. |
| Qwen3-VL / VLM | blocked | VLM blocker records | provider/model/runtime approval | Keep blocked. | Separate VLM approval. | Production model privacy/SLO. |
| vLLM serving | blocked | serving blocker records | GPU/runtime/security approval | Keep blocked. | Serving architecture review. | Production model-serving SLO/security. |
| Worker Runtime execution | blocked | WORKER-1 dry-run evidence | transactional runtime approval | TOOL-ROUTE planning only. | Controlled runtime execution. | Production backend runtime. |
| Supabase milestone sync | blocked | base absence recorded | sync layer absent | No Track B Supabase action. | Separate Supabase owner path. | Production metadata policy. |

## Decision

TOOL-ROUTE-1 readiness: `ready_for_TOOL_ROUTE_1_route_dry_run_planning_after_owner_review`.

Internal beta is not unlocked by this packet. Track B runtime, media processing, VLM, Demucs, public artifacts, signed URL delivery, billing, Supabase mutation, and production remain blocked.

## No-Scope Statement

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.

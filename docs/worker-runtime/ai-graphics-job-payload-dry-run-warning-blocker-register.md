# AI Graphics Job Payload Dry-Run QA Warning Blocker Register

Decision: `worker_ai_graphics_metadata_job_payload_dry_run_qa_passed_with_warnings`

| Item | Status | Notes |
| --- | --- | --- |
| Draft stack | `warning` | PR #500 remains draft/open, so this QA remains accepted with warnings. |
| Scoped pass claim | `accepted_with_warnings` | Only `workerAiGraphicsMetadataJobPayloadDryRunPassed` is accepted. |
| Generic pass claims | `blocked` | `genericDryRunPassedClaimed`, `dryRunPassedClaimed`, and `generatedLocalFixturePassedClaimed` remain false. |
| Worker execution | `blocked` | No live worker execution is approved. |
| Job claim and lease mutation | `blocked` | Claim and lease refs remain placeholders only. |
| Queue execution | `blocked` | Queue refs remain placeholders only. |
| Route/tool/provider runtime | `blocked` | Metadata dry-run QA does not approve runtime execution. |
| Browser/WebGL/canvas/resvg/Remotion | `blocked` | Visual/runtime/render paths remain separately gated. |
| Supabase/GCS/public/signed URL paths | `blocked` | Supabase remains `no write` / `docs_only`; public and signed artifact paths remain blocked. |
| Beta/production | `blocked` | Internal beta, external beta, paid production, and production remain blocked. |

No worker execution, job claim, lease mutation, queue execution, route execution, actual tool execution, provider/model runtime, browser/WebGL/canvas runtime, resvg rasterization, Remotion render/export, Supabase mutation, SQL execution, GCS/storage transfer, signed URL creation, public artifact creation, raw prompt execution, internal beta unlock, external beta unlock, production unlock, or broad service-role handler was enabled.

# RP-RENDER-01 Remotion Render Worker Scaffold Matrix

Every row returns `disabled_pending_remotion_render_worker_runtime_gate`. No row dispatches workers, executes Remotion, renders previews, renders exports, runs FFmpeg/FFprobe, processes media, writes storage, creates signed URLs, creates public artifacts, mutates Supabase, or unlocks beta.

| Operation | Scaffold function | Approved plan | Credit reservation | Job id | Manifest | QA report | Cleanup | Idempotency | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `render_worker_plan_read` | `readInternalBetaRenderWorkerPlanScaffold` | required | required | not_required | not_required | not_required | not_required | not_required | `disabled_pending_remotion_render_worker_runtime_gate` |
| `render_worker_preflight` | `preflightInternalBetaRenderWorkerScaffold` | required | required | required | required | not_required | required | required | `disabled_pending_remotion_render_worker_runtime_gate` |
| `render_worker_job_prepare` | `prepareInternalBetaRenderWorkerJobScaffold` | required | required | required | required | not_required | required | required | `disabled_pending_remotion_render_worker_runtime_gate` |
| `render_worker_manifest_expectation` | `expectInternalBetaRenderWorkerArtifactManifestScaffold` | required | required | required | required | not_required | not_required | required | `disabled_pending_remotion_render_worker_runtime_gate` |
| `render_worker_qa_gate_prepare` | `prepareInternalBetaRenderWorkerQaGateScaffold` | required | required | required | required | required | not_required | required | `disabled_pending_remotion_render_worker_runtime_gate` |
| `render_worker_cleanup_policy_prepare` | `prepareInternalBetaRenderWorkerCleanupPolicyScaffold` | required | not_required | required | required | not_required | required | required | `disabled_pending_remotion_render_worker_runtime_gate` |
| `render_worker_status_readback` | `readInternalBetaRenderWorkerStatusScaffold` | not_required | not_required | required | not_required | not_required | not_required | not_required | `disabled_pending_remotion_render_worker_runtime_gate` |
| `render_worker_failure_classify` | `classifyInternalBetaRenderWorkerFailureScaffold` | required | required | required | not_required | not_required | not_required | required | `disabled_pending_remotion_render_worker_runtime_gate` |

## Runtime State

Render worker job prepared: `false`

Worker dispatch executed: `false`

Worker execution: `false`

Remotion execution: `false`

FFmpeg execution: `false`

FFprobe execution: `false`

Media processing: `false`

Render/export execution: `false`

Preview artifact creation: `false`

Final export creation: `false`

Storage write: `false`

Storage read: `false`

Signed URL creation: `false`

Public artifact creation: `false`

Route execution: `false`

Credit mutation: `false`

Supabase mutation: `false`

Provider/model calls: `false`

Internal beta unlock: `false`

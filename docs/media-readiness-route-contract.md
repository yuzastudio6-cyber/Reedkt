# Media Readiness Route Contract

Prompt 9 routes expose readiness boundaries only. They must not process media, create jobs, claim workers, call providers, render, execute tools, mutate credits, or mutate approved snapshots.

| Route ID | Method/path | Purpose | Auth/project access | Tables touched | Service role | Idempotency | Forbidden side effects | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `media.readiness.check` | `POST /v1/media/readiness` | Check media/storage/source/transcript/timing readiness. | Required | `projects`, `workspace_members`, `media_assets`, `storage_object_records`, `uploaded_clips`, `source_sequence_items` | Required for persisted reads | No | Media/tool/job execution | `backend_required` |
| `media.source.get` | `GET /v1/media-sources/:mediaAssetId` | Read sanitized source media metadata. | Required | `media_assets`, `storage_object_records` | Required | No | Storage download, analysis | `backend_required` |
| `media.source.listForProject` | `GET /v1/projects/:projectId/media-sources` | List project media sources. | Required | `media_assets` | Required | No | Storage download, analysis | `backend_required` |
| `media.sourceSequence.readiness` | `POST /v1/projects/:projectId/source-sequence/readiness` | Check source order readiness. | Required | `uploaded_clips`, `source_sequence_items` | Required | No | Source order mutation, planning | `backend_required` |
| `media.probe.readiness` | `POST /v1/media/probe/readiness` | Check probe prerequisites. | Required | `media_assets`, `storage_object_records` | Required | No | FFmpeg/ffprobe execution, job creation | `backend_required` |
| `media.probe.request` | `POST /v1/media/probe/request` | Validate future probe request boundary. | Required | `media_assets`, `storage_object_records`, `api_idempotency_keys` | Required | Yes | Job creation, worker execution, ffprobe | `backend_required` |
| `media.probe.result.get` | `GET /v1/media/probe-results/:mediaAssetId` | Return probe result placeholder. | Required | `media_assets`, `storage_object_records` | Required | No | Probe result mutation | `backend_required` |
| `media.transcript.readiness` | `POST /v1/media/transcript/readiness` | Check transcript readiness. | Required | `media_assets`, `storage_object_records` | Required | No | AI transcription, alignment | `backend_required` |
| `media.transcript.placeholder.get` | `GET /v1/media/transcript-placeholder/:mediaAssetId` | Return transcript placeholder. | Required | `media_assets` | Required | No | Transcription | `backend_required` |
| `media.visualObservation.readiness` | `POST /v1/media/visual-observation/readiness` | Check visual observation readiness. | Required | `media_assets`, `storage_object_records` | Required | No | OCR/VLM/object/face analysis | `backend_required` |
| `media.audioObservation.readiness` | `POST /v1/media/audio-observation/readiness` | Check audio observation readiness. | Required | `media_assets`, `storage_object_records` | Required | No | Audio analysis | `backend_required` |
| `timing.seed.readiness` | `POST /v1/timing/seed/readiness` | Check timing seed prerequisites. | Required | `media_assets`, `master_timing_maps` reference only | Required | No | Timing persistence, render | `backend_required` |
| `timing.seed.placeholder.get` | `GET /v1/timing/seed-placeholder/:projectId` | Return timing placeholder. | Required | `projects` | Required | No | Timing persistence | `backend_required` |
| `timing.validation.readiness` | `POST /v1/timing/validation/readiness` | Check timing validation readiness. | Required | `media_assets`, `master_timing_maps` reference only | Required | No | Frame-accurate validation execution | `backend_required` |

All responses use the safe API envelope plus `MediaReadinessResult`.

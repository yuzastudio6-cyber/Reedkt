# Backend and Worker Architecture

Caption Direction extends the approved-snapshot work graph; it does not run heavy work in the frontend.

## Proposed service boundaries

| Service | Responsibility |
| --- | --- |
| Caption strategy service | Compile approved intent, skill selection, transcript summary, preferences, and reference DNA into strategy/opportunities/reservations |
| Transcript authority service | Resolve immutable transcript/projection/lineage records |
| Caption finish-readiness service | Verify picture lock and dependency versions |
| Caption choreography service | Produce validated semantic/style/scene-graph proposals |
| Caption timing adapter | Register requirements and consume final StoryTiming frames |
| Caption sound handoff service | Build motion-locked cue intent for SoundSync |
| Caption render coordinator | Build deterministic render specs and worker dependencies |
| Caption QA/repair service | Aggregate evidence, propose scoped repair, and gate delivery |

These services use authenticated tenant scope, exact plan/snapshot IDs, idempotency keys, safe DTOs, and audited private records. Durable production writes require route-specific atomic boundaries; the generic idempotency path remains fail-closed.

## Work graph

```text
canonical transcript ─┬─> strategy/opportunity/reservation
                      └─> alignment/diarization review

approved main edit -> PictureLockManifest
  -> final visual proxy
  -> occupancy/OCR/mask/anchor evidence
  -> CaptionFinishReadiness
  -> semantic/layout proposal + deterministic validation
  -> StoryTiming resolution
  -> CaptionMotionLock
  -> caption sound plan -> SoundSync mix
  -> font preparation
  -> Remotion creative render
  -> SRT/WebVTT/ASS/libass outputs
  -> FFmpeg package
  -> independent caption/render/export QA
  -> delivery readiness
```

Independent branches continue when safe. A missing required mask blocks only depth-dependent scenes; it does not stop stable subtitle generation. Final export waits for all required artifacts and QA.

## Worker assignment

- `gpu_ai_worker`: qualified speech alignment/diarization or approved visual-model inference.
- `cpu_analysis_worker`: OCR, frame/occupancy analysis, font parsing/subsetting, deterministic text layout support.
- `render_worker`: pinned Remotion/Chromium creative renders, libass stable renders, FFmpeg packaging.
- `qa_worker`: independent frame/audio/text/export checks.
- `tool_readiness_worker`: version/import/capability checks only.
- `api_service`: approval/credit gates, authorization, job dispatch, signed access, safe status.

## Artifacts

Every transcript, alignment, occupancy manifest, mask, font subset, scene graph, render spec, caption track, audio cue, render, QA report, and delivery file enters the asset manifest with project/snapshot/scene/timing/renderer lineage and immutable storage identity.

## Security boundary

Workers receive IDs and canonical private object references, not secrets, raw chat, persistent signed URLs, or arbitrary executable code. Service-role/provider credentials remain backend-only. Production deployment remains blocked pending canonical tenancy, worker identity, storage/IAM, tool/model/license, and live security evidence.

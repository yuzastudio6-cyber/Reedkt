# Edit Reference Live Study Closure

Status: `passed_local_partial_external_blockers`

Gate 8.1 connects private reference video bytes to the existing upload, media, skill, evidence, DNA, and QA boundaries.

```text
private upload intent/finalization
→ canonical storage object + media asset IDs
→ FFprobe media structure
→ FFmpeg audio extraction and bounded representative-frame plan
→ ephemeral artifact cleanup
→ structured skill runs and evidence
→ separately labelled unavailable semantic specialists
→ manual/deterministic fallback evidence
→ copy-safety review
→ Preference DNA synthesis
→ DNA QA and explicit approval
```

## Verified Local Work

- `edit_reference.media_structure.metadata_map`: `verified_local`; FFprobe verifies duration, dimensions, streams, and audio presence.
- `edit_reference.media_structure.representative_frame_plan`: `verified_local`; FFmpeg prepares at most four representative frames and optional audio inside an OS temporary directory.
- Temporary media outputs are recursively deleted before the result is committed.
- Persisted evidence contains timing/count/provenance only—never raw pixels, local paths, signed URLs, or process output.
- The reference asset records `media_studied_local_partial`, canonical storage/media IDs, representative-frame count, and retry blocker when applicable.

## Truthful Partial State

Representative frames are not semantic visual findings. Visual-language Qwen analysis, story reasoning, OCR/caption timing, histogram/color study, transcript/alignment, semantic audio/SFX analysis, and graphics/motion understanding each emit a separate `degraded` or `blocked` skill run with an exact blocker. User-described evidence may provide a separately labelled fallback; it is never reported as live or local semantic analysis.

`retryBlockedSkills` allows a partial study to rerun unavailable capabilities while no DNA version has been created. It does not bypass version or evidence gates.

## Privacy And Safety

- Browser code receives upload targets but persists only canonical private IDs in study evidence.
- No frontend credentials or provider payloads exist.
- No raw frames are persisted by default.
- No signed URL or filesystem path is a source of truth.
- Provider/model/worker flags remain false.
- Reference footage is never attached to a target edit.

Behavior proof: `npm run smoke:edit-reference-gate-8-1-closure` and the controlled-video Playwright journey.

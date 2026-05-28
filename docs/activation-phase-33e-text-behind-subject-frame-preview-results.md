# Phase 33E Text-Behind-Subject Frame Preview Results

Status: complete for one controlled single-frame text-behind-subject preview.

## Source

- Run ID: `phase33e-20260528T165755`
- Source Phase 33D run: `phase33d-20260528T161056`
- Representative frame: `gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase33d/phase33d-20260528T161056/representative-frame/frame.png`
- Mask: `gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase33d/phase33d-20260528T161056/mask/mask.png`
- RGBA cutout: `gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase33d/phase33d-20260528T161056/cutout/cutout.png`

## Text Layer

- Text content: `REEDITPRO`
- Sanitized text: `REEDITPRO`
- Font fallback: `DejaVu Sans Bold`
- Font file: `/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf`
- Font size: `270`
- Placement: `center_upper_mid`
- Position: `x=254`, `y=1306`, `width=1652`, `height=311`
- Estimated subject occlusion ratio: `0.6538`
- Layer order: `background_frame -> text_layer -> foreground_cutout`

## Depth Composition

- Manifest: `gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase33e/phase33e-20260528T165755/manifests/depth-composition-manifest.json`
- Render mode: `single_frame_preview_only`
- FFmpeg single-frame composition: true
- Remotion used: false
- Revideo used: false
- Final render allowed: false
- Video render allowed: false

## Preview

- Preview object: `gs://reeditpro-staging-reeditpro-previews/activation-real-video/phase33e/phase33e-20260528T165755/text-behind-subject-preview.png`
- Preview dimensions: `2160x3840`
- Preview size: `5,736,959` bytes
- Render job execution: `reeditpro-staging-render-job-mb424`
- Render image digest: `sha256:2c98ed1117d76779e8b06e29063168ea73a7e8ff4b730cc15d2c12e47d4eaafd`

## QA Summary

- `mask_edge_quality`: passed from Phase 33D upstream QA
- `mask_subject_coverage`: passed from Phase 33D upstream QA
- `render_asset_integrity`: passed
- `text_readability`: passed
- `text_safe_zone`: warning-only; deterministic placement was used and no face/OCR analysis ran
- `text_behind_subject_composition`: passed
- `final_delivery`: not applicable
- QA status: warning-only
- Blocking failures: none

## Private Artifacts

- Text layer plan: `gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase33e/phase33e-20260528T165755/plans/text-layer-plan.json`
- Depth composition manifest: `gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase33e/phase33e-20260528T165755/manifests/depth-composition-manifest.json`
- Preview PNG: `gs://reeditpro-staging-reeditpro-previews/activation-real-video/phase33e/phase33e-20260528T165755/text-behind-subject-preview.png`
- QA report: `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-real-video/phase33e/phase33e-20260528T165755/qa/text-behind-subject-frame-qa.json`
- Phase 33E report: `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-real-video/phase33e/phase33e-20260528T165755/reports/phase33e-report.json`

## Warnings

- Phase 33E does not validate temporal text-behind-subject behavior.
- Full-video text-behind-subject remains blocked.
- Phase 33E composed one PNG only; no video render/export was attempted.
- Pre-existing project legacy owner/editor storage bindings and non-admin staging grants were observed; Phase 33E did not create them and added only conditional prefix-scoped render-service-account IAM.

## Blockers

- None for the controlled Phase 33E single-frame preview.

## Phase 34 Readiness

Phase 34 is ready for the next controlled activation phase only because the
private Phase 33E preview PNG, depth composition manifest, and QA report exist
with no blocking failures.

Phase 34 readiness is not approval for full-video text-behind-subject,
production, external beta, broad real media, public delivery, SAM2, GPU, model
downloads, providers, or Revideo.

## Launch Gates

- `productionReadyAllowed=false`
- `externalBetaAllowed=false`
- `broadRealUserMediaAllowed=false`
- `fullVideoTextBehindSubjectAllowed=false`

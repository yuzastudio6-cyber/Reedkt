# Phase 35E Segment Text-Behind-Subject Preview Results

Status: completed.

Phase 35E is locked to the approved Phase 35D run
`phase35d-20260530T004442`. The selected segment is 6.9s-8.9s, 2.0 seconds,
10 frames at 768x432, using the fixed text `REEDITPRO`.

Run ID: `phase35e-20260530T01355`

Composition method: native Node PNG alpha compositor. It used the Phase 35D
frame manifest and mask metadata as source of truth. The Phase 35D frame object
names differed from the prompt examples, so Phase 35E used the manifest-backed
frame paths `frame-001.png` through `frame-010.png` and mask paths
`frame-000-mask.png` through `frame-009-mask.png`.

Text style and placement:

- Text: `REEDITPRO`
- Renderer: built-in deterministic block font
- Position: `x=66`, `y=78`, `width=636`, `height=84`
- Layer order: source frame, text layer, subject from Phase 35D SAM2 mask
- Preview clip: not generated; local FFmpeg was unavailable and preview frames
  are the Phase 35E source of truth

Private artifacts:

- Preview frames:
  `gs://reeditpro-staging-reeditpro-previews/activation-real-video/phase35e/phase35e-20260530T01355/preview-frames/`
- Composition manifest:
  `gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase35e/phase35e-20260530T01355/composition/composition-manifest.json`
- Source frame/mask map:
  `gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase35e/phase35e-20260530T01355/metadata/source-frame-mask-map.json`
- Text style metadata:
  `gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase35e/phase35e-20260530T01355/metadata/text-style.json`
- QA report:
  `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-real-video/phase35e/phase35e-20260530T01355/qa/segment-text-behind-subject-qa.json`
- Phase 35E report:
  `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-real-video/phase35e/phase35e-20260530T01355/reports/phase35e-report.json`

QA summary:

- `source_integrity`: passed
- `segment_bounds`: passed
- `mask_integrity`: passed
- `composition_artifacts`: passed
- `behind_subject_effect`: warning, human visual review still recommended
- `temporal_preview_consistency`: warning, edge/flicker review still recommended
- `artifact_privacy`: passed
- `blocked_features`: passed

Blockers: none.

Warnings:

- Subjective visual quality and edge flicker remain warning-only until human
  review.
- Preview clip generation was omitted because local FFmpeg is unavailable;
  private preview frames are the controlled Phase 35E output.

Phase36A readiness: ready for audio AI approval workflow only.

Production, external beta, paid production, broad real media, full-video masks,
full-video text-behind-subject, final export, providers, Revideo, FILM, and slow
motion remain blocked.

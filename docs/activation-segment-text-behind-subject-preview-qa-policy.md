# Phase 35E Segment Text-Behind-Subject QA Policy

Required QA gates:

- `source_integrity`: approved Phase 35D run, manifests, frames, masks, and QA only
- `segment_bounds`: 2.0s, 10 frames, 768x432, no full-video frame set
- `mask_integrity`: masks exist, decode, are non-empty, and match frames
- `composition_artifacts`: all private preview frames and metadata exist
- `behind_subject_effect`: text is behind the subject mask; visual quality is warning-only pending review
- `temporal_preview_consistency`: stable text placement, no missing frames; flicker review is warning-only
- `artifact_privacy`: outputs remain private with no public or signed URL path
- `blocked_features`: no full-video mask/text-behind-subject, final export, providers, Revideo, FILM, slow motion, production, beta, or broad media

Phase 36A readiness is limited to the next audio AI approval workflow. Phase
35E does not approve full-video text-behind-subject, production, beta, or broad
real media.

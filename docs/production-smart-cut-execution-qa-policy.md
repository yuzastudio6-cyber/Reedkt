# Production Smart Cut Execution QA Policy

M14 emits deterministic QA gates for smart cut and timeline execution:

- `cut_smoothness`;
- `transcript_alignment`;
- `audio_sync` placeholder;
- `render_timeline_integrity`;
- `export_duration_sync` for preview-only duration checks;
- `final_delivery`, which must not pass in M14.

QA blocks or warns on negative timestamps, end-before-start ranges, overlapping keep/remove segments, mid-word cuts, protected segment removal, repeated-take removal without a keeper, missing transcript/caption refs, preview failure, and final export attempts.

Meaning preservation and emotional pause policy remain conservative: risky cuts require review or a future approved plan revision.

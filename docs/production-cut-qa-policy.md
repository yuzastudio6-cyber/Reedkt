# Production Cut QA Policy

Milestone 8 cut QA is deterministic and conservative.

## Gates

- `cut_smoothness`: checks invalid ranges, overlapping keep/remove ranges, mid-word boundaries, protected segment overlap, and cut boundary warnings.
- `transcript_alignment`: checks that transcript evidence is present or warns when smart cut planning is conservative.
- `audio_sync`: placeholder gate for future audio pop/crossfade validation.
- `render_timeline_integrity`: checks that timeline duration and clip ranges are valid before any future render/export path.

Blocking cut QA must prevent preview/render/export in later milestones. Milestone 8 only records gates and never performs final media operations.

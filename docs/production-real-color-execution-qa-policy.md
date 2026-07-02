# Production Real Color Execution QA Policy

M15B emits four required color QA gates:

- `color_exposure`: highlight, shadow, washed-out, and crushed-black risk;
- `color_skin_tone`: skin tone and conservative correction warnings;
- `color_export_space`: output color-space assumptions, LUT safety, HDR warnings, and final-export exclusion;
- `color_shot_match`: cross-shot/reference continuity.

Blocking issues prevent preview readiness and always block future final export. Final export remains out of scope for M15B.

# Production Enhancement Sample First Policy

Enhancement starts with bounded samples, not full-clip processing. M15D selects representative frames or short clip samples, requires before/after QA metadata, and records private sample artifacts before any future full enhancement path.

Reject conditions include plastic skin, oversharpening, texture artifacts, flicker risk, hallucinated detail, and no measurable improvement. If no source quality issue or approved request exists, the plan may recommend no enhancement.

`targetScale` defaults to `2`, warns above `2`, and blocks above `4`. Target resolution must stay within a 4x pixel-area increase in M15D.

# Production Enhancement Slowmotion QA Policy

M15D emits `enhancement_artifacts`, `slow_motion_artifacts`, and `render_asset_integrity` gates.

Enhancement QA checks sample-first compliance, artifact existence or planned private refs, oversharpening, plastic/fake skin, texture artifacts, flicker risk, hallucinated detail, and final-render exclusion.

Slow-motion QA checks selected clip ranges, slow-motion factor policy, ghosting, warped faces/people, duplicated objects, motion trails, artifact presence, and final-render exclusion. Blocking QA prevents preview and always blocks future final export.

# Edit Level QA Gates

RP-EDITLEVEL-08 adds mock/local level-aware QA gate policy for `normal | premium | ultra_premium`.

This milestone defines QA gate policy only. It does not execute QA tools, call Qwen 3.7, call Qwen2.5-VL, call DeepSeek, call providers, run planners, create edit plans, start media workers, render, export, use Supabase, read uploaded file bytes, fetch external URLs, reserve credits, or spend credits.

## Product Levels

- Normal: baseline QA for a clean professional edit.
- Premium: stronger creative QA for polish, markers, B-roll timing, captions, audio guidance, Preference DNA, and plan completeness.
- Ultra Premium: studio-level strict QA with deeper safety, source, visual, story, style, design, render, revision, and credit readiness policy.

Runtime `basic | pro | premium` behavior remains unchanged. Canonical product levels stay mapped only through the existing compatibility boundary.

## Policy Boundary

Every package exposes `mockOnly: true` and false flags for provider, Qwen, Qwen2.5-VL, DeepSeek, planner, edit plan, media worker, render, credit, file-byte, and external-fetch side effects.

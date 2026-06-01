# Phase 39C-Q-SO2 Text-Only Harness Policy

Text-only structured-output proof runs before image fixtures.

Schemas:

- `T0`: enum smoke represented as a tiny JSON object with `decision`
- `T1`: status/confidence/reason JSON object
- `T2`: compact VLM QA schema without image input

The harness uses generated synthetic text prompts only. It does not process media and does not complete Phase 39C-Q-SO2 by itself.

If T0/T1 fail for all candidates and structured-output APIs are available, SO2 classifies the blocker as runtime/backend compatibility and should not spend L4 time on all generated image fixtures. If T0/T1 pass, SO2 may escalate to one generated image smoke and then all required generated fixtures.

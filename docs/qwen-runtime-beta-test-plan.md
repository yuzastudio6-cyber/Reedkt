# Qwen Runtime Beta Test Plan

Required local checks for RP-QWEN-BETA-01:

- `npm run smoke:qwen-runtime-beta`
- `npm run smoke:qwen-marker-chat-bridge`
- `npm run smoke:qwen-secret-manager-runtime`
- `npm run check:qwen-secret-leakage`
- `npm run smoke:qwen-runtime-boundary`
- `npm run check:qwen-runtime-boundary`
- `npm run smoke:qwen-runtime-readiness-audit`
- `npm run smoke:model-routing`
- `npm run smoke:provider-config`
- `npm run smoke:reasoning-agent`
- Edit Brief smokes through Marker Chat, QA, Plan, and E2E.
- `npm run build`
- `npm run lint`
- `npm run check:frontend-boundary`

Every report must preserve: no secret values printed, no frontend secrets, no direct `gcloud` command, no Supabase command, no migration, no render, no workers, no credits, and production ready: false.

If beta config is absent, `smoke:qwen-secret-manager-runtime` reports a safe blocked state. That is expected unless the owner intentionally sets beta runtime gates for a backend-only environment.

Boundary phrase: Qwen 3.7 beta is backend-only, uses Secret Manager, keeps deterministic fallback, no render, no workers, no credits, and production ready: false.

## RP-QWENVL-BETA-01 Visual Context Checks

Add `npm run smoke:qwen25vl-runtime`, `npm run smoke:project-edit-brief-visual-context`, `node scripts/qwen25vl-beta-doctor.mjs`, and `tests/e2e/project-edit-brief-visual-context.spec.ts` for the Qwen2.5-VL visual-context beta path. These checks verify dedicated Qwen2.5-VL config, sampled-frame boundaries, deterministic fallback, fake beta mode, structured visual response validation, marker metadata summary persistence, and no raw frame persistence.

Qwen 3.7 remains the Marker Chat reasoning brain. The visual-context beta must not send raw video/audio or sampled frame payloads into Qwen 3.7 prompts; it only displays visual availability/fallback status in this milestone.

## RP-MEDIA-01 Test Boundary

When testing browser-local source video preview alongside Qwen beta surfaces, keep the paths separate. The source video object URL, browser file handle, and raw media bytes must not enter Qwen requests. `npm run smoke:project-source-video-brief-playback` and `tests/e2e/project-source-video-brief-playback.spec.ts` verify local playback without Qwen, Qwen2.5-VL, providers, workers, render/export, credits, Supabase commands, or migrations.

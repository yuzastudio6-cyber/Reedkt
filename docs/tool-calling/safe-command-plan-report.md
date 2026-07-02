# Safe Command Plan Report

## Branch State

This report covers `REEDITPRO-TOOL-CALLING-SAFE-COMMAND-PLAN-1`, stacked on `codex/reeditpro-tool-calling-adapter-contracts-1`.

The mandatory refresh gate was run before implementation. It reported `continueAllowed: true` with warnings for the existing unstaged `package-lock.json` change and default fetch skip.

## Intent Policies Added

The safe command-plan policy catalog adds 31 planning-only command intent policies for the first adapter contract layer. These policies cover the current four initial pipeline patterns plus initial adapter extras for PyAV, Sharp, PaddleOCR, DeepFilterNet, BiRefNet, SAM2, Real-ESRGAN, FILM, OpenColorIO, OpenImageIO, and FFprobe export validation.

Policies define generic parameter schemas, defaults, resource limits, sandbox constraints, input artifact requirements, output artifact expectations, and validation policy. They do not include raw shell strings, arbitrary args, local output paths, signed URLs, provider secrets, or service-role context.

## Coverage

Safe command plans cover the current selected operations from:

- `raw_footage_to_social_short`
- `captioned_talking_head`
- `smart_cut_basic`
- `final_export_validation`

Pending external tools remain excluded until production registry expansion.

## No-Duplicate Scan

This milestone does not create a duplicate production registry, worker router, QA policy, fallback policy, adapter registry, runtime contract table, tool execution-plan table, or worker job table. Existing execution command builders remain future execution/readiness surfaces and are not imported by this layer.

## Validation

Validation run for the PR:

- `npm run tool-calling:refresh-gate`: passed with warnings for the existing unstaged `package-lock.json` change and default fetch skip.
- `npm run tool-calling:diagnostics`: passed.
- `npm run tool-calling:adapter-contracts`: passed.
- `npm run tool-calling:safe-command-plan`: passed with 31 command intent policies and 37 safe command plans for the four current patterns.
- `npm run smoke:prod-tool-registry`: passed.
- `npm run lint`: passed.
- `git diff --check`: passed.
- `git diff --cached --check`: passed.
- `npm run typecheck:server`: failed due to existing unrelated activation and smoke errors; no failures referenced `server/tool-calling`.

Typecheck failing path groups:

- `server/activation/private-searxng-service/*`
- `server/activation/supabase-milestone-sync/*`
- `server/smoke/*` files for activation, edit-plan, edit-preference, media-asset, model-routing, preference-video, sound-music-audio, source-sequence, and visual-scene smoke tests.

`package-lock.json` remained unstaged with hash `c2c47ecc381a022921b76ab499cf70ba260466ef283046e2d53ac2f2bd255973`.

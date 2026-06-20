# GD-8A resvg Probe Evidence

Prompt: `GD-8A - Creative Graphics resvg Native Runtime Fixes`

Status: `local_darwin_native_blocker`

Production capability enabled: `none; AI Tools creative graphics resvg runtime review only`

## Probe Scripts

- Broader GD-8 import probe with sanitized resvg native diagnostics: `scripts/fixtures/ai-tools/probe-creative-graphics-runtimes.mjs`
- Focused GD-8A import-only native probe: `scripts/fixtures/ai-tools/probe-resvg-native-runtime.mjs`
- Static diagnostic: `scripts/validation/ai-tools-creative-graphics-resvg-runtime-diagnostics.mjs`

## Focused Probe Contract

The focused probe dynamically imports `@resvg/resvg-js` only. It does not pass SVG input, instantiate `Resvg`, rasterize, write generated images, render media, call workers/providers/models, upload, create signed URLs, touch Supabase, run SQL, call Google Cloud, call Secret Manager, or deploy.

Local evidence is written only under `.local-artifacts/ai-tools/gd-8a/<run-id>/resvg-native-probe-report.json`. That path is private, ignored, and uncommitted.

## Current Local Evidence

Expected local result on the current Darwin host:

- Platform: `darwin/arm64`.
- Node: `24.14.0`.
- Package: `@resvg/resvg-js@2.6.2`.
- Native package present: `node_modules/@resvg/resvg-js-darwin-arm64`.
- Import status: `blocked`.
- Error code: `ERR_DLOPEN_FAILED`.
- Error class: `darwin_code_signature_native_binding_load_failure`.
- Classification before CI evidence: `ci_linux_viability_unknown`.
- Broad probe run ID: `gd8-2026-06-09T13-47-11-492Z`.
- Focused probe run ID: `gd8a-2026-06-09T13-47-11-496Z`.
- Focused local evidence path: `.local-artifacts/ai-tools/gd-8a/gd8a-2026-06-09T13-47-11-496Z/resvg-native-probe-report.json`.

The probe output must use package-relative native identifiers and must not print sensitive absolute paths.

## CI Evidence Status

GD-8 GitHub Foundation Validation passed, but it did not run a resvg import probe. GD-8A added the workflow import-only probe. GitHub Foundation Validation run `27211119431`, job `80340139677`, reported focused resvg probe status `passed` on `linux/x64` with native package present and no error code. Overall GD-8A classification is `local_darwin_native_blocker`.

Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`

## GD-7-Retry resvg Outcome

Prompt: `GD-7-Retry`

Status: `generated_local_fixture_partially_passed`

GD-7-Retry preserved the GD-8A resvg classification. The local runner skipped `resvg_js_svg_rasterization` with `local_darwin_native_blocker` and did not create rasterized output.

SVG-only Group A fixture paths proceeded for the importable tools with safe Node handlers. This does not convert Linux import-only evidence into resvg fixture execution.

Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`

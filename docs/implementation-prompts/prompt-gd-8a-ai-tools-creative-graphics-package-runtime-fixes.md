# Prompt GD-8A - Creative Graphics resvg Native Runtime Fixes

Branch: `codex/rp-gd-8a-ai-tools-creative-graphics-package-runtime-fixes`

Base: `origin/codex/rp-gd-8-ai-tools-creative-graphics-package-runtime-enablement`

Production capability enabled: `none; AI Tools creative graphics resvg runtime review only`

## Prompt Intent

GD-8A diagnoses `@resvg/resvg-js@2.6.2` native import/loading for the `resvg_js_svg_rasterization` tool only. It preserves GD-8 package enablement, adds sanitized native import probes, and records whether the blocker is local Darwin-only, CI unknown, or package-wide.

## Implemented Files

- `docs/ai-tools/creative-graphics-resvg-native-runtime-review.md`
- `docs/ai-tools/creative-graphics-resvg-fallback-boundary.md`
- `docs/ai-tools/creative-graphics-gd8a-resvg-probe-evidence.md`
- `docs/prompt-gd-8a-validation-results.md`
- `scripts/fixtures/ai-tools/probe-resvg-native-runtime.mjs`
- `scripts/validation/ai-tools-creative-graphics-resvg-runtime-diagnostics.mjs`

## Required Classification State

Current state before GD-8A CI import evidence: `ci_linux_viability_unknown`.

Allowed final classifications:

- `fixed`
- `local_darwin_native_blocker`
- `ci_linux_viability_unknown`
- `blocked_needs_runtime_review`
- `blocked_needs_package_alternative_review`

GD-8A must keep `generated_local_fixture_not_executed` in every classification. It must not claim rasterization readiness unless the native import passes, and it must still not execute rasterization.

## No-Scope Statement

No fixture generation, no SVG rasterization, no media rendering, no worker/provider/model execution, no browser capture, no media processing, no Docker/Cloud Run, no upload or storage transfer, no signed URL or public artifact creation, no Supabase mutation, no SQL execution, no Google Cloud or Secret Manager access, no dependency addition/replacement, no deployment, no human approval grant, and no beta or production unlock is enabled by GD-8A.

## PR Tracking

PR: [#255](https://github.com/yuzastudio6-cyber/Reedkt/pull/255).

Local validation: passed with expected `ci_linux_viability_unknown` local Darwin resvg import classification.

Local build status: `environment_blocked` by Darwin Rolldown native binding/code-signature failure.

CI status: pending.

Recommended next prompt: `Prompt GD-8B - resvg Alternative Runtime Review` unless the GD-8A Linux CI import probe passes, in which case use `Prompt GD-7-Retry - Creative Graphics Controlled Local Fixture Execution`.

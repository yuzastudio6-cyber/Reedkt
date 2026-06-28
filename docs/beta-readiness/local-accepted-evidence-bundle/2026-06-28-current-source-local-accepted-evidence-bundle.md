# Current-Source Local Accepted Evidence Bundle - 2026-06-28

Decision: `beta_tools_current_source_local_accepted_evidence_bundle_passed_ready_for_deployed_staging_evidence_recording`

This packet records a current-source local no-write evidence bundle for `codex/sound-music-audio-1abc-checkpoint` at `a1943442b794f7ae5216adf501a617a9f4478185`.

The bundle accepted 14 local tools for deployed evidence recording readiness: `ffmpeg`, `ffprobe`, `pyav`, `opentimelineio`, `hyperframe`, `remotion`, `sharp`, `duckdb`, `polars`, `pyscenedetect`, `opencv`, `opencolorio`, `openimageio`, and `libass`.

## Evidence

- The hydrated core Python readiness lane accepted 13 tools after `.reeditpro-tool-readiness-python` was rehydrated with `npm run tools:readiness:install-core-python`.
- The PR #1426 hardening is now part of the accepted source SHA: Python readiness uses one resolved Python command per run, a 45 second bounded timeout, and one retry before classifying a cold import as missing.
- A first local bundle attempt correctly failed closed when the ignored readiness virtualenv had been removed. That guardrail confirms missing local dependencies do not silently count as accepted evidence.
- Libass synthetic burn-in QA passed through the approved local Docker image `us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-libass-burnin-validation:staging-libass-burnin-validation-001` with `--network none`.
- The libass run used synthetic-only input video/captions, safe ASS style, temp-root cleanup, and no private or user media. Output checksum was `301ee872212d00c243c8d220a0552157bdebc7766238cc178353089de6b912a8`, size was `40771` bytes, and duration was `1` second.

## Scoped Blocker Policy

This packet follows the source-truth rule that blockers stop only the unsafe action they protect. The remaining blockers still prevent external beta, real-user-media beta, paid production, provider calls, worker dispatch, Supabase/GCS writes, public artifact delivery, and signed URL delivery.

They do not block the next safe lanes: source-truth review, local no-write preview, deployed evidence preflight, owner approval collection, diagnostics, QA review, and monitoring or rollback planning.

## Boundaries

This packet did not record backend evidence, write Supabase, write GCS, dispatch workers, call providers, process user/private media, create public artifacts, create signed URLs, enable external beta, enable real-user-media beta, enable paid production, or claim all registry tools are product-ready.

Supabase classification remains `no write / environment none / SQL none / migration no`.

## Remaining Gates

- `deployed_core_real_check_evidence_recording_pending`
- `deployed_libass_qa_evidence_recording_pending`
- `platform_billing_deployment_evidence_pending`
- `launch_owner_approval_evidence_pending`
- `final_operator_status_readback_pending`

## Next Safe Actions

1. Run `npm run beta:tools:core-real-check-evidence-preflight`, then `npm run beta:tools:core-real-check-evidence` against deployed staging with source SHA `a1943442b794f7ae5216adf501a617a9f4478185`.
2. Run `npm run beta:tools:libass-synthetic-burnin-qa-evidence-preflight`, then `npm run beta:tools:libass-synthetic-burnin-qa-evidence` against deployed staging using the accepted libass QA inputs.
3. Run `npm run beta:platform:staging-evidence-preflight` only after the remaining owner-side staging API prerequisites are remediated and platform probe inputs exist.
4. Run `npm run beta:readiness:launch-approval-evidence-preflight` after launch owner approvals and evidence notes exist.
5. Rerun `npm run beta:readiness:operator-status-api` after deployed evidence is recorded. Do not enable external beta or production from this local bundle alone.

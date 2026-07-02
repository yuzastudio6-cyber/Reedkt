# Local Accepted Evidence Bundle - 2026-06-27

Decision: `beta_tools_local_accepted_evidence_bundle_passed_ready_for_deployed_staging_evidence_recording`

This packet records a local no-write evidence bundle for the current beta tool lane on `codex/sound-music-audio-1abc-checkpoint` at `5bc6abf0ef238d8038ea0b95877ca06dd73738fc`.

The bundle accepted 14 local tools for deployed evidence recording readiness: `ffmpeg`, `ffprobe`, `pyav`, `opentimelineio`, `hyperframe`, `remotion`, `sharp`, `duckdb`, `polars`, `pyscenedetect`, `opencv`, `opencolorio`, `openimageio`, and `libass`.

## Evidence

- Core Python readiness passed after hydrating `.reeditpro-tool-readiness-python` with `npm run tools:readiness:install-core-python`.
- `npm run smoke:prod-core-python-readiness` passed for PyAV, PySceneDetect, OpenCV, DuckDB, Polars, OpenTimelineIO, OpenColorIO, and OpenImageIO.
- Libass filter proof passed through `docker run --rm --network none` against `us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-libass-burnin-validation:staging-libass-burnin-validation-001`; both `ass` and `subtitles` filters were present.
- Libass synthetic burn-in QA passed with synthetic-only temp video/captions, safe ASS style, one-second output, SHA-256 `301ee872212d00c243c8d220a0552157bdebc7766238cc178353089de6b912a8`, and temp-root cleanup.

## Boundaries

This packet is local source-truth only. It did not record backend evidence, write Supabase, write GCS, dispatch workers, call providers, process user/private media, create public artifacts, create signed URLs, enable external beta, enable real-user-media beta, enable paid production, or claim all registry tools are product-ready.

Supabase classification remains `no write / environment none / SQL none / migration no`.

## Remaining Gates

- `deployed_core_real_check_evidence_recording_pending`
- `deployed_libass_qa_evidence_recording_pending`
- `platform_billing_deployment_evidence_pending`
- `launch_owner_approval_evidence_pending`
- `final_operator_status_readback_pending`

## Next Safe Actions

1. Run `npm run beta:tools:core-real-check-evidence-preflight`, then `npm run beta:tools:core-real-check-evidence` against deployed staging with the same accepted source SHA.
2. Run `npm run beta:tools:libass-synthetic-burnin-qa-evidence-preflight`, then `npm run beta:tools:libass-synthetic-burnin-qa-evidence` against deployed staging.
3. Run `npm run beta:platform:staging-evidence-preflight` after platform owner approvals and staging probe inputs exist.
4. Run `npm run beta:readiness:launch-approval-evidence-preflight` after launch owner approvals and evidence notes exist.
5. Rerun `npm run beta:readiness:operator-status-api` after deployed evidence is recorded. Do not enable external beta or production from this local bundle alone.

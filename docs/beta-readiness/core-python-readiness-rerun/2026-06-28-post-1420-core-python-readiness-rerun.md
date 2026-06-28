# Core Python Readiness Rerun After PR #1420

Decision: `beta_tools_core_python_readiness_rerun_passed_ready_for_current_source_libass_bundle_refresh`.

This packet records a local no-write core readiness rerun on `codex/sound-music-audio-1abc-checkpoint` at `9bda4642fefa82714d30868f1625a6155f3363b3`, after PR #1420 landed the post-foundation owner prerequisite audit result.

## Result

The hydrated core real-check preview accepted 13 current-source local tools:

- `ffmpeg`
- `ffprobe`
- `pyav`
- `opentimelineio`
- `hyperframe`
- `remotion`
- `sharp`
- `duckdb`
- `polars`
- `pyscenedetect`
- `opencv`
- `opencolorio`
- `openimageio`

`libass` remains a separate bounded synthetic subtitle QA lane for this source SHA. The core preview skipped it with `warning_status_not_accepted_by_request`; no product or beta gate is opened by this report.

## Evidence

- `npm ci --no-audit --no-fund --progress=false` passed and did not mutate `package-lock.json`.
- `npm run tools:readiness:install-core-python` hydrated `.reeditpro-tool-readiness-python` from `docker/prod/tool-readiness-worker/requirements.readiness.txt`.
- Direct bounded imports passed for `av`, `scenedetect`, `cv2`, `duckdb`, `polars`, `opentimelineio`, `PyOpenColorIO`, and `OpenImageIO`.
- `npm run smoke:prod-core-python-readiness` passed on immediate rerun after the cold package import attempt. No media files were processed.
- `npm run beta:tools:core-real-check-preview:hydrated` passed with 13 accepted tools and one skipped warning tool.

## Boundaries

This packet is source-truth only. It did not record backend evidence, write Supabase, write GCS, dispatch workers, call providers, run Docker, process user/private media, create public artifacts, create signed URLs, enable external beta, enable real-user-media beta, enable paid production, or increment product-ready local OSS status.

Supabase classification remains `no write / environment none / SQL none / migration no`.

## Safe Forward Progress

This is not a blanket blocker. It only blocks deployed staging evidence recording, external beta, real-user-media beta, and paid production until the remaining evidence gates are complete.

Next safe actions:

1. Refresh the current-source `libass` synthetic burn-in QA or container filter evidence.
2. Rerun `npm run beta:tools:local-accepted-evidence-bundle` at `9bda4642fefa82714d30868f1625a6155f3363b3` after `libass` evidence is available.
3. After owner-side staging API prerequisites are fixed, run `npm run beta:tools:core-real-check-evidence-preflight` and the deployed evidence recording commands.
4. Continue platform staging evidence and launch approval preflights before any beta or production activation.

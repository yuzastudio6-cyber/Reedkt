# Core Python Cold Import Timeout Hardening

Decision: `beta_core_python_cold_import_timeout_hardening_passed_ready_for_current_source_validation`.

After PR #1424 merged, final validation reproduced a cold-start PySceneDetect import timeout immediately after hydrating `.reeditpro-tool-readiness-python`. Direct bounded imports passed for `av`, `scenedetect`, `cv2`, `duckdb`, `polars`, `opentimelineio`, `PyOpenColorIO`, and `OpenImageIO`, and immediate reruns passed. That means the packages were installed, but the readiness runner's 15 second per-import timeout was too tight for cold native import paths.

## Change

- `server/workers/production-readiness/core-cpu-render-readiness-checks.ts` now uses a 45 second bounded default readiness timeout.
- The runner resolves the readiness Python command once per real-check run and reuses it for every Python import check.
- A failed Python import gets one bounded retry before the tool is classified as missing; if the retry fails too, the check still fails closed.

This keeps the check bounded while avoiding a false `missing` classification for installed packages immediately after venv hydration.

## Boundaries

This change does not process media, run Docker, write backend evidence, write Supabase, write GCS, dispatch workers, call providers, enable external beta, enable real-user-media beta, enable paid production, or increment product-ready local OSS status.

Supabase classification remains `no write / environment none / SQL none / migration no`.

## Next Safe Action

Refresh current-source `libass` synthetic subtitle QA evidence, then reissue the 14-tool local accepted evidence bundle for the latest tools SHA.

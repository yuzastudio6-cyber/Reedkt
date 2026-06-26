# AI-VIDEO-BROLL-GEN-TOOL-REGISTRY-2: align model-weight templates with approved cache evidence, no inference

## Goal

Align AI B-roll model-weight readiness templates with approved source/cache/checksum evidence where available, starting with the controlled Wan/Wan2.1 cache manifest.

## Allowed

- Read existing AI B-roll license, source, checksum, controlled-download, cache, and registry docs.
- Update model-weight readiness metadata and diagnostics only.
- Keep all routes fail-closed until owner acceptance, runtime, QA, billing, GCP, and worker gates are complete.

## Forbidden

- Do not download model weights.
- Do not install dependencies.
- Do not import model modules.
- Do not instantiate model pipelines.
- Do not run inference.
- Do not create generated video or generated assets.
- Do not create or start VMs, Docker containers, Cloud Run, workers, or providers.
- Do not mutate Supabase, run SQL, upload storage objects, create signed URLs, publish public artifacts, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Expected Output

- Wan/Wan2.1, LTX-Video, Mochi 1, and HunyuanVideo remain represented in the model-weight readiness lane.
- Model-weight templates reference approved evidence without exposing secrets or committing weights.
- Wan/Wan2.1 uses the controlled source revision and checksum manifest evidence already recorded outside the repo.
- LTX and Mochi remain `needs_review` unless exact version/source/checksum evidence is added.
- Hunyuan remains blocked.
- Diagnostics prove all runtime gates remain closed.

# SOUND-RUNTIME-MEDIA-GATE-2B Synthetic Worker Route Plan

Plan a fail-closed synthetic worker route for the four accepted SOUND CPU job types:

- `sound.package_import_smoke`
- `sound.numeric_array_analysis`
- `sound.symbolic_midi_analysis`
- `sound.loudness_synthetic_analysis`

Require the Gate 2A proof and WORKER_RUNTIME_JOBS owner-review decision before any route source planning. The plan may define payload/result schemas and a future synthetic-only worker path, but it must not execute workers, process uploaded media, open media files, run FFmpeg/ffprobe, run Docker, push images, call GCP, mutate Supabase, run SQL, create artifacts, unlock beta, unlock production, claim `generated_local_fixture_passed`, claim `dry_run_passed`, or claim runtime/media/worker readiness.

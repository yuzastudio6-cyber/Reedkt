# Dry-Run Fixture Payloads

The dry-run diagnostics synthesize one gated payload for each of the 16 Track B tools. Each valid fixture includes approved snapshot, edit plan, idempotency, credit reservation, private artifact reference, requested recipe, QA gate, fallback policy, result schema, `dryRunOnly: true`, and `executionEnabled: false`.

Negative fixtures are intentionally rejected for missing approved snapshot, `executionEnabled: true`, public/signed URL-like artifact paths, and raw prompt metadata.

No tool binary, Docker image, worker, route runtime, media input, image input, OCR inference, Supabase/GCS write, public artifact, signed URL, beta delivery, or production path runs in this phase.

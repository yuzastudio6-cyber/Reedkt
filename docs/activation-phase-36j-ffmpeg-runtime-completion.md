# Phase 36J FFmpeg Runtime Completion

Phase 36J uses a linux/amd64 CPU Cloud Run Job only because the local host lacks `ffmpeg` and `ffprobe`.

- Runtime image: `us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/signalsmith-controlled-runtime-phase36j:<run-id-or-commit>`
- Job: `reeditpro-stg-signalsmith-controlled-runtime-phase36j`
- Region: `us-central1`
- Service account: `reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com`
- Runtime scope: private CPU-only job, no public service, no production traffic, no GPU

The runtime first performs an ffmpeg/ffprobe smoke check without media access. Only after smoke and evidence gates pass may it read the single approved private controlled sample and extract the `6.9s-8.9s` window. Cloud Build context excludes media, audio, video, model payloads, private artifacts, caches, dependency folders, logs, secrets, and environment files.

## 2026-06-03 Rerun Result

The linux/amd64 runtime image built and pushed successfully. The private Cloud Run Job executed on CPU and the worker reached the controlled path: Signalsmith source acquisition/build passed, controlled sample evidence passed, source SHA-256 verification passed, and bounded extraction passed.

Phase 36J remains blocked because private artifact upload failed from the CPU worker service account. The Cloud Run execution log reports `phase36j_private_artifact_upload_failed` and `phase36j_cpu_worker_qa_prefix_storage_objects_get_missing`; `reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com` lacks `storage.objects.get` on the Phase 36J QA report objects/prefix. No broad IAM was granted, and no public artifact path was created.

Required follow-up before Phase 36J can pass: approve/apply the narrow Phase 36J QA-prefix read/write binding for the CPU worker service account, then rerun the existing Cloud Run Job path. Do not proceed to Demucs, production, beta, broad media, arbitrary media, OCR/VLM runtime, providers, public output, or Track A.

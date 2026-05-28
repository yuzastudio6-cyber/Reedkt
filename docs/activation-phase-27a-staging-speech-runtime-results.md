# Phase 27A Staging Speech Runtime Results

Status: complete for controlled staging CPU speech runtime verification.

| Field | Result |
| --- | --- |
| Project | `reeditpro` |
| Region | `us-central1` |
| Runtime image | `us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-speech-runtime:staging-speech-cpu-001` |
| Image index digest | `sha256:195d3dfae114c157b990e6328aff20181213d2ce95ebcd548323e8793954b193` |
| Execution image digest | `sha256:502620a854a6f6e22d398e95e4e432d3333e63cd496109903604e86c8f6ce89b` |
| Platform | `linux/amd64` verified by `docker buildx imagetools inspect` |
| Cloud Run Job | `reeditpro-staging-speech-runtime-job` |
| Service account | `reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com` |
| Model path | `gs://reeditpro-staging-reeditpro-generated-assets/model-weights/faster-whisper/tiny/` |
| Model checksum | `331e779addbf1ed02bf462c0c26d978d23ecd01ec8f79fb3771cc21975e696f5` |
| Job execution | `reeditpro-staging-speech-runtime-job-lmh7l` completed successfully |
| Runtime report | `gs://reeditpro-staging-reeditpro-worker-temp/activation-speech-runtime/phase27a/phase27a-20260528T01291/speech-runtime-report.json` |
| Phase 28 readiness | ready for explicit controlled speech/caption-only execution planning |

## Verification Summary

- Built and pushed a dedicated CPU speech runtime image for `linux/amd64`; no GPU image was built or pushed.
- Deployed `reeditpro-staging-speech-runtime-job` with no GPU and the patched CPU worker service account.
- Added conditional `roles/storage.objectViewer` on `reeditpro-staging-reeditpro-generated-assets` for only `model-weights/faster-whisper/tiny/`.
- Copied the approved `Systran/faster-whisper-tiny` model from private staging GCS at runtime.
- Verified `file_checksums_sha256.txt` and the aggregate checksum before transcription.
- Generated a 2 second silent WAV fixture inside the container.
- Ran faster-whisper on CPU with the local approved model path and `compute_type=int8`.
- Uploaded a private runtime report to the staging worker-temp bucket.

## Transcript Test

The generated silent fixture produced an empty transcript with `segmentCount=0`.
This is accepted for Phase 27A because the model loaded, checksum verification
passed, faster-whisper completed cleanly, and the test used generated audio only.

## Blockers

- None for Phase 27A CPU speech runtime verification.

## Warnings

- `gcloud` printed local Python 3.9 support/importlib warnings, but the GCP
  operations completed successfully.
- Phase 27A does not approve production transcription, external beta, or broad
  real user media testing.
- Phase 28 still requires an explicit controlled speech/caption real-video
  execution phase before any real media is processed.

Launch gates remain closed:

- `productionReadyAllowed=false`
- `externalBetaAllowed=false`
- `realUserMediaTestingAllowed=false`

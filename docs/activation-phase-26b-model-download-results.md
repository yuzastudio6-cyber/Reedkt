# Phase 26B Model Download Results

Phase 26B downloaded and uploaded only the approved `Systran/faster-whisper-tiny`
model scope for staging speech/caption testing. No other model weights were
downloaded, no model files were committed, and broad real user media testing
remains blocked.

## Model

| Field | Result |
| --- | --- |
| Model | `Systran/faster-whisper-tiny` |
| Manifest ID | `faster_whisper_tiny_staging_v1` |
| Purpose | Staging speech/caption test preparation for Phase 28 |
| Resolved revision | `d90ca5fe260221311c53c58e660288d3deb8d356` |
| Aggregate SHA-256 | `331e779addbf1ed02bf462c0c26d978d23ecd01ec8f79fb3771cc21975e696f5` |
| File count | 6 model snapshot files |
| Total model size | 78,207,087 bytes |
| Uploaded object count | 8 objects, including checksum and tree manifest |
| Sanitized temp path | `/tmp/reeditpro-model-download/faster-whisper-tiny/snapshot` |
| Runtime path planned | `/opt/reeditpro/model-weights/faster-whisper/tiny` |

Downloaded snapshot files:

- `.gitattributes`
- `README.md`
- `config.json`
- `model.bin`
- `tokenizer.json`
- `vocabulary.txt`

Temporary Hugging Face cache metadata was removed from the staging GCS model path
after upload and is not part of the checksum manifest.

## Private Staging Storage

| Field | Result |
| --- | --- |
| Project | `reeditpro` |
| Bucket | `gs://reeditpro-staging-reeditpro-generated-assets` |
| Model prefix | `gs://reeditpro-staging-reeditpro-generated-assets/model-weights/faster-whisper/tiny/` |
| Checksum manifest | `gs://reeditpro-staging-reeditpro-generated-assets/model-weights/faster-whisper/tiny/file_checksums_sha256.txt` |
| Tree manifest | `gs://reeditpro-staging-reeditpro-generated-assets/model-weights/faster-whisper/tiny/model_tree_manifest.json` |
| Source-media bucket used | No |
| Public bucket/object access | No public principals found in bucket IAM |
| Signed URL source of truth | No |

Google Cloud CLI emitted local Python 3.9/importlib warnings during storage
commands, but the authenticated project, bucket operations, object listing, and
IAM policy reads completed successfully.

## Blocked Models

Still blocked and not downloaded:

- `Systran/faster-whisper-base` and larger Whisper models
- `BiRefNet`
- `SAM2`
- `DeepFilterNet`
- `Demucs`
- `Real-ESRGAN`
- `FILM`
- `PaddleOCR GPU`
- provider models
- Revideo production use

## Runtime Readiness

The approved tiny model weights are now available in private staging storage
with revision and checksum evidence. Phase 26B did not deploy a speech runtime,
mount the model into Cloud Run, run transcription, deploy GPU, or process real
media.

Phase 28 execution remains blocked until a controlled speech/caption runtime
path is deployed or otherwise verified to load the approved model from the
private staging path.

## Launch Gates

| Gate | State |
| --- | --- |
| `productionReadyAllowed` | `false` |
| `externalBetaAllowed` | `false` |
| `realUserMediaTestingAllowed` | `false` |
| Provider execution | Blocked |
| GPU deployment | Blocked/deferred |
| Secret values | Not added |
| Model files in git | Not committed |

## Readiness

| Phase | State | Reason |
| --- | --- | --- |
| Phase 27 | Deferred | GPU deployment is not needed by Phase 26B and remains optional unless a later runtime decision requires it. |
| Phase 28 | Planning-ready, execution-blocked | Model storage evidence exists, but speech runtime loading/transcription is not verified yet. |

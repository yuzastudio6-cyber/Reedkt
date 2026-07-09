# Internal Testing Faster Whisper Local Bootstrap

This bootstrap is an explicit local operator path for ReEditPro internal testing only. It prepares the local faster-whisper Python runtime and one reviewed internal-testing model directory outside the repository so the real-video speech/caption gate can move from placeholder caption wiring to real transcript acceptance.

## Approved Internal Testing Source

- Runtime package: `faster-whisper==1.2.1`
- Runtime source: `https://github.com/SYSTRAN/faster-whisper`
- Runtime API: `from faster_whisper import WhisperModel`
- Model repository: `https://huggingface.co/Systran/faster-whisper-small`
- Model source class: CTranslate2 conversion of OpenAI Whisper small
- Model license evidence: Hugging Face model page reports `mit`
- Model approval scope: internal testing only

The upstream faster-whisper README documents Python 3.9+, PyPI installation, `WhisperModel`, local-directory model loading, and automatic Hub downloads when a model name is used. ReEditPro does not use automatic model-name downloads in acceptance smokes. The bootstrap downloads a fixed model repository only after the explicit confirmation variable is set, then all normal real-video tests use the resulting local path and manifest with `allowModelDownload=false`.

## Command

```bash
REEDITPRO_CONFIRM_INTERNAL_TESTING_FASTER_WHISPER_LOCAL_BOOTSTRAP=true \
  npm run prepare:internal-testing:faster-whisper-local-bootstrap
```

Default outputs are outside source control:

- Runtime root: `/private/tmp/reeditpro-internal-testing-faster-whisper-runtime`
- Model path: `/private/tmp/reeditpro-approved-local-models/faster-whisper-small`
- Manifest path: `/private/tmp/reeditpro-approved-local-models/faster-whisper-small.manifest.json`

The script prints the three environment variables needed for the real-video acceptance command:

```bash
export REEDITPRO_INTERNAL_TESTING_FASTER_WHISPER_PYTHON_COMMAND=/private/tmp/reeditpro-internal-testing-faster-whisper-runtime/venv/bin/python
export REEDITPRO_INTERNAL_TESTING_FASTER_WHISPER_MODEL_PATH=/private/tmp/reeditpro-approved-local-models/faster-whisper-small
export REEDITPRO_INTERNAL_TESTING_FASTER_WHISPER_MODEL_MANIFEST_PATH=/private/tmp/reeditpro-approved-local-models/faster-whisper-small.manifest.json
```

Then rerun:

```bash
npm run test:internal-testing:real-video-end-to-end-readiness
```

## Boundaries

This does not approve production model weights, public delivery, paid production, external beta, Supabase/GCS writes, provider calls, live Qwen calls, or final export. It does not commit model files, package downloads, cache files, captions, previews, media, or generated artifacts to the repo.

Normal readiness and real-video acceptance commands still fail closed when the manifest, local model directory, or Python package/API is missing. They do not install packages or download models.

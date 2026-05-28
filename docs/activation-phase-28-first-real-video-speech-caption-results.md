# Phase 28 First Real Video Speech/Caption Results

Status: complete for the single controlled speech/caption-only real-video test.

| Field | Result |
| --- | --- |
| Project | `reeditpro` |
| Region | `us-central1` |
| Run ID | `phase28-20260528T01552` |
| Approved source | `/Users/macuser/Downloads/IMG_6005.MOV` |
| Private source object | `gs://reeditpro-staging-reeditpro-source-media/activation-real-video/phase28/phase28-20260528T01552/source-video.mov` |
| Runtime image tag | `staging-phase28-speech-001` |
| Runtime image digest | `sha256:5438e8b22e22343d22dd5a3f723468e00ee5e53d946af17dfd84e7613571f652` |
| Runtime job | `reeditpro-staging-speech-runtime-job` |
| Successful execution | `reeditpro-staging-speech-runtime-job-xlhmh` |
| Model | `Systran/faster-whisper-tiny` |
| Model revision | `d90ca5fe260221311c53c58e660288d3deb8d356` |
| Model checksum | `331e779addbf1ed02bf462c0c26d978d23ecd01ec8f79fb3771cc21975e696f5` |
| Media | `16.083333s`, `3840x2160`, audio present |
| Transcript | `5` segments, `47` word timestamps |
| Captions | `5` caption segments; SRT, WebVTT, and ASS created |
| Caption QA | warning-only; no blockers |
| Phase 29 readiness | ready for controlled smart-cut + captions planning |

## Artifact Summary

- Media probe: `gs://reeditpro-staging-reeditpro-analysis-artifacts/activation-real-video/phase28/phase28-20260528T01552/analysis/media-probe.json`
- Extracted audio: `gs://reeditpro-staging-reeditpro-transcripts/activation-real-video/phase28/phase28-20260528T01552/audio/source-audio.wav`
- Transcript JSON: `gs://reeditpro-staging-reeditpro-transcripts/activation-real-video/phase28/phase28-20260528T01552/transcripts/transcript.json`
- Word timestamps JSON: `gs://reeditpro-staging-reeditpro-transcripts/activation-real-video/phase28/phase28-20260528T01552/transcripts/word-timestamps.json`
- Caption segments JSON: `gs://reeditpro-staging-reeditpro-transcripts/activation-real-video/phase28/phase28-20260528T01552/captions/caption-segments.json`
- SRT: `gs://reeditpro-staging-reeditpro-transcripts/activation-real-video/phase28/phase28-20260528T01552/captions/captions.srt`
- WebVTT: `gs://reeditpro-staging-reeditpro-transcripts/activation-real-video/phase28/phase28-20260528T01552/captions/captions.vtt`
- ASS: `gs://reeditpro-staging-reeditpro-transcripts/activation-real-video/phase28/phase28-20260528T01552/captions/captions.ass`
- QA report: `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-real-video/phase28/phase28-20260528T01552/qa/caption-qa.json`
- Phase 28 report: `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-real-video/phase28/phase28-20260528T01552/reports/phase28-report.json`

## QA Summary

- `transcript_alignment`: passed.
- `caption_timing`: passed.
- `caption_readability`: passed.
- `caption_safe_zone`: warning only because Phase 28 does not run face/OCR analysis or burn captions into a final video.

## Notes

- The first execution attempt was blocked by missing artifact write access for the CPU service account. Conditional Phase 28 object-create grants were added for the analysis, transcripts, and QA artifact prefixes, then the run was retried with a fresh run ID.
- The local macOS shell does not have `ffprobe`; media probing and audio extraction were performed inside the deployed container.
- `gcloud` continues to print Python 3.9 support/importlib warnings, but the relevant GCP operations completed.
- Full transcript text is intentionally not included in this tracked doc; it remains in the private transcript artifact.

Launch gates remain closed:

- `productionReadyAllowed=false`
- `externalBetaAllowed=false`
- `realUserMediaTestingAllowed=false`

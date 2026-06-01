# Phase 36C DeepFilterNet Artifact Policy

Phase 36C artifacts must remain private and must not be committed to git.

## Private GCS Prefixes

- Generated assets:
  `gs://reeditpro-staging-reeditpro-generated-assets/activation-audio-ai/phase36c/<runId>/`
- QA artifacts:
  `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-audio-ai/phase36c/<runId>/`
- Analysis artifacts:
  `gs://reeditpro-staging-reeditpro-analysis-artifacts/activation-audio-ai/phase36c/<runId>/`

## Expected Objects

- `fixture/generated-clean-reference.wav`
- `fixture/generated-noisy-input.wav`
- `fixture/audio-fixture-manifest.json`
- `enhanced/deepfilternet-enhanced.wav`
- `metadata/model-checksum-verification.json`
- `metadata/deepfilternet-runtime-metadata.json`
- `audio-metrics/input-metrics.json`
- `audio-metrics/output-metrics.json`
- `audio-metrics/comparison-metrics.json`
- `qa/deepfilternet-runtime-qa.json`
- `reports/phase36c-report.json`

## Git Safety

Do not commit DeepFilterNet artifacts, generated WAVs, enhanced WAVs, private
JSON reports from GCS, logs, credentials, or large binaries. Commit only code,
docs, and sanitized metadata.

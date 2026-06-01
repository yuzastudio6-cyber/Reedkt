# Phase 36D Real-Video DeepFilterNet Artifact Policy

Phase 36D runtime artifacts must stay private and must not be committed to git.

Approved private prefixes:

- `gs://reeditpro-staging-reeditpro-generated-assets/activation-audio-ai/phase36d/<runId>/`
- `gs://reeditpro-staging-reeditpro-final-exports/activation-audio-ai/phase36d/<runId>/`
- `gs://reeditpro-staging-reeditpro-analysis-artifacts/activation-audio-ai/phase36d/<runId>/`
- `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-audio-ai/phase36d/<runId>/`
- `gs://reeditpro-staging-reeditpro-worker-temp/activation-audio-ai/phase36d/<runId>/`

Do not commit generated audio, cleaned audio, review MP4s, private report JSON,
logs, credentials, model/tool artifacts, or other large binary output.

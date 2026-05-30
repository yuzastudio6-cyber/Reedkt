# Phase 35E Segment Text-Behind-Subject Artifact Policy

Input artifacts must come from the approved Phase 35D private prefixes:

- `gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase35d/phase35d-20260530T004442/`
- `gs://reeditpro-staging-reeditpro-masks/activation-real-video/phase35d/phase35d-20260530T004442/`
- `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-real-video/phase35d/phase35d-20260530T004442/`

Output artifacts must stay private:

- preview frames under `gs://reeditpro-staging-reeditpro-previews/activation-real-video/phase35e/<runId>/`
- composition metadata under `gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase35e/<runId>/`
- QA/report JSON under `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-real-video/phase35e/<runId>/`

Do not commit generated preview frames, masks, clips, private reports, logs,
credentials, or large binary artifacts. Commit only source, docs, and sanitized
evidence.

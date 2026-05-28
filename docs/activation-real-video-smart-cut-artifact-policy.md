# Activation Real Video Smart Cut Artifact Policy

Phase 29 artifacts are retained privately under:

`activation-real-video/phase29/<runId>/`

Analysis artifacts go to:

`gs://reeditpro-staging-reeditpro-analysis-artifacts/activation-real-video/phase29/<runId>/`

QA and reports go to:

`gs://reeditpro-staging-reeditpro-qa-artifacts/activation-real-video/phase29/<runId>/`

Expected artifacts:

- `smart-cut/smart-cut-plan.json`
- `timeline/timeline-manifest.json`
- `timeline/opentimelineio-style.json`
- `timeline/hyperframe-bridge.json`
- `timeline/remotion-composition-manifest.json`
- `qa/smart-cut-caption-qa.json`
- `reports/phase29-report.json`

Do not commit transcript, caption, video, preview, or generated artifact files.
Do not create public ACLs or signed URLs as source of truth.

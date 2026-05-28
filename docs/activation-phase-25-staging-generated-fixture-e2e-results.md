# Phase 25 Staging Generated-Fixture E2E Results

Phase 25 executed the first staging end-to-end workflow using generated fixture
media only.

## Run Summary

- Branch: `codex/rp-activation-25-staging-generated-fixture-e2e`
- Project: `reeditpro`
- Region: `us-central1`
- Run ID: `2026-05-27t23-21-50-107z`
- API service: `reeditpro-staging-api`
- Non-GPU jobs: tool-readiness, CPU analysis, render, QA
- GPU job: deferred and not run
- Real user media: not used
- Providers/model downloads: not run
- Public access: not granted
- Secret values: not created

## API Health

- Authenticated `/health`: passed with HTTP `200`
- Service URL: `https://reeditpro-staging-api-4wkjiqvdqa-uc.a.run.app`
- Service IAM policy has no `allUsers` / `allAuthenticatedUsers` bindings.
- Response mode: `mock`

## Fixture

- Local fixture: generated under `activation-logs/staging-fixture-e2e/phase25/`
- Fixture checksum: `7abc3dccaceff00fe574d2b69b0708c9da939cd8b34087d2c249504ab61814a4`
- Uploaded source object:
  `gs://reeditpro-staging-reeditpro-source-media/activation-fixtures/phase25/2026-05-27t23-21-50-107z/fixture.mp4`
- Local temp fixture cleanup: completed

The local machine did not have `ffmpeg` available, so the runner created a tiny
generated MP4 container as source evidence. The CPU staging job then generated
the real proxy media from an FFmpeg `testsrc` pattern inside the container. No
real user media or arbitrary local files were used.

## Jobs Executed

| Stage | Cloud Run job | Execution | Status |
| --- | --- | --- | --- |
| Tool readiness | `reeditpro-staging-tool-readiness-job` | `reeditpro-staging-tool-readiness-job-wb9s9` | Passed |
| CPU analysis | `reeditpro-staging-cpu-analysis-job` | `reeditpro-staging-cpu-analysis-job-4s22m` | Passed |
| Render | `reeditpro-staging-render-job` | `reeditpro-staging-render-job-8lggw` | Passed |
| QA | `reeditpro-staging-qa-job` | `reeditpro-staging-qa-job-84ggs` | Passed |

The CPU, render, and QA jobs were updated to use the generated-fixture worker
entrypoint from the `staging-fixture-001` images:

- CPU image: `reeditpro-staging-cpu-worker@sha256:4e7be87fc24c1cd1efcad129f7d636b084f731f8eb6827d99d7f8b9d54432ddb`
- Render image: `reeditpro-staging-render-worker@sha256:798df87aa5fb1dfab239963f9280c4e460300253b83ac5c91d2960f7b9e22ae0`
- QA image: `reeditpro-staging-qa-worker@sha256:0042d3c6eb4e4ff7f1fabd21ec792ee69808e039ec39a2ac422122c2c4ed1ca3`

## Artifacts

All artifacts are private staging objects under
`activation-fixtures/phase25/2026-05-27t23-21-50-107z/`.

- Source fixture:
  `gs://reeditpro-staging-reeditpro-source-media/.../fixture.mp4`
- Proxy video:
  `gs://reeditpro-staging-reeditpro-proxy-media/.../proxy/proxy.mp4`
- Media analysis:
  `gs://reeditpro-staging-reeditpro-analysis-artifacts/.../analysis/media-analysis.json`
- Timeline manifest:
  `gs://reeditpro-staging-reeditpro-analysis-artifacts/.../analysis/timeline-manifest.json`
- Transcript placeholder:
  `gs://reeditpro-staging-reeditpro-transcripts/.../transcripts/transcript.json`
- Preview:
  `gs://reeditpro-staging-reeditpro-previews/.../previews/preview.mp4`
- Render manifest:
  `gs://reeditpro-staging-reeditpro-previews/.../previews/render-manifest.json`
- Final export:
  `gs://reeditpro-staging-reeditpro-final-exports/.../final-exports/final-export.mp4`
- QA summary:
  `gs://reeditpro-staging-reeditpro-qa-artifacts/.../qa/qa-summary.json`

## QA Summary

- QA status: passed
- Generated fixture only: true
- Final export: created for generated-fixture validation only
- Final delivery allowed: true for this generated fixture evidence only
- Production ready allowed: false
- External beta allowed: false
- Real user media testing allowed: false

## Warnings

- Cloud SDK emitted local Python 3.9 compatibility warnings during some `gcloud`
  commands, but the commands completed.
- Local `ffmpeg` was not available, so source fixture generation used the
  built-in minimal MP4 fallback and container-side FFmpeg generated the proxy.
- A duplicate CPU job retry against the same run ID failed because overwriting
  existing GCS objects would require `storage.objects.delete`. The successful
  CPU execution and verified artifacts remain the accepted Phase 25 evidence.
  Future execute-mode runs now create a fresh run ID by default.
- GCS fixture artifacts were retained for debugging under the private
  `activation-fixtures/phase25/` prefix.

## Readiness

- Phase 26 readiness: ready for the model approval workflow, with generated
  fixture evidence available for review.
- Phase 28 readiness: blocked until explicit approval for first real video
  testing scope.
- Production readiness: blocked.
- External beta: blocked.
- Real user media testing: blocked.

## Logs

Raw logs are local only under:

`activation-logs/staging-fixture-e2e/phase25/`

Tracked summary:

`docs/activation-phase-25-staging-generated-fixture-e2e-results.md`

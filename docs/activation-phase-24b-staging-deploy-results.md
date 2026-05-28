# Phase 24B Retry Staging Non-GPU Deploy Results

## Summary

Phase 24B retry deployed the staging API service and four non-GPU Cloud Run
jobs in project `reeditpro`, region `us-central1`, using the corrected
`linux/amd64` images tagged `staging-amd64-001`.

The original Phase 24B attempt correctly stopped before deployment because the
`staging-local-001` images were `linux/arm64` only. Phase 20C/23C rebuilt and
pushed the non-GPU images for `linux/amd64`; this retry used those pinned
digests.

GPU remains deferred. No GPU job, provider call, model download, real user
media processing, secret value creation, public access grant, production-ready
change, external beta unblock, or real user media testing was performed.

- Branch: `codex/rp-activation-24b-retry-deploy-staging-non-gpu-amd64`
- Project: `reeditpro`
- Region: `us-central1`
- Image tag: `staging-amd64-001`
- Logs: `activation-logs/staging-deploy/phase24b-staging-amd64-001/`

## Safety Gates

| Gate | State |
| --- | --- |
| `productionReadyAllowed` | `false` |
| `externalBetaAllowed` | `false` |
| `realUserMediaTestingAllowed` | `false` |
| GPU job deployed | `false` |
| Provider calls executed | `false` |
| Model downloads executed | `false` |
| Real media processed | `false` |
| Secret values created | `false` |
| Public unauthenticated access granted | `false` |

## Preflight

| Check | Result |
| --- | --- |
| Active GCP project | passed, `reeditpro` |
| Active account | passed, `aiediting@reeditpro.com` |
| Artifact Registry repo | passed, `reeditpro-staging-workers` |
| Service accounts | passed for API, tool-readiness, CPU, QA, and render |
| Image architecture | passed, all five images include `linux/amd64` |
| Secret versions | not mounted; placeholders remain value-free for this deploy |

The local Cloud SDK install emitted Python 3.9 support warnings and an
`importlib.metadata` warning after some successful commands. The commands still
completed and returned the expected resources.

## Images Deployed

| Target | Digest | Platform |
| --- | --- | --- |
| API service | `sha256:ddb5c6d31fe738ab56291806527e1a5638d1fbfd2b08e05fafb492dc78cb05ac` | `linux/amd64` |
| Tool-readiness job | `sha256:775d0c9fffe03a3f2836e246824a5feb0b753fe3e1672f68685144fc5fc79656` | `linux/amd64` |
| CPU analysis job | `sha256:48362d165a07e8ab14f1debf764001e659963db6d26694fd4194446cd0ccc109` | `linux/amd64` |
| QA job | `sha256:ee5360f68f16263fd1a8e791c577f696b688f2ed986a38029fe11803674f9c8a` | `linux/amd64` |
| Render job | `sha256:46f2d8f76b14a2fdc000c1260c9026169a28351763e9d28914046c027b9b0922` | `linux/amd64` |

Each image index also includes a BuildKit `unknown/unknown` attestation
manifest. That is warning-only and not the runnable Cloud Run platform.

## API Service

| Field | Value |
| --- | --- |
| Service | `reeditpro-staging-api` |
| Status | deployed and latest revision ready |
| Service account | `reeditpro-stg-api-sa@reeditpro.iam.gserviceaccount.com` |
| URL | `https://reeditpro-staging-api-4wkjiqvdqa-uc.a.run.app` |
| Public access | disabled; no `allUsers` or `allAuthenticatedUsers` binding found |
| Health check | authenticated `/health` returned HTTP `200` |

The API was deployed with mock-safe staging env only:
`REEDITPRO_ENV=staging`, `API_PORT=8080`, `E2E_RUNTIME_MODE=mock`,
`WORKER_RUNTIME_MODE=mock`, `API_ALLOW_MOCK_WITHOUT_SUPABASE=true`, and
`STORAGE_MODE=local`.

## Jobs

| Job | Status | Service account | Execution |
| --- | --- | --- | --- |
| `reeditpro-staging-tool-readiness-job` | deployed and ready | `reeditpro-stg-tool-ready-sa@reeditpro.iam.gserviceaccount.com` | executed once; succeeded |
| `reeditpro-staging-cpu-analysis-job` | deployed and ready | `reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com` | not executed |
| `reeditpro-staging-qa-job` | deployed and ready | `reeditpro-stg-qa-sa@reeditpro.iam.gserviceaccount.com` | not executed |
| `reeditpro-staging-render-job` | deployed and ready | `reeditpro-stg-render-sa@reeditpro.iam.gserviceaccount.com` | not executed |
| `reeditpro-staging-gpu-ai-job` | not deployed | none | not executed |

The tool-readiness execution
`reeditpro-staging-tool-readiness-job-h8ds9` completed successfully with
`succeededCount=1`.

CPU, QA, and render jobs were deployed with finite readiness/no-op commands but
were not executed in this phase.

## Warnings

- Cloud SDK on this machine reports Python 3.9 support warnings.
- Cloud SDK also emits `module 'importlib.metadata' has no attribute
  'packages_distributions'` after some successful commands.
- The staging service accounts currently have display descriptions containing
  the word `production` from earlier reusable setup scripts; the patched
  service account IDs are correct and the old long API service account is not
  used.
- BuildKit `unknown/unknown` attestation manifests appear beside the runnable
  `linux/amd64` image manifests.

## Phase 25 Readiness

`ready`

Phase 25 generated-fixture staging E2E can proceed because the API is deployed
and health-checked, all four non-GPU jobs are deployed, the safe
tool-readiness execution passed, and no launch gates were opened.

Phase 25 must remain generated-fixture only. Real user media, external beta,
production readiness, provider calls, model downloads, and GPU work remain
blocked.

## Validation

| Command | Result |
| --- | --- |
| `smoke:activation-staging-deploy-config` | passed |
| `activation:staging:deploy-report -- --project reeditpro --region us-central1 --image-tag staging-amd64-001` | passed; 0 blockers, Phase 25 ready |
| `activation:staging:healthcheck:summary -- --project reeditpro --region us-central1` | passed; API ready, jobs ready, tool-readiness execution passed |
| `lint` | passed |
| `build` | passed; existing large-chunk warning emitted |
| `build:server` | passed |
| `git diff --check` | passed |

`package-lock.json` was unchanged.

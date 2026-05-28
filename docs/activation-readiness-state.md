# Activation Readiness State

Phase 18 classifies the repo as ready for the next local baseline, not for staging launch, external beta, real user media, or paid production.

| Area | State | Notes |
| --- | --- | --- |
| Repo baseline | Ready | M0-M17 dry-run/static runtime foundation is present. |
| Smoke suite | Ready | Existing production smoke and summary scripts are available; Phase 19 must run the full baseline. |
| Docker build | Not yet human-run | Production images have not been built for activation. |
| Container readiness | Not yet human-run | Readiness has not run against human-built images. |
| GCP setup | Not yet human-run | Staging resources are not created by Phase 18. |
| Image push | Not yet human-run | No activation images have been pushed to Artifact Registry. |
| Non-GPU staging deploy | Not yet done | API, CPU, render, and QA staging deployments are not active. |
| GPU staging deploy | Not yet done | L4 GPU worker deployment waits for model/license and staging prerequisites. |
| Model weights | Not yet approved | Model/checkpoint license and security review is still required. |
| First real video speech/caption | Not yet allowed | Blocked until staging, readiness, storage, and model prerequisites pass. |
| Final private export | Not yet allowed | Blocked until controlled upstream real-video tests and render/export gates pass. |
| Internal beta | Blocked | Requires full private E2E evidence, operations, support, privacy, cost, and rollback readiness. |
| External beta | Blocked | Requires strict Phase 37 go/no-go approval. |
| Paid production | Blocked | Not approved by Phase 18 or the activation roadmap. |

Current classification:

- dry-run/static runtime foundation: ready
- local generated fixture testing: ready where supported
- production container build: not yet human-run
- container readiness: not yet human-run
- GCP staging resources: not yet human-run
- staging deployment: not yet done
- model weights/licenses: not yet approved
- GPU worker: not yet deployed
- real user video testing: not yet allowed
- external beta: blocked
- paid production: blocked

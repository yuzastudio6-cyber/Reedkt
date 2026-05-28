# Activation Readiness State

Phase 26B classifies the repo as ready for first-model approval and private
staging model-storage evidence, not for production launch, external beta, broad
real user media testing, provider execution, or transcription execution.

| Area | State | Notes |
| --- | --- | --- |
| Repo baseline | Ready | M0-M17 dry-run/static runtime foundation is present. |
| Smoke suite | Ready | Existing production smoke and summary scripts are available and cataloged by Phase 19. |
| Local baseline command/report | Ready | `activation:local-baseline` defaults to static-only reporting and requires confirmation before execution. |
| Container build reporting | Ready | Phase 20 can print build plans and parse human build logs without running Docker. |
| Docker build | Not yet human-run | Production images have not been built for activation unless humans provide passing build logs. |
| Container readiness validation reporting | Ready | Phase 21 can print readiness command plans and parse human-run readiness logs without running Docker. |
| Actual container readiness run | Human-run required | Humans must run readiness against built images and provide logs; Codex does not run Docker. |
| GCP staging setup planning | Ready | Phase 22 validates staging config, resource map, IAM, buckets, secrets, and command plans. |
| Actual GCP staging resources | Human-run required | Resources are not created until humans run reviewed setup with confirmation. |
| Image push | Not yet human-run | No activation images have been pushed to Artifact Registry. |
| Non-GPU staging deploy | Not yet done | API, CPU, render, and QA staging deployments are not active. |
| GPU staging deploy | Not yet done | L4 GPU worker deployment waits for model/license and staging prerequisites. |
| Model approval workflow | Ready | Phase 26 can report evidence, storage policy, manifests, and text-only future download commands. |
| faster-whisper tiny model approval | Staging-approved for planning | `Systran/faster-whisper-tiny` is approved only for Phase 28 speech/caption planning. |
| Model weights availability | Private staging storage verified | `Systran/faster-whisper-tiny` is stored under private generated-assets model storage with revision/checksum evidence. Runtime loading is still unverified. |
| First real video speech/caption | Planning-ready, execution-blocked | Blocked until a speech runtime image/job can load the approved tiny model and Phase 28 explicitly approves the controlled test. |
| Final private export | Not yet allowed | Blocked until controlled upstream real-video tests and render/export gates pass. |
| Internal beta | Blocked | Requires full private E2E evidence, operations, support, privacy, cost, and rollback readiness. |
| External beta | Blocked | Requires strict Phase 37 go/no-go approval. |
| Paid production | Blocked | Not approved by Phase 18 or the activation roadmap. |

Current classification:

- dry-run/static runtime foundation: ready
- local generated fixture testing: ready where supported
- local baseline command/report: ready
- container build reporting: ready
- production container build: not yet human-run
- container readiness validation reporting: ready
- actual container readiness run: human-run required
- GCP staging setup planning: ready
- GCP staging resources: not yet human-run
- staging deployment: not yet done
- model weights/licenses: faster-whisper tiny staging approval only
- model files/checksums: private staging storage verified for faster-whisper tiny only
- GPU worker: not yet deployed
- real user video testing: blocked except future Phase 28 speech/caption-only approval
- external beta: blocked
- paid production: blocked

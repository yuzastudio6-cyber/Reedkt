# Activation Staging Deploy Report Policy

The staging deploy report records config, image digests, architecture evidence,
Cloud Run service/job plans, command text, blockers, warnings, health status,
and Phase 25 readiness.

Phase 25 readiness requires:

- API service deployed and ready;
- tool-readiness, CPU, QA, and render jobs deployed;
- no GPU deployment;
- no provider/model/media/secret/public-access findings;
- production, external beta, and real user media gates remain false.

Architecture blockers take precedence over deployment. If any image lacks
`linux/amd64`, Phase 24B must stop before `gcloud run deploy`.

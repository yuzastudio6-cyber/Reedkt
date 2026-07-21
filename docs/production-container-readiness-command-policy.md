# Production Container Readiness Command Policy

M12 command plans are generated safely and do not execute by default.

Human-run Docker readiness scripts must:

- require explicit image tag environment variables;
- require immutable `name@sha256:digest` image references and fail on mutable tags;
- fail if an image reference remains `manual-not-set`;
- require exact source commit and tree hashes;
- require `REEDITPRO_CONFIRM_CONTAINER_READINESS=true` before `docker run`;
- print the command before running it;
- run with `--network none`, read-only root, all capabilities dropped, no-new-privileges, and a non-root user;
- avoid mounting user source media by default;
- avoid model downloads, inference, media processing, providers, secrets, `gcloud`, deployment, image build, image push, and final render/export.

GPU readiness commands are import/spec/readiness checks only. They must not load model weights or run inference.

The runtime output is a `production-container-qualification-candidate-v1`, not a production qualification. It is self-attested by the human runner and remains non-promotable until an independent same-source/image verifier and the separate manual license/model gates pass. Copied or caller-authored JSON cannot satisfy `production-container-qualification-receipt-v1`.

The independent host verifier must:

- require explicit `REEDITPRO_CONFIRM_CONTAINER_HOST_VERIFICATION=true`;
- read one bounded, regular, non-symlink candidate file through standard input;
- require an exactly clean checkout whose commit/tree match the candidate;
- verify that the active Docker endpoint is local;
- use `docker image inspect` only and require the exact immutable repository digest;
- verify exact source/tree/role/clean/candidate-version OCI labels;
- retain hashes rather than raw Git status, Docker output, endpoint, or local paths;
- never build, pull, run, push, deploy, process media, load models, call providers, read secrets, mutate cloud/database/billing state, or promote production readiness.

Its `local_host_source_image_verification_unreleased` receipt remains outside the static production readiness authority until manual license/model review and a later reviewed release adapter are implemented.

Manual review package preparation must likewise require explicit confirmation, one bounded retained host receipt, and the exact clean source. It may project source-owned package/license/model/source-install metadata and hashes only. It must never accept a reviewer decision, edit the tool registry, mark a model approved, qualify an image/release, call Docker or cloud services, or affect customer price/credits/service fee/billing.

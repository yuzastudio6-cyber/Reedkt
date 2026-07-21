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

# Production Container Readiness Command Policy

M12 command plans are generated safely and do not execute by default.

Human-run Docker readiness scripts must:

- require explicit image tag environment variables;
- fail if an image tag remains `manual-not-set`;
- require `REEDITPRO_CONFIRM_CONTAINER_READINESS=true` before `docker run`;
- print the command before running it;
- avoid mounting user source media by default;
- avoid model downloads, inference, media processing, providers, secrets, `gcloud`, deployment, image build, image push, and final render/export.

GPU readiness commands are import/spec/readiness checks only. They must not load model weights or run inference.

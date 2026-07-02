# Production Job Timeout And Kill Switch Policy

M17 defines timeouts for CPU, GPU, render, QA, and readiness workers. It also defines kill switches for global generation, GPU workers, render workers, providers, final export, and public delivery/share.

Kill switches default to the conservative blocked posture for production-sensitive paths. They must be wired into future deployment config before any external beta.

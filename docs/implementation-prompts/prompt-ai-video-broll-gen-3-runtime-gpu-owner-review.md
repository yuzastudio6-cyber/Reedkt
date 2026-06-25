# AI-VIDEO-BROLL-GEN-3 Runtime / GPU Owner Review Prompt

Goal: review GPU/runtime owner boundaries for future AI video B-roll model import and synthetic generation proofs.

This prompt must not install dependencies, download model weights, run inference, generate video, run FFmpeg/ffprobe, run Docker, build Docker images, call GCP, mutate Supabase, execute SQL, create storage objects, create signed URLs, call providers, dispatch workers, mutate credits, or unlock beta/production.

Inputs:

- AI-VIDEO-BROLL-GEN-1 license/provenance result.
- AI-VIDEO-BROLL-GEN-2 weight source/checksum plan.
- `docs/ai-video-broll-generation-runtime-gpu-architecture-plan.md`
- `docs/production-gpu-tool-readiness-policy.md`
- `docs/production-gpu-model-weight-policy.md`

Exit criteria:

- GPU tier, dependency lane, worker boundary, queue handoff, cost/latency metadata, and no-raw-prompt rule are accepted or blocked.
- No runtime is enabled from this review.
- Next prompt is dependency install planning or controlled weight download proof only if owners approve.

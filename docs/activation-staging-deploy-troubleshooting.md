# Activation Staging Deploy Troubleshooting

| Symptom | Likely cause | Next action |
| --- | --- | --- |
| Image is `linux/arm64` only | Built on Apple Silicon without `linux/amd64` target | Rebuild and push `linux/amd64` or multi-arch images. |
| Secret version missing | Phase 22B created placeholder names only | Do not mount secrets; use mock-safe env or add real values in a later approved phase. |
| Old service account appears | Pre-fix account was created in Phase 22B | Stop and switch to patched `reeditpro-stg-*` account. |
| Public URL requires unauthenticated access | Service is private by default | Use authenticated health checks; do not make public without explicit approval. |
| Job command would process media | Worker command is not a safe readiness/no-op command | Do not execute the job in Phase 24B. |
| GPU appears in command plan | Wrong target set | Stop; GPU deployment belongs to a later phase. |

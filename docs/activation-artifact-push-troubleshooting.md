# Activation Artifact Push Troubleshooting

Common blockers and fixes:

| Symptom | Likely cause | Next action |
| --- | --- | --- |
| `unauthorized` or `authentication required` | Docker auth missing for Artifact Registry | Run `gcloud auth configure-docker us-central1-docker.pkg.dev --quiet`. |
| `permission denied` or `403` | Active account lacks push permission | Verify active account and Artifact Registry IAM. |
| `repository not found` | Wrong project, region, or repo | Verify `reeditpro`, `us-central1`, and `reeditpro-staging-workers`. |
| `No such image` | Local Phase 20B image missing | Rebuild or retag the missing non-GPU image before push. |
| Network timeout | Temporary network/registry issue | Retry the single failed image push after confirming no partial blocker. |
| GPU image detected | Wrong manifest or command | Stop and remove GPU from Phase 23B execution. |
| Digest missing | Push did not complete or verification failed | Re-run digest verification before Phase 24B. |

Do not deploy or push GPU images while resolving Phase 23B blockers.

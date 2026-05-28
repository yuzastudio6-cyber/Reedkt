# Activation Container Readiness Validation Runbook

Phase 21 adds static/report-only validation for human-built production container images. Codex does not run Docker, build images, push images, run `gcloud`, deploy, call providers, download model weights, mount user media, or process media.

## Purpose

Use Phase 21 after Phase 20 image builds have been run by a human and logs are available. The readiness layer prints the human-run command plan, parses local readiness log text, compares evidence to expected tools, and reports whether Phase 22 staging foundation setup and Phase 23 image push review can proceed.

## Image Set

Readiness covers:

1. API
2. tool-readiness worker
3. CPU worker
4. QA worker
5. render worker
6. GPU worker

GPU readiness is heavy and can be deferred for non-GPU staging. It remains required for later GPU/model phases and stays production-blocked until model-weight, license, and GPU readiness approvals pass.

## Command Plan

Run the plan command to print the readiness commands as text:

```bash
npm.cmd run activation:container-readiness:plan -- --image-tag staging-test-001
```

The output is not executed by Codex. Human readiness runs require explicit image variables and `REEDITPRO_CONFIRM_CONTAINER_READINESS=true`.

## Report From Logs

After humans run readiness and save logs as local text files, parse them with:

```bash
npm.cmd run activation:container-readiness:report -- --image-tag staging-test-001 --log path/to/api-readiness.log
```

Use repeated `--log` flags for multiple image logs. Unknown logs are treated as blocked evidence until they can be tied to a known image.

## Next Phase

Phase 22 is GCP staging foundation setup preparation. Phase 21 may say Phase 22 setup is ready even while Phase 23 image push remains blocked. Phase 22 validates staging config, resource names, IAM, buckets, secret placeholders, and command plans, but it does not run `gcloud`, deploy services, or unblock beta.

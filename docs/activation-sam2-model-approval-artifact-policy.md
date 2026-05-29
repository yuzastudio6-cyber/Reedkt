# Phase 35A SAM2 Artifact Policy

Phase 35A creates only small source-controlled policy, report, smoke, and
runbook files. It must not create private runtime artifacts.

## Allowed Artifacts

- static TypeScript evidence and report modules
- static CLI output
- smoke test output
- markdown runbooks and policy docs

## Blocked Artifacts

- SAM2 model weights
- checkpoint files
- generated masks
- generated cutouts
- generated videos or images
- activation logs from cloud jobs
- public URLs or signed URLs as source of truth
- cloud credentials or secret values

## Future Storage Policy

If Phase 35B is approved later, checkpoint files must be downloaded outside the
repo, checksummed, and uploaded only to private staging storage under:

`gs://reeditpro-staging-reeditpro-generated-assets/model-weights/sam2/<model>/`

No SAM2 model file may be committed to git.

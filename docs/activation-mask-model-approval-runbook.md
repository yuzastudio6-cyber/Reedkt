# Activation Mask Model Approval Runbook

Phase 33A creates the first mask-model approval workflow. It approves only
`ZhengPeng7/BiRefNet` for staging representative-frame/single-frame
background-removal planning.

## Approved Scope

- Model: `ZhengPeng7/BiRefNet`
- Source: `https://huggingface.co/ZhengPeng7/BiRefNet`
- Purpose: staging single-frame background-removal planning
- Future path: Phase 33B download/load, Phase 33C runtime verification, Phase 33D controlled mask test

## Evaluated Only

- `facebook/sam2-hiera-tiny`
- Meta SAM2 official repository/checkpoints

SAM2 is for future video mask tracking/propagation review. It is not approved
for download or execution in Phase 33A.

## Explicit Non-Actions

Phase 33A does not download model weights, deploy GPU, run GPU jobs, process
frames or video, run masks, run text-behind-subject, call providers, add
secrets, create public URLs, or unblock production/external beta/broad real
media.

## Commands

- `npm run activation:mask-model-approval:plan`
- `npm run activation:mask-model-approval:report`
- `npm run activation:mask-model-weight:summary`
- `npm run smoke:activation-mask-model-approval-workflow`

All commands are static/report-only.

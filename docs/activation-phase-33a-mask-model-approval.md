# Phase 33A Mask Model Approval

Phase 33A adds a static model-weight/license approval workflow for the first
mask/background-removal model.

## Approved

- `ZhengPeng7/BiRefNet`
- staging representative-frame/single-frame background-removal planning only
- manifest: `birefnet_main_staging_v1`
- checksum: `missing_until_download`

## Evaluated Only

- `facebook/sam2-hiera-tiny`
- Meta SAM2 official repository/checkpoints

SAM2 stays blocked for execution until a separate video tracking phase.

## Still Blocked

Production, external beta, paid production, broad real media, GPU deploy, model
downloads, mask execution, text-behind-subject, providers, Revideo, and all
non-mask model tools remain blocked.

Phase 33B is the next step: download/load only approved BiRefNet weights into
private staging storage and record revision/checksum evidence.

# packages/platform

`packages/platform` owns product mode types, platform boundary types, and future capability profile types.

## Allowed

- web/desktop/server product mode types
- platform boundary metadata
- future browser and device capability profile types
- shared static policy data

## Not Allowed

- runtime hardware scans
- local worker execution
- provider calls
- Cloud Run job orchestration
- model weights or model execution

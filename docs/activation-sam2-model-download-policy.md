# Phase 35B SAM2 Model Download Policy

Phase 35B is the only approved download/load phase for the first SAM2 checkpoint:
`sam2.1_hiera_tiny.pt`.

## Decision

- `downloadAllowedInPhase35B=true`
- `licenseDecision=staging_download_approved_by_codex`
- `humanLicenseApprovalRequired=false`
- `runtimeAllowed=false`
- `temporalTrackingAllowed=false`
- `fullVideoMaskAllowed=false`
- `fullVideoTextBehindSubjectAllowed=false`
- `providerAllowed=false`
- `revideoAllowed=false`
- `productionReadyAllowed=false`
- `externalBetaAllowed=false`
- `paidProductionAllowed=false`
- `broadRealUserMediaAllowed=false`

## Source Rules

The runner must verify official SAM2 source evidence before download. If the
official repository no longer clearly identifies SAM2 checkpoints as Apache-2.0,
or if the checkpoint/config URLs no longer match official evidence, the runner
must stop before downloading.

## Execution Boundary

Frontend code must not download, run, or load SAM2. Future runtime workers may
only use this private model artifact after Phase 35C explicitly approves
generated/synthetic runtime verification.

# AI Graphics CPU Static Spec Validation Output Contract

Decision: `ai_graphics_cpu_static_spec_validation_approval_passed_with_warnings`

The future execution lane may produce ignored local evidence and committed sanitized summaries only after its own approval and validation. This approval lane defines the contract but does not execute it.

## Allowed future local evidence shape

- deterministic JSON summaries
- per-tool validation metadata
- checksum or shape metadata if the future execution lane approves it
- no committed generated SVG, image, media, browser output, WebGL/canvas output, public artifact, or signed URL

## Required false current-state booleans

- `staticValidationExecutionApprovedNow=false`
- `staticFixtureExecutionApprovedNow=false`
- `agentExecutionAllowedNow=false`
- `toolExecutionPerformed=false`
- `workerExecutionPerformed=false`
- `routeExecutionPerformed=false`
- `providerRuntimePerformed=false`
- `browserWebglCanvasRuntimePerformed=false`
- `gpuRuntimePerformed=false`
- `modelWeightDownloadPerformed=false`
- `supabaseMutationPerformed=false`
- `sqlExecutionPerformed=false`
- `gcsUploadPerformed=false`
- `publicArtifactCreated=false`
- `signedUrlCreated=false`
- `runtimeReadyNow=false`
- `internalBetaReadyNow=false`
- `externalBetaReadyNow=false`
- `productionReadyNow=false`

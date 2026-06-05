# Tool Capability Manifest Schema

Every tool family should publish a manifest with:

- `manifestVersion`
- `track`
- `toolId`
- `displayName`
- `owner`
- `status`
- `internalTestingReady`
- `internalBetaCandidateReady`
- `productionReady`
- `capabilities`
- `inputs`
- `outputs`
- `artifactPolicy`
- `runtimeRequirements`
- `dependencyRequirements`
- `secretsRequired`
- `modelArtifactsRequired`
- `privacyConstraints`
- `costConstraints`
- `failureModes`
- `blockedUses`
- `allowedConsumers`
- `readinessEvidence`
- `supabaseMilestoneRefs`
- `testCommands`
- `lastValidatedPhase`

Required examples are encoded in the Phase 52A module for MapLibre, SearXNG, Brave Search, AI Tools Remotion graphics, Track B Sharp/libvips, Qwen3-VL/vLLM, and Demucs.

Phase 52B materializes this schema into the canonical 67-record tool capability registry. Each record includes both `lastValidatedPhase` and `lastValidatedRunId` so future agents can trace readiness to a specific activation run. The registry is the source for future multi-agent dry-runs and for Supabase `tool_capabilities` metadata. Runtime execution remains blocked unless a later phase explicitly approves it.

VLM status is `excluded_for_initial_internal_testing` because Phase 39C hit L4/vLLM CUDA OOM during approved safe profiles. Future VLM runtime needs a smaller approved model, quantized artifact, runtime redesign, or approved hardware profile.

Demucs status is `blocked_pending_model_provenance` until approved model artifacts, license/provenance review, checksum manifest, private artifact path, and runtime QA exist.

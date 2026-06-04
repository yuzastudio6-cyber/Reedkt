# Tool Capability Manifest Schema

Every tool family should publish a manifest with:

- `manifestVersion`
- `track`
- `toolId`
- `displayName`
- `owner`
- `status`
- `internalTestingReady`
- `betaCandidateReady`
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
- `testCommands`
- `lastValidatedPhase`

Required examples are encoded in the Phase 52A module for MapLibre, SearXNG, Brave Search, AI Tools Remotion graphics, Track B Sharp/libvips, Qwen3-VL/vLLM, and Demucs.

VLM status is `excluded_for_initial_internal_testing` because Phase 39C hit L4/vLLM CUDA OOM during approved safe profiles. Future VLM runtime needs a smaller approved model, quantized artifact, runtime redesign, or approved hardware profile.

Demucs status is `blocked_pending_model_provenance` until approved model artifacts, license/provenance review, checksum manifest, private artifact path, and runtime QA exist.

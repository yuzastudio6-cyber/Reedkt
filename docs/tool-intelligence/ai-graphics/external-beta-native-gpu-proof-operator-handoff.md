# AI Graphics External-Beta Native GPU Proof Operator Handoff

Decision: `ai_graphics_external_beta_native_gpu_proof_operator_handoff_prepared_with_private_evidence_runtime_blocks`.

This is the operator-facing bridge from the current native GPU proof collection gate to the actual private/native evidence run needed for the 8 GPU/model AI graphics tools. It does not approve external beta, production, route execution, worker execution, tool execution, provider/model runtime, GPU runtime, model download, model load, inference, media processing, storage mutation, signed URLs, or public artifacts.

The source native GPU proof collection must preserve `sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence=21`. Operator handoff is rejected when that proof bridge is missing or stripped.

## Covered GPU Tools

- `torch_torchvision`
- `transformers`
- `sam2`
- `birefnet`
- `real_esrgan`
- `kornia`
- `rembg`
- `transparent_background`

## Private Model Manifests Required

- `sam2`
- `birefnet`
- `real_esrgan`
- `rembg`
- `transparent_background`

## Native GPU Profiles Required

- `gpu_worker_ai_graphics`
- `sam2`
- `birefnet`
- `real_esrgan`
- `rembg`
- `transparent_background`

## Operator Sequence

Run only in the private artifact environment and the approved native `linux/amd64` NVIDIA L4 proof host where noted.

```sh
npm run --silent ai-graphics:model-weight-checksum-evidence-scaffold -- --out-dir .local-artifacts/ai-graphics/model-weight-checksum-evidence
npm run --silent ai-graphics:model-weight-checksum-evidence:validate -- --evidence-dir .local-artifacts/ai-graphics/model-weight-checksum-evidence > .local-artifacts/ai-graphics/model-weight-checksum-evidence/model-weight-checksum-evidence-packet.json
npm run --silent ai-graphics:model-weight-manifest-authoring -- --checksum-evidence-dir .local-artifacts/ai-graphics/model-weight-checksum-evidence --out-dir .local-artifacts/ai-graphics/model-weight-manifests
npm run --silent ai-graphics:model-weight-manifest-review:validate -- --manifest-dir .local-artifacts/ai-graphics/model-weight-manifests > .local-artifacts/ai-graphics/model-weight-manifests/model-weight-manifest-review-packet.json
npm run --silent ai-graphics:gpu-runtime-proof-command-plan -- --manifest-dir .local-artifacts/ai-graphics/model-weight-manifests --script-out .local-artifacts/ai-graphics/gpu-runtime-proof-results/run-native-gpu-proof.sh > .local-artifacts/ai-graphics/gpu-runtime-proof-results/gpu-runtime-proof-command-plan-packet.json
npm run --silent ai-graphics:gpu-runtime-proof-local-preflight -- --detect-host --require-host-eligible > .local-artifacts/ai-graphics/gpu-runtime-proof-results/native-gpu-host-preflight.json
bash .local-artifacts/ai-graphics/gpu-runtime-proof-results/run-native-gpu-proof.sh
npm run --silent ai-graphics:gpu-runtime-proof-result:validate -- --result-dir .local-artifacts/ai-graphics/gpu-runtime-proof-results > .local-artifacts/ai-graphics/gpu-runtime-proof-results/gpu-runtime-proof-result-packet.json
npm run --silent ai-graphics:external-beta-native-gpu-proof-collection -- --external-beta-per-tool-runtime-proof-packet docs/tool-intelligence/ai-graphics/external-beta-per-tool-runtime-proof.json --gpu-runtime-proof-command-plan-packet .local-artifacts/ai-graphics/gpu-runtime-proof-results/gpu-runtime-proof-command-plan-packet.json --model-weight-checksum-evidence-packet .local-artifacts/ai-graphics/model-weight-checksum-evidence/model-weight-checksum-evidence-packet.json --model-weight-manifest-review-packet .local-artifacts/ai-graphics/model-weight-manifests/model-weight-manifest-review-packet.json --gpu-runtime-proof-result-packet .local-artifacts/ai-graphics/gpu-runtime-proof-results/gpu-runtime-proof-result-packet.json --external-beta-native-gpu-proof-collection-policy-ref private://ai-graphics/external-beta/native-gpu-proof/policy --external-beta-native-gpu-proof-collection-schema-ref private://ai-graphics/external-beta/native-gpu-proof/schema --external-beta-native-gpu-proof-collection-host-pool-ref private://ai-graphics/external-beta/native-gpu-proof/host-pool/l4 --external-beta-native-gpu-proof-collection-private-artifact-namespace-ref private://ai-graphics/model-weights --external-beta-native-gpu-proof-collection-telemetry-ref private://ai-graphics/external-beta/native-gpu-proof/telemetry --external-beta-native-gpu-proof-collection-rollback-ref private://ai-graphics/external-beta/native-gpu-proof/rollback > .local-artifacts/ai-graphics/gpu-runtime-proof-results/external-beta-native-gpu-proof-collection-packet.json
npm run --silent ai-graphics:external-beta-per-tool-runtime-proof -- --external-beta-tool-route-runtime-proof-packet docs/tool-intelligence/ai-graphics/external-beta-tool-route-runtime-proof.json --node-runtime-proof-packet docs/tool-intelligence/ai-graphics/node-runtime-proof.json --browser-runtime-proof-packet docs/tool-intelligence/ai-graphics/browser-runtime-proof.json --satori-font-runtime-proof-packet docs/tool-intelligence/ai-graphics/satori-font-runtime-proof.json --gpu-runtime-proof-result-packet .local-artifacts/ai-graphics/gpu-runtime-proof-results/gpu-runtime-proof-result-packet.json --external-beta-per-tool-runtime-proof-policy-ref private://ai-graphics/external-beta/per-tool-runtime-proof/policy --external-beta-per-tool-runtime-proof-schema-ref private://ai-graphics/external-beta/per-tool-runtime-proof/schema --external-beta-runtime-proof-evidence-ref private://ai-graphics/external-beta/per-tool-runtime-proof/evidence --external-beta-runtime-proof-telemetry-ref private://ai-graphics/external-beta/per-tool-runtime-proof/telemetry --external-beta-runtime-proof-rollback-ref private://ai-graphics/external-beta/per-tool-runtime-proof/rollback > .local-artifacts/ai-graphics/gpu-runtime-proof-results/external-beta-per-tool-runtime-proof-recheck-packet.json
```

## Completion Criteria

- Private checksum evidence accepted for 5 model-weight tools.
- Reviewed private model manifests accepted for 5 model-weight tools.
- Native GPU proof results accepted for 6 runtime profiles.
- External per-tool runtime proof recheck accepts 8 native GPU tools.
- External beta and production remain false until later launch gates accept real runtime soak, external QA, cost/concurrency/privacy/rollback, incident response, and owner approval evidence.

## Boundary

GPU runtime is on-demand only. There is no idle GPU service approval and no CPU fallback for the heavy/model tools. This handoff only prepares the deterministic path for private evidence collection.

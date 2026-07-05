# AI Graphics External-Beta Native GPU Proof Collection

Decision: `ai_graphics_external_beta_native_gpu_proof_collection_prepared_with_private_manifest_and_runtime_result_blocks`

This checkpoint connects the external per-tool runtime proof gate to the native GPU proof path for the 8 heavy/model AI graphics tools:

- `torch_torchvision`
- `transformers`
- `sam2`
- `birefnet`
- `real_esrgan`
- `kornia`
- `rembg`
- `transparent_background`

The current external-beta state remains blocked for these tools. The 13 JavaScript graphics tools already have accepted runtime proof evidence, but the 8 GPU/model tools still require the full private model-weight evidence intake and native linux/amd64 NVIDIA L4 proof before they can be rechecked by the per-tool runtime gate.

The source per-tool runtime proof must also preserve the runtime queue service proof bridge: `sourceRuntimeQueueServiceProofBridgeAcceptedWithProvidedEvidence=21`. This prevents stale or stripped proof packets from feeding the native GPU collection path.

For the external Cloud Run path, ready-state also requires the local Cloud Run result collector packet to preserve the native GPU proof collection bridge. A valid GPU proof result packet alone is not enough; the collection gate expects `sourceCloudRunResultCollectorBridgeAcceptedWithProvidedEvidence=6` from the saved private L4 proof logs before it can move to the per-tool runtime proof recheck.

## Runtime Targets

| Tool | Runtime Target |
| --- | --- |
| `torch_torchvision` | `native_linux_amd64_nvidia_l4_gpu_worker` |
| `transformers` | `native_linux_amd64_nvidia_l4_gpu_worker` |
| `sam2` | `native_linux_amd64_nvidia_l4_sam2_runtime` |
| `birefnet` | `native_linux_amd64_nvidia_l4_birefnet_runtime` |
| `real_esrgan` | `native_linux_amd64_nvidia_l4_real_esrgan_runtime` |
| `kornia` | `native_linux_amd64_nvidia_l4_gpu_worker` |
| `rembg` | `native_linux_amd64_nvidia_l4_gpu_worker` |
| `transparent_background` | `native_linux_amd64_nvidia_l4_gpu_worker` |

GPU runtime is on-demand only. No idle GPU runtime is approved, and CPU fallback remains blocked for the heavy/model tools.

## Required Private Evidence

The five model-weight tools that need private checksum evidence and reviewed private manifests are:

- `sam2`
- `birefnet`
- `real_esrgan`
- `rembg`
- `transparent_background`

Current accepted private checksum evidence: `0 / 5`

Current accepted reviewed private manifests: `0 / 5`

Current accepted combined private model-weight evidence intake: `0 / 5`

Current accepted native GPU proof profiles: `0 / 6`

Current accepted Cloud Run result collector profiles: `0 / 6`

Required native proof profiles:

- `gpu_worker_ai_graphics`
- `sam2`
- `birefnet`
- `real_esrgan`
- `rembg`
- `transparent_background`

## Collection Commands

These commands are the collection path for private/local evidence. The generated files must stay under `.local-artifacts/` and must not be committed.

```sh
npm run --silent ai-graphics:model-weight-checksum-evidence-scaffold -- --out-dir .local-artifacts/ai-graphics/model-weight-checksum-evidence
npm run --silent ai-graphics:model-weight-checksum-evidence:validate -- --evidence-dir .local-artifacts/ai-graphics/model-weight-checksum-evidence
npm run --silent ai-graphics:model-weight-manifest-authoring -- --checksum-evidence-dir .local-artifacts/ai-graphics/model-weight-checksum-evidence --out-dir .local-artifacts/ai-graphics/model-weight-manifests
npm run --silent ai-graphics:model-weight-manifest-review:validate -- --manifest-dir .local-artifacts/ai-graphics/model-weight-manifests
npm run --silent ai-graphics:model-weight-private-evidence-intake -- --checksum-evidence-dir .local-artifacts/ai-graphics/model-weight-checksum-evidence --manifest-supplement-dir .local-artifacts/ai-graphics/model-weight-manifest-supplements --manifest-dir .local-artifacts/ai-graphics/model-weight-manifests
npm run --silent ai-graphics:gpu-runtime-proof-command-plan -- --manifest-dir .local-artifacts/ai-graphics/model-weight-manifests --script-out .local-artifacts/ai-graphics/gpu-runtime-proof-results/run-native-gpu-proof.sh
npm run --silent ai-graphics:gpu-runtime-proof-local-preflight -- --detect-host --require-host-eligible
npm run --silent ai-graphics:gpu-runtime-proof-result:validate -- --result-dir .local-artifacts/ai-graphics/gpu-runtime-proof-results
npm run --silent ai-graphics:external-beta-native-gpu-proof-cloud-run-result-collector -- --source-cloud-run-job-scaffold-packet docs/tool-intelligence/ai-graphics/external-beta-native-gpu-proof-cloud-run-job-scaffold.json --logs-dir .local-artifacts/ai-graphics/cloud-run-native-gpu-proof/profile-results --out-dir .local-artifacts/ai-graphics/gpu-runtime-proof-results/cloud-run-extracted-profile-results
npm run --silent ai-graphics:external-beta-per-tool-runtime-proof -- --external-beta-tool-route-runtime-proof-packet docs/tool-intelligence/ai-graphics/external-beta-tool-route-runtime-proof.json --node-runtime-proof-packet docs/tool-intelligence/ai-graphics/node-runtime-proof.json --browser-runtime-proof-packet docs/tool-intelligence/ai-graphics/browser-runtime-proof.json --satori-font-runtime-proof-packet docs/tool-intelligence/ai-graphics/satori-font-runtime-proof.json --gpu-runtime-proof-result-packet .local-artifacts/ai-graphics/gpu-runtime-proof-results/gpu-runtime-proof-result-packet.json --external-beta-per-tool-runtime-proof-policy-ref private://ai-graphics/external-beta/per-tool-runtime-proof/policy --external-beta-per-tool-runtime-proof-schema-ref private://ai-graphics/external-beta/per-tool-runtime-proof/schema --external-beta-runtime-proof-evidence-ref private://ai-graphics/external-beta/per-tool-runtime-proof/evidence --external-beta-runtime-proof-telemetry-ref private://ai-graphics/external-beta/per-tool-runtime-proof/telemetry --external-beta-runtime-proof-rollback-ref private://ai-graphics/external-beta/per-tool-runtime-proof/rollback
```

## External Boundary

This checkpoint performs no dependency install, package-lock mutation, Docker build, GPU runtime, model download, model load, inference, media processing, Tool Route execution, Worker dispatch, provider/model call, Supabase/GCS mutation, signed URL creation, public artifact creation, beta unlock, or production unlock.

The only accepted ready state from this checkpoint is `external_beta_native_gpu_proof_collection_ready_for_owner_review_not_beta_ready`, and only after the combined private model-weight evidence intake, all five private model manifest records, and all six native GPU proof profile results validate.

## Current Result

- Source per-tool runtime proof accepted: `true`
- Source runtime queue service proof bridge accepted with provided evidence: `21 / 21`
- Source Cloud Run result collector bridge accepted with provided evidence: `0 / 6`
- GPU command plan accepted: `true`
- Private checksum evidence accepted for all five model tools: `false`
- Private model manifests accepted for all five model tools: `false`
- Private model-weight evidence intake accepted for all five model tools: `false`
- Native GPU runtime proof results accepted for all six profiles: `false`
- Cloud Run result collector accepted for all six profiles: `false`
- Ready for per-tool runtime proof recheck: `false`
- Agent can select for planning: `true`
- Agent can execute tools now: `false`
- GPU runtime should start now: `false`
- External beta ready now: `false`
- Production ready now: `false`

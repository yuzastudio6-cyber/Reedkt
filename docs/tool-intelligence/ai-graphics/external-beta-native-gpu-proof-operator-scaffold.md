# AI Graphics External-Beta Native GPU Proof Operator Scaffold

Decision: `ai_graphics_external_beta_native_gpu_proof_operator_scaffold_prepared_local_only`.

This scaffold turns the native GPU proof operator handoff into local files an operator can use in the private evidence environment. It writes a handoff packet, guarded shell script, env example, and checklist under an ignored local output directory. It does not execute tools, run Docker, start GPU runtime, download model weights, load models, run inference, process media, mutate Supabase/GCS, create signed URLs, create public artifacts, or unlock external beta/production.

## Command

```sh
npm run --silent ai-graphics:external-beta-native-gpu-proof-operator-scaffold -- \
  --external-beta-native-gpu-proof-collection-packet docs/tool-intelligence/ai-graphics/external-beta-native-gpu-proof-collection.json \
  --operator-runbook-policy-ref private://ai-graphics/external-beta/native-gpu-proof/operator-runbook \
  --operator-access-control-ref private://ai-graphics/external-beta/native-gpu-proof/operator-access \
  --native-gpu-host-pool-ref private://ai-graphics/external-beta/native-gpu-proof/host-pool/l4 \
  --private-model-weight-root-ref private://ai-graphics/model-weights \
  --private-telemetry-ref private://ai-graphics/external-beta/native-gpu-proof/telemetry \
  --rollback-ref private://ai-graphics/external-beta/native-gpu-proof/rollback \
  --out-dir .local-artifacts/ai-graphics/native-gpu-proof-operator
```

## Generated Files

- `operator-handoff-packet.json`
- `run-native-gpu-proof-operator.sh`
- `operator.env.example`
- `operator-checklist.md`

## Guardrails

The generated shell script refuses to run unless:

- `REEDITPRO_AI_GRAPHICS_NATIVE_GPU_OPERATOR_CONFIRM=run-native-gpu-proof-on-approved-l4-host`
- `REEDITPRO_AI_GRAPHICS_PRIVATE_MODEL_WEIGHT_ROOT` is set

The script is intended only for an approved native `linux/amd64` NVIDIA L4 host. GPU stays on-demand only. No idle GPU runtime is approved and CPU fallback for `sam2`, `birefnet`, `real_esrgan`, `rembg`, `transparent_background`, `torch_torchvision`, `transformers`, or `kornia` remains blocked.

## Current State

This scaffold improves the external proof collection path, but it does not make the tools external-beta-ready by itself. Current private evidence remains missing until an operator completes the generated workflow:

- Private checksum evidence: `0/5`
- Reviewed private model manifests: `0/5`
- Native GPU proof profiles: `0/6`
- External beta ready now: `0/21`
- Production ready now: `0/21`

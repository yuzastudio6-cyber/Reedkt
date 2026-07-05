# AI Graphics Model-Weight Private Evidence Intake

Decision: `ai_graphics_model_weight_private_evidence_intake_prepared_with_runtime_blocks`

This packet adds a single local/private intake bridge for the five AI graphics tools that require reviewed model-weight manifests before native GPU proof:

- `sam2`
- `birefnet`
- `real_esrgan`
- `rembg`
- `transparent_background`

The bridge combines the existing checksum-evidence validator, manifest-supplement validator, manifest authoring bridge, and manifest-review validator. It is intended for private operator evidence only. It does not commit private refs, download model weights, load models, run inference, start GPU runtime, enqueue workers, call routes, or unlock beta/production.

## Current Public Baseline

- Model-weight manifest tools: `5`
- Private checksum evidence accepted: `0`
- Private manifest supplements accepted: `0`
- Local private manifest drafts ready: `0`
- Reviewed private manifests accepted: `0`
- Native GPU proof input eligible records: `0`
- Ready for native GPU proof input: `false`
- External beta-ready now: `false`
- Production-ready now: `false`

## Local Private Intake Command

```bash
npm run --silent ai-graphics:model-weight-private-evidence-intake -- \
  --checksum-evidence-dir "$REEDITPRO_AI_GRAPHICS_PRIVATE_CHECKSUM_EVIDENCE_DIR" \
  --manifest-supplement-dir "$REEDITPRO_AI_GRAPHICS_PRIVATE_MANIFEST_SUPPLEMENT_DIR" \
  --manifest-dir "$REEDITPRO_AI_GRAPHICS_PRIVATE_MODEL_WEIGHT_ROOT"
```

The command exits nonzero if any private input is supplied but the complete five-tool intake is not ready for native GPU proof. With no private inputs it reports the committed fail-closed baseline.

## Runtime Boundary

This intake can only prepare private evidence for later native linux/amd64 NVIDIA L4 proof. It keeps all execution/runtime/storage/public/beta/production gates false:

- no tool, route, worker, or provider execution
- no browser/WebGL/canvas runtime
- no GPU/model runtime
- no model download/load/inference
- no media processing
- no Supabase/GCS mutation
- no signed URL or public artifact
- no external beta or production unlock

GPU remains on-demand only. It may start only inside a later approved worker/tool-call proof job after private evidence and runtime gates are accepted.

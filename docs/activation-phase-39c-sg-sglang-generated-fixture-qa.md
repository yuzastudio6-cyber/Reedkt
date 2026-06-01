# Phase 39C-SG SGLang Generated Fixture QA

Phase 39C-SG uses the SO3 canary/decomposed QA policy with SGLang as the runtime.

Canary fixtures:

- `canary-basic-shapes`
- `canary-colored-layout`
- `canary-text-and-shape`
- `canary-ui-simplified`
- `canary-caption-safe-zone-simple`

Required generated fixtures after canary pass:

- `generated-object-layout`
- `generated-ui-safe-zone`
- `generated-ocr-vlm-comparison`
- `generated-ambiguous-scene`
- `generated-spatial-reasoning`

Pass thresholds:

- Canary label recall >= `0.80`.
- Canary coarse-region accuracy >= `0.80`.
- Original generated fixture label/alias recall >= `0.60`.
- Original generated fixture coarse-region accuracy >= `0.60`.
- Safe-zone decision cannot be `unknown`.
- Ambiguous fixture must require manual review or high uncertainty.

The canonical Phase 39C-SG report may be composed from validated SG3, SG4, and SG5 outputs only. Freeform SG2 traces are diagnostic and cannot pass the phase alone.

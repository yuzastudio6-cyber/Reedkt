# Phase 39C-Q-SO JSON Schema QA Policy

A Phase 39C-Q-SO pass requires all five generated fixtures:

- `generated-object-layout`
- `generated-ui-safe-zone`
- `generated-ocr-vlm-comparison`
- `generated-ambiguous-scene`
- `generated-spatial-reasoning`

Required gates:

- private PR #87 model payload copy passes
- per-file SHA-256 and aggregate SHA-256 pass
- local model path is used
- runtime auto-download remains blocked
- output validates directly through S1-S5
- object-region QA passes or warns within policy
- safe-zone QA passes or warns within policy
- ambiguous fixture requires manual review or low-confidence behavior
- hallucination/safety QA passes
- private artifact upload passes

Phase 39D, Phase 39E, beta, production, provider calls, public output, broad media, arbitrary media, and Track A stay blocked regardless of this phase result.

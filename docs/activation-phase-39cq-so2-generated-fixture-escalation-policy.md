# Phase 39C-Q-SO2 Generated Fixture Escalation Policy

Generated image fixture inference is allowed only after text-only structured-output proof.

Required fixtures:

- `generated-object-layout`
- `generated-ui-safe-zone`
- `generated-ocr-vlm-comparison`
- `generated-ambiguous-scene`
- `generated-spatial-reasoning`

A pass requires one official PR #87 candidate and one pass-counting strategy to complete all fixtures with direct JSON validation, object-region QA pass or warning within policy, safe-zone QA pass or warning within policy, ambiguous-scene manual-review behavior, hallucination/safety QA pass, and private artifact upload.

Diagnostic repair, markdown stripping, extract-first-json, natural-language parsing, and manual output patching cannot count as a pass.

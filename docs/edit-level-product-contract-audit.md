# Edit Level Product Contract Audit

RP-EDITLEVEL-00 documents the future beta product contract only. It creates no runtime implementation and does not rename the current `basic | pro | premium` TypeScript values.

## Product Contract

Every edit level must produce a professional edit. Higher levels increase depth, polish, analysis, creative layering, QA strictness, review/render budget, and tool usage. They do not control basic correctness.

| Future level | Promise | Analysis and polish meaning |
| --- | --- | --- |
| Normal | Clean professional edit, efficient and reliable. | Clean pacing, basic cut/remove guidance, simple captions when needed, basic export settings, basic Qwen 3.7 reasoning, targeted Qwen2.5-VL only when marker/visual clarification requires it, basic QA, minimal tool budget. |
| Premium | Enhanced creative edit with deeper source understanding. | Stronger story and pacing, source video understanding package, Qwen2.5-VL key visual moments and marker windows, timecoded transcript when speech exists, audio/music/SFX/ducking recommendations, styled captions/cards, stronger Edit Preference/DNA application, Edit Brief prioritized when present, premium QA, medium tool budget. |
| Ultra Premium | Studio-level creative treatment. | Deep source understanding, scene-level Qwen2.5-VL visual analysis, transcript plus speech timing, sound design planning, graphic/text/layout understanding, deep Preference DNA use, Edit Brief strongly recommended, advanced B-roll/captions/cards/motion direction, multi-pass Qwen 3.7 reasoning, strict QA, highest tool budget, higher future render budget and revision budget. |

Normal is not low quality. Normal is the clean professional baseline.

## Current To Future Naming

| Current runtime value | Future display concept | Notes |
| --- | --- | --- |
| `basic` | Normal | Basic already means professional lower-compute editing. Whether it remains an alias is `needs_product_value`. |
| `pro` | Premium | Current Pro broadly maps to enhanced creative depth. Exact migration policy is `needs_product_value`. |
| `premium` | Ultra Premium | Current Premium broadly maps to deepest planning. Exact label and tier policy are `needs_product_value`. |

## Future Profile Shape

Future implementation should document and then add an `EditLevelProfile` only after this audit milestone. Expected fields:

- `level`
- `displayName`
- `promise`
- `analysisDepth`
- `qwenReasoningDepth`
- `qwen25vlVisualDepth`
- `transcriptPolicy`
- `audioPolicy`
- `graphicsPolicy`
- `editBriefPolicy`
- `qaProfile`
- `planComplexity`
- `toolBudget`
- `renderPassBudgetFuture`
- `revisionBudgetFuture`
- `creditEstimateMultiplier`
- `fallbackPolicy`
- `degradedCapabilityNotice`

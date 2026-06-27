# Edit Level Qwen Planning Profile

Status: RP-EDITLEVEL-07 complete as mock/local Qwen planning profile only.

This document defines how future Qwen 3.7 planning should reason for the canonical Edit Levels `normal`, `premium`, and `ultra_premium`. It does not call Qwen, Qwen2.5-VL, DeepSeek, providers, planners, media tools, workers, render/export, Supabase, file-byte reads, external fetches, or credits.

## Profile Shape

The mock profile package is exported from `src/types/edit-level-qwen-planning.ts` and resolved by browser-safe helpers under `src/lib/edit-level-qwen-planning-*`.

Each package includes:

- selected canonical level and public display name;
- Qwen 3.7 reasoning depth;
- planning pass policy;
- future prompt context policy;
- structured output policy;
- Marker Chat behavior;
- Edit Brief marker priority;
- Preference DNA usage;
- QA explanation depth;
- fallback policy;
- usage estimate policy;
- side-effect flags with `mockOnly: true`.

## Level Summary

| Level | Reasoning | Pass policy | Context |
| --- | --- | --- | --- |
| Normal | standard reasoning | single pass | compact prompt context |
| Premium | deep reasoning | two pass | enhanced prompt context |
| Ultra Premium | studio multi-pass reasoning | studio multi pass | studio prompt context |

Normal remains a clean professional edit. Premium and Ultra Premium add reasoning depth, creative layering, stricter QA explanation, and future estimate depth only.

## Runtime Boundary

Runtime `basic | pro | premium` compatibility remains unchanged. The current planner is not migrated to `normal | premium | ultra_premium`. RP07 creates no production route, repository, worker, planner execution, edit plan creation, render, progress, migration, or credit operation.

Next milestone: `RP-EDITLEVEL-08 - Level-Aware QA Gates`.

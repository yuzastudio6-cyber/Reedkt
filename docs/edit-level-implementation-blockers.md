# Edit Level Implementation Blockers

## Blockers And Open Decisions

| Blocker | Status | Notes |
| --- | --- | --- |
| Existing level naming conflicts | Open | Runtime uses Basic/Pro/Premium; future beta labels are Normal/Premium/Ultra Premium. |
| Basic vs Normal naming decision | `needs_product_value` | Decide whether Basic remains an alias for Normal. |
| Runtime profile types | Partially reduced | RP-EDITLEVEL-02 adds mock-safe types/fixtures, but current runtime still uses Basic/Pro/Premium. |
| Where level is persisted | Open | Current mock uses local state and plan metadata; durable persistence is future. |
| Tool budget fields | Mock type exists | RP-EDITLEVEL-02 defines mock-safe tool budget metadata; production values remain future. |
| Credit estimate policy | `needs_product_value` | Multipliers and base budgets need product values. |
| Render budget policy | `needs_product_value` | Future render pass budget values are not defined. |
| Revision budget policy | `needs_product_value` | Future revision budget values are not defined. |
| Qwen2.5-VL runtime readiness | Blocked by backend/runtime | Dedicated runtime files were not present in this checkout. |
| Qwen 3.7 live verification | Blocked by backend/runtime | No model calls in this milestone. |
| Durable persistence | Blocked by backend/database | Supabase/backend execution remains future. |
| Edit Preference/DNA source of truth | Open | Dedicated requested files were missing; Reference DNA exists and future resolver architecture is documented. |
| Missing requested legacy files | Documented | Integration/status docs report missing Qwen/video-context/project-edit type paths, ProjectHome/session pages, internal-testing scenarios, and requested `docs/reeditpro-*` status docs instead of creating placeholders. |
| Repository/API/client layer | Mock-only reduced | RP-EDITLEVEL-03 adds mock-safe access boundaries, disabled Supabase skeleton, and mock local planning-domain route handlers without production routes. |
| UI cards/recommendation behavior | Mock-only reduced | RP-EDITLEVEL-04 adds visible cards, recommendation, selection state, summary, estimate notice, and boundary copy without live planner/tool routing. |
| Level-aware tool capability router | Mock-only reduced | RP-EDITLEVEL-05 connects selected level to mock-safe routing capability packages and UI summaries without execution. |
| Level-aware source video understanding routing | Mock-only reduced | RP-EDITLEVEL-06 connects selected level to mock-safe source context depth, marker windows, future Qwen context policy, fallbacks, and UI summaries without source-tool execution. |
| Level-aware Qwen planning profile | Mock-only reduced | RP-EDITLEVEL-07 connects selected level to mock-safe Qwen reasoning/pass/context/output/fallback/estimate policy and UI summaries without Qwen, planner, edit-plan, worker, render, Supabase, file-byte, external-fetch, or credit execution. |
| Level-aware QA gates | Mock-only reduced | RP-EDITLEVEL-08 connects selected level to mock-safe baseline/premium/ultra QA gate packages, readiness states, fallback notices, and UI summaries without QA tool execution, Qwen, planner, media worker, render, Supabase, file-byte, external-fetch, or credit execution. |
| Level-aware estimates | Mock-only reduced | RP-EDITLEVEL-09 connects selected level to mock-safe time ranges, multiplier-only credit estimates, future render/revision/variant budgets, degraded capability notices, and UI summaries without credit reservation/spend/records, planner execution, media worker, render, Supabase, file-byte, external-fetch, or provider execution. |

## Runtime Gates

Future implementation must remain behind plan approval, credit estimate approval, approved snapshot policy, backend worker boundaries, and provider/model routing policy. No Qwen, provider, planner, media, render, Supabase, gcloud, Docker, credit operation, or credit record creation is authorized by the RP-EDITLEVEL mock/local architecture.

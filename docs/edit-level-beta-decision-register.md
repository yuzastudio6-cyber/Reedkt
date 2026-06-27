# Edit Level Beta Decision Register

This register is not an approval blocker. It records product values not found in the repo. Unknown values are marked `needs_product_value`.

| Decision | Current recommendation | Status |
| --- | --- | --- |
| Final labels | Normal, Premium, Ultra Premium | Architecture documented in RP-EDITLEVEL-01. |
| Basic remains alias for Normal | Keep as compatibility alias during migration if product agrees. | `needs_product_value` |
| Current Pro maps to future Premium | Use as conceptual compatibility mapping. | `needs_product_value` |
| Current Premium maps to future Ultra Premium | Use as conceptual compatibility mapping. | `needs_product_value` |
| Default recommendation rules | Recommend Normal for low-credit/simple clean edits, Premium for stronger creative polish, Ultra Premium for studio/deep-analysis requests. | `needs_product_value` |
| Ultra Premium minimum tool requirements | Qwen 3.7 multi-pass, Qwen2.5-VL scene-level plan when visual context matters, transcript/speech timing when speech exists, stricter QA. | `needs_product_value` |
| Credit multiplier values | Not defined. | `needs_product_value` |
| Revision budget values | Not defined. | `needs_product_value` |
| Render pass budget values | Not defined. | `needs_product_value` |
| Variant budget values | Not defined. | `needs_product_value` |
| Degraded capability copy | Explain unavailable brief/DNA/visual analysis without implying low quality. | `needs_product_value` |
| RP-EDITLEVEL-02 type placement | Added isolated `src/types/edit-level.ts`, lib fixtures/mappers, request/response-only contracts, scenarios, and orchestrator. | Complete for mock foundation. |
| RP-EDITLEVEL-03 route/repository scope | Added mock repository, MockDatabase collections, disabled Supabase skeleton, mock local planning-domain route handlers, and browser-safe client wrapper. | Complete as mock-only; no production route or runtime wiring. |
| RP-EDITLEVEL-04 UI scope | Added visible Normal/Premium/Ultra Premium cards, recommendation banner, selected summaries, estimate-only notices, and mock selection save/update. | Complete as mock/local UI; no runtime planner/tool routing. |
| RP-EDITLEVEL-05 tool routing scope | Use selected public level to drive mock-safe capability routing policy. | Complete as mock/local router; RP-EDITLEVEL-06 source understanding routing is next. |

## Non-negotiable Product Rule

Normal is a professional edit. Premium and Ultra Premium add depth, polish, analysis, tool coverage, QA strictness, and future iteration budget, not basic correctness.

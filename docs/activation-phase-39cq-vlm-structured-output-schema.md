# Phase 39C-Q-SO Compact JSON Schema

The compact schema is `phase39c_qwen_vlm_v1`.

Required root fields:

- `fixture_id`
- `candidate_id`
- `prompt_template_id`
- `schema_version`
- `objects`
- `text_like_regions`
- `safe_zone_suggestions`
- `spatial_relations`
- `uncertainty`
- `blocked_actions`

The schema rejects additional root fields. Boxes are normalized `[x1, y1, x2, y2]` with values in `0..1`, and `x1 < x2`, `y1 < y2` are enforced by the internal validator.

The pass-counting validator rejects markdown/code fences, prose wrappers, mismatched fixture/candidate IDs, wrong schema version, invalid coordinates, forbidden tool/provider/public-output claims, and ambiguous fixture outputs that do not set `manual_review_required`.

S6 deterministic repair is diagnostic only. A repaired output cannot complete Phase 39C-Q-SO.

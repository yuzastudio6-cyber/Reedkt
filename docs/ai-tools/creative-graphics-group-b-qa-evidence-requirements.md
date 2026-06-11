# Creative Graphics Group B QA Evidence Requirements

Prompt: `GD-9`

Decision state: `group_b_partially_ready_for_gd10`

GD-9 defines QA evidence requirements for a future GD-10 prompt. No Group B fixture execution or artifact generation is approved in this prompt.

## Per-Tool Requirements

| Tool ID | GD-10 classification | Required QA evidence | Required blocker handling |
| --- | --- | --- | --- |
| `anime_js_motion` | `approved_for_gd10_controlled_local_fixture_execution` | Import proof, synthetic input manifest, local-only motion/timing result summary if executed in GD-10, checksum summary, duration/timing assertions, blocked-use assertion, and skipped-tool blocker code when unavailable. | Fail closed if runtime import fails, browser assumptions appear, or dependency mutation would be needed. |
| `lottie_web_overlays` | `approved_for_gd10_manifest_only_fixture` | Import proof, synthetic Lottie manifest summary, overlay metadata placeholders, adapter-review blocker, blocked-use assertion, and no player/render proof. | Fail closed if player/browser execution is attempted before adapter review. |
| `remotion_graphics` | `approved_for_gd10_manifest_only_fixture` | Import proof, synthetic composition manifest summary, timing metadata placeholders, Track A boundary note, blocked-use assertion, and no render/export proof. | Fail closed if render/export is attempted or if `@remotion/renderer` becomes required. |

## Cross-Cutting QA Requirements

- Evidence must stay local/private and synthetic.
- `.local-artifacts/` evidence remains ignored unless a later prompt explicitly preserves sanitized summaries.
- All success claims require a runtime-created local output plus manifest/checksum evidence; otherwise the tool is skipped or blocked.
- `lottie_web_overlays` and `remotion_graphics` may not be marked as controlled local execution passed from manifest-only evidence.
- `anime_js_motion` may not be marked as production-ready from synthetic timing evidence.
- Group B evidence does not change full internal beta status.

Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`


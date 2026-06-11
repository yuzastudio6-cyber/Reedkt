# Creative Graphics Group B GD-10 Allowed Scope

Prompt: `GD-9`

Decision state: `group_b_partially_ready_for_gd10`

GD-9 allows a future `GD-10 - Group B Controlled Local Fixture Execution` prompt to consider only the scopes below. GD-9 itself does not run Group B fixtures.

## Tool Scope

| Tool ID | GD-10 allowed scope | Required skip condition |
| --- | --- | --- |
| `anime_js_motion` | Controlled local synthetic motion/timing fixture evidence only. | Skip if `animejs` import fails or requires browser/runtime behavior not already available without dependency mutation. |
| `lottie_web_overlays` | Manifest-only fixture evidence only. | Skip any player/browser behavior until adapter review exists. |
| `remotion_graphics` | Manifest-only fixture evidence only. | Skip any render/export behavior; Track A remains the owner for preview/final composition. |

## Evidence Scope

Future GD-10 evidence may include:

- ignored local/private output paths under `.local-artifacts/ai-tools/gd-10/<run-id>/` for any actually allowed local-only attempt;
- synthetic input manifest summaries;
- artifact manifest placeholders;
- checksum summaries;
- QA evidence JSON summaries;
- Track A handoff placeholders;
- skipped-tool blocker codes.

Future GD-10 evidence must use placeholders for private artifact path, approved plan snapshot, Supabase artifact row, checksum/provenance, and Track A handoff references.

## Required Boundaries

- No provider/model calls.
- No worker execution.
- No browser capture.
- No media processing.
- No upload/storage transfer.
- No signed URL creation.
- No public artifact creation.
- No dependency mutation.
- No beta unlock.
- No production unlock.
- No Supabase mutation.
- No SQL execution.
- No Google Cloud or Secret Manager access.
- No Remotion final render/export.

Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`


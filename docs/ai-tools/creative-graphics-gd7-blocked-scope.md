# Creative Graphics GD-7 Blocked Scope

Status: `approved_for_gd7_controlled_local_fixture_execution / blocked_scope_preserved`

GD-7 may not:

- call providers or models;
- run workers;
- execute raw prompts as source instructions;
- upload to GCS or any storage service;
- create signed URLs;
- create public artifacts;
- mutate Supabase;
- run Supabase lifecycle commands;
- run SQL;
- run Track A final render/export;
- use real user media;
- run map/geospatial tools;
- run sound/music/audio tools;
- perform Track B general media processing;
- not run Docker or Cloud Run;
- call Google Cloud APIs;
- fetch Google Cloud Secret Manager metadata or values;
- change dependencies without separate approval;
- create broad service-role handlers;
- unlock internal beta, external beta, production, paid production, or broad media.

Group B tools blocked until package/runtime review:

- `anime_js_motion`
- `lottie_web_overlays`
- `remotion_graphics`

Group C tools blocked until a later canvas/3D-specific approval:

- `pixijs_canvas_graphics`
- `three_js_visuals`

Supabase update required: `docs/status only`
Supabase update status: `docs_only`
Supabase environment touched: `none`
SQL executed: `none`
Migration deployed: `no`

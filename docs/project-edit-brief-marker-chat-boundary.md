# Project Edit Brief Marker Chat Boundary

RP-EDITBRIEF-07 is mock/local only.

Allowed:
- append marker-scoped user messages;
- append deterministic mock assistant messages;
- save deterministic marker intent;
- save marker confirmation metadata;
- update safe marker statuses through existing mock routes;
- refresh drawer/timeline/detail state.

Blocked:
- Qwen, DeepSeek, embeddings, vector DB, provider/model calls;
- no Qwen, no provider, and no Supabase production behavior;
- planner execution or plan application;
- uploads, file-byte reads, external URL fetches, signed URLs, media processing;
- Supabase commands, migrations, remote SQL, remote writes, generated DB types;
- workers, render/progress, credits, staging, commit, cleanup, or `ChatNativeEditor` changes.

Production ready: false.

## RP-EDITBRIEF-12 Verification

Marker Chat is included in the consolidated Edit Brief E2E path. It remains marker-scoped and must not pollute the main Edit Chat stream. It captures deterministic mock intent only and does not call Qwen, DeepSeek, providers, embeddings, Supabase, media tools, workers, render/export/progress, or credits.

## RP-QWEN-BETA-01 Boundary

The beta backend bridge can call Qwen only from server code with explicit beta runtime gates. Browser code still receives marker-scoped route data and no secrets. Disabled config, Secret Manager failure, provider failure, timeout, invalid schema, unsafe response, rate limit, and empty response all use deterministic fallback.

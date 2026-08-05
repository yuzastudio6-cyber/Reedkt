# Track All retirement map

This map is enforced by static validation before final freeze.

Run `npm run test:track-all-retirement`. The validator hashes the active Track
All TypeScript surface and proves one runtime registration, no SAM2 import or
route, no superseded orchestra-binding or legacy planning-skill import, no
production binding, no public-plugin-to-private-mini-skill import, strict
active artifact schemas, and the forward-only SAM 3.1 V2 authority.

| Surface | Classification | Active-route decision |
|---|---|---|
| `server/edit-skills/core/**` | keep | shared plugin/manifest/runtime kernel |
| `server/edit-skills/b-roll/**` | keep | frozen V1 consumer compatibility; never Track All runtime owner |
| `server/workers/masks/canonical-track-all-sam3_1-orchestra-binding.ts` | supersede | compatibility evidence only; public Track All plugin becomes source of truth |
| `tool.sam3_1.segment_and_track_subject.v1` | archive_historical | preserve exact identity/evidence; no semantic mutation |
| canonical SAM 3.1 source/checkpoint/image authorities | keep | exact supply-chain and qualification gates |
| `server/edit-skills/track-all/**` | keep | one authoritative Track All runtime |
| shared `track_graph_v1` schema under B-Roll | refactor | move ownership to shared graph package with frozen projection |
| SAM2 registry/history | archive_historical | readable evidence only; new execution/fallback/repair rejected |
| `tracking_masking_future_planning` orchestra skill | supersede | cannot be an active runtime skill |
| direct peer-skill GPU dispatch | delete from active routing | public dependency plus approved work only |
| raw user prompt GPU dispatch | delete from active routing | server-compiled target prompt only |
| caller-selected model/module/class/checkpoint/GPU/command/path/URL | delete from active routing | strict schemas reject fields |
| CPU heavy inference fallback | delete from active routing | no silent fallback |
| unbounded sessions or ranges | delete from active routing | bounded chunks and authority |
| duplicate Track Graph schemas | supersede | shared V1/V2 owner |
| silent low-confidence acceptance | delete from active routing | repair, review, or block |

Historical migrations, immutable evidence, old attempt records, Git history, B-Roll V1 compatibility, and SAM 3.1 supply-chain work are never rewritten.

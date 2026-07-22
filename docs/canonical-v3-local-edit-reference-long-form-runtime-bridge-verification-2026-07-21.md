# Canonical V3 Local Edit Reference Long-Form Runtime Bridge — 2026-07-21

Status: `local_postgres_runtime_bridge_verified_production_blocked`

This slice mounts the isolated canonical V3 distributed pre-plan study state
behind the existing `EditReferenceLongFormStudyRuntimePort`. It replaces no
product route, Study Chat, Edit Preference, Preference DNA, application,
planner, upload, or worker authority. It changes no historical
`supabase/migrations/` file and performs no remote mutation.

## Runtime path

For a source-backed library Edit Preference, the existing Edit Reference
service still inspects the immutable private source, builds the established
long-form plan, and prepares verified ingest-integrity and media-probe
results. The local bridge then:

1. validates the exact user/workspace/reference/study/source binding;
2. compiles the established plan into the canonical distributed pre-plan
   seed and dependency graph;
3. enqueues that graph through the fixed seven-operation PostgreSQL state
   port;
4. commits the two prepared preflight results as domain results with zero
   provider cost and zero infrastructure cost;
5. reconstructs the high-level plan/run through the new read-only projection;
6. applies pause, resume, cancel, and exact replay through the same durable
   state authority.

The projection RPC is read-only. It is not an eighth mutation operation and
does not expose a lease credential, signed URL, private path, provider secret,
service-role credential, customer price, credits, wallet, billing, or service
fee.

## Hours-long reliability proof

The real loopback PostgreSQL smoke uses an immutable six-hour, 250 GiB source
authority and proves:

- 36 bounded source chunks;
- 292 server-derived dependency work items;
- no whole-study wall-clock timeout and no browser-session dependency;
- exact enqueue replay;
- recovery after the first preflight claim commits but its response is lost;
- exactly one preflight attempt after that response-loss recovery;
- durable read after constructing a new runtime instance;
- exact pause replay, resume, and cancel;
- two retry-eligible deterministic failures exhaust the original attempt
  budget, enter operator review, and only an authorized, idempotent recovery
  adds one bounded attempt (`maximumAttempts: 2 -> 3`);
- the two completed preflight results remain completed after cancellation;
- a second user in a second workspace cannot read the first workspace run;
- the bridge refuses to fabricate target-video source authority.

The two-minute local HTTP request timeout applies only to an individual
control-plane RPC carrying a bounded, validated request or projection. It is
not a timeout for the whole video study, which is intentionally resumable and
may run for minutes or hours.

## Deliberately closed execution gates

The bridge returns a truthful blocked scheduling result. It does not dispatch
a worker, read a private media object, create an output artifact, call Kimi,
Qwen, DeepSeek, Qwen2.5-VL, or any other provider, or calculate customer
pricing. The existing Kimi-primary reasoning contract and Qwen2.5-VL
visual-only role remain unchanged.

The isolated database currently owns canonical library preference assets but
does not own the exact-edit target-source media record used by target-video
study. The bridge therefore accepts `preference_asset` only and rejects
`target_source_media`; it does not fall back to a second store or invent an
asset row. A future same-release source-authority adapter must close that gate.

## Verification boundary

The local verification runner resets the isolated database, provisions two
local Auth users, installs controlled tenant/source fixtures, runs the lower
distributed-state proof, runs the high-level six-hour bridge proof, checks SQL
postconditions and grants, executes the mounted signed-in browser journey,
and completes the existing 49-table backup/reset/restore rehearsal.

Final uninterrupted evidence:

- 11 isolated migrations and 130 manifest-verified files;
- all seven distributed mutation operations plus the read-only projection;
- 36 chunks and 292 work items for the six-hour source;
- one mounted Chromium lifecycle test passed;
- backup archive SHA-256
  `d3bd85f394b51e09cc128a5df020c811812588ceb368cf52f7009be38ed590c7`;
- restored state SHA-256
  `3cb2b5563736658d481183a518c56484a9926cad2149a16bb7ec54dbe1764a0a`;
- all 49 reviewed data tables restored with the operator-recovery generation
  and expanded attempt ceiling intact.

This evidence is local and non-promotable. Remaining production gates include
a reviewed forward migration, deployed Auth/RLS/Storage, same-release private
source authority, multi-replica lease recovery, authenticated worker dispatch,
live private-object reads, provider/checkback/cost qualification, staging
recovery, observability, secrets, billing, deployment, and public acceptance.

`productionAuthority` and `productionReady` remain `false`.

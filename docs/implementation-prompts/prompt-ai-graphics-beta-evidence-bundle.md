# Prompt AI Graphics Beta Evidence Bundle

Implement a server-only validator that checks whether the 21 AI graphics tools
are installed or represented for the correct ReeditPro surface and whether a
complete evidence bundle makes all 21 beta-eligible.

The validator must stay fail-closed by default. It may report all 21 tools
beta-eligible only when Node runtime proof, browser runtime proof, Satori font
runtime proof, approved plan snapshot, credit reservation, artifact boundary,
Tool Route, Worker, browser/canvas/WebGL sandbox, native GPU runtime proof,
reviewed model-weight manifests, and internal beta owner approval gates are
supplied as evidence.

Legacy GPU/model boolean override flags must not satisfy the final all-21 beta
evidence bundle. Require actual native GPU runtime proof and model-weight
manifest packets for all-21 eligibility.

Do not install dependencies, mutate `package-lock.json`, run tools, run routes,
run workers, call providers/models, run browser/WebGL/canvas runtime, run GPU
runtime, download model weights, process media, mutate Supabase, upload to GCS,
create signed URLs, create public artifacts, or unlock beta/production.

Latest observed implementation PR state after proof hardening: [#862](https://github.com/yuzastudio6-cyber/Reedkt/pull/862), open/draft/CLEAN at `b005621cd930fd2209aa8398c7e132748e7c3d16`, with an empty check rollup.

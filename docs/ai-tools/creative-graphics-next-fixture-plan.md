# Creative Graphics Next Fixture Plan

Status: `generated_local_fixture_candidate_prepared`

## GD-2 - Creative Graphics All-Tools Dry-Run Fixture Pack

- Goal: create synthetic dry-run fixture definitions for all 12 tools.
- Allowed scope: docs, fixture schemas, static diagnostics.
- Blocked scope: tool execution, worker execution, render/export, providers, Supabase, SQL, cloud, public artifacts.
- Tools covered: all 12 GD tools.
- Evidence created: fixture input shape, expected private artifact type, QA checks, blocked uses.

## GD-3 - Creative Graphics Generated/Local Fixture Candidate Pack

- Goal: prepare generated/local candidate plans for all 12 tools.
- Allowed scope: static candidate manifests, private artifact placeholders, QA evidence templates, and handoff candidates.
- Blocked scope: actual generated artifacts, uploads, signed URLs, public artifacts, runtime execution, Track A final render/export.
- Tools covered: all 12 GD tools.
- Evidence created: local artifact placeholders, private artifact placeholders, QA evidence templates, Track A handoff candidates, worker envelope candidates.

## GD-4 - Creative Graphics Motion/Animation Fixture Candidate

- Goal: prepare local candidate plans for motion, canvas, 3D, and Lottie overlay outputs.
- Allowed scope: local fixture plans and future candidate docs.
- Blocked scope: runtime execution, worker execution, browser capture, render/export.
- Tools covered: Remotion graphics, Three.js, PixiJS, Anime.js, Lottie-web.
- Evidence required: timing context, fps/duration fields, alpha and safe-zone requirements.

## GD-5 - Creative Graphics Track A Handoff Dry-Run

- Goal: verify private artifact manifests can be handed to Track A without transferring ownership.
- Allowed scope: dry-run handoff docs and static validation.
- Blocked scope: final composition, final render/export, delivery, public artifacts.
- Tools covered: all GD tools with Track A handoff fields.
- Evidence required: handoff field completeness and Track A boundary compliance.

Recommended next prompt: `Prompt GD-4 - Creative Graphics Static Validation and Fixture Gate Review`.

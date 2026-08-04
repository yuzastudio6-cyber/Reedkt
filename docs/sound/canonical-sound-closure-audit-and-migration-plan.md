# Canonical Sound closure audit and migration plan

> Historical migration record: version 3 has been superseded by the immutable Sound
> `4.0.0` closure documented in `canonical-sound-final-execution-audit.md` and
> `canonical-sound-standalone-closure-report.md`.

Status: implementation input for the standalone Sound closure. This artifact records repository evidence before the closure changes; it is not a qualification claim.

## Evidence inspected

- Canonical Sound branch: `codex/canonical-sound-skill` at `e0b94e56e63164a35a02030554b9d1cda74c0254`.
- Accepted shared-kernel branch: `codex/reeditpro-b-roll-skill-end-to-end` at `cb6e55518d7ac4cda9e9325b38cb53bea5076080`.
- Common base and remote default at the time of audit: `e405e69e1a43fd2609854d8acaa7a4ef959b7e94`.
- Existing Sound contracts, scope guard, controller, 24 tool manifests, 18 route manifests, local FFmpeg/FFprobe processor, Mirelo 1.6 adapter, private artifacts, smokes, and legacy adapter.
- Shared capability kernel and B-roll registration under `server/edit-skills/core/` and `server/edit-skills/b-roll/`.
- Approved snapshot, work-item, private-persistence, media-worker, provider-attempt, idempotency, cost, and QA foundations.
- Repository timing, SoundSync, SFX, audio, approval, worker, security, privacy, merge-integrity, and migration instructions.
- The two attached capability-registry prompts and the available cached Sound/Music conversation excerpt. The external conversation reader returned an error for conversation `6a70b0e6-e93c-83ea-922c-44f1693af679`; unavailable turns are not treated as read evidence.

## Audit findings

1. `server/edit-skills/core/` is the current neutral shared skill-capability kernel. It supplies the canonical skill keys, qualification vocabulary, immutable hashing, registry, assignment/plan/result envelopes, estimators, qualification receipts, invalidation, revision, and range authority used by B-roll.
2. Sound's older `server/orchestra/` and `src/types/skill-capability-manifest.ts` form a second incompatible generic kernel and include a temporary Head facade. They must be retired as production authority; this Goal must not implement the real Head of Orchestra.
3. Sound's top-level and mini-skill manifests contain informal route aliases even though the route registry already publishes exact keys such as `sound.route.generate.video_sfx.mirelo.v1`. Publication does not yet recursively close all top-level, capability, mini-skill, fallback, lower-cost, tool-operation, and output references.
4. `timelineFps` and `durationSeconds * 30` remain authoritative in several Sound paths. Exact rational rate binding and integer/rational conversion utilities are absent.
5. `prepare_bounded_private_visual_proxy` is declared in a tool manifest and route, but no Sound-owned executable operation performs the range-bound, hash-bound, timebase-bound private media extraction.
6. Existing real local audio execution is operation-level and useful, but no stable Sound-owned `plan/execute/revise/qa` service executes a complete admitted route and returns populated canonical execution results.
7. Current QA is strongest for real local technical analysis and synchronization smoke evidence. Planning QA is mixed with output QA, whole-video continuity is a boolean, and perceptual/material labels exceed the evidence actually produced.
8. Legacy compatibility is mostly isolated, but no active-entry-point scan proves that all production callers must pass the shared manifest, Sound scope guard, invocation service, route admission, and approved operation profiles.
9. A merge-tree rehearsal found five integration conflicts only: `package.json`, `server/security/private-local-persistence.ts`, `server/tool-registry/index.ts`, and two SFX UI files. The newer shared-kernel branch must remain authoritative for current repository foundations while preserving Sound scripts, tool exports, and honest Mirelo UI copy.

## Migration sequence

1. Merge the accepted B-roll/shared-kernel history into the existing Sound branch without rewriting either published history; resolve the five conflicts by preserving the newer repository foundations plus the Sound-specific additions.
2. Move Sound's generic manifest participation to `server/edit-skills/core/`, register Sound beside B-roll, and replace `server/orchestra/` with a compatibility-only boundary that cannot act as a Head or separate registry.
3. Publish a new immutable Sound manifest/skill version using the shared vocabulary and add recursive exact-route/tool/output validation.
4. Add an exact rational timeline-rate contract and centralized drift-free frame/second/sample conversions; bind it through requests, scope, artifacts, SoundSync, local execution, and QA.
5. Implement the allowlisted private bounded visual-proxy operation and connect it to the canonical Mirelo video-conditioned route.
6. Implement one Sound-owned invocation service and in-process route executor for deterministic local, no-Sound, and injected Mirelo paths, using the same execution package future workers can receive.
7. Separate planning, technical, sync, mix, continuity, perceptual/material, provenance, and integration QA; derive qualification from real evidence and downgrade unevidenced claims.
8. Add the legacy bypass scan, cross-kernel B-roll regression, acceptance matrix, documentation, and final security/privacy/authority/qualification review.

The final state intentionally leaves global skill selection, global work graphs, global scheduling, global approvals/cost aggregation, cross-skill conflict resolution, and final composition coordination to the future Head of Orchestra.

## Closure outcome

The migration sequence above is implemented on the canonical Sound branch. The current
immutable execution-integrity publication is skill version `3.0.0` and contract
`sound.skill_contract.v3` through `server/edit-skills/core/`; the former `server/orchestra/`
production façade and `src/types/skill-capability-manifest.ts` remain retired. The stable
Sound-owned boundary is `StandaloneCanonicalSoundSkillService` in
`server/edit-skills/sound/canonical-sound-skill-service.ts`.

All 39 capability entries and 19 mini-skills reference exact `3.0.0` route identities from
the 19-route registry. Publication validation rejects missing versions, hash mismatches,
job mismatches, unproducible outputs, unknown tool operations, missing executable handlers,
invalid fallbacks, and invalid lower-cost claims. Exact rational timeline rates are bound
through request, timeline manifest, compiled operation spec, local execution, SoundSync,
artifacts, proxy generation, and QA.

Standalone evidence includes real private FFmpeg/FFprobe processing, actual output QA, structured whole-video continuity, no-Sound execution, localized revision, and canonical injected Mirelo text/video route execution. The video route uses the real bounded, silent, private visual proxy operation. Mirelo remains planning-qualified with fixture evidence; production activation still requires the external evidence listed in the final closure report. Global Orchestra integration remains pending by design, and the separate Music skill was not started.

# Canonical Music v2 Execution-Integrity Audit

Status: `migration_frozen`

Date: 2026-08-04

Baseline branch: `codex/canonical-music-skill`

Baseline commit: `908f0ea327aa9db57367a829ccfb68f7fdea23e1`

Sound dependency: canonical Sound `4.0.0`, contract `sound.skill_contract.v4`, baseline commit `0eef00d247b040168cf48a8c00a039954fb8595a`.

This audit records the closure gap between the published Music v1 implementation and the execution-integrity contract for the final standalone Music department. It is not a second Music authority and it does not implement the future Head of Orchestra.

## Evidence checked

- The complete attached product and architecture conversation.
- All repository instructions applicable to Music, timing, SoundSync, provider routing, private artifacts, idempotency, security, and Lyria.
- The neutral skill kernel in `server/edit-skills/core`.
- Canonical Sound v4's public service and public request/result boundary.
- Every current canonical Music request, result, supervision, manifest, route, tool, graph, executor, provider, Sound-port, QA, revision, UI-projection, compatibility, fixture, and acceptance surface.
- The clean Music branch and its remote tracking branch.
- The complete v1 Music acceptance suite, Sound acceptance suite, shared-kernel tests, and B-roll regression.

The v1 acceptance baseline passes. That proves the published v1 behavior is reproducible; it does not prove the v2 closure requirements below.

## Findings and disposition

| Area | v1 evidence | Closure disposition |
| --- | --- | --- |
| Shared kernel | Music publishes through `server/edit-skills/core` | Retain; do not create another kernel or Orchestra facade. |
| Public request | `proposedCues` is required and contains most creative decisions | Replace in v2 with resolved context plus optional, explicit user-locked cue constraints. The Music department must derive unconstrained cues. |
| Context loading | Supervision checks reference presence and derives synthetic strings | Implement a hash-validated context resolver and a canonical evidence package that consumes versioned story, scene, transcript, speech, visual, source-audio, transition, and Sound evidence. |
| Music need | No proposed cue usually becomes ambience or no Music | Derive Music need per exact range from evidence, restraint, speech, ambience, user policy, and rights. Missing user Music must never imply generation. |
| Arc and cue sheet | Both mirror caller-proposed cues | Preserve user-locked cues exactly; derive all remaining cue strategy, arc, motif, density, and per-cue creative fields internally. |
| Mini-skills | Forty-one descriptors exist, but several are labels over generic planning routes | Publish v2 descriptors tied to concrete typed operations and evidence, with honest planning/internal/fixture qualification. |
| Acquisition | A route binding may contain many sources, while execution requires exactly one | Evaluate every eligible asset, enforce project/workspace/internal authorization and rights expiry, analyze each actual candidate, and select with typed evidence. Ambiguity must not silently select the first item. |
| Provider generation | Injected Lyria executes private fixture bytes and live mode fails closed | Retain the server-only adapter and reconciliation lifecycle; bind it to a reverified immutable provider profile and execution fingerprint. |
| Candidate analysis | Actual bytes are decoded and all provider candidates are analyzed | Retain and extend to all acquisition sources. Preserve measured/inferred/declared distinctions and independent candidate receipts. |
| MusicSync | Rational timing exists, but source selection normally begins at frame zero and uses limited anchors | Publish MusicSync v2 with source-section selection, intro skip, phrase/section scoring, all sync anchors, ending preservation, loop/stretch limits, and typed rejection. |
| Sound delegation | Uses the public Sound v4 service, but several Music operations collapse or disappear and gain is hard-coded | Add the smallest backwards-compatible, versioned public technical-directive extension needed for lossless Music-to-Sound mapping. Music may not import Sound internals. |
| Route execution | Route admission happens, then broad `unitKind` logic executes; route steps are not the runtime authority | Execute exact immutable route steps through exact tool/version/operation/profile handler identities and emit actual step receipts. |
| Idempotency | Replay cache is keyed only by the caller idempotency key | Add a canonical execution fingerprint. Reuse with different request, context, route, source, provider, Sound, or graph bindings must fail closed. |
| Cost | Provider USD is converted through a literal `0.1` | Use a versioned Music rate-card snapshot and preserve nested Sound cost separately without double counting. |
| QA | Actual technical analysis exists, but speech, continuity, rights expiry, route receipt, and output attribution checks are incomplete | Run distinct planning, technical, structural/MusicSync, speech, narrative, vocal/lyric, reference, culture, continuity, provenance, and integration QA against actual evidence. |
| Revision | Localized replacement exists, but cue discovery is tied to request proposals and cost/replay identity is incomplete | Compile affected v2 cue units from prior artifacts, preserve byte-identical unaffected work and Sound receipts, and fingerprint the revision. |
| UI | Canonical projections exist | Retain projections only; expose evidence/review/blocked states without provider secrets, paths, fake progress, or execution authority. |
| Legacy | Compatibility adapter is planning-only and legacy scans pass | Retain one bounded compatibility projection and strengthen bypass scans for v2. |
| Persistence | Standalone execution uses private artifacts | Retain; no speculative database migration and no global Orchestra persistence. |

## Frozen migration plan

1. Publish Music skill `2.0.0`, contract `music.skill_contract.v2`, v2 request/result/artifact identities, and v2 route/tool/profile identities for every materially changed contract.
2. Preserve v1 only as an explicitly bounded compatibility surface. No v1 identity may silently acquire v2 semantics.
3. Resolve all context before supervision and bind the context-package hash into planning, execution, idempotency, QA, and revision.
4. Make Music autonomously derive Music need, silence, arc, motif, cue density, and cue sheets while preserving explicit locked constraints.
5. Execute every eligible acquisition candidate independently, with rights/scope admission before use.
6. Make immutable route steps and exact handlers the runtime authority; unit kinds remain graph organization only.
7. Publish MusicSync v2 and a lossless typed Music-to-Sound technical directive without exposing low-level Sound execution.
8. Add execution fingerprints, versioned rate cards, honest QA, localized revision, UI projection, and strengthened legacy retirement.
9. Add a v2 acceptance matrix covering all required end-to-end scenarios, run clean-checkout validation, commit the closure report, push, and verify dedicated GitHub CI.

## Explicit boundaries

- The future Head of Orchestra remains unimplemented.
- Music never owns Sound tools, non-musical ambience generation, visual mutation, final mux, render, export, delivery, or publishing.
- Live Lyria stays blocked until account, privacy, retention, commercial, quota, rate, deployment, and private-canary evidence exists.
- Subjective emotional fit, originality, culture nuance, advanced harmonic fit, lyric certainty, and copyright clearance remain confidence-scored, review-required, or unsupported as automatic guarantees.

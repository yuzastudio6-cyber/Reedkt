# Implementation Roadmap

Status: CAP-00 self-review passed; CAP-01 in progress.

## Dependency graph

```text
CAP-00 architecture
  -> CAP-01 skill relationships
  -> CAP-02 domain contracts/lifecycle
  -> CAP-03 transcript lineage/provenance
      -> CAP-04 alignment/diarization qualification
      -> CAP-05 font/Unicode runtime
  -> CAP-06 strategy/opportunity/reservation
  -> CAP-07 picture lock/finish readiness
  -> CAP-08 final-frame occupancy/late resolution
  -> CAP-09 style/legibility
  -> CAP-10 multi-track scene graph
  -> CAP-11 motion/handoffs/camera
  -> CAP-12 sound choreography
  -> CAP-13 Remotion creative runtime
  -> CAP-14 libass/accessibility/localization/export
  -> CAP-15 QA/repair/fallback/invalidation
  -> CAP-16 UI/approval/credits/observability/persistence
  -> CAP-17 end-to-end production readiness
```

Milestones may overlap only when contracts are approved and independent; production gates do not move forward merely because later code exists.

## Milestones

| Milestone | Reviewable outcome | Explicit boundary |
| --- | --- | --- |
| CAP-01 | `caption_design` composite, component relationships, legacy mapping, cycle validation, `no_captions` | no runtime model/tool execution |
| CAP-02 | versioned core plan, opportunity, reservation, approval, profile, lifecycle, dependency schemas | adapters before consumer migration |
| CAP-03 | canonical transcript projections, lineage, transformations, sensitive-text review, timing provenance gate | synthetic timing blocked from final word motion |
| CAP-04 | qualified forced alignment/diarization artifacts and fallbacks | no unreviewed weights/downloads |
| CAP-05 | font registry, sanitizer/metrics/shaping runtime, Unicode fixtures | no unreviewed custom font execution |
| CAP-06 | early strategy, opportunities, integration classes, reservation, blocking metadata | no final choreography |
| CAP-07 | general PictureLockManifest, visual proxy, FinishReadiness, staleness | no finish without stable dependencies |
| CAP-08 | VisualOccupancyManifest, semantic/layout proposal, output recomposition | model observations validated deterministically |
| CAP-09 | executable style/legibility/color/optical sizing and calibration preview | minimum sufficient treatment |
| CAP-10 | simultaneous tracks, depth, anchors, lists, hero, occlusion, B-roll composition | accessible projection always retained |
| CAP-11 | typed motion, mode switching, camera requests, Caption-to-Visual/Living Frame handoffs | StoryTiming owns frames; receivers own visuals |
| CAP-12 | motion-locked sound budget/cues and SoundSync/final-mix handoff | dialogue protection |
| CAP-13 | pinned deterministic Remotion creative renderer | typed specs only, no model code |
| CAP-14 | canvas-aware ASS, SRT/WebVTT, localization, FFmpeg delivery | projection and frame parity |
| CAP-15 | full QA, local repair, fallback, invalidation | required failures block delivery |
| CAP-16 | chat cards, approvals, credits, lineage/metrics, canonical persistence and compatibility | production writes only after security gates |
| CAP-17 | end-to-end, performance, security/license, old snapshot, production-readiness evidence | production remains blocked until every gate passes |

## Required fixture plan

At minimum:

- 9:16 energetic short; 16:9 documentary; long-form television; business talking head; educational explainer;
- accessibility-only and no-caption restraint;
- dual stable/hero tracks; spatial sentence around speaker; behind/in-front subject; object anchor; persistent list; full-screen type;
- Caption-to-Visual map and Caption-to-Living-Frame handoffs;
- overlapping dialogue; busy movement; dark-to-light background;
- crop/reframe, mask, and Living Frame invalidation;
- low-confidence person name and claim-sensitive number;
- custom and malformed fonts; missing glyph;
- Japanese, Arabic RTL, Indic, combining marks, emoji graphemes, translated track;
- reduced motion; alignment failure; diarization uncertainty;
- Remotion-to-libass fallback; old snapshot; multi-aspect recomposition.

## Test plan

For applicable milestones run typecheck, lint, units, contracts/schemas, integration, workers, snapshots, security, storage/path safety, StoryTiming conflicts, font/Unicode fixtures, render smokes, visual regression/golden frames, timing/collision/occlusion/accessibility tests, export validation, and legacy compatibility.

Benchmarks cover semantic accuracy, timing, layout, occupancy, occlusion, contrast, stable read duration, render determinism/performance, resource/cost use, fallback rate, and accessible parity. Thresholds and hardware profiles must be versioned.

## Per-milestone protocol

Every CAP milestone must:

1. re-read applicable repository instructions and canonical Caption Direction documents;
2. inspect the current implementation and identify existing owners/duplicate-lane risk;
3. state intended files and contracts;
4. make the smallest coherent end-state-aligned change;
5. add or update applicable tests and fixtures;
6. run relevant type, lint, contract, worker, security, render, and compatibility checks;
7. review the complete diff for unrelated changes;
8. update canonical documentation and write a milestone report;
9. publish a reviewable checkpoint;
10. continue automatically after milestone self-review; pause only for a real
    product/user approval, security, spending, secret, deployment, migration,
    destructive compatibility, or unreviewed dependency gate.

Milestone reports record phase, status, outcome, files/contracts, reused owners,
duplicates avoided, checks/pass/fail, limitations, scoped blockers, safe
progress, owner decisions, and next milestone.

## Risk register

| Risk | Impact | Mitigation / owner gate |
| --- | --- | --- |
| Truncated conversation or unavailable references | missed nuance | owner approves ledger or supplies canonical transcript/media |
| Duplicate transcript/timing/layout systems | divergence | source-of-truth contracts and adapters |
| Raw migration baseline divergence | unsafe persistence | canonical isolated chain and two-tenant tests |
| Font/model/tool license or security | legal/security exposure | qualification manifests and manual approval |
| Semantic text mutation | misinformation | lineage, sensitive-text review, immutable source |
| Synthetic timing used as truth | bad sync | hard provenance gate |
| Occlusion reduces comprehension | accessibility failure | stable projection and rendered-frame QA |
| Renderer/browser drift | visual nondeterminism | pinned image and golden frames |
| Motion/sound overload | poor edit quality | attention/sound budgets and dialogue priority |
| Cross-system failure | broken continuity | typed handoff/fallback and scoped invalidation |
| Cost or overage drift | unapproved spend | existing estimate/reservation gates and local repair |
| Private asset leakage | user harm | tenant/private storage, safe DTOs, no path/signed URL logs |

## Resolved CAP-00 progression gate

The user explicitly replaced the development owner-review pause with
evidence-backed agent self-review and automatic continuation. CAP-00 passed:
all required documents exist, the 60-section coverage matrix is complete,
links resolve, scope is documentation-only, and the checkpoint is published.

CAP-01 therefore proceeds with the stable `caption_design` compatibility
direction. Unresolved choices are decided during the narrowest applicable
milestone using repository evidence and recorded tradeoffs. Only real external,
production, spending, security, migration, secret, destructive compatibility,
or product/user approval gates pause work.

## General blocker policy

A blocker names one unsafe action, exact missing evidence/approval, affected
milestone, safe parallel work, smallest next step, and fallback. It does not
stop unrelated safe work. Explicit approval is required before deployment,
provider spending, secret changes, unreviewed downloads/fonts/dependencies,
irreversible migrations, billing changes, compatibility-path deletion, or
unresolved product choices.

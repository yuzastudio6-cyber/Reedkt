# Captions Specialist Implementation Roadmap

Status: `CAP-09 contract complete; CAP-05/CAP-08/CAP-09 internal runtime gates tracked; CAP-10 next`

## Dependency graph

```text
CAP-00R reconcile owners, history, and public seams
  -> CAP-01 shared manifest v2 + qualification + call/support/result + harness
  -> CAP-02 internal caption_design composite + mini skills + restraint
  -> CAP-03 strict core domain contracts
  -> CAP-04 transcript lineage and qualified timing provenance
  -> CAP-05 font, shaping, Unicode, and preview/final parity
  -> CAP-06 early strategy, opportunity, reservation, approval envelope
  -> CAP-07 shared picture lock and finish readiness
  -> CAP-08 Visual Intelligence support and final-frame evidence
  -> CAP-09 Track All / SAM 3.1 support evidence
  -> CAP-10 semantic phrase and executable style system
  -> CAP-11 multi-track spatial Caption Scene Graph
  -> CAP-12 StoryTiming, motion, camera intent, and cross-system handoffs
  -> CAP-13 Sound support and dialogue-protected fallback
  -> CAP-14 deterministic Remotion creative renderer
  -> CAP-15 libass, accessibility, localization, and FFmpeg export
  -> CAP-16 complete QA, direct visual inspection, repair, fallback
  -> CAP-17 chat UI, approval, credits, persistence, observability
  -> CAP-18 real-media private qualification
  -> CAP-19 migration and retirement
  -> CAP-20 private internal release and future-Orchestra mounting guide
```

## Milestones and boundaries

| Milestone | Required outcome | Ownership boundary |
| --- | --- | --- |
| CAP-00R | reconciled docs, branches, owners, gaps, keep/adapt/retire, migration, compatibility, checkpoint | no runtime change |
| CAP-01 | `captions` manifest, qualification snapshot, bounded jobs, neutral calls/support/results, standalone harness | no HQ loop, global scheduler, or peer execution |
| CAP-02 | `caption_design`, components, legacy aliases, `no_captions`, cycle/conflict and scene activation | one existing skill catalog |
| CAP-03 | strict strategy through repair domain schemas, hashes, lineage, serialization | contracts do not grant execution |
| CAP-04 | canonical transcript projections, word lineage, sensitive review, alignment/diarization qualification and gates | transcript owner remains external |
| CAP-05 | approved font registry, FontTools/OTS, script fallback, shaping parity | no unreviewed font or runtime download |
| CAP-06 | strategy, opportunities, four integration classes, reservations, blocking metadata, approval envelope, estimate inputs | no final choreography |
| CAP-07 | shared PictureLockManifest, FinishReadiness, lifecycle, dependency and staleness | no Caption-only lock |
| CAP-08 | Visual Intelligence support, occupancy, hierarchy, rendered inspection | no direct Qwen/provider owner |
| CAP-09 | Track All support request/result, SAM 3.1-backed masks/tracks/anchors, OpenCV/Kornia refinement, temporal QA | no direct SAM runtime |
| CAP-10 | semantic phrases, line breaking, typography roles/fonts/size/color/legibility, profiles, calibration | deterministic validation |
| CAP-11 | simultaneous tracks, depth, anchors, environmental/hero/list/B-roll composition, accessibility counterpart | accessible completeness retained |
| CAP-12 | StoryTiming registration, typed motion, stable-read math, Caption-to-Visual/LF/Transition/camera requests, reduced motion | receivers own execution |
| CAP-13 | bounded Sound request, cue eligibility/density, injected fixtures, final-mix dependency, silent fallback | Sound owns audio |
| CAP-14 | multi-track Remotion scene group, masks/anchors, typed motion, deterministic/golden frames, pinned Chromium | Remotion owns final canvas |
| CAP-15 | canvas-aware libass, SRT/WebVTT, localization, multilingual scripts, per-output recomposition, FFmpeg | stable/accessibility parity |
| CAP-16 | semantic through export QA, professional visual inspection, local repairs and declared fallbacks | independent QA approval remains external |
| CAP-17 | chat-native cards/revisions, existing approval/credits, snapshot/persistence, metrics, private tenancy | no browser-local completion |
| CAP-18 | complete real-media private matrix, direct MP4 inspection, per-job qualification | private/internal only |
| CAP-19 | old IDs/styles/plans/snapshots, simple overlay route, retire duplicate/direct owners, rollback | no destructive removal before fixtures |
| CAP-20 | full regression, security/license/performance/cost evidence, release manifest, blocked-job report, mounting guide | `caption_specialist_private_internal_qualified` only |

## CAP-01 dependency rule

The committed base has no neutral shared specialist call family. CAP-01 may
introduce one versioned shared set only after checking for a newly published
one-writer foundation. It must preserve backward readability of manifest v1
where that version enters the base. It must not define Caption-local copies.

If a shared-owner commit is not yet available, CAP-01 can still implement and
test Caption-owned manifest data, qualification policy, job handlers, and
harness behavior behind an internal neutral adapter, but it cannot publish a
conflicting shared DTO or claim the future Orchestra seam complete.

## Required fixtures

The final suite includes bounded video/scene/boundary calls, incoming and
outgoing support, peer/scope/cycle/qualification refusal, simple subtitles,
dynamic social, hero + stable tracks, spatial composition, text behind/in front
of a moving subject, anchors, lists, B-roll, Visual/Living Frame/Transition
handoffs, Sound cues, multi-speaker, low-confidence names/numbers, busy and
changing backgrounds, multilingual/RTL/CJK/Indic/emoji, reduced motion,
multiple outputs, failures/fallbacks, old snapshots, and actual MP4 inspection.

## Milestone protocol

After every milestone:

1. inspect the current committed owners and the complete diff;
2. verify no duplicate owner or authority was created;
3. run focused and relevant aggregate tests;
4. directly inspect generated media when present;
5. repair and rerun failures;
6. update docs and evidence;
7. commit and push a reviewable checkpoint;
8. continue automatically.

A gate blocks only the named unsafe claim. It does not stop unrelated safe work.

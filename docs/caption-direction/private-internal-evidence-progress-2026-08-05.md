# Caption private internal evidence progress — 2026-08-05

Status: `caption_private_internal_evidence_in_progress`

Target: `caption_specialist_private_internal_qualified`

## Outcome

The new `caption-private-internal-evidence-progress-v1` record reports the
actual internal evidence state without using a misleading completion
percentage and without joining evidence from different fixtures into one edit.

- Caption-owned implementations: **41/41**
- Source paths ready for an internal evidence run: **41/41**
- Canonical shared-owner composition mounts: **5/5**
- Terminally qualified jobs from one exact canonical run: **0/41**
- Terminal evidence gates satisfied by one exact canonical run: **0/9**
- Gates with some actual private evidence observed: **5/9**

The final two zeroes are intentional. The implementation is source-ready, but
the evidence currently belongs to several independently scoped tests.

## What the five observed evidence gates mean

| Gate | Current evidence truth |
| --- | --- |
| Canonical transcript | A real private Faster-Whisper run occurred, but direct inspection rejected the transcript. The reviewed-correction owner is mounted; an independent complete audio-truth review has not supplied its actual correction artifact. |
| SoundSync | The actual private Sound/media path executed. Its inspection package explicitly reports `directListeningReviewCompleted: false`, so it is incomplete. |
| B-roll | The canonical B-roll owner, libass overlay, Remotion composite, owner result, authenticated Caption evidence, and sequential resume all ran. Direct visual inspection accepted it with the explicit synthetic-fixture warning. Its scope is not the terminal talking-head edit scope. |
| Backend Caption execution | Two actual real-source Caption renders exist and were inspected, but all 41 Caption jobs have not completed through one canonical work graph/package. |
| Complete-time visual review | Every rendered frame of the real talking-head full/reduced variants was represented and inspected. This proves Caption-owned professional appearance; it is not the shared qualified postrender-AI lifecycle and not independent final QA. |

Visual Intelligence, Track All/SAM 3.1, and independent final QA have
source-ready adapters but no actual record for the terminal run. The final
per-job projection remains blocked by the first eight gates.

## The images the engineering fixtures produce

Color bars, geometry blocks, timers, and exaggerated plates are test media.
They prove frame timing, safe-area behavior, layer ordering, clipping refusal,
and export behavior. They are deliberately **not** examples of the intended
Caption art direction.

The intended-appearance proof uses real talking-head pixels and separate
full/reduced Caption renders:

- full-motion render SHA-256:
  `200abd32615cbed07739243880ed7993998609451ad911a1bddac9e686fa939f`
- reduced-motion render SHA-256:
  `b8b87995c9031a0221a304bd1c06bfe6beeb1c186b5818d28758fd511f606e74`
- direct-inspection contract digest:
  `004ae03efbf920fdf43015ca4523e5371d3613d5cfdcc7124b8b43410914ba4d`

That inspection found no face/gesture obstruction, clipping, phrase overflow,
plate collision, unstable placement, unusable cue transition, or tail
truncation. It deliberately claims neither shared Qwen review nor independent
final QA.

## Closed semantics

The progress record is strict, closed, and digest-bound. It rejects:

- promoting any gate to satisfied;
- changing rejected or incomplete evidence into accepted evidence;
- claiming separate fixtures share one terminal run;
- relabelling direct visual inspection as shared postrender AI;
- claiming terminal completion or public/production authority;
- unknown, inherited, cyclic, stale-digest, or authority-escalating data.

It serializes only byte-free references. Media bytes, local paths, URLs,
credentials, and raw chat are not part of the record.

## Next internal implementation step

Supply the missing evidence through the existing owners, then bind it to one
immutable snapshot, execution package, output set, work graph, and terminal
request. The nearest hard prerequisite is a complete independent audio-truth
review for the rejected real-source transcript. Visual Intelligence, Track
All, complete-time listening review, shared postrender visual AI, and
independent final QA remain separate owner evidence requirements.

Public SaaS rollout, billing activation, production authority, and the central
Orchestra are not required for this private internal target.

## Verification

`npm run smoke:captions-specialist-private-internal-evidence-progress`
performs the focused 21-assertion closed-contract regression. The source-only
Caption integration aggregate includes it and starts no media, model, provider,
or Docker runtime.

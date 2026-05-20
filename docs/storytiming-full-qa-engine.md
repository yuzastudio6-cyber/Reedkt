# StoryTiming Full QA Engine

RP-TIMING-08 adds the mock/local Timing QA Engine for ReeditPro's StoryTiming Master Timing Map. It combines the focused QA layers from caption/cut timing, SoundSync music/SFX timing, signature animation timing, overall rhythm, overlay safety, emotional timing, and render manifest readiness.

This layer is demo-safe. It does not connect to Supabase, run migrations, call providers, process media, render video, create UI, add secrets, or build mobile screens.

## Why Timing QA Matters

Timing QA answers one product question:

```text
Does the edit timing feel professional, understandable, emotionally correct, and render-ready?
```

Individual systems can produce valid timing in isolation, but a full edit can still fail when captions, cuts, music, SFX, Stroke Motion, Graphic Design, Real Motion, and render tracks compete for the same moment. The full QA engine checks those relationships before preview/render/export.

## Combined QA Layers

The full QA pass combines:

- Caption/cut QA for caption sync, readability, speech-cut integrity, and pause preservation
- SoundSync QA for music beat alignment, ducking, SFX hit timing, tail safety, density, and ambience
- Signature QA for Stroke Motion phrase sync, Graphic Design readability, Real Motion entry/settle/face safety, and signature SFX sync
- Overlay safety for caption, face, object, and crowded visual timing
- Overall rhythm for rushed, slow, inconsistent, or dense timing
- Render readiness for manifest integrity, required tracks, unresolved blockers, and mock worker handoff

## Scoring

Category scores start at `100` and subtract deterministic mock penalties:

- low conflict: `4`
- medium conflict: `10`
- high conflict: `22`
- critical conflict: `45`
- QA warning: `8`
- QA requires adjustment: `18`
- QA requires manual review: `22`
- QA failed: `35`

Render-blocking conflicts cap the affected category below `50`. The weighted overall score uses caption/cut, music/SFX, signature timing, overlay safety, emotional timing, overall rhythm, and render manifest integrity.

## Readiness Decisions

The engine returns one decision:

- `ready_for_preview`: timing is clean enough for mock preview
- `ready_with_warnings`: preview can proceed, but notes should be reviewed
- `requires_timing_adjustment`: timing should be fixed before preview
- `requires_user_review`: subjective or instruction-related timing needs approval
- `blocked_for_render`: critical or render-blocking timing issues exist

## Adjustment Recommendations

Recommendations are created from conflicts and failed/warning QA checks. Examples:

- caption overlap: move caption or overlay
- caption too fast: split or extend caption
- cut before meaning: shift cut later
- emotional pause removed: preserve pause or ask user
- music ducking late: start ducking earlier
- SFX hit late: shift hit earlier
- Stroke Motion late: shift/shorten animation
- Graphic unreadable: extend hold
- Real Motion face risk: move or shorten overlay
- crowded moment: stagger or remove decorative events

## Chat Summaries

The QA chat summary gives a user-ready timing status, top issue, readiness decision, adjustment count, and mock-only boundary. RP-TIMING-09 now uses those outputs in compact chat-native timing cards instead of a timeline dashboard.

## Examples

Lake Como/lifestyle QA checks caption readability, soft title SFX timing, ambience preservation, montage density, and render manifest integrity.

Faith/serious QA protects emotional pauses, speech meaning, simple captions, subtle music, and minimal SFX.

Signature QA checks that Stroke Motion lands on phrases, Graphic Design remains readable, Real Motion is face-safe, SFX hits sync, and captions do not collide.

## RP-TIMING-10 Handoff

RP-TIMING-10 consumes the QA report and readiness decision when building a mock render timing manifest. Blocking QA issues keep the manifest in draft/not-ready state; warning-only maps can still produce a mock worker input with explicit worker notes.

## Mock-Only Limits

RP-TIMING-08 stops at mock QA and readiness decisions. RP-TIMING-09 displays those decisions in chat, and RP-TIMING-10 converts approved/mock-ready timing into worker-readable metadata. None of these milestones perform real media inspection, real rendering, provider integrations, Supabase persistence, migrations, or mobile screens.

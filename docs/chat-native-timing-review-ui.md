# Chat-Native Timing Review UI

RP-TIMING-09 adds a mock chat-native review layer for the StoryTiming Master Timing Map.

The goal is not to create a timeline dashboard. ReeditPro remains chat-native: the chat is the editor, and timing review appears only when the user opens the inline StoryTiming review flow.

## What Appears In Chat

The timing review flow shows:

- Master timing map summary
- Story timing segment summaries
- Important timing anchors
- Timing event groups by track
- Timing conflicts
- Full Timing QA report
- Preview/render readiness decision
- Timing adjustment recommendations
- Render timing manifest placeholder
- Mock revision options

Dense technical details remain collapsed by default so the editor stays calm and readable.

## Why Inline, Not A Dashboard

StoryTiming coordinates captions, cuts, music, SFX, Stroke Motion, Graphic Design, Real Motion, transitions, and render markers so the edit lands on speech meaning, story beats, music rhythm, and viewer comprehension.

That information is useful only when the user needs to review readiness, approve timing, or resolve conflicts. A full timeline view would overwhelm the chat flow and duplicate the advanced timeline drawer.

## Cards

`InlineStoryTimingMapCard` shows the master map status, duration, frame rate, authority hierarchy, source systems, readiness decision, warnings, conflicts, and the consolidation rule.

`InlineStoryTimingSegmentCard` shows compact story segment timing, including output ranges, source ranges, authority, speech/music/SFX/caption/signature flags, and emotional pause preservation.

`InlineTimingAnchorCard` shows important word, phrase, music, SFX, signature, and render anchors first.

`InlineTimingEventCard` groups events by captions, cuts, music, SFX, Stroke Motion, Graphic Design, Real Motion, transitions, and render markers.

`InlineTimingConflictCard` explains conflict severity, affected systems, time range, why the issue matters, recommended adjustment, render blocking, and review status.

`InlineTimingQACard` shows category scores, readiness, top issues, recommended actions, and collapsed QA checks.

`InlineTimingReadinessCard` translates readiness decisions into plain language.

`InlineTimingAdjustmentCard` shows mock fix actions without mutating backend records.

`InlineRenderTimingManifestCard` shows the render timing manifest placeholder and worker-readiness status. RP-TIMING-10 can now build the backing mock worker input, but no rendering happens in this mock UI.

`InlineTimingRevisionOptionsCard` gives user-facing choices such as approving timing, applying suggested fixes, preserving pauses, smoothing pacing, fixing music ducking, fixing SFX hit timing, or blocking render until fixed.

## Mock-Only Boundaries

This UI does not:

- connect to Supabase
- run migrations
- call AI or provider APIs
- process video or audio
- render preview/export output
- mutate backend timing records
- build a traditional timeline dashboard
- create mobile screens

The action buttons update local mock chat state only.

## RP-TIMING-10 Relationship

RP-TIMING-10 uses the same StoryTiming report, readiness, and manifest concepts to create mock worker-ready timing payloads. This UI remains the chat review surface while future worker tasks handle execution behind approval and credit gates.

## What Comes Next

Future milestones can connect the approved manifest to real render workers only after backend approval, credit reservation, asset availability, storage, worker queues, and render QA are implemented.

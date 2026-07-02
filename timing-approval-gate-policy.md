# Timing Approval Gate Policy

## Purpose

The timing approval gate makes sure no generation, rendering, tool execution, provider prompt execution, worker runtime, credit deduction, or approved snapshot proceeds with invalid or unconfirmed timing.

## Required Before Approval

Required before approval:

- output frame/aspect ratio is confirmed
- timing base exists
- `MasterTimingPlan` exists
- `CaptionVisualCueTimingPlan` exists when captions or visuals are planned
- `SoundSyncTransitionTimingPlan` exists when transitions, music, SFX, or ducking are planned
- `TimingValidationPlan` exists
- timing validation is not `blocking` or `failed`
- credit estimate includes timing complexity
- approved snapshot includes timing plans and timing validation

## What Happens When Timing Changes

If the user changes aspect ratio, edit level, source order, pacing style, caption style, music/SoundSync preference, visual density, AI video duration, platform, or timeline order, the plan must reset approval, progress, preview readiness, final credit estimate state, and approved snapshot readiness.

Changing timing materially requires a new review and approval.

## Worker Runtime

Future workers use timing plans from approved snapshots. They do not reinterpret raw chat timing. They may refine timing only within approved fallback/QA policy. Material timing changes require a new approval.

This milestone does not implement real workers or execution.

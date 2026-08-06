# Footage Prep And Clean Assembly

Footage Prep is the assistant-editor stage that prepares messy raw footage before creative editing. It runs before serious creative planning when the user uploads rough, repeated, noisy, or untrimmed source media.

## Footage Prep Analysis

Footage Prep should analyze:

- transcript
- speech sections
- silence
- retakes
- false starts
- repeated takes
- bad takes
- strong takes
- hook candidates
- CTA candidates
- possible B-roll moments
- visual quality
- audio quality
- faces
- objects
- screenshots/screen recordings
- on-screen text
- privacy-sensitive content

This milestone documents the production architecture only. It does not implement real transcript analysis, media inspection, trimming, rendering, provider calls, workers, or Supabase wiring.

## Core Objects

### Raw Source

The original uploaded media. It is never modified or destroyed.

### Source Understanding Map

A structured record of what the AI learned from the source media, including speech, scenes, quality issues, strong moments, weak moments, retakes, possible visual support, privacy concerns, and source timing references.

### Cleanup Plan

The proposed assistant-editor cleanup decisions, such as:

- remove silence
- remove false start
- keep best take
- tighten pause
- preserve important emotional moment
- mark bad/noisy section
- flag possible hook
- flag possible CTA

Every cleanup decision should have a reason. The system must not randomly cut footage.

### Clean Assembly

The cleaned, non-destructive starting point for creative planning. It removes obvious dead space, groups retakes, selects strongest takes, and keeps source references. Clean Assembly is not a destructive overwrite of uploaded media.

### Prep Summary

The user-facing summary after Footage Prep. It should explain what changed, what was preserved, and what the user can do next.

Example Prep Summary:

```text
Original length: 12:36
Clean assembly: 4:08

Removed:
- 21 silence sections
- 8 false starts
- 6 repeated takes
- 2 camera setup sections

Preserved:
- Strong intro at raw 00:42
- Best explanation from raw 02:18
- Emotional story from raw 05:10
- CTA from raw 11:44

Next actions:
- Continue with AI plan
- Add Edit Brief
- Add Edit Cues
- Review cleanup decisions
```

## Source Time Mapping

The system must preserve relationships between:

- `raw_source_time`
- `clean_assembly_time`
- `final_edit_time`

Example:

```text
Raw source:
00:01:20-00:01:34

Clean assembly:
00:00:42-00:00:56

Final edit:
00:00:18-00:00:27
```

This matters because the user may create a cue before cleanup. If a user creates a cue at raw `00:40` and cleanup changes timing, the cue must remap to the correct Clean Assembly time before planning or rendering decisions depend on it.

Early timestamp cues created before cleanup should be stored as `pending_cleanup_remap` until they can be mapped to Clean Assembly timing.

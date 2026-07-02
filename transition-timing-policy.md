# Transition Timing Policy

## Purpose

Transition timing controls exactly when and how ReeditPro moves from one segment, layout, or visual state to another. It refines the `MasterTimingPlan` and works with caption/visual cue timing so transitions preserve speech clarity, read time, and story meaning.

## Transition Decision Inputs

Transition timing considers:

- final timeline segments
- speech phrase boundaries
- caption timing
- visual cue timing
- beat grid
- music phrase
- emotional pauses
- layout mode
- aspect ratio
- edit category
- edit level
- user style request
- reference DNA
- QA risk

## Duration Ranges

At a mock 30fps planning base:

- hard cut: 0 frames
- quick graphic pop/wipe: 6-10 frames
- clean social transition: 8-14 frames
- smooth premium transition: 12-24 frames
- documentary crossfade: 12-30 frames
- cinematic/emotional dissolve: 18-45 frames
- map/chart/browser transition: 12-30 frames depending label/read time

These are planning defaults only. They are not media-derived values.

## Safety Rules

- Never cut through important speech unless intentional.
- Never cover captions during a transition.
- Never hide a source label or claim label too fast.
- Avoid flashy transitions for serious documentary unless requested.
- Keep Basic simple.
- Pro and Premium can be more refined.
- Ensure transitions do not create black gaps or flashes.
- Preserve visual read time before transition.

## Fallback Rules

If a transition is risky:

- use a hard cut
- use a phrase cut
- delay to a phrase boundary
- remove SFX
- use crossfade instead of whip
- hold the card longer
- simplify visual exit
- switch to full visual takeover if readability requires it

## Mock-Only Scope

This policy describes typed frontend/mock planning. It does not execute Remotion, FFmpeg, AudioFlux, provider calls, media processing, or worker jobs.

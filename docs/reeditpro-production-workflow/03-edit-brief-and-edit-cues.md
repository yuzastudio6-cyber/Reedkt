# Edit Brief And Edit Cues

Edit Brief and Edit Cues give the user optional control after Footage Prep and Clean Assembly. They are direction for the AI editor, not raw render commands.

## Edit Brief

The optional creative direction space after Footage Prep/Clean Assembly. It captures the user's overall goal, style, platform, audience, pacing, captions, music, B-roll preferences, must-use assets, avoid rules, and special instructions.

Users can skip the brief and let AI continue.

## Edit Cue

A specific instruction attached to a time, transcript phrase, scene, asset, or global project rule.

Edit Cues are optional. The user can skip them and let AI continue.

## Edit Cue Anchors

Edit Cue anchors must include:

- `time_range`
- `transcript_range`
- `scene`
- `asset`
- `global`

## Edit Cue Roles

Edit Cue roles must include:

- `b_roll`
- `overlay`
- `picture_in_picture`
- `split_screen`
- `insert_clip`
- `text_overlay`
- `caption_instruction`
- `graphic`
- `sound_effect`
- `music`
- `reference_only`
- `avoid`

## Edit Cue Priority

Edit Cue priority must include:

- `must_follow`
- `prefer`
- `optional`
- `avoid`
- `do_not_use`

## Edit Cue Timing Flexibility

Edit Cue timing flexibility must include:

- `exact`
- `ai_can_adjust`
- `ai_decides`

## Visual Usage Differences

B-roll temporarily replaces the visual while preserving the main voice/audio unless the user says otherwise.

Overlay appears on top of the current visual and must be composed professionally.

Picture-in-picture appears in a framed area while the main video remains visible.

Split screen shows multiple visuals at once.

Insert clip adds a clip into the edit sequence.

Reference only helps AI understand the project but should not be directly shown.

## Example Edit Cue: Kitchen B-roll

Title: Kitchen B-roll

Where: When speaker says "renovated kitchen"

Asset: `kitchen-tour.mp4`

Use as: B-roll

Audio: Keep main voice, mute B-roll audio

Timing: AI can adjust slightly

Priority: Must follow

Instruction: Show the strongest kitchen shot when this topic is mentioned.

## Example Edit Cue: Dashboard Proof Overlay

Title: Dashboard Proof Overlay

Where: Around clean assembly `00:22`

Asset: `dashboard-proof.png`

Use as: Overlay

Treatment: Floating proof card, right side, rounded corners, soft shadow, blur private info, avoid captions.

Priority: Prefer

## Important Rule

Edit Cues are planning inputs. They are not raw timeline/render commands.

# Source Sequence Review UX

## Purpose

The source sequence review lets the user confirm how uploaded clips should be understood before ReeditPro builds the edit plan. It is an in-chat planning checkpoint, not a separate pre-chat form.

ReeditPro should treat this as one of the first serious editing moments: the user may have uploaded one complete video, a set of story clips, optional b-roll, proof clips, product shots, or clips that are intentionally out of order.

## Key Distinction

### Uploaded order / source order

- The order the user uploaded, filmed, or believes clips belong.
- Used as story and source context.
- Can include important clips, optional clips, b-roll, proof, speaker clips, and ending clips.
- Should be confirmed before approval.

### Final edit order

- The order ReeditPro may recommend for the finished video.
- May differ for hooks, pacing, storytelling, social structure, or clarity.
- Must be shown in the edit plan before being applied.
- Must not be silently inferred from uploaded order.

Uploaded order is source/story context. It is not automatically the final edit order.

## Source Sequence Modes

- `single_complete_video`: one full source video; no reorder is needed.
- `multi_clip_story_order`: multiple clips that appear to already be in story/source order.
- `unordered_clips_needs_ai_help`: clips may be out of order, and ReeditPro can recommend a final structure later.
- `b_roll_plus_main_clip`: one or more main clips with supporting b-roll, proof, detail, or insert clips.
- `mixed_assets`: a blend of footage/assets where source meaning needs extra review.

## Source Order Confirmation

The user should be able to:

- Preview each clip placeholder.
- See uploaded/source order.
- Reorder clips.
- Mark clips as important.
- Mark clips as optional.
- Set a source role.
- Add notes.
- Remove clips.
- Add more mock clips in the frontend prototype.
- Confirm source order.

Confirmation freezes the current source-order context for the mock plan. It does not approve generation, reserve credits, or start progress.

## User-Facing Language

Use clear copy:

- "Are these clips in the right source/story order?"
- "Uploaded order is your source order. I can recommend a stronger final edit structure later, but I'll show you before changing it."
- "Mark optional clips as b-roll or supporting clips if they do not need to appear in order."
- "Source order confirmed. I'll use this as the story/source context."

## No Real Media Processing

In the current frontend prototype:

- No real video playback.
- No real thumbnails.
- No real upload processing.
- No real transcoding.
- No real media analysis.
- Use preview placeholders and typed mock clip metadata.

Future backend/media work can connect uploaded media assets, thumbnails, analysis, transcript, and clip storage.

## Approval Relationship

Source order confirmation is part of the plan context. Changing clip order, clip role, clip notes, important/optional status, or the clip list should reset source confirmation and plan/progress approval state.

If ReeditPro later recommends a final edit order that differs from source order, that recommendation must appear inside the edit plan before the user approves credits or generation.

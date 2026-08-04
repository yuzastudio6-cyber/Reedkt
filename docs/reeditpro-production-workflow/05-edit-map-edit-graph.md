# Edit Map And Edit Graph

This document defines the post-preview editing model. The preview is the main editor, and the detailed timeline is advanced-only.

## Core Concepts

### Edit Map

The user-facing post-preview editing control system.

### Edit Graph

The internal data model behind the Edit Map.

### Edit Document

The full editable representation of a generated preview.

### Edit System

A major connected category such as:

- Story & Cuts
- Captions
- Text & Graphics
- Stroke Motion
- Real Motion
- SoundSync
- Voice Cleanup
- Color/Look
- AI Enhance
- Browser/App Visuals
- Platform Layout

### Edit Group

A connected group inside a system, such as:

- Main Captions
- Hook Captions
- CTA Captions
- Kitchen B-roll
- Dashboard Proof Overlays
- Music Bed
- Whoosh SFX

### Edit Element

A specific visible/audible/timed thing in the edit, such as:

- `caption-line-017`
- `dashboard-overlay-001`
- `kitchen-broll-002`
- `whoosh-sfx-003`

### Edit Operation

A non-destructive post-preview user change, such as:

- `set_system_visibility`
- `set_group_visibility`
- `update_group_style`
- `update_element`
- `replace_asset`
- `move_element`
- `regenerate_element`
- `lock_group`
- `unlock_group`

## UX Rules

- The preview is the editor.
- The detailed timeline is advanced-only.
- Click selects the moment.
- Inspector edits the connected group/system by default.
- Users can change scope when they want a more specific edit.

## Caption Example

User clicks one caption line.

The system resolves:

- selected element: `caption-line-017`
- selected group: Main Captions
- selected system: Captions
- default scope: All Main Captions

Default action:

Hide affects all Main Captions.

Advanced scope:

The user can choose "This caption only" if needed.

This keeps captions connected instead of random disconnected boxes.

## Cue-To-Element Flow

Pre-edit cues become post-preview elements through this chain:

```text
Edit Cue -> Edit Plan -> Professional Integration -> Render -> QA -> Edit Map element
```

Post-preview edits should create structured Edit Operations. If an operation requires new generation, new credits, or a plan change, it should become a revision request with the appropriate approval path.

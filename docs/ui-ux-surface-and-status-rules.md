# ReeditPro Surface And Status Rules

Status: `audit_recommendation`

Status date: 2026-07-10

This document refines `design.md` for the current active desktop/web product. It does not replace the AI Topology Matrix identity; it prevents that identity from becoming a wall of bordered glass and colored badges.

## Core Principle

> Surface treatment communicates hierarchy. Color communicates state. Neither is decoration by default.

The current active UI often gives route headers, page intros, recovery notices, list rows, setting rows, and cards similar dark fills, borders, radii, and spacing. That makes the interface orderly but visually flat: every group looks equally important.

The redesign must use fewer containers and stronger contrast between focal work, ordinary content, inline status, and elevated tools.

## Surface Hierarchy

### Level 0 — Canvas

Purpose:

- Default application background.
- Open work area.
- Chat thread and page whitespace.

Treatment:

- Deep-space foundation from existing tokens.
- Optional very subtle topology/grid atmosphere.
- No page-sized outer card.
- No persistent glow.
- Content is bounded by layout, not by a border around the entire page.

Use for:

- Home background.
- Projects background.
- Project workspace background.
- Chat canvas.

### Level 1 — Focal Surface

Purpose:

- The one thing the user should act on first.

Treatment:

- Strongest controlled contrast from the canvas.
- Restrained glass or subtle gradient edge may be used.
- One clear heading and primary action.
- Generous but not hero-scale padding.
- Normally one Level 1 surface per page state.

Use for:

- Continue Latest Edit.
- Create First Project.
- Plan Review approval moment.
- Upload gate when it blocks the entire edit.

Do not use for:

- Routine recovery copy.
- One status.
- One setting.
- Internal diagnostics.

### Level 2 — Standard Card

Purpose:

- Group a repeated or self-contained item.

Treatment:

- Quiet neutral surface.
- Soft border only when separation is otherwise unclear.
- Little or no glow.
- Consistent compact padding.

Use for:

- Recent edit.
- Project summary.
- Edit session summary.
- A clearly bounded form group.

### Level 3 — Inline Row

Purpose:

- Supporting information or actions that belong together but do not need a card.

Treatment:

- Transparent or minimally tinted.
- Divider, spacing, or alignment creates grouping.
- Compact icon, title, metadata, and action.

Use for:

- Needs Attention items.
- Activity.
- Recovery notice with a trusted local copy.
- Preference status.
- Project/edit list rows when imagery is absent.

### Level 4 — Status Indicator

Purpose:

- State only.

Treatment:

- Dot plus text, icon plus text, inline metadata, or one compact badge.
- Strong semantic color only when it changes meaning.
- Never rely on color alone.
- Avoid multiple strong badges inside one item.

### Level 5 — Elevated Layer

Purpose:

- Temporary or secondary focused work.

Treatment:

- Stronger separation, blur, shadow, and focus management.
- Explicit title and dismiss/back behavior.
- No duplicate source of truth.

Use for:

- Modal.
- Drawer.
- Advanced timeline.
- Internal-testing panel.
- A future current-edit settings surface if its navigation model is approved.

## Full-Width Rule

> A component must not become full-width merely because the content area has available space.

Full-width is appropriate for:

- A true focal workspace.
- A critical blocking notice.
- An editor canvas.
- A timeline or media surface.
- A real table that requires width.

Full-width is usually wrong for:

- A short setup state.
- One connection check.
- One status.
- A two-line explanation.
- One preference.
- Internal diagnostics.

At wide desktop sizes, increase outer whitespace or use an intentional grid. Do not stretch low-information rows to 1600px.

## Container Budget

Before adding a surface, ask:

1. Does this content need a boundary to be understood?
2. Is it more important than surrounding content?
3. Is it repeated and independently actionable?
4. Would spacing, alignment, or a divider be enough?

If spacing or a divider is enough, use Level 0 or Level 3 instead of another card.

Avoid more than two visible nested surface levels in the normal Guided experience. A bordered card inside a bordered card inside a bordered panel is a design failure unless the inner layer is an actual tool, table, or modal-like editor.

## Glass Rules

Glass is a material cue, not the default background for every component.

Use glass for:

- Focal surfaces.
- Floating composer.
- Elevated layers.
- Selected or active AI work areas.

Prefer neutral or transparent treatment for:

- Repeated list rows.
- Routine metadata.
- Attention lists.
- Form labels.
- Read-only summaries.

Every glass surface should have a reason for blur, elevation, or depth. If the glass effect does not help the user understand hierarchy, remove it.

## Border Rules

- Do not begin every component recipe with a border.
- Use border contrast to show separation, selection, focus, or elevation.
- Gradient borders are reserved for rare focal or premium moments.
- Do not stack multiple borders around the same content group.
- Hover should not turn every neutral border cyan.
- Focus-visible may use a stronger accessible ring without changing ordinary hover semantics.

## Shadow And Glow Rules

- Shadows define elevation; glows define rare active state.
- Ordinary cards should not glow.
- Cyan glow is allowed for the primary action, active AI state, or focused composer—not all three in every region.
- Violet glow is rare creative emphasis.
- Semantic warning/error states should not glow continuously.
- Ambient animation must respect reduced motion and never block input.

## Status-Color Budget

### Neutral

Use for:

- Default state.
- Metadata.
- Counts.
- Saved browser copy.
- Optional.
- Inactive.
- Informational persistence state.

Preferred treatment:

- Text.
- Dot plus text.
- Muted compact badge only when scanability requires it.

### Blue

Use for:

- Primary action.
- Strong selected control.

Blue is an action color, not a routine status color.

### Cyan

Use for:

- Current/active ReeditPro AI state.
- Selected navigation or editor tool.
- Focused composer.

Do not use cyan for every eyebrow, icon, border, and status in the same region.

### Green

Use only for:

- Completed.
- Approved.
- Verified success.
- Ready when no further setup is required.

Do not use green for:

- Source needed.
- Source uploaded but planning not done.
- Changes requested.
- Waiting.
- Optional.

### Amber

Use for:

- User action required.
- Needs setup.
- Waiting for approval.
- Changes requested.
- Non-blocking warning.

### Red

Use for:

- Blocking failure.
- Access denied.
- Destructive action.
- Invalid state that prevents progress.

Do not use red for ordinary incompleteness.

### Violet

Use for:

- Rare creative/system emphasis.
- A signature-system moment when it improves recognition.

Do not use violet as a general second status color.

## Strong-Color Limit

Normally, one card or row should contain no more than one strong colored status indicator.

Exceptions require a real comparison task, such as a compact plan matrix where multiple statuses are the content. In those cases, reduce surface color and use direct text labels.

## Current Badge Translation

| Current label | Default future treatment |
| --- | --- |
| `Required` | Remove when the control already communicates required state; otherwise short text, not a decorative badge. |
| `Needs setup` | Amber dot/text when actionable. |
| `Waiting` | Neutral or amber depending on whether the user must act. |
| `Ready` | Green only when genuinely usable now; otherwise neutral `Configured`. |
| `Saved` | Neutral persistence text with a small dot; not green celebration. |
| `Default` | Neutral inline metadata. |
| `Optional` | Neutral inline metadata. |
| `Internal testing` | Move outside normal user-facing flow; neutral label inside the internal surface. |

## Home Stage Semantics

| Home stage | Tone |
| --- | --- |
| Source needed | Amber |
| Ready for preparation | Cyan or amber depending on action ownership |
| Approved work underway | Cyan/neutral |
| Review ready | Amber if user action is required |
| Review verified | Amber until accepted/revised |
| Review approved | Green |
| Complete | Green |
| Changes requested | Amber |
| Revision ready | Amber |

## Typography Hierarchy

- One route-level H1.
- Do not immediately repeat the route name as a near-equal H2.
- Eyebrows are semantic signals, not decoration on every section.
- Home and ordinary app pages use product-scale type, not marketing-scale display type.
- Use short labels and direct action copy.
- Metadata remains readable; do not solve density by dropping below the established body/microcopy floor.

## Spacing Hierarchy

- Use the existing tokenized 4px rhythm.
- Major sections: enough separation to read as distinct without adding another card.
- Focal surfaces: more interior space than routine cards.
- Inline rows: compact but maintain at least comfortable 44px action targets.
- Wide desktops: preserve max-width and increase surrounding space.
- Do not reduce gaps merely to avoid scrolling.

## Motion Rules

- Motion communicates entry, hierarchy, selection, progress, or completion.
- Ordinary status badges do not pulse.
- Prefer transform and opacity.
- Interactive feedback should feel immediate.
- Large reveals and drawers remain interruptible.
- Respect `prefers-reduced-motion`.
- Never use animation to compensate for weak static hierarchy.

## Accessibility Rules

- Status always includes text or an accessible name.
- Focus ring must be distinguishable from ambient glow.
- Icon-only status/actions require names.
- Color contrast must remain readable on glass.
- Loading and recovery changes use appropriate live regions without repeatedly announcing decorative metadata.
- Tooltips cannot be the only source of required status meaning.

## Review Checklist

For every page or component, ask:

- Is there one focal surface?
- Could any card become a row or open canvas?
- Does the surface width match its information content?
- Is glass doing real hierarchy work?
- Is status color semantically correct?
- Is more than one strong status color competing inside one item?
- Is the route heading duplicated?
- Does the page remain bounded at 1728px and 1920px?
- Does the same hierarchy work without motion?
- Can the state be understood without color?

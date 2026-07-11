# ReeditPro UI/UX Component Standards

## AppShell

- Purpose: frame authenticated desktop/web app routes.
- Visual behavior: fixed sidebar, compact topbar, calm deep-space surface.
- Interaction states: active nav uses `aria-current`; disabled nav uses semantic disabled state.
- Accessibility: nav must be labeled; progress widgets need progressbar semantics.
- Spacing: keep topbar compact and page content breathable.
- Do: keep one optional primary page action. Do not: add giant app headers.
- Do not: repeat the route H1 with a near-equal inner hero or allow low-information content to span the full remaining viewport.

## MarketingShell

- Purpose: future wrapper for public marketing pages.
- Visual behavior: AI Topology Matrix, bounded grid, deep-space background.
- Accessibility: nav landmarks and clear links.
- Do: keep product promise visible. Do not: create generic SaaS hero layouts.

## PageHeader And SectionHeader

- Purpose: explain current task and orient the user.
- Visual behavior: concise title, optional eyebrow, short supporting copy.
- Accessibility: one route-level `h1`.
- Spacing: app headers stay compact; marketing display can be larger.
- Do: use direct operational copy. Do not: use text-heavy banners.

## Surface, GlassPanel, GradientBorderShell

- Purpose: group related controls or content.
- Visual behavior: tokenized glass, subtle borders, restrained glow.
- Interaction states: interactive surfaces need hover and focus states.
- Accessibility: use semantic containers or headings for grouped content.
- Do: use for main panels. Do not: create nested border noise.
- Apply the hierarchy in `docs/ui-ux-surface-and-status-rules.md`: open canvas, one focal surface, quiet standard card, inline row, status indicator, elevated layer.
- Glass and gradient borders are not defaults for every level.

## Button And IconButton

- Purpose: trigger clear commands.
- Visual behavior: primary is strongest; secondary is calm; ghost is quiet; danger is explicit.
- Interaction states: hover, focus-visible, active, disabled.
- Accessibility: icon-only buttons need `aria-label`; disabled actions must be real disabled controls.
- Spacing: button labels must fit on desktop and narrow responsive web widths.
- Do: one primary action per region. Do not: use primary for every action.

## Badge And StatusDot

- Purpose: compact status, category, or plan metadata.
- Visual behavior: subdued surfaces with tokenized semantic accents.
- Accessibility: status meaning must be present in text, not color alone.
- Do: use sparingly. Do not: decorate every row with multiple badges.
- Green means approved/completed, amber means action/attention, red means blocking/destructive, cyan means active AI/selection, and violet is rare creative emphasis.

## Home Edit Summary And Attention Row

- Purpose: resume the latest meaningful edit and surface real user-action states.
- Visual behavior: one focal edit summary plus quiet inline attention rows.
- Accessibility: state and action are explicit in text; do not rely on color.
- Data truth: do not fabricate thumbnails, plan-ready state, credit estimate, or progress percentage.
- Do: use state-aware action labels. Do not: show onboarding to returning users.

## TextInput, TextArea, Select, SearchInput

- Purpose: gather user text, search, or choices.
- Visual behavior: calm glass input, visible focus state.
- Interaction states: hover, focus, disabled, error.
- Accessibility: every field needs a label; placeholder is not the label.
- Do: keep helper text concise. Do not: hide critical requirements in placeholder copy.

## SegmentedControl, Toggle, Checkbox

- Purpose: choose among modes or binary settings.
- Visual behavior: selected state must be clear but restrained.
- Interaction states: use `aria-pressed`, native checked state, or equivalent.
- Accessibility: group labels are required for sets of controls.
- Do: use for filters and display modes. Do not: use plain badges as controls.

## Drawer And Modal

- Purpose: secondary workflows or advanced review.
- Visual behavior: focused, bounded, and clearly dismissible.
- Interaction states: close button, escape handling in future implementation, focus management in production.
- Accessibility: labeled title and close button.
- Do: use for timeline and advanced detail. Do not: make drawers primary editor flows.

## Tooltip And Toast

- Purpose: explain icons or transient status.
- Visual behavior: quiet, readable, tokenized.
- Accessibility: do not hide required information only in a tooltip.
- Do: use for unfamiliar icon controls. Do not: replace labels with tooltips.

## EmptyState, LoadingState, ErrorState

- Purpose: explain no data, pending work, or recoverable problems.
- Visual behavior: concise, calm, one next action.
- Accessibility: loading status should be announced when persistent.
- Do: avoid implying generation before approval. Do not: use generic spinner-only states.

## ChatMessage

- Purpose: show user and ReeditPro AI turns.
- Visual behavior: chat-native, readable, not card-wall-heavy.
- Accessibility: author labels visible; thread has an accessible label.
- Do: keep AI turns concise. Do not: dump every technical detail in Guided mode.

## ChatComposer And ChatAttachmentChip

- Purpose: send instructions, attach clips, and attach references.
- Visual behavior: familiar input row with balanced actions.
- Interaction states: send disabled when empty; microphone disabled if unavailable.
- Accessibility: textarea label, button names, disabled voice state.
- Do: reinforce plan-first approval copy. Do not: imply recording is live if it is not.

## PlanReviewCard And CreditApprovalFooter

- Purpose: show proposed edit work, estimate credits, and collect approval.
- Visual behavior: clear hierarchy between plan summary, risks, lower-cost options, and approval.
- Interaction states: approve disabled until required gates pass.
- Accessibility: approval controls must state consequences.
- Do: require explicit approval. Do not: start mock progress before approval.

## PreviewRail

- Purpose: show preview status and review actions after approval.
- Visual behavior: secondary to chat but clearly available.
- Accessibility: preview controls need labels.
- Do: separate preview, revision, and export actions. Do not: show preview-ready state before approval unless explicitly marked local/mock and approved.

## Edit Preferences

- Purpose: one feature with Saved and Current Edit scopes.
- Saved scope: reusable defaults copied into future named edits.
- Current scope: inherited/overridden values for the exact edit, only after persistence and invalidation architecture is approved.
- Accessibility: source (`Inherited` or `Changed for this edit`) must be readable in text.
- Do: use the visible label `Edit Preferences`. Do not: create separate Global/Project/General Preferences products.
- Internal testing is not an Edit Preferences component group.

## TimelineDrawer

- Purpose: advanced timing inspection.
- Visual behavior: hidden by default, clearly labeled advanced view.
- Accessibility: close button, heading, and future focus management.
- Do: keep secondary. Do not: make timeline-first editing the default.

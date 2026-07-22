# ReeditPro Master Design System

Status: `active_product_source_of_truth`

Status date: 2026-07-10

This is the persistent implementation bridge between `design.md`, the active product-scope documents, the referenced UI examples in the UI/UX design conversation, and the UI UX Pro Max critique framework. ReeditPro's product rules and current route scope remain authoritative. External recommendations are accepted only when they strengthen this product.

## Product Experience

- Website/desktop web app first. Native mobile remains future-only.
- Project -> named edit -> upload -> Chat/Edit Brief/Edit Preferences -> plan and credit approval -> private work/review.
- Chat is the primary editor.
- Timeline and technical planning surfaces are secondary.
- No generation, rendering, or credit use before the exact plan and estimate are approved.
- Deep intelligence must appear as a simple, calm, trustworthy workflow.

## Design Dials

The UI UX Pro Max reasoning engine was queried for AI-native creative software, photo/video editing, React, dark professional workspaces, accessibility, and anti-patterns. The useful dials are:

- Variance: `6/10` — balanced asymmetry and mixed component sizes, never chaotic.
- Motion: `3/10` — short state feedback and subtle transitions, never spectacle.
- Density: `4/10` — calm professional density with high-density tools only when the task requires them.

The generated purple-first palette, Tailwind defaults, mobile-cinema assumptions, and timeline-first video-editor recommendation are rejected. ReeditPro keeps its existing React/Vite/CSS stack and AI Topology Matrix identity.

## Visual Identity

- Deep-space canvas: `--rp-bg-void`, `--rp-bg-deep`, and `--rp-bg-app`.
- Cyan: current AI state, focus, precision, and selected tools.
- Blue: primary actions and strong selection.
- Violet: rare creative/system emphasis.
- Green: only complete, approved, or verified success.
- Amber: user attention or setup required.
- Red: blocking failure or destructive action.
- Glass: focal and elevated surfaces only.
- Topology/grid texture: subtle atmosphere, never content competition.
- Inter/system typography: readable weights, compact app scale, no ultra-thin body text.

## Hierarchy Laws

1. One route H1.
2. One focal surface per page state.
3. One dominant action per region.
4. Supporting content becomes quiet cards or inline rows.
5. Advanced details stay collapsed in the normal experience.
6. A surface must not become full-width merely because space exists.
7. Ordinary app pages use product-scale headings, not marketing display type.
8. Status remains text-readable without color.
9. Shared identity comes from tokens and behavior, not identical page templates.
10. Wide screens gain whitespace, not stretched low-information panels.

## Surface Levels

- Level 0 — Canvas: open page/chat background.
- Level 1 — Focal: Continue Edit, Create First Project, upload gate, Plan Review.
- Level 2 — Standard card: recent edit, project, self-contained form group.
- Level 3 — Inline row: attention, activity, recovery, persistence feedback.
- Level 4 — Status: dot/icon + text; one strong status per item.
- Level 5 — Elevated: modal, drawer, timeline, internal testing.

Avoid more than two visible nested surface levels in Guided mode.

## Typography And Copy

- App H1: short, normally 28-40px within existing responsive tokens.
- Section title: 18-24px.
- Card title: 15-18px.
- Body: 14-16px with readable line height.
- Metadata: 12-14px; do not shrink important information below readability.
- Page description: one sentence.
- Card description: one or two lines.
- Button: direct state-aware action, usually two to four words.
- Do not expose provider, persistence, adapter, route, or internal-tool language to normal users.

## Spacing And Layout

- Use the existing 4px token rhythm.
- Standard app page padding: 24-40px.
- Major section gap: 24-40px depending on density.
- Focal padding: 24-40px.
- Standard card padding: 16-24px.
- Inline row action targets: at least 44px.
- Bounded ordinary app content: `--rp-content-max` unless the task is an editor/timeline workspace.
- Desktop composition uses an intentional 12-column mental model and asymmetry based on information priority.

## Interaction And Motion

- Hover/focus feedback: 140-220ms.
- Drawer/large reveal: 240-360ms.
- Prefer transform and opacity.
- Never delay navigation for animation.
- Never use continuous glow/pulse on routine status.
- Respect `prefers-reduced-motion`; the full hierarchy must work with motion removed.
- Every async action lasting more than roughly 300ms needs visible loading/progress feedback.

## Accessibility

- Sequential heading hierarchy.
- Semantic links, buttons, navigation, forms, and status regions.
- Visible focus distinct from ambient glow.
- Icon-only actions require accessible names.
- Labels remain visible; placeholders are not labels.
- Errors use text and `role="alert"`/appropriate live behavior where needed.
- Dynamic state changes are announced without repeatedly announcing decorative metadata.
- Keyboard order follows visual order.
- All target viewport and zoom checks remain mandatory.

## Performance

- Preserve route-level lazy loading.
- Do not add Tailwind, a UI framework, GSAP, Framer Motion, Three.js, or WebGL for ordinary app UI.
- Blur and glass are limited to surfaces where elevation matters.
- Keep hidden technical content unmounted or lazy where practical.
- Profile before adding optimization complexity.

## Rejected Patterns

- Generic SaaS KPI dashboard.
- Equal-sized widget wall.
- Full-width low-information cards.
- Purple-gradient "all AI tools" marketplace.
- Toy-like mascots or promotional signed-in tiles.
- Timeline-first editor shell.
- Glass, borders, badges, or glow on every component.
- Large explanatory app headers.
- Duplicate editable sources for Brief or Preferences.

## Active Page Jobs

- Landing: explain the chat-first product with an authentic editor preview and one clear entry path.
- Sign In: establish trusted access with one clear action and no developer-oriented authentication noise.
- Home: resume, attention, start.
- Edit Videos (`/projects`): scan project containers and continue or start named edits through the one canonical edit library.
- Motion Studio (`/motion-studio`): retain the existing specialized storytelling workspace when the Motion source is reconciled; do not duplicate it inside Edit Videos.
- New Project: create the project shell with only a name and broad editing context.
- Project Home: manage named edits in one project.
- Named Edit: do the editing work through Chat, Brief, planning, approval, review, and contextual advanced tools.
- Edit Preferences: manage saved defaults and exact-edit overrides without becoming account settings.

Page-specific implementation rules live in `design-system/pages/` and may refine composition without violating this master.

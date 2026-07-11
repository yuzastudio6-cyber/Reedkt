# ReEditPro Master Design System

Status: `active_product_source_of_truth`

Status date: 2026-07-11

This is the persistent implementation bridge between `design.md`, the active product architecture, and the supporting [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) critique framework. ReEditPro's product rules, current route scope, and page overrides are authoritative. External recommendations are accepted only when they strengthen this product.

## Authority Order

1. `design.md` and ReEditPro product rules.
2. This master and the relevant `design-system/pages/` override.
3. Current route, workflow, safety, and implementation-status documents.
4. UI UX Pro Max as a supporting accessibility and craft checklist.

External guidance must not replace ReEditPro's identity, stack, chat-first workflow, approval gates, or truthful readiness boundaries.

## Product Experience

- Website and desktop web app first; native mobile remains future-only.
- Project -> named edit -> upload -> Chat/Edit Brief/Edit Preferences -> plan and estimate approval -> private work/review.
- Chat is the primary editor; timeline and technical planning surfaces are secondary.
- No generation, rendering, or credit use before the exact plan and estimate are approved.
- Deep intelligence must appear as a simple, calm, trustworthy workflow.

## Design Dials

- Variance: `6/10` — balanced asymmetry and mixed component sizes, never chaos.
- Motion: `3/10` — short state feedback and subtle transitions, never spectacle.
- Density: `4/10` — calm professional density, with denser tools only when the task requires them.

Purple-first palettes, generic framework defaults, mobile-cinema assumptions, and timeline-first editor recommendations are rejected. ReEditPro keeps its React/Vite/CSS stack and AI Topology Matrix identity.

## Visual Identity

- Deep-space canvas uses the existing background tokens.
- Cyan communicates current AI state, focus, precision, and selected tools.
- Blue is reserved for primary actions and strong selection.
- Violet is rare creative or system emphasis.
- Green means complete, approved, or verified success.
- Amber means attention or setup is required.
- Red means blocking failure or destructive action.
- Glass belongs only on focal or elevated surfaces.
- Topology/grid texture is atmosphere, never content competition.
- Inter/system typography uses readable weights and a compact application scale.

## Hierarchy Laws

1. One route H1.
2. One focal surface per page state.
3. One dominant action per region.
4. Supporting content becomes quiet cards or inline rows.
5. Advanced detail stays collapsed in the normal experience.
6. A surface does not become full width merely because space exists.
7. Ordinary app pages use product-scale headings, not marketing display type.
8. Status remains text-readable without color.
9. Shared identity comes from tokens and behavior, not identical page templates.
10. Wide screens gain whitespace, not stretched low-information panels.

Avoid more than two visible nested surface levels in Guided mode.

## Typography And Copy

- App H1: normally 28–40px within existing responsive tokens.
- Section title: 18–24px.
- Card title: 15–18px.
- Body: 14–16px with readable line height.
- Metadata: 12–14px; important information never shrinks below readability.
- Page description: one sentence.
- Card description: one or two lines.
- Button copy: direct, state-aware, and usually two to four words.
- Normal user UI never exposes provider, persistence, adapter, route, gate-number, mock, or internal-tool language.

## Spacing And Layout

- Use the existing 4px token rhythm.
- Standard app page padding: 24–40px.
- Major section gap: 24–40px depending on density.
- Focal padding: 24–40px.
- Standard card padding: 16–24px.
- Interactive targets are at least 44px.
- Ordinary app content remains bounded unless it is a true editor/timeline workspace.
- Desktop composition uses intentional asymmetry based on information priority.

## Interaction And Motion

- Hover/focus feedback: 140–220ms.
- Drawer or large reveal: 240–360ms.
- Prefer transform and opacity.
- Never delay navigation for animation.
- Never continuously pulse routine status.
- Respect `prefers-reduced-motion`; hierarchy must work with motion removed.
- Every async action lasting more than roughly 300ms has visible loading/progress feedback.

## Accessibility

- Public and signed-in shells expose a keyboard-first Skip to main content link.
- Heading hierarchy is sequential.
- Use semantic links, buttons, navigation, forms, tabs, and status regions.
- Visible focus is distinct from ambient glow.
- Icon-only actions have accessible names.
- Labels remain visible; placeholders are never the only label.
- Required naming fields are identified in copy and markup.
- Compact, icon, filter, workspace-switcher, and composer actions keep at least a 44px target.
- Muted text retains sufficient contrast against application surfaces.
- Errors use text plus `role="alert"` or the appropriate live behavior.
- Dynamic state changes are announced without repeatedly announcing decorative metadata.
- Keyboard order follows visual order.
- Test at 375, 768, 1024, and 1440px where the route supports those sizes.
- Verify no page-level horizontal overflow, focus behavior, zoom resilience, and reduced-motion behavior.

## Performance

- Preserve route-level lazy loading.
- Do not add Tailwind, a UI framework, GSAP, Framer Motion, Three.js, or WebGL for ordinary application UI.
- Limit blur and glass to meaningful elevation.
- Keep hidden technical content unmounted or lazy where practical.
- Profile before adding optimization complexity.

## Rejected Patterns

- Generic SaaS KPI dashboard.
- Equal-sized widget wall.
- Full-width low-information cards.
- Purple-gradient all-tools marketplace.
- Toy-like mascots or promotional signed-in tiles.
- Timeline-first editor shell.
- Glass, borders, badges, or glow on every component.
- Large explanatory app headers.
- Duplicate editable sources for Brief or Preferences.

Page-specific implementation rules live in `design-system/pages/` and may refine composition without violating this master.

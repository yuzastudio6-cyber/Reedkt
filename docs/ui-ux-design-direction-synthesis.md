# ReeditPro UI/UX Design Direction Synthesis

Status: `audit_synthesis_ready_for_product_review`

Status date: 2026-07-10

This synthesis combines the current repository, `design.md`, the structural lessons recorded from the reference-image discussion, and selected critique criteria from UI UX Pro Max. The current checked-out product scope remains authoritative when historical visual material describes retired pages.

## Unique ReeditPro Direction

ReeditPro should feel like a calm AI editing workbench: spatial and technically capable, but content-first, restrained, and trustworthy.

The distinctive combination is:

- Chat-native editing rather than timeline-first editing.
- Project -> named edit organization.
- Plan and credit approval before work begins.
- Deep-space AI Topology Matrix identity.
- Video/story state as the visual center, not analytics.
- Advanced professional controls available without dominating Guided mode.
- Light and accent color used as state signals.
- Open canvas plus a small number of deliberately elevated surfaces.

The target is neither a generic SaaS dashboard nor a sci-fi control panel. It is professional creative software that makes deep planning feel understandable.

## From `design.md`

### Accepted as authoritative identity

- AI Topology Matrix.
- Deep-space/dark application canvas.
- Cyan, blue, and violet signal accents.
- Bounded grid composition.
- Strong spacing discipline and 4px rhythm.
- Glass as a spatial material.
- Light used to communicate active state.
- Chat-first, plan-first, approval-first product behavior.
- Professional editing quality at every edit level.
- Stroke Motion, VisualExplain, Real Motion, SoundSync, and StoryTiming as product systems.
- Accessible controls, visible focus, readable text, clear loading/empty/error states.
- Controlled motion rather than random animation.

### Normalized for production

- Cyan is an accent, not the page background.
- Ultra-thin type is inappropriate for normal product copy.
- Glass does not mean every component is a tinted card.
- Glow does not define premium quality.
- Marketing display type does not transfer to routine signed-in headers.
- Historical route/feature lists do not define current navigation.
- Native mobile concepts remain future-only.
- Timeline-first concepts remain secondary to chat.

### Historical ideas rejected for current scope

- Active top-level Media Library.
- Templates marketplace.
- Team/collaboration dashboard.
- Analytics dashboard.
- Standalone Brand Kit.
- Standalone Wallet.
- Standalone Pricing inside the current authenticated product.
- Standalone Export Queue.
- Generic KPI/storage/activity Home widgets.

These can be reconsidered only through a new product-scope decision.

## From The Reference-Image Discussion

The original external image attachments are not present as inspectable files in this checkout. The following uses only the structural observations preserved in the attached conversation, plus the current repository screenshots.

### Dark professional chat/desktop references

Borrow:

- Compact desktop navigation.
- Minimal top chrome.
- Focused central workspace.
- Floating composer behavior.
- Quiet status treatment.
- Professional density.
- Strong separation between conversation and secondary tools.

Reject:

- Direct imitation of another product's branding.
- A generic empty chat screen outside the project/edit model.
- Icon-only navigation that reduces discoverability.

### Light creative chat/media reference

Borrow:

- Open canvas.
- Strong whitespace.
- Natural media placement.
- Clear composer/content relationship.
- Content scrolling behind a floating interaction surface.

Translate those structural strengths into the dark ReeditPro identity rather than copying the light palette.

### Dashboard references

Borrow:

- Mixed component sizes based on importance.
- Balanced asymmetry.
- Strong alignment.
- Clear grouping and scan paths.

Reject:

- KPI walls.
- Charts without an editing decision to support.
- Equal-sized widget grids.
- Employee/calendar/business-intelligence patterns.

### Bright all-in-one AI dashboard references

Borrow only:

- Clear selected navigation.
- Basic discoverability.

Reject:

- Mascots.
- Promotional tiles.
- Tool-marketplace identity.
- Bright generic AI styling.
- Toy-like visual language.

## From UI UX Pro Max

Reference: [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)

The project was cloned outside the application into a temporary review directory and its search engine was run for AI-native creative software, photo/video editing, React, dark professional workspaces, accessibility, and anti-patterns. It was not installed as a production dependency or allowed to change the runtime stack. ReeditPro now persists its own reviewed synthesis in `design-system/MASTER.md` and page overrides rather than copying the generator's output verbatim.

### Guidance accepted

- Prioritize accessibility, interaction feedback, performance, layout, typography, forms, and navigation before decorative style.
- Visible focus and keyboard navigation.
- Status not communicated by color alone.
- Visible form labels and errors near the affected field.
- Progressive disclosure for complex options.
- Fast feedback for asynchronous actions.
- Motion in the roughly 150-300ms interaction range when appropriate.
- Prefer transform/opacity and avoid layout-shift animation.
- Use semantic color tokens rather than raw values inside components.
- Preserve predictable Back behavior and deep-linkable important views.
- Use a shared master design system with deliberate page-specific deviations.
- Run explicit pre-delivery checks against accessibility and common UI anti-patterns.

### Guidance translated for ReeditPro

- The external tool's general dashboard recommendations do not override the project-first editing workflow.
- ReeditPro's target is desktop/web first, so generic mobile-first IA guidance is not the product model; responsive web still must work.
- The repository uses React, TypeScript, Vite, and an existing CSS token architecture.
- Any useful Tailwind examples must be translated into the current CSS system.
- Generic glassmorphism is constrained by `docs/ui-ux-surface-and-status-rules.md`.
- Dashboard density is set by user task, not by a generic analytics template.

### Guidance rejected

- Default HTML + Tailwind output.
- Tailwind migration.
- New UI framework.
- Generated palette or type system replacing ReeditPro tokens.
- Charts merely because the surface is called a dashboard.
- GSAP or other motion dependencies without a separate approved need.
- Native mobile patterns in the current phase.

## Current Repository Visual Evidence

### Strongest current patterns

- Editor's minimal status header.
- Open chat canvas.
- Floating compact composer.
- Landing-page asymmetry and one strong product promise.
- Sign-in's focused composition.
- Existing token split and route-level code splitting.
- Explicit recovery/error states and keyboard-aware modal behavior.

### Weakest current patterns

- AppShell route header followed by a second near-equal page intro.
- Full-width low-information cards.
- Similar surface recipe at every hierarchy level.
- Overuse of tinted badges.
- Incorrect success mapping for incomplete or revision states.
- Onboarding shown to returning Home users.
- Internal/private testing copy carrying too much user-facing weight.
- `chat.css` and `layout.css` remaining very large despite the style split.
- Many advanced editor card families retaining bordered/nested treatment.

## Visual Laws For The Redesign

1. One route H1; do not repeat it as a near-equal H2.
2. One focal surface per page state.
3. Supporting content uses quiet cards or inline rows.
4. Normal app content is bounded at wide desktop widths.
5. Glass is reserved for elevation and focus.
6. Cyan communicates active/AI/focus; it is not decoration everywhere.
7. Green means complete or approved.
8. Advanced technical content is absent or collapsed in normal user mode.
9. Status language is user-oriented and actionable.
10. Media/state is the visual center; analytics is not.
11. Motion reinforces state and hierarchy but is never required to understand the page.
12. Every visual signoff includes first-time, returning, loading, empty, error, long-copy, keyboard, reduced-motion, and wide-screen evidence as applicable.

## Page-Specific Composition

The shared system does not mean every page has the same hero and row stack.

| Page | Composition job |
| --- | --- |
| Home | Resume-first asymmetric command center; first-project variant when empty. |
| Projects | Scan and organize project containers; visual library/list based on real media availability. |
| Project Home | Manage named edits within one project. |
| Named Edit | Open chat workbench with optional Brief, planning, approval, review, and advanced tools. |
| Edit Preferences | Structured reusable defaults; current-edit scope appears only through a deliberate inherited/override model. |
| Sign In | Focused trust and access entry. |

## Rejected Whole-Product Pattern

Do not copy the current `AppShell header -> full-width intro card -> full-width status card -> full-width rows` composition onto each route. Shared identity should come from tokens, typography, navigation, state semantics, and motion—not identical page templates.

## Design Review Question

Before approving any screen, ask:

> Does this composition help the user perform the page's job, or is it only reusing a familiar card template?

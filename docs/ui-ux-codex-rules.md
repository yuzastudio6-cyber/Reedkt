# ReeditPro UI/UX Codex Rules

## Hard Rules

- Do not implement native mobile app flows.
- Do not turn responsive web behavior into mobile-app-specific IA.
- Do not create generic SaaS UI.
- Do not create card walls.
- Do not create giant text-heavy app headers.
- Do not add random raw colors, radii, shadows, timings, or spacing values in components.
- Do not add Tailwind, shadcn, MUI, Chakra, Radix, Framer Motion, GSAP, ThreeJS, WebGL, or new UI frameworks unless explicitly requested.
- Do not start generation, rendering, provider calls, worker jobs, or credit deduction before edit plan and credit approval.
- Do not imply subscriptions include unlimited AI editing.
- Do not expose backend, provider, billing, render, storage, or service-role behavior in frontend UI milestones.
- Do not treat `Preferences` and `Edit Preferences` as separate products. Use `Edit Preferences` in visible copy; `/preferences` may remain the technical route.
- Do not place internal-testing, Supabase/API readiness, or route diagnostics on normal Home or inside normal Edit Preferences content.
- Do not describe Home as complete when returning users still receive onboarding instead of resume/attention content.

## Required Preservation

- Preserve chat-first editing.
- Preserve upload, goal, questions, plan, credits, approval, progress, preview, revision, export flow.
- Preserve plan and credit approval gate.
- Preserve advanced and developer cards collapsed by default unless warning, blocking, or required.
- Preserve desktop/web-first structure.
- Preserve AI Topology Matrix visual direction.
- Preserve reduced-motion support.

## Implementation Rules

- Use tokens from `src/styles/tokens.css` and shared CSS architecture before adding new component-local styles.
- Use shared components for buttons, icon buttons, badges, cards, search fields, and common state blocks.
- Keep one primary action per page region.
- Keep app page headers short.
- Do not follow an AppShell route header with a second near-equal full-width page hero.
- Bound ordinary app content at wide desktop widths; do not stretch low-information cards merely because space exists.
- Hide technical detail by default.
- Use calm glass surfaces and restrained accent color.
- Prefer small, reversible fixes during QA milestones.
- Document large redesign needs instead of starting them without approval.
- For Home, preserve first-time, returning, attention, loading, local-only, unavailable, denied, long-copy, and wide-screen states.

## Accessibility Rules

- Every icon-only button needs an accessible name.
- Every input, textarea, select, segmented control, checkbox, and toggle needs an accessible label or equivalent.
- Selected state should use semantic attributes such as `aria-current`, `aria-pressed`, or native checked state where appropriate.
- Status cannot be color-only.
- Progress indicators need labels and values where possible.
- Disabled states must be visually and semantically clear.
- Keyboard focus must be visible.

## Performance Rules

- Report bundle warnings after every UI milestone.
- Prefer route-level lazy loading before deeper editor splitting.
- Defer advanced editor cards, detailed timeline, music, SFX, revision, export, and mock planner families until needed when safe.
- Keep rendering-only and worker-only libraries out of the browser bundle.

## Required PR Notes

Every UI PR or milestone summary must include:

- Product-flow notes.
- Accessibility notes.
- Performance notes.
- Any deferred UX risks.
- Lint result.
- Build result.

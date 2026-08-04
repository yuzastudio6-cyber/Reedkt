# Landing Page Override

Status: `implemented_and_visually_verified`

## Job

Explain ReeditPro in five seconds and lead into the protected project-first editing flow.

## Composition

- Short hero promise: `ChatGPT for video editing.`
- One primary action: `Start with chat`.
- A truthful chat-editor preview showing user intent, AI plan, credit estimate, approval state, preview rail, and composer.
- Follow with workflow, signature systems, approval trust, use cases, and private-workspace proof.
- Marketing display type is allowed, but copy remains short and bounded.

## Page Rules

- The product preview must resemble the active named-edit workspace, not a generic dashboard.
- No feature-card wall, unrelated KPI, fake customer metric, or unverified production claim.
- Explain approval before generation more strongly than individual AI features.
- Native anchor navigation must move to the promised section.
- At narrower web widths, keep logo/actions compact and put discoverable navigation on one quiet second row.
- Keep one truthful named-edit preview in the hero: intent, proposed plan, estimated credits, approval state, preview rail, and composer stay visually connected.
- Preserve a keyboard skip route into `main`; it stays hidden at rest and becomes visible on focus.
- Collapse the hero, preview, trust rail, workflow, approval, signature, and use-case layouts deliberately rather than allowing unstyled document flow to decide the hierarchy.

## Evidence

- `tests/e2e/marketing-ui.spec.ts`
- `docs/ui-ux-screenshots/active-product-redesign-2026-07-10/landing-1280.png`
- `docs/ui-ux-screenshots/active-product-redesign-2026-07-10/landing-1024.png`
- `docs/ui-ux-screenshots/active-product-redesign-2026-07-10/landing-720.png`
- Computed-style regressions cover the two/one-column hero, editor preview, trust rail, compact navigation, native workflow anchor, hidden-until-focused skip route, 375px phone width, compact landscape, reduced motion, and horizontal-overflow safety.

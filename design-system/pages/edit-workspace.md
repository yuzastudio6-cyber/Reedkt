# Named Edit Workspace Override

Status: `implemented_and_visually_verified`

## Job

Complete one edit through the smallest current decision, one plan/credit approval moment, and one private review path.

## Composition

- Compact project/edit header with Chat, Edit Brief, and Edit Preferences access.
- Center conversation rail with one active decision.
- Quiet right preview/status rail on wide desktop screens.
- Floating composer aligned to the conversation, never a hard full-width footer.
- Advanced timeline and technical planning remain secondary.

## Page Rules

- Chat is the default workspace.
- The mic is a 40px labelled circular control next to the send control.
- User messages are compact and right-aligned; AI messages remain calm and readable.
- Plan Review combines understanding, scope, timing, credit estimate, and approval.
- Edit Brief is a single inline workspace; focused fields must remain fully visible above the floating composer.
- Current Edit Preferences uses a deliberate query-addressable workspace, not a chat card.
- Work and credits never start before approval.

## Responsive Rules

- The preview rail appears only when the available desktop width supports it.
- The conversation remains the primary surface at narrower desktop widths.
- Composer position must not depend on a hardcoded sidebar width.
- The exact parent project and edit name remain visible in the workspace header. Controls move to a second row below 1320px and stack at compact widths instead of truncating the editing context.
- Chat and Current Edit Preferences expose one explicit `aria-current="page"` destination while retaining the same exact-project Back target.

## Evidence

- `tests/e2e/editor.spec.ts`
- `tests/e2e/editor-keyboard.spec.ts`
- `tests/e2e/editor-clean-slate.spec.ts`
- `tests/e2e/viewport.spec.ts`
- `docs/ui-ux-screenshots/active-product-redesign-2026-07-10/named-edit-chat-ready-1280.png`
- `docs/ui-ux-screenshots/active-product-redesign-2026-07-10/named-edit-brief-1280.png`
- `docs/ui-ux-screenshots/active-product-redesign-2026-07-10/named-edit-plan-review-1280.png`
- Exact project Back navigation, workspace active state, retained project/edit identity, and non-overflowing layout pass at 1024px, 1280px, 1440px, 1728px, and 1920px.

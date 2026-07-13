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
- Plan Review is one calm checkpoint: understood intent, four approval facts, story structure, treatment chips, exact estimated credits, and one primary approval action. Advanced planner internals stay out of the default hierarchy.
- Processing communicates that the approved plan is being prepared for private review; it must not imply public rendering, release, billing, or an editable approved snapshot.
- Private Review uses a bounded playback surface, explicit estimate context, disabled actions until their evidence exists, and direct approve/request-changes choices while sharing and release remain gated.
- Edit Brief is a single inline workspace; focused fields must remain fully visible above the floating composer.
- The source-upload gate stays bounded inside the conversation canvas instead of stretching across the application shell.
- On supported wide screens, the conversation canvas and quiet preview/status rail form a deliberate two-column workspace. The rail never competes with the current decision.
- Edit Brief uses a flat, sectioned form hierarchy with an explicit Optional/Draft/Ready status, restrained planning-impact notice, and a semantic read-only lock after approval.
- Current Edit Preferences uses a deliberate query-addressable workspace, not a chat card.
- Work and credits never start before approval.

## Responsive Rules

- The preview rail appears only when the available desktop width supports it and collapses before the primary workspace becomes cramped.
- The conversation remains the primary surface at narrower desktop widths.
- Composer position must not depend on a hardcoded sidebar width.
- The exact parent project and edit name remain visible in the workspace header. Controls move to a second row below 1320px and stack at compact widths instead of truncating the editing context.
- Chat and Current Edit Preferences expose one explicit `aria-current="page"` destination while retaining the same exact-project Back target.
- Edit Brief summary fields collapse from two columns to one at compact width, while its lock notice and editable fieldset retain their visual distinction without horizontal overflow.
- Plan Review facts move from four columns to two and then one as space narrows. Estimate metadata and private-review headers stack at compact width without changing approval semantics.

## Evidence

- `tests/e2e/editor.spec.ts`
- `tests/e2e/editor-keyboard.spec.ts`
- `tests/e2e/editor-clean-slate.spec.ts`
- `tests/e2e/viewport.spec.ts`
- `docs/ui-ux-screenshots/active-product-redesign-2026-07-10/named-edit-chat-ready-1280.png`
- `docs/ui-ux-screenshots/active-product-redesign-2026-07-10/named-edit-brief-1280.png`
- `docs/ui-ux-screenshots/active-product-redesign-2026-07-10/named-edit-plan-review-1280.png`
- `docs/ui-ux-screenshots/active-product-redesign-2026-07-10/named-edit-private-review-1280.png`
- `docs/ui-ux-screenshots/active-product-redesign-2026-07-10/named-edit-recovery-error-1280.png`
- Exact project Back navigation, workspace active state, retained project/edit identity, and non-overflowing layout pass at 1024px, 1280px, 1440px, 1728px, and 1920px.
- The focused editor suite passes 20/20 checks, the viewport suite passes 59/59, and the clean-shell/keyboard/zoom group passes 9/9 after the named-edit and Edit Brief presentation restoration.
- Guarded local browser review confirms the upload gate and wide preview rail at 1280px, the single-column workspace at 1024px, and no horizontal overflow or console errors in either state.
- Computed-style regressions prove the Plan Review checkpoint, intent accent, four/two/one-column fact hierarchy, estimate alignment, private-review playback surface, review metadata, skill trace, and preparation activity grid.
- Named-edit loading and failure resolve before editor mount. Blocking recovery uses one bounded 560px state surface with truthful guidance, a safe retry/back action when applicable, and no exposed empty editor.

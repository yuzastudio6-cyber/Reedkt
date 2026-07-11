# Edit Reference UI Contract

Status: `gate_0_authority`

This contract governs the Edit Preferences route while preserving ReEditPro's chat-first, approval-first, desktop/web product laws. It does not authorize media analysis, providers, workers, rendering, credits, or production persistence.

## Navigation And Route

Primary navigation remains:

1. Home
2. Projects
3. Edit Preferences

`/preferences` is the technical route. Visible copy must say **Edit Preferences**. `/edit-preferences` may remain a compatibility alias, but it may not become a second product.

## Workspace Tabs

The route contains exactly these primary destinations:

- **Edit References** — default.
- **Workspace Defaults** — broad dropdown/default values copied into future edits.
- **Applied Edits** — applications and usage history, only when backed by typed records.
- **Safety & Privacy** — copy-safety, privacy, provenance, retention, and runtime boundaries.

Tab identity must be URL-addressable or otherwise reload-stable without creating separate products. Edit References is always the default when no valid tab is supplied.

## Edit References Layout

At wide desktop widths, use a bounded three-panel creative workspace.

### Left — Saved Edit References

- New Reference action.
- Reference name and optional description.
- Study status.
- Latest activity.
- Current DNA version/status.
- Applied project/edit count.
- Search/filter only when records justify it.
- Loading, empty, unavailable, and retry states.

The selected row exposes text and semantic selection state, not color alone.

### Center — Preference Study Chat

- Study title.
- Reference/evidence controls when the current gate supports them.
- User, assistant, and system study messages.
- Deterministic setup questions before real reasoning is enabled.
- Composer and send action.
- Study progress and evidence findings when backed by records.
- User corrections and approval prompts in later gates.
- Reload-safe conversation.

The center remains conversational. It must not become a settings form or technical card wall. Study Chat is separate from the main Project Edit Chat and cannot start editing execution.

### Right — Preference DNA And QA Inspector

- Study status.
- Evidence status.
- Skill status.
- Preference DNA status.
- DNA QA status.
- Next required action.
- Later-gate expandable sections for visual language, story/pacing, captions, color, B-roll, audio/SFX, graphics/motion, do-not-copy rules, confidence, warnings, and version approval.

Every displayed value must come from backend data or a deterministic typed mapping. Empty decorative panels are prohibited. Gate 1 must explicitly say:

- `Study evidence not complete`
- `DNA not generated yet`
- `QA not run`

## New Reference Flow

The first working flow asks for:

- Name, required.
- Description, optional.
- Initial study goals: Visual language, Story and pacing, Captions, Color, B-roll, Audio and SFX, Graphics, or Everything.

Initial goals are study-intent metadata only. Selecting them does not mean a skill ran.

On success, the new Edit Reference is selected, a study is opened, and deterministic setup questions appear in Study Chat. Failure preserves user input and exposes one retry action.

## Workspace Defaults

Workspace Defaults retains the broad default controls for new edits:

- Edit level.
- Workflow type.
- Cleanup preference.
- Visual preference.
- Mood/style.
- Credit preference.
- Preferred target platform.
- Whether reusable choices begin confirmed.

The tab must preserve load, draft, save, conflict, retry, discard, and snapshot semantics supported by the canonical backend boundary. Existing edits retain their copied baseline. Workspace Defaults do not become Preference DNA and do not mutate existing edits.

## Applied Edits

Until durable Preference Application records exist, the tab shows a truthful empty/not-yet-applied state. It must not derive counts from mock handles or fabricate projects. Later it lists exact target project/edit identity, applied DNA version, application state, source, timestamp, replacement/clear history, and downstream invalidation state.

## Safety & Privacy

This tab explains and, when data exists, reports:

- Adapt, never copy.
- Do-not-copy rules.
- Raw-frame and provider-payload persistence policy.
- Runtime source and fallback labelling.
- Private asset/reference handling.
- Provenance and evidence source types.
- Retention/deletion boundary.
- Production persistence and media-analysis gates.

Normal users must not see secrets, service-role status, signed URLs, filesystem paths, raw provider responses, or internal credentials.

## Visual System

- Deep-space foundation using existing tokens.
- Bounded content, stable grid, and `minmax(0, 1fr)` for flexible columns.
- Clean glass only for focal/elevated surfaces.
- Cyan for active/focus, blue for primary actions, violet for premium depth.
- Status always includes text/icon meaning.
- One dominant action per region.
- No generic SaaS settings maze, wall of dropdowns, giant hero, or nested-card noise.

## Responsive Behavior

- Validate responsive behavior at 375, 768/780, 1024, 1280, 1440, 1728, and 1920 pixels as the route matures.
- The three-panel workspace may collapse to two panels and then a single ordered column before content becomes cramped.
- Preserve desktop/web information architecture; responsive web is not a native mobile redesign.
- Long names, messages, filenames, URLs, status text, and warnings wrap or truncate intentionally.
- No global overflow clipping may hide layout defects.
- Horizontal tab scrolling must stay inside the tab region and never create page-level overflow.

## Accessibility

- One route-level `h1`.
- Tablist/tab semantics and keyboard navigation.
- Selected reference and statuses include text.
- Every input and composer has a label.
- Icon-only actions have accessible names.
- Focus remains visible and clear of sticky composer/chrome.
- Per-message live regions only for new status/error events; the full thread is not a live region.
- Reduced motion disables nonessential transitions.
- The shared signed-in shell exposes a keyboard-first Skip to main content link.

## State Vocabulary

Use distinct UI for:

- loading
- empty
- ready
- creating
- saving
- saved
- needs retry
- not found
- access denied
- unavailable
- version conflict
- blocking validation

Transport, authorization, parse, tenancy, or repository errors must never appear as a false empty state.

## Copy And Truthfulness

- Say Edit Reference when referring to a study-derived reusable profile.
- Say Workspace Defaults for broad dropdown defaults.
- Say Preference DNA only when a stored DNA version exists.
- Say QA only when a QA record exists.
- Say fallback when a fallback ran.
- Say metadata only when media was not actually studied.
- Never imply upload, analysis, provider, worker, render, export, plan approval, or credit activity from navigation or Study Chat.
- Normal user copy must not expose gate numbers, mock/local implementation labels, database products, providers, adapters, worker names, or route internals.
- Private testing limitations must be explained in plain language: what is saved, what has not started, and what still requires review or approval.

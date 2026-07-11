# Edit Reference UI Contract

Status: `gate_7_lifecycle_closure_authority`

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

When an evidence-ready study exists, Study Chat may show one Generate DNA action with explicit not-approved/not-applied copy. After creation, the center shows a compact review surface with the exact version, layer/rule/copy-boundary counts, confidence, conflicts, and expandable evidence-linked rules. The do-not-copy layer may open by default.

Gate 4 keeps QA and approval inside that same review surface:

- one dominant `Run quality review` action before QA;
- non-passing checks visible with a clear recommendation;
- passed checks collapsed by default;
- blocking checks paired with correction, never an override;
- review-only findings paired with an exact-version acknowledgement;
- one `Approve version` action after acknowledgement;
- an approved state that explicitly says the guidance has not been applied to an edit and production has not started.

Approval controls must never expose internal QA IDs, digests, route names, runtime labels, or gate numbers in normal copy. A new DNA or QA version resets the local acknowledgement because acknowledgement is scoped to one exact version/result pair.

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

With no durable records, the tab shows a truthful empty/not-yet-prepared state and never derives counts from mock handles or fabricated projects. Gate 5 lists exact target project/edit labels, exact approved DNA version, target context, adaptation and held-back counts, target-specific guidance, application state, timestamp, and the not-connected boundary. Gate 6 updates the same record to a verified mock target and connected planning-context state only after the exact Project Edit Session receipt is accepted. Gate 7 adds replacement/clear history and downstream invalidation state.

Applied Edits renders lifecycle states as `Prepared`, `Connected`, `Replaced`, or `Removed`. Replaced and Removed are quiet historical states, not success states. When a record was replaced, the card may show the prior/next version relationship in plain language, but normal UI still omits internal IDs and digests.

`prepared` must not be rendered as if the target edit already changed. Until Gate 6 connects the record, the card states that the target edit, approved plan, and production state remain unchanged. Normal users see no IDs, digests, provider/worker terms, storage details, or internal gate labels.

## Target Edit Integration

Gate 6 adds one bounded Edit Reference connection surface inside the existing Project Edit Session preference region. It must:

- list only approved Edit References, using user-facing names rather than IDs;
- explain that ReEditPro adapts creative intelligence to the target instead of copying a reference shot list;
- collect the current target direction and require explicit confirmation of the saved output frame;
- distinguish prepared/inactive from connected/active context;
- show adapted, held-back, and do-not-copy counts after connection;
- state that current instructions and confirmed Edit Brief markers outrank reusable DNA;
- retain loading, unavailable, retry, and recovery behavior;
- never imply that a plan, provider, worker, render, media process, or credit action ran.

The connected Edit Brief card repeats the exact Edit Reference name and bounded counts, not a second selector. Marker Context, Marker Chat, Plan Hints, and QA use progressive disclosure inside their existing surfaces. A connected reference must not create a new global navigation destination, settings page, or technical inspector.

## Replacement And Removal

Gate 7 keeps lifecycle controls inside the existing Project Edit Session preference region.

- `Replace` opens a progressive replacement surface, lists only other approved Edit References, preserves the current target direction for review, and requires output-frame reconfirmation.
- `Remove` opens a destructive confirmation that names the affected Edit Reference and explains that reusable guidance will be removed while historical application records remain.
- Both actions show a pending state, disable duplicate submission, retain an actionable retry after failure, and use a live status message for completion or error feedback.
- Replacement/removal resets requested or approved session approval when required, invalidates the exact downstream context, and marks affected Brief/Marker/Plan/QA material as requiring replan.
- Invalidated context must never be silently reactivated during reload or recovery.
- A replacement produces a monotonic next application version with immutable previous/next links; removal preserves the cleared application and usage history.
- No lifecycle action mutates an approved plan, starts production, runs media/provider work, or charges credits.

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

Authority order is `design.md` and `design-system/`, then current ReEditPro UI/UX architecture, then UI UX Pro Max as supporting guidance only.

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

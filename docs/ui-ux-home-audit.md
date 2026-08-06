# Signed-In Home UI/UX Audit

Status: `audit_complete_recommendation_pending_implementation`

Status date: 2026-07-10

This is an audit and design-direction document. It does not authorize UI implementation, route changes, data migrations, provider execution, billing, or production release.

## Executive Finding

The current signed-in Home is not routing the Edit Preferences diagnostic panel by mistake. The current `/dashboard` mounts `DashboardPage`; the Supabase/API/internal-testing content exists in a collapsed disclosure inside `PreferencesPage` at `/preferences`.

The real Home problem is different: it is an onboarding-first document that shows the same large hero, account-recovery notice, and four instructional rows to first-time and returning users. It can resume one latest edit, but it does not yet behave like a professional dashboard for resuming work, finding attention items, or scanning recent edits.

The signed-in Home should become a resume-first creative command center with a first-project variant for new users.

## Evidence And Screenshot Reconciliation

### Current route truth

- `/dashboard` mounts `DashboardPage` in `src/App.tsx`.
- `/preferences` mounts `PreferencesPage`.
- `DashboardPage` does not import or render the internal-testing readiness report.
- The current Home screenshot at `docs/ui-ux-screenshots/active-product-redesign-2026-07-10/home-1280.png` matches `DashboardPage`.

### Where the diagnostic content actually lives

These strings occur in `src/pages/PreferencesPage.tsx`:

- `Safety boundary`
- `Internal testing details`
- `Testing connection`
- `Supabase sign-in`
- `Live backend check`

They are inside `<details data-testid="internal-testing-details">`, collapsed by default. `tests/e2e/editor.spec.ts` explicitly navigates to `/preferences`, confirms the readiness card is hidden, opens the disclosure, and then checks those strings.

Therefore the diagnostic screenshot discussed in the design conversation is most consistent with one of these cases:

1. `/preferences` was scrolled down with `Internal testing details` expanded.
2. It came from an older or different branch.
3. It was mislabeled as Home.

There is no current Home routing bug in this checkout.

## Current Home Composition

`src/pages/DashboardPage.tsx` currently renders:

1. `AppShell` route header: `Home` / `Start an edit` / descriptive sentence.
2. A second full-width hero: `From raw footage to a review-ready edit.`
3. Create Project and, when available, Continue Latest.
4. A full-width account-recovery state.
5. A small Latest Edit surface when an edit exists.
6. Four full-width onboarding rows:
   - Create a project.
   - Start a named edit.
   - Add footage and shape the plan.
   - Approve and review.

The onboarding rows always render. There is no explicit first-time versus returning-user composition.

## Job Of The Signed-In Home

The signed-in Home is not a marketing hero. Its job is:

> Get the user back into meaningful editing work within five seconds.

It must answer, in this order:

1. What should I continue?
2. What needs my attention?
3. How do I start something new?

It should not lead with product education, technical readiness, public-delivery disclaimers, billing boundaries, or generic analytics.

## Current Home Data

### Available now

`DashboardPage` reads a scoped, newest-first list of `LocalInternalProjectHandoff` records and attempts reviewed backend recovery. The list is currently capped at 12 records.

Each handoff can provide:

- Project ID and name.
- Edit session ID and optional edit name.
- Editing category.
- Exact editor path.
- Coarse workflow stage.
- Source-file count.
- Created and updated timestamps.
- Setup snapshot.
- Optional source-media metadata.
- Optional approved snapshot and reservation IDs.
- Optional private-review and revision metadata.

`LocalProjectRecord` data is also available elsewhere and provides project ID, name, category, and timestamps. `ProjectsPage` already merges browser and reviewed-backend project records, but Home does not currently load that project source.

### Currently rendered

- The latest handoff only: `handoffs[0]`.
- Edit name.
- Coarse stage.
- Stage-derived next-action sentence.
- Source-file count.
- Exact Continue Latest path.
- Account-recovery state.

### Missing or unsafe to claim

| Desired Home content | Current constraint |
| --- | --- |
| `Plan ready for approval` | The persisted Home stage model has no distinct pre-approval plan-ready stage. Do not infer it. |
| Real source thumbnail/poster | Durable source summaries intentionally do not expose a public or signed URL to Home. A scoped private-thumbnail contract is required. |
| Current credit estimate | The Home summary does not carry a user-facing estimate. Keep estimates in Plan Review until a truthful summary contract exists. |
| Progress percentage | No stable Home progress percentage is persisted. Use named workflow state only. |
| Dedicated attention list | It can be derived from stages, but no shared selector or product contract exists yet. |
| Recent project list | Project data exists, but Home does not currently load or reconcile it. |

The first Home redesign must not fabricate media, progress, approval, or credit information.

## Truthful Stage Mapping

The initial Home can map the current coarse stages as follows:

| Persisted stage | User-facing state | Attention | State-aware action |
| --- | --- | --- | --- |
| `created` | Source needed | Yes | Upload source |
| `source_uploaded` | Ready for preparation | Yes | Prepare footage |
| `plan_approved` | Approved work underway | No user action implied | View progress |
| `private_review_ready` | Review ready | Yes | Open review |
| `private_review_verified` | Review checked | Yes | Approve or revise |
| `private_review_accepted` | Review approved | No | Open edit |
| `internal_edit_complete` | Internal edit complete | No | Open edit |
| `revision_requested` | Changes requested | Yes | Review changes |
| `revision_preview_ready` | Revision ready | Yes | Open revision |

Do not show all non-created states as green success. Green is reserved for approved or completed states; created/source-uploaded/revision states require neutral, cyan, or amber treatment.

## State Audit

### First-time user

Current behavior:

- Shows the full product hero.
- Shows an account-recovery state that can dominate the page.
- Shows four full-width instructional rows.

Required direction:

- One focal `Create your first project` surface.
- One primary Create Project action.
- One compact `Project → Named edit → Upload / Brief` explanation.
- No empty Recent Work or Needs Attention sections.
- Optional quiet link to Saved Edit Preferences.

### Returning user

Current behavior:

- Adds a small Latest Edit row but retains all onboarding content.

Required direction:

- Continue the latest meaningful edit is the focal surface.
- Show zero to three derived attention items.
- Show a bounded recent-work group.
- Suppress onboarding.
- Keep New Project available but secondary to resuming work.

### Loading

Current behavior:

- Uses a full-width resource-state notice.

Required direction:

- Reserve the focal and recent-work geometry with quiet skeletons.
- Do not show false empty state while exact scoped recovery is unresolved.
- Preserve the existing recovery truth and access-denied behavior.

### Empty

- Show only the first-project focal state and compact process explanation.
- Do not render empty grids or empty attention panels.

### Local-only / backend unavailable

- If a trusted browser copy exists, keep the edit usable and show a compact inline notice.
- If no trusted copy exists, state that workspace recovery is unavailable without claiming the workspace is empty.
- Offer Retry only when the result is retryable.
- Full technical diagnostics remain outside Home.

### Access denied

- Treat as blocking.
- Do not render recovered project or edit details.
- Give one recovery/sign-out action path.

## Visual Diagnosis

### Duplicated hierarchy

`AppShell` renders eyebrow, route H1, and description. Home then adds a second near-equal H2 hero. The route H1 and inner H2 scales are too similar, so the page has two competing introductions.

### Over-wide low-information surfaces

The standard app content is not bounded by `--rp-content-max`. The hero, recovery notice, and onboarding rows span the remaining viewport even when their content is short. This creates dead space at 1280px and becomes more pronounced at 1728px and 1920px.

### Undifferentiated surfaces

Hero, page intro, latest edit, flow rows, and setting rows use similar dark fill, border, radius, and padding. Focal and supporting content therefore carry nearly equal visual weight.

### Status-semantic error

Home currently renders every latest-edit stage with a success badge. `Changes requested` and `Ready for upload` are not successes.

### Product copy in the wrong layer

The Home hero explains private workspace, public delivery, and billing boundaries. Those are important product constraints, but they should live in approval/help/trust contexts rather than dominate the signed-in task dashboard.

## Recommended Home Contract

Use Concept A from `docs/ui-ux-home-concepts.md`: Resume-first command center with an automatic first-project variant.

Required hierarchy:

1. Compact route header with `Home` or a short contextual greeting and one New Project action.
2. One focal Continue Edit surface, or Create First Project when empty.
3. Compact Needs Attention list, hidden when empty.
4. Bounded Recent Work group.
5. Quiet View Projects and Edit Preferences links.

## Likely Implementation Surface

This audit does not implement the redesign. A future approved Home milestone is likely to affect:

- `src/pages/DashboardPage.tsx`
- `src/components/AppShell.tsx` or a page-header variant
- `src/components/ProjectResourceState.tsx`
- `src/lib/local-project-handoff.ts` only if a richer summary contract is approved
- Project list/recovery helpers if Home begins loading projects
- `src/styles/layout.css`
- `src/styles/surfaces.css`
- `src/styles/responsive.css`
- `src/styles/tokens.css` only when a missing semantic token is proven
- Home E2E and screenshot coverage

## Required Home Acceptance Evidence

### Screenshots

- First-time/empty at 1280px.
- Returning user with one edit at 1280px.
- Returning user with at least five edits and three attention items at 1440px.
- Loading, trusted-local-only, retryable unavailable, and access-denied states.
- Long project/edit names.
- 1024px and 1920px.
- Existing 125% zoom proxy.

### Assertions

- One route-level H1.
- One dominant primary action per region.
- Returning users do not see onboarding.
- Exact recovered editor path remains correct.
- Status mapping is tested for every current stage.
- No horizontal overflow.
- Bounded content at wide desktop widths.
- Logical keyboard order and visible focus.
- Status is not color-only.
- No fabricated thumbnail, estimate, or progress data.

## Decisions Required Before Implementation

1. Approve Resume-first as the returning-user Home and first-project as its empty variant.
2. Approve which current stages count as Needs Attention.
3. Decide whether Home should load the reviewed project registry now or initially use edit handoffs only.
4. Decide whether a private thumbnail artifact contract belongs in the Home milestone or a later media milestone.
5. Confirm that internal-testing diagnostics should move completely out of normal Edit Preferences rather than merely remain collapsed.

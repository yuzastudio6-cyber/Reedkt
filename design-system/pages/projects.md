# Projects Page Override

Status: `implemented_scan_and_filter_v1`

Status date: 2026-07-10

## Job

Projects helps a signed-in user find a project, understand its latest edit state, and continue without turning the page into a file table or analytics dashboard.

## Hierarchy

1. Compact route header with `New project`.
2. Search and state filters only when projects exist.
3. Compact recovery truth when it affects trust.
4. Bounded project-card grid.
5. One clear action on each card.

Project cards do not stretch to fill the page when only one or two projects exist. Wide screens create additional grid capacity and whitespace instead of long low-information cards.

## Project Card Content

- Truthful category/source-state visual until a real private poster contract exists.
- One status dot and readable label.
- Project name.
- One or two lines describing the latest useful next step.
- Edit count and latest edit name.
- `Open project` action.

No badge clusters, fake thumbnails, KPI metrics, wallet data, or production-readiness claims.

## Filters

- All.
- Needs action.
- In progress.
- Complete.

The pressed state is programmatic through `aria-pressed`. Search and filters preserve the normal project identity and never infer a missing project from a transport failure.

## Required States

- Loading without trusted data: resource recovery state, not a false empty page.
- First-time: one Create Project focal surface.
- Ready: bounded cards and state-aware descriptions.
- No search/filter result: quiet inline empty result with Clear Filters.
- Local/private recovery: compact neutral row.
- Access denied/unavailable/malformed: explicit resource state with safe action.

## Validation

- Search/filter behavior and live result count.
- Same-name project identity remains distinct.
- 1024, 1280, 1440, 1728, and 1920 overflow checks.
- Empty and populated screenshot review.
- Status readable without color.
- Shared recovery surfaces use a bounded semantic card at blocking scope and a compact three-column row when trusted local work remains; the compact row stacks cleanly below 720px.
- No retired product areas or internal diagnostics.

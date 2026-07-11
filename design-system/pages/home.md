# Home Page Override

Status: `implemented_resume_first_v1`

Status date: 2026-07-10

## Job

The signed-in Home is not a marketing hero. It must answer within five seconds:

1. What should I continue?
2. What needs my attention?
3. How do I start something new?

## Returning User Hierarchy

1. Compact route header with `New project`.
2. Level 1 Continue Edit surface with a state-aware CTA.
3. Level 3 Needs Attention list for other actionable edits.
4. Quiet Recent Work cards.
5. Inline Edit Preferences shortcut.
6. Compact recovery notice only when connection state affects trust.

The focal surface represents the latest meaningful edit, not merely a project container. It uses a truthful abstract category/source-state visual until a private thumbnail contract exists.

## First-Time Hierarchy

1. Create First Project focal surface.
2. Compact `Project -> Named edit -> Upload and shape the plan` sequence.
3. Inline Edit Preferences shortcut.
4. No empty Recent Work or Needs Attention containers.

## State-Aware Actions

- Created -> Upload source.
- Source uploaded -> Prepare footage.
- Plan approved -> View progress.
- Review ready -> Open review.
- Review verified -> Approve or revise.
- Review accepted/complete -> Open edit.
- Revision requested -> Review changes.
- Revision ready -> Open revision.

## Status Treatment

- Source needed, decision needed, review ready, revisions -> amber dot + text.
- Preparation or approved work underway -> cyan dot + text.
- Approved/complete -> green dot + text.
- Counts and timestamps -> neutral text.
- No decorative badge clusters.

## Responsive Behavior

- Wide desktop: focal/attention asymmetric split.
- 1120px and below: attention stacks below the focal surface.
- 760px and below: focal visual/copy and recent cards become single-column.
- Wide displays increase outer whitespace through `--rp-content-max` rather than stretching cards.
- Native mobile IA remains out of scope; this is responsive web.

## Required States

- Loading without trusted local data: bounded focal skeleton; no false first-time claim.
- First-time: one Create Project action.
- Returning: Continue Edit and state-aware action.
- Attention: up to three other actionable edits.
- No attention: quiet success text, not a celebration card.
- Account unavailable with trusted local edit: preserve the edit and show one compact notice.
- Access denied: fail closed and show the actionable resource state.

## Validation

- First-time and returning recovery E2E.
- 1024, 1280, 1440, 1728, and 1920 viewport checks.
- Screenshot review for first-time and returning states.
- Keyboard and focus review.
- Reduced-motion review.
- No horizontal overflow, duplicate H1, internal diagnostics, retired product navigation, or false media/credit data.

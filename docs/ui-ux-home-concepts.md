# Signed-In Home Concepts

Status: `concept_a_implemented_and_validated`

Status date: 2026-07-10

These concepts remain the comparison record. Concept A is now implemented as the signed-in Home, with a first-project variant, a returning-user focal edit, state-aware actions, other attention items, recent work, compact recovery truth, and the page-specific rules in `design-system/pages/home.md`.

## Shared Product Contract

Every concept must preserve:

- Signed-in Home is a dashboard, not the public marketing hero.
- Project-first architecture.
- One meaningful primary action per region.
- Exact scoped project/edit recovery.
- Plan and credit approval before work begins.
- No fabricated thumbnail, credit estimate, or progress data.
- No internal-testing console on Home.
- Desktop/web first; responsive web is required, native mobile IA is not.

## Concept A — Resume-First Command Center

Recommendation: `preferred`

### Returning-user wireframe

```text
Home                                               [New project]
Pick up where you left off.

┌───────────────────────────────────────┬────────────────────────┐
│ Continue editing                      │ Needs your attention   │
│                                       │                        │
│ [category / source-state visual]      │ ● Upload source        │
│ Project name / Edit name              │   Property launch      │
│ Current stage · updated time          │                        │
│ Source count · concise next step      │ ● Review changes       │
│                                       │   Founder story        │
│ [state-aware primary action]          │                        │
└───────────────────────────────────────┴────────────────────────┘

Recent work                                      View projects →
┌────────────────────┐ ┌────────────────────┐ ┌────────────────────┐
│ Edit / state       │ │ Edit / state       │ │ Edit / state       │
│ project · updated  │ │ project · updated  │ │ project · updated  │
└────────────────────┘ └────────────────────┘ └────────────────────┘

Edit defaults                                    Edit Preferences →
```

The left focal surface should usually occupy more visual weight than the attention rail. A 7/5 or 8/4 split is a starting hypothesis, not a hardcoded rule.

### First-time wireframe

```text
Home
Start your first edit.

┌───────────────────────────────────────────────────────────────┐
│ Create your first project                                   │
│ Keep related edits, source footage, plans, and reviews      │
│ together.                                                    │
│                                                               │
│ [Create project]                                             │
└───────────────────────────────────────────────────────────────┘

Project  →  Named edit  →  Upload and optional brief

Set reusable editing defaults                     Edit Preferences →
```

Recent Work and Needs Attention do not render when empty.

### Information hierarchy

1. Continue the latest meaningful edit.
2. Resolve user-action states.
3. Scan recent edits.
4. Start a new project.
5. Reach all projects or saved Edit Preferences.

### Primary action

- Returning user: a state-aware action on the focal edit.
- First-time user: Create Project.

New Project remains in the page header for returning users, but must not visually outrank Continue Edit.

### State-aware action map

| Stage | Action label |
| --- | --- |
| `created` | Upload source |
| `source_uploaded` | Prepare footage |
| `plan_approved` | View progress |
| `private_review_ready` | Open review |
| `private_review_verified` | Approve or revise |
| `private_review_accepted` | Open edit |
| `internal_edit_complete` | Open edit |
| `revision_requested` | Review changes |
| `revision_preview_ready` | Open revision |

### Grid and max-width behavior

- Bound ordinary Home content to roughly the existing `--rp-content-max`, subject to screenshot tuning.
- Use one 12-column desktop grid rather than independent full-width panels.
- Keep the focal/attention pair aligned.
- Recent Work may use three compact cards or divider-separated rows based on actual text length.
- At 1024px, stack attention beneath the focal surface without changing information order.
- At wider desktop widths, increase outer whitespace rather than stretching low-information cards.

### Surface hierarchy

- Canvas: open deep-space surface.
- Continue/Create: one Level 1 focal surface.
- Recent edits: Level 2 quiet cards.
- Attention: Level 3 inline rows, not warning cards.
- State: Level 4 dot/text/small badge.

### Data dependencies

Available now:

- Latest and recent edit handoffs.
- Project/edit identity.
- Exact path.
- Coarse stage.
- Category.
- Source count.
- Updated time.
- Private-review/revision metadata.

Requires additional work:

- Reconciled recent project registry on Home.
- A shared attention selector and ordering contract.
- A private safe thumbnail contract if actual media imagery is desired.
- A richer persisted stage before Home can say `Plan ready for approval`.
- A current estimate summary before credits can appear on Home.

Initial implementation should use a restrained category/source-state visual instead of pretending to show a video poster.

### Components likely affected

- `DashboardPage`
- Shared page header behavior in `AppShell`
- A small Home edit summary primitive
- A small attention-row primitive
- `ProjectResourceState`
- Status mapping helper

### CSS likely affected

- App content max-width.
- Home grid.
- Surface levels.
- Responsive stacking.
- Semantic status styles.

### Tests affected

- Home empty and recovery tests.
- Active-route viewport tests.
- Home screenshots.
- New semantic status mapping tests.
- Keyboard/focus order assertions.

### Strengths

- Answers Continue, Attention, and Start in under five seconds.
- Gives returning users priority without weakening first-time onboarding.
- Uses current data honestly.
- Feels like creative workflow software rather than analytics or documentation.
- Scales from one edit to the current 12-record handoff cap.

### Weaknesses

- A visually rich focal media area needs a safe thumbnail contract.
- Attention must be carefully derived so background work is not mislabeled as user action.
- The current coarse stage model cannot represent plan-waiting-for-approval.

## Concept B — Intent-First Start

Recommendation: `defer`

### Wireframe

```text
Home                                               [New project]
What are you creating?

┌───────────────────────────────────────────────────────────────┐
│ Start a project                                              │
│ [Project name / category or intent entry]                    │
│ [Create project]                                             │
└───────────────────────────────────────────────────────────────┘

Continue latest
┌───────────────────────────────────────────────────────────────┐
│ Project / Edit · stage · updated                   [Continue] │
└───────────────────────────────────────────────────────────────┘

Recent projects
[Project]  [Project]  [Project]
```

### First-time state

The creation surface dominates and the Continue region is absent.

### Returning state

Continue Latest appears under creation, which makes starting new work more prominent than resuming existing work.

### Product constraint

Do not add a ChatGPT-like Home prompt unless submitting it has a reviewed contract to create or prefill a project and named edit. The current architecture does not support a disconnected Home chat. Duplicating Create Project fields on Home would also create two creation surfaces to maintain.

### Strengths

- Very clear for first-time users.
- Could later support an intent-led creation contract.
- Visually simple.

### Weaknesses

- Poorer priority for returning users.
- Risks bypassing or duplicating the current Project -> Named Edit model.
- Needs a new intent-to-project contract to be genuinely chat-native.
- Makes Home feel like another creation form.

## Concept C — Project Activity Workspace

Recommendation: `not_primary`

### Wireframe

```text
Home                                               [New project]
Projects and edits

Active projects
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ Project          │ │ Project          │ │ Project          │
│ latest edit      │ │ latest edit      │ │ latest edit      │
│ state / updated  │ │ state / updated  │ │ state / updated  │
└──────────────────┘ └──────────────────┘ └──────────────────┘

Needs attention                    Recent activity
● Upload source                    Edit created
● Open revision                    Review approved
```

### First-time state

The grid is replaced by a Create First Project state.

### Returning state

Projects become the primary unit, with latest edit context nested in each project.

### Strengths

- Strong for users managing many projects.
- Exposes project containers clearly.
- Can scale to agency or studio workflows later.

### Weaknesses

- Makes the next meaningful edit less obvious.
- Risks becoming another operational card grid.
- Duplicates the Projects page.
- Requires project/edit reconciliation and more derived data on Home.
- Encourages equal-sized cards and status-chip density.

## Comparison

| Criterion | A: Resume-first | B: Intent-first | C: Project activity |
| --- | --- | --- | --- |
| Returning-user speed | Strongest | Weak | Medium |
| First-time clarity | Strong with variant | Strongest | Medium |
| Fits current data | Strong | Partial | Partial |
| Fits project-first flow | Strong | Risk without new contract | Strong |
| Avoids generic dashboard | Strong | Strong | Weakest |
| Avoids duplicating Projects | Strong | Strong | Weak |
| Supports current recovery truth | Strong | Medium | Medium |
| Visual focal point | Latest edit | Creation | Project grid |

## Recommendation

Approve Concept A: Resume-first command center, with the first-project variant replacing the focal and supporting sections when the workspace has no trusted projects or edits.

It best satisfies the signed-in Home job without inventing unsupported product behavior. It also gives ReeditPro a distinct creative-workbench character while staying calm and operational.

## Definition Of Concept Signoff

Concept A is ready for implementation planning only after product approval of:

1. Attention-stage mapping.
2. Whether recent Home content is edit-first only or includes projects.
3. Whether the initial focal visual is an abstract/category treatment or waits for a private thumbnail contract.
4. The exact role of the compact Edit Preferences shortcut.

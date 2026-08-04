# Active-Product UI/UX Redesign Milestones

Status: `planning_ready_product_approval_required`

Status date: 2026-07-10

This roadmap covers only the current active product. It does not reactivate Wallet, Pricing, Brand Kit, Media Library, Templates, Team, Analytics, standalone Exports, native mobile, or unrestricted production execution.

## Governing Sequence

1. Approve product and information-architecture decisions.
2. Implement one page/workspace milestone at a time.
3. Validate functional states.
4. Capture required screenshots.
5. Complete visual signoff before propagating the pattern.

Do not perform a repo-wide cosmetic rewrite before Home establishes the approved surface hierarchy and status semantics.

## Milestone 0 — Decision Lock And Baseline

### User goal

No user-facing change. Establish one approved implementation contract.

### Scope

- Approve Concept A for Home or choose another concept.
- Approve attention-stage mapping.
- Approve surface/status rules.
- Confirm `Edit Preferences` as visible terminology.
- Confirm internal-testing relocation.
- Preserve current workspace IA until the current-edit preference architecture is approved.

### Routes affected

- None.

### Components/CSS affected

- None.

### Data dependencies

- Decide whether Home initially uses edit handoffs only or reconciles project records.
- Decide whether safe thumbnail work is in or out of the Home milestone.

### Approval/credit implications

- None. Existing plan/credit gate remains authoritative.

### Evidence

- Approved docs in this audit package.
- Baseline screenshots for all active routes.
- Recorded current validation results.

### Definition of done

- Product owner approves the Home concept and unresolved architecture decisions.
- No active dirty work is overwritten.
- The implementation prompt names exact in-scope routes and exclusions.

## Milestone 1 — Signed-In Home Implementation

### User goal

Resume meaningful work, find required actions, or start a project within five seconds.

### Routes affected

- `/dashboard`

### UX changes

- Replace duplicate route header + large onboarding hero with one compact hierarchy.
- Returning user: Continue Edit focal surface, Needs Attention, Recent Work, View Projects.
- First-time user: Create First Project focal surface and compact process explanation.
- Suppress onboarding for returning users.
- Make recovery states compact and truthful.
- Apply semantic stage colors and state-aware CTA labels.
- Use visible `Edit Preferences` terminology for any shortcut.

### Components affected

- `DashboardPage`
- Shared page-header behavior if needed
- `ProjectResourceState`
- New small edit-summary/attention-row primitives if justified

### CSS affected

- Home layout/grid.
- Standard app max-width.
- Level 1/2/3 surface recipes.
- Semantic status styles.
- Responsive stacking.

### Data/state dependencies

- Existing handoff list, exact editor paths, stages, timestamps, source count.
- Optional project-record reconciliation only if approved.
- No real thumbnail, plan-ready label, progress percentage, or credit estimate without new contracts.

### Approval/credit implications

- Home must not expose Approve or spend credits without exact Plan Review context.
- `plan_approved` may show View Progress; it must not imply a new approval action.

### E2E changes

- First-time Home.
- Returning Home.
- Attention ordering.
- Every stage's tone and CTA.
- Recovery loading/local-only/unavailable/access-denied.
- Exact editor path.
- Keyboard and overflow.

### Screenshots

- Empty 1280.
- Returning one-edit 1280.
- Multi-edit/attention 1440.
- 1024 and 1920.
- Long names.
- Loading/local-only/unavailable/access-denied.
- 125% zoom proxy.

### Definition of done

- User can identify the next action in five seconds.
- One H1 and one focal surface.
- No duplicate hero.
- No returning-user onboarding.
- No full-width low-information rows.
- No fabricated data.
- Functional, accessibility, and visual evidence passes.

### Product decisions required

- Attention mapping.
- Project data on Home.
- Initial focal visual treatment.

## Milestone 2 — Home Visual Signoff And Pattern Freeze

### User goal

No new feature. Ensure the Home pattern is truly professional before reuse.

### Routes affected

- `/dashboard`

### UX changes

- Spacing, type, surface, copy, focus, and motion adjustments only.

### Components/CSS affected

- Only Home and shared primitives proven necessary by screenshot review.

### Data dependencies

- Same as Milestone 1.

### E2E/screenshots

- Re-run the full Home state matrix.
- Compare at 1024/1280/1440/1728/1920.
- Verify reduced motion and keyboard focus.

### Definition of done

- Home surface levels and status semantics are approved as the cross-product baseline.
- Any page-specific rule is documented rather than turned into a global default accidentally.

## Milestone 3 — Projects

### User goal

Find a project quickly, understand its latest edit state, or create a new project.

### Routes affected

- `/projects`
- Redirect behavior remains unchanged.

### UX changes

- Remove duplicated Projects/Project Edits introduction.
- Bound the content at wide widths.
- Use project summaries sized to their information.
- Keep exact loading/local-only/unavailable/denied/invalid recovery truth.
- Use semantic status mapping.
- Preserve one Create Project action.
- Avoid duplicating the Home recent-work layout.

### Components affected

- `ProjectsPage`
- Project summary primitive
- `ProjectResourceState`

### CSS affected

- Project list/grid composition.
- Populated/empty states.
- Responsive layout.

### Data dependencies

- Existing project record and handoff merge.
- No media thumbnail without safe artifact support.

### Approval/credit implications

- None beyond truthful stage labels.

### E2E/screenshots

- Empty, one project, many projects.
- Project with no edits, one edit, multiple edits.
- Every recovery state.
- Long names.
- 1024-1920 and keyboard.

### Definition of done

- Projects is easy to scan and does not read as a stretched settings list.
- Status and next action are accurate.
- No false empty state.

## Milestone 4 — Project Home / Named Edit List

### User goal

Understand one project, create a named edit, and resume an existing edit.

### Routes affected

- `/projects/:projectId`

### UX changes

- Remove duplicated project header + Edits intro.
- Give project identity, edit list, and New Edit clear hierarchy.
- Show saved Edit Preferences summary quietly as the baseline for new edits.
- Keep the New Edit dialog accessible and focused.
- Use state-aware edit actions instead of generic Open where possible.

### Components affected

- `ProjectDetailPage`
- New Edit modal and edit rows.
- Shared project/edit summary primitives.

### CSS affected

- Project header and edit-list composition.
- Dialog polish only when needed.

### Data dependencies

- Exact project recovery.
- Edit handoffs.
- Saved Edit Preferences snapshot summary.

### Approval/credit implications

- Creating an edit snapshots defaults but does not approve a plan or spend credits.

### E2E/screenshots

- Empty project.
- Multi-edit project.
- New Edit normal/error/keyboard/Escape.
- Preference load pending.
- Recovery denied/not-found/unavailable.
- Long names and wide/narrow desktop.

### Definition of done

- The Project page makes the Project -> Named Edit model obvious without instructional card walls.

## Milestone 5 — Named Edit Workspace Shell

### User goal

Know which edit is open, its state, and the available workspace destinations without losing Chat focus.

### Routes affected

- `/projects/:projectId/edits/:editSessionId`
- `/editor` remains compatibility/internal.

### UX changes

- Preserve the editor's strong minimal header and floating composer.
- Clarify project/edit identity and persistence without adding badge noise.
- Keep exact pre-mount recovery gates.
- Decide, but do not prematurely implement, addressable Chat/Brief/Current Edit Preferences destinations unless Milestone 0 approved the required architecture.
- Keep advanced Timeline/SFX/Music secondary.

### Components affected

- `EditorPage`
- `ChatNativeEditor`
- `MinimalProjectHeader`
- Recovery/loading shells

### CSS affected

- Editor header and workspace bounds.
- Utility-control hierarchy.

### Data dependencies

- Exact named-edit state.
- Persistence status.
- Brief availability/status.
- Current-edit preference architecture if approved.

### Approval/credit implications

- Opening a view is non-mutating.
- No generation or credit action moves into the shell.

### E2E/screenshots

- Upload gate, default setup, source prepared, plan, progress, review, revision.
- Missing/denied/unavailable edit.
- Header long names and persistence states.
- 1024-1920 and 125% zoom.

### Definition of done

- The shell is quieter than its content and never competes with the current required action.

### Product decisions required

- Addressable destination pattern.
- Brief shortcut behavior.
- Current Edit Preferences availability.

## Milestone 6 — Chat And Plan Review

### User goal

Describe the edit, answer only necessary questions, understand the plan/cost, approve, and review progress without technical overload.

### Routes affected

- Named edit route.
- `/editor` compatibility path.

### UX changes

- Preserve floating composer and open chat lane.
- Reduce nested outlined cards and routine badges.
- Keep required action cards expanded and concise.
- Consolidate the plan/credit approval moment.
- Keep advanced/provider/developer details collapsed.
- Remove internal/private QA vocabulary from normal summary copy.
- Preserve microphone disabled/accessible truth if voice is not connected.

### Components affected

- Structured chat renderer.
- Chat composer.
- Plan Review/approval card.
- Progress/review/revision cards.
- Advanced disclosure.

### CSS affected

- `chat.css` decomposition may be proposed, but only through bounded slices.
- Message rhythm and card surface levels.
- Composer focus/occlusion.

### Data dependencies

- Existing structured messages and planning state.
- Existing credit estimate/approval gates.

### Approval/credit implications

- This is the highest-risk gate. No progress state before explicit plan + credit approval.
- Lower-cost and revise actions must not approve automatically.

### E2E/screenshots

- Default/upload/source/reference/plan/approval/progress/review/revision.
- Advanced closed and open.
- Composer empty/typing/attachment/focus/keyboard.
- Reduced motion and zoom.

### Definition of done

- Guided mode has no card wall.
- Plan and credit consequences are obvious.
- Chat remains primary.
- Technical details remain available but secondary.

## Milestone 7 — Edit Brief

### User goal

Review and change what this specific edit is without creating another source of truth.

### Routes affected

- Named edit route only, unless an addressable nested destination is approved.

### UX changes

- Preserve one Edit Brief state.
- Separate factual deliverable context from editing behavior.
- Make Optional/Draft/Ready understandable without multiple badges.
- Protect unsaved changes.
- Make material-change consequences clear before invalidating approval.
- Keep the header control a shortcut or summary, not a duplicate editable Brief.

### Components affected

- `FootagePrepWorkspace`
- Edit Brief hook/components.
- `MinimalProjectHeader` shortcut.

### CSS affected

- Brief grouping, form hierarchy, responsive behavior.

### Data dependencies

- Brief ownership/persistence if it becomes addressable.
- Structured planning context.
- Central material-change resolver.

### Approval/credit implications

- Material Brief changes invalidate stale plan/estimate/approval.
- Opening or viewing the Brief is non-mutating.

### E2E/screenshots

- Optional, draft, ready, used-in-plan, unsaved, invalidation warning.
- Back/Forward/direct link if addressable.

### Definition of done

- One Brief source of truth.
- Clear separation from Edit Preferences.
- Safe recovery and invalidation behavior.

## Milestone 8 — Edit Preferences

### User goal

Set reusable editing defaults and, after the required architecture exists, understand or override how the current edit should be edited.

### Routes affected

- `/preferences`
- `/edit-preferences` remains alias.
- Named edit route only if Current Edit Preferences is approved.

### UX changes

- Change visible label to Edit Preferences.
- Remove duplicated route/page intro.
- Group saved defaults by editing concern.
- Show clear save, dirty, retry, read-only, and inheritance copy.
- Move internal testing outside normal feature content.
- If Current Edit Preferences is implemented, show inherited versus overridden values and reset behavior.

### Components affected

- `PreferencesPage`
- Preference field groups.
- Persistence status.
- Future current-edit preference surface.

### CSS affected

- Form grouping and density.
- Persistence/error states.
- Elevated internal-only panel if separately approved.

### Data dependencies

- Existing saved preference repository.
- Current-edit canonical record and material-change resolver before override UI.

### Approval/credit implications

- Saved defaults never mutate existing edits.
- Current material changes may invalidate plan/approval; the UI must explain this before saving.
- Preferences never execute tools, upload, approve, or spend credits.

### E2E/screenshots

- Saved normal/dirty/save/loading/error/read-only.
- Scope isolation/sign-out.
- New edit receives snapshot.
- Current override/inheritance/reset/invalidation if implemented.
- Internal diagnostics absent from normal surface.

### Definition of done

- One feature name and one two-scope mental model.
- No generic settings confusion.
- No developer console in the normal page.

### Product decisions required

- Current-edit canonical record.
- Save model.
- Invalidation matrix.
- Addressable workspace pattern.

## Milestone 9 — Sign In And Public Entry Alignment

### User goal

Understand ReeditPro, sign in safely, and land in the correct workspace.

### Routes affected

- `/`
- `/sign-in`

### UX changes

- Align public promise with current project-first, chat-first flow.
- Preserve one strong CTA.
- Do not advertise retired routes or unrestricted execution.
- Keep return-to behavior clear.
- Distinguish local-test/internal entry from production identity without technical overload.

### Components affected

- `LandingPage`
- `SignInPage`
- Marketing navigation/auth states.

### CSS affected

- Marketing/auth only.

### Data dependencies

- Existing auth runtime and return-to logic.

### Approval/credit implications

- Public copy must preserve approval-before-work and honest credit language.

### E2E/screenshots

- Signed out, local-test entry, Supabase configured/unconfigured, invalid credentials, return-to.
- 1024-1920 and keyboard.

### Definition of done

- Public entry and signed-in product describe the same current product.

## Milestone 10 — Shared Accessibility, Motion, Responsive, And CSS Hardening

### User goal

Use the active product reliably across desktop widths, zoom, keyboard, and reduced-motion settings.

### Routes affected

- All active routes.

### UX changes

- Normalize focus, targets, errors, loading, and status semantics.
- Add restrained motion only where it explains state.
- Preserve desktop-first composition at narrow responsive web widths.
- Eliminate dead wide-screen stretching.

### Components/CSS affected

- Shared primitives.
- `layout.css`, `chat.css`, `responsive.css`, `surfaces.css`, motion tokens.
- Decompose large CSS files only in reviewable feature slices.

### Data dependencies

- None beyond current state contracts.

### Approval/credit implications

- No behavior change to gates.

### E2E/screenshots

- All active routes at 1024/1280/1440/1728/1920.
- 125% zoom proxy.
- Keyboard-only navigation.
- Reduced motion.
- Long copy and errors.

### Definition of done

- No horizontal overflow.
- Focus is visible and unobscured.
- Status is not color-only.
- Motion is optional and interruptible.
- No page becomes an accidental mobile app.

## Milestone 11 — Whole-Product Visual Signoff

### User goal

No new features. Confirm the active product feels like one coherent professional application.

### Routes affected

- `/`
- `/sign-in`
- `/dashboard`
- `/projects`
- `/projects/new`
- `/projects/:projectId`
- `/projects/:projectId/edits/:editSessionId`
- `/preferences`
- `/editor` compatibility audit

### Review requirements

- Route-by-route state matrix.
- Cross-route hierarchy consistency.
- Page-specific composition rather than copied templates.
- Approval and credit truth.
- Internal detail containment.
- Surface/status budget.
- Accessibility.
- Performance and bundle review.
- Build/lint/typecheck/E2E.

### Definition of done

- Every active route passes functional and visual acceptance.
- Retired surfaces remain absent.
- Product decisions are reflected in docs.
- Screenshot evidence is current and named by state.
- Any remaining blocker is explicitly documented rather than disguised as complete.

## Excluded From This Roadmap

- Native mobile application.
- Standalone Wallet.
- Standalone Pricing in the current app.
- Standalone Brand Kit.
- Global Media Library.
- Templates marketplace.
- Team/collaboration dashboard.
- Analytics dashboard.
- Standalone Export Queue.
- Public sharing/delivery activation.
- Live billing or unrestricted credit mutation.
- Provider or worker activation without its own evidence gates.

# ReeditPro UI/UX Page Flow Map

## `/`

- Primary goal: understand ReeditPro as chat-first AI video editing.
- Main action: open projects and start the project/edit flow.
- Secondary actions: inspect product promise and security/readiness posture.
- Visible: project-first path, upload-to-private-review promise, approval-before-generation promise, and signature systems.
- Hidden/collapsed: technical planning internals, tool names, backend details, billing surfaces, and old dashboard destinations.
- Never: full-page cyan background, generic SaaS claims, unlimited editing language, visible Pricing/Wallet/Brand Kit/Exports app links.
- Spacing: marketing scale can be larger but should preserve bounded grid.
- Future notes: no mobile app flow; responsive web only.

## `/dashboard`

- Primary goal: provide a quiet home surface for internal testing and project resumption.
- Main action: open Projects or create a project.
- Secondary actions: check internal readiness notes without exposing old wallet, pricing, export, or brand-kit pages.
- Visible: concise project/edit status and clear route into the Project -> Edit flow.
- Hidden/collapsed: deep technical planning cards, tool names, billing surfaces, export queues, and retired route links.
- Never: generation activity before approval, product-ready claims, or old dashboard card walls.
- Spacing: keep the home surface sparse and operational.

## `/projects`

- Primary goal: find projects and open their edit lists.
- Main action: create a project.
- Secondary actions: search existing projects and restore saved internal edit state.
- Visible: clean project cards and edit status summaries.
- Hidden/collapsed: backend storage implementation detail, tool names, old wallet/pricing/export/brand surfaces.
- Never: real upload or storage claims before the user enters an edit and completes the upload gate.
- Spacing: keep filters compact and project groups distinct.

## `/projects/new`

- Primary goal: create a project shell before any edit work starts.
- Main action: name the project and choose a broad context.
- Secondary actions: return to Projects.
- Visible: category context and a clear handoff to the project detail page.
- Hidden/collapsed: full planning internals, tool names, provider/model routes, and upload controls.
- Never: imply category forces a visual system, creates an edit automatically without user action, or starts generation.
- Spacing: category cards should scan cleanly without overwhelming.

## `/projects/:projectId`

- Primary goal: show edits inside one project.
- Main action: create a named edit with the plus/new-edit action.
- Secondary actions: reopen existing edits and review their stage.
- Visible: edit list, current edit status, and a clean route to `/projects/:projectId/edits/:editSessionId`.
- Hidden/collapsed: technical execution details and retired app surfaces.
- Never: start upload, planning, generation, or billing from the project list.
- Spacing: keep edit rows/cards compact and easy to scan.

## `/projects/:projectId/edits/:editSessionId`

- Primary goal: complete one focused edit chat/workspace.
- Main action: upload source video, prompt or optionally complete Edit Brief, review plan, approve credits, and inspect private review.
- Secondary actions: revise, open timeline/details, and attach reference context when needed.
- Visible: upload gate, current step, chat composer, source sequence, optional Edit Brief, plan review, private review, revision state.
- Hidden/collapsed: advanced/developer details unless expanded, internal tool names, backend/provider/model wording, old dashboard surfaces.
- Never: live tool execution, public delivery, signed URLs, billing mutation, external beta, or production without the named evidence gates.
- Spacing: chat messages and inline cards must remain readable and progressive.

## `/editor`

- Primary goal: compatibility route for older internal links.
- Main action: preserve old links by opening the focused edit workspace with isolated testing IDs.
- Secondary actions: none beyond the normal edit workspace actions.
- Visible: same clean edit workspace as the project/edit route.
- Hidden/collapsed: legacy dashboard surfaces and retired app links.
- Never: become the primary navigation path again.

## `/preferences`

- Primary goal: manage local/internal testing preferences.
- Main action: set edit preferences used when starting future edits.
- Secondary actions: review safe account/testing configuration.
- Visible: preferences that affect edit setup and internal testing flow.
- Hidden/collapsed: billing checkout, production deployment, and retired app pages.
- Never: imply paid production, live external beta, or service-role settings are configured from the browser.

## Retired Compatibility Routes

- `/wallet` redirects to `/preferences`.
- `/pricing` redirects to `/projects`.
- `/brand-kit` redirects to `/preferences`.
- `/exports` redirects to `/projects`.
- `/upload` redirects to `/projects/new`.
- `/app` redirects to `/dashboard`.
- These routes are not active app surfaces and should not appear in sidebar navigation.

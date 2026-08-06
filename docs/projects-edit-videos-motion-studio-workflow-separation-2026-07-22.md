# Projects, Edit Videos, And Motion Studio Workflow Separation

Status: `source_and_normal_edit_browser_verified_motion_shared_mount_pending`

Date: 2026-07-22

## Owner correction

Projects, normal video editing, and Motion Studio Storytelling are separate product workflows:

```text
Home
Projects
Edit Videos
Motion Studio
Edit Preferences
```

- Projects owns project containers at `/projects`.
- Edit Videos owns the normal named-edit library at `/edit-videos`.
- A normal named edit opens `/projects/:projectId/edits/:editSessionId` and mounts normal Edit Chat.
- Motion Studio owns its Storytelling Library and dedicated Director Chat workspace.

Renaming Projects to Edit Videos or redirecting Motion Storytelling into normal Edit Chat does not satisfy this contract.

## Shared workflow authority

The local/browser handoff now carries an explicit product-workflow identity:

- `video_edit`
- `motion_studio.storytelling`

Editing category is content context only. A normal edit may use `category = storytelling` and must still open normal Edit Chat. Category, `?studio=story`, and the superseded nested `.../motion-studio` path grant no Motion authority.

This local discriminator is routing and library metadata, not production authorization. The dedicated Motion workspace remains fail-closed until the server re-verifies the canonical Motion Studio production association defined by the Motion-owned contract.

For retained Motion V1 browser records only, the exact namespaced `storytelling-edit-` identity remains a migration hint when no explicit product workflow exists. An explicit workflow always wins, so the prefix cannot override a normal record.

## Routes

Backend-line routes in this change:

- Projects: `/projects`
- Edit Videos: `/edit-videos`
- Normal Edit Chat: `/projects/:projectId/edits/:editSessionId`
- Saved Edit Preferences: `/preferences`

Motion-owned frozen contract from product-integration commit `15d05425a95225329970546614645db7473a7717`:

- workflow: `motion_studio.storytelling`
- library: `/motion-studio/storytelling`
- Director Chat workspace: `/motion-studio/storytelling/projects/:projectId/edits/:editSessionId`

That Motion commit intentionally does not edit the shared router or shell. A later one-writer product integration must mount its namespaced workspace and insert Motion Studio between Edit Videos and Edit Preferences without replacing any of the other destinations.

## Edit Preferences seam

The approved-DNA action `Choose a project edit` now targets `/edit-videos`. It still applies nothing by itself and does not change the canonical Edit Preference library, target-study, application, Brief, planning, or approval authorities.

## Verification

- `npx tsx server/smoke/product-workflow-route-separation-smoke.ts`
- `npm run smoke:edit-preferences-route-entrypoint`
- frontend/server TypeScript
- focused ESLint
- focused Chromium coverage for Projects, Edit Videos, exact normal Edit Chat, route entry, and project-to-edit flow
- production build, full lint, frontend boundary, secret scan, strict canonical UI source gate, and diff integrity

The workflow-separation browser case uses two records with the same `storytelling` content category. It proves that the explicit normal record appears in Edit Videos and opens normal Edit Chat, while the explicit Motion record does not appear there.

## Closed gates

This source/UI change starts no upload, provider, worker, tool, render, export, credit, billing, Supabase, cloud, deployment, or public-delivery action. The dedicated Motion workspace shared mount remains pending one-writer source reconciliation; this backend branch does not fabricate it.

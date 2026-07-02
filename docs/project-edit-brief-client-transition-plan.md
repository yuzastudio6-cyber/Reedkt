# Project Edit Brief Client Transition Plan

RP-EDITBRIEF-04 prepares the future Brief UI without adding that UI yet.

Transition path:

1. Use the browser-safe client and adapter helpers for future Brief shell calls.
2. Keep `ProjectEditSessionChatPage`, `/editor`, and `ChatNativeEditor` unchanged.
3. Add `/projects/:projectId/edits/:editSessionId/brief` only in a later owner-approved milestone.
4. Continue using mock/local fixture state until production auth, RLS, Supabase schema, storage/media workers, render, and credit gates are approved.

The client hides large raw bundles behind compact summaries for future UI surfaces. Edit Brief remains optional and belongs to a `ProjectEditSession`; it is not an Edit Preference and does not replace the main Edit Chat.

## RP-EDITBRIEF-04A QA Closure

The route/client layer is QA-closed for future UI work after passing `smoke:project-edit-brief-route-client-qa-closure`, existing ProjectEditBrief route/client smokes, shared API/safety checks, Project Edit Session smokes, representative Preference Video/Edit Preference smokes, build, lint, frontend-boundary, QA wrappers, and requested Playwright specs.

No Edit Brief UI shell, no `/brief` route, no runtime behavior, no migration, no Supabase command, no staging, no commit, and no cleanup occurred. RP-EDITBRIEF-05 may start only after owner review.

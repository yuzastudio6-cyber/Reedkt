# Edit Brief UI And Route Audit

Status: audit only. This report adds no implementation, no migration, no Supabase command, no route, no UI behavior, no worker, no render, no provider/model call, no credit action, no staging, and no cleanup.

## Current Routes

| Route | Current behavior |
| --- | --- |
| `/projects/:projectId` | Mock Project Home with Edit Chat cards and New Edit flow. |
| `/projects/:projectId/edits/:editSessionId` | Persistent mock Edit Chat page. |
| `/projects/:projectId/edits/:editSessionId/chat` | Same Edit Chat page with chat route section. |
| `/projects/:projectId/edits/:editSessionId/history` | Same Edit Chat page with history-focused section. |
| `/projects/:projectId/edits/:editSessionId/versions` | Same Edit Chat page with version-focused section. |
| `/projects/:projectId/edits/:editSessionId/preview` | Same Edit Chat page with preview-focused section. |
| `/projects/:projectId/edits/:editSessionId/details` | Same Edit Chat page with details-focused section. |
| `/editor` | Legacy/global mock editor; not session-specific. |
| `/edit-preferences` | Edit Preference library/create/detail surface. |
| `/internal-testing` | Internal testing status/scenario surface. |

## Future Recommendation

Future Brief route: `/projects/:projectId/edits/:editSessionId/brief`.

Chat remains default. Brief is optional. Opening Brief can be closed or left without side effects. Brief should not auto-start setup, progress, preview, render, workers, providers, Supabase writes, or credit activity.

## UI Placement

Future Brief should appear as a route tab beside Chat, History, Versions, Preview, and Details after owner approval. The route should render a clean surface with video/preview frame, simple timeline, marker lane, selected marker drawer/popup, asset chips, optional Marker Chat, and access to export settings.

## Boundary

No `/brief` route is added in RP-EDITBRIEF-00. Existing `ProjectEditSessionChatPage` and `ChatNativeEditor` runtime behavior remains unchanged.

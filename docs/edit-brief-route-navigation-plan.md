# Edit Brief Route Navigation Plan

Status: architecture/docs only. This report maps a future `ProjectEditSession` Brief route and adds no implementation, no TypeScript types, no repository, no API route, no UI route, no runtime behavior, no migration, no Supabase command, no provider/model call, no worker, no render, no upload, no file-byte read, no credit action, no staging, and no cleanup.

## Future Route

Recommended future route:

```text
/projects/:projectId/edits/:editSessionId/brief
```

## Current Route Relationship

- `/projects/:projectId/edits/:editSessionId` remains the default Edit Chat route.
- `/chat`, `/history`, `/versions`, `/preview`, and `/details` continue to render the existing Project Edit Session shell.
- `/editor` remains the legacy/global editor and is unchanged.
- `/edit-preferences` remains the Edit Preference library.

## Navigation Rules

- Chat remains default.
- Brief is optional.
- Opening Brief has no side effects.
- Closing Brief has no side effects unless changes were explicitly saved in a future milestone.
- The route tab label remains pending owner approval: `Brief` or `Edit Brief`.

## Boundary

No `/brief` route is added in RP-EDITBRIEF-01.

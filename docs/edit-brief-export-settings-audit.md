# Edit Brief Export Settings Audit

Status: audit only. This report adds no implementation, no migration, no Supabase command, no route, no UI behavior, no worker, no render, no provider/model call, no credit action, no staging, and no cleanup.

## Existing Export-Like Concepts

| Concept | Existing surface | Ownership decision |
| --- | --- | --- |
| Aspect ratio | Project Edit Session fixtures, Project Home cards, source sequence and editor UI. | Belongs to `ProjectEditSession`. Brief may display/edit later. |
| Platform target | Project Edit Session session fields and Edit Brief target platforms. | Belongs to session/edit intent; Brief can refine. |
| Preview placeholder | Project Edit Session preview history. | Session-level preview metadata, not Brief-owned. |
| Render/export policy | Production render/export smokes and worker docs. | Future blocked production gate. |
| Safe zones/caption safe area | Visual/graphic understanding and editor styling concepts. | Session/export setting candidate; Brief may expose. |
| Resolution/frame rate/codec | Production/render planning language appears in docs/workers. | Future export settings only; no runtime in audit. |

## Future Export Settings Candidates

- Aspect ratio
- Platform target
- Resolution
- Frame rate / fps
- Caption safe zone
- Graphic safe zone
- Format/container
- Codec/profile
- Audio loudness target
- Watermark/review label state

## Expected Decision

Export settings belong to `ProjectEditSession` and are accessible from Edit Brief, but not owned only by Edit Brief. Brief can suggest or edit session-level export settings later; render/export remains blocked until production gates exist.

## Boundary

No render, export, media processing, artifact write, worker, provider, credit, or Supabase behavior is added by RP-EDITBRIEF-00.

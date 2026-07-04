# Edit Brief Video Player And Preview Audit

Status: audit only. This report adds no implementation, no migration, no Supabase command, no route, no UI behavior, no worker, no render, no provider/model call, no credit action, no staging, and no cleanup.

## Existing Preview And Player-Like Surfaces

| Surface | Current purpose | Brief reuse | Boundary |
| --- | --- | --- | --- |
| `ProjectEditSessionPreviewRecord` and preview history UI | Mock preview placeholders and version/approval history. | Reuse latest-preview metadata and placeholder display. | Does not imply render, media processing, signed URL, or generated artifact. |
| Project Home aspect frames | Card thumbnails/aspect-aware frames for Edit Chats. | Reuse aspect framing patterns. | Not a video player. |
| `DetailedTimelineDrawer` | Advanced timing check with mock timeline. | Reuse panel/drawer style. | Not a Brief player or marker editor. |
| Media safe preview descriptors | Mock storage/source preview descriptors. | Reuse metadata-only safe preview concepts. | `storageReadMade`, `storageWriteMade`, and `signedUrlCreated` stay false. |
| Preference source video DNA cards | Mock source-video metadata and DNA summaries. | Reuse source metadata language. | No real source-video study or frame inspection. |

## Reuse For Future Brief

- Use latest Project Edit Session preview placeholder as the default video/preview surface when available.
- Show mock/local boundary text next to any player-like component.
- Reuse aspect ratio, platform target, safe-zone language, and source-order context from the session.
- Keep marker interactions as metadata-only until real media lifecycle and render gates exist.

## Future Gaps

- No Project Edit Session Brief video player exists.
- No playhead binding to markers exists.
- No safe-zone overlay for Brief exists.
- No marker lane synchronized with preview time exists.
- No real preview/render artifact can be read or generated.

## Audit Result

Future Edit Brief may display a mock preview/player frame and marker timeline, but it must not imply real render/export. Preview work remains mock metadata until storage, worker, render, and credit gates are approved.

# Storage Bucket Strategy

RP-FIX-07 uses the active RP-DATA-04 bucket names instead of introducing `reeditpro-*` bucket ids.

## Buckets

| Bucket | Purpose |
| --- | --- |
| `source-media` | User-uploaded source videos, clips, audio, and reference media separated by path. |
| `generated-assets` | AI-generated or worker-generated visual/audio assets and placeholders. |
| `processed-media` | Future processed intermediates, normalization outputs, or derived media. |
| `previews` | Preview render outputs. |
| `exports` | Final export files. |
| `thumbnails` | Project thumbnails, preview images, and temporary profile/brand image planning. |
| `qa-artifacts` | Future QA reports, diagnostics, thumbnails, manifests, or review artifacts. |
| `worker-temp` | Worker-only temporary objects. No normal user policy should write here. |

## Upload Purpose Mapping

| Upload purpose | Bucket |
| --- | --- |
| `source_media` | `source-media` |
| `reference_media` | `source-media` |
| `generated_asset` | `generated-assets` |
| `preview_render` | `previews` |
| `final_export` | `exports` |
| `thumbnail` | `thumbnails` |
| `audio_asset` | `generated-assets` |
| `profile_asset` | `thumbnails` |
| `brand_asset` | `thumbnails` |

Profile and brand assets are planned only. Production should add workspace-safe policies or backend signed upload routes before treating these as real user-facing upload paths.

## Privacy Recommendation

Most buckets should stay private. Access should use conservative storage RLS, short-lived signed URLs, or backend delivery routes. Final exports should default to signed URLs, not public buckets.

## Path Strategy

Project assets use:

```text
workspace/{workspaceId}/project/{projectId}/{folder}/{assetId}/{filename}
```

Workspace-only profile and brand assets use:

```text
workspace/{workspaceId}/profile/{userId}/{filename}
workspace/{workspaceId}/brand/{assetId}/{filename}
```

The local RP-FIX-07 migration adds conservative project-path policies. Workspace-only profile/brand paths remain backend-required until a safe policy is reviewed.

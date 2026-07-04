# Edit Brief Source Asset Attachment Audit

Status: audit only. This report treats Marker attachments as future `ProjectEditSession` metadata only and adds no implementation, no migration, no Supabase command, no route, no UI behavior, no worker, no render, no provider/model call, no credit action, no staging, and no cleanup.

## Existing Source And Asset Surfaces

| Surface | Current support | Future marker attachment use |
| --- | --- | --- |
| Media asset repository | Mock media asset records, previews, upload sessions, source order, and disabled Supabase boundary. | Reuse metadata-only asset references and safety flags. |
| Storage runtime | Mock providers and disabled Supabase/GCS providers. | Reuse safe preview descriptors and provider readiness summaries. |
| Source sequence adapter | Converts filenames/File metadata into mock descriptors and source order context without byte reads. | Reuse for marker source chips and source-order references. |
| Edit Cue assets | `EditCueAsset` links cue instructions to media assets and usage roles. | Strong prior art for marker attachments. |
| Edit Brief asset rules | Must-use/avoid asset lists in existing brief panel. | Reuse concept as Brief-level rules, separate from marker-specific attachments. |
| Preference source video metadata | Mock source-video DNA and summary metadata. | Reuse as context, not source footage copying. |

## Attachment Types To Consider Later

- Source clip reference
- B-roll note
- Caption note
- Music cue
- SFX cue
- Voiceover note
- Image/reference URL metadata
- Edit Preference / DNA hint reference

## Blocked Or Future

- Real uploads
- External URL fetches
- File-byte reads
- Signed URL creation
- Media processing
- Storage writes
- Worker extraction

## Audit Result

Marker attachments should start as metadata-only chips linked to existing media/source records where available. The future UI should keep attachment chips clean and clearly mock/local until storage and media-worker gates are approved.

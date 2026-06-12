# Creative Graphics Group B Private Preview Cleanup Rollback Packet

Prompt: `TRACKA-GD-GROUPB-HANDOFF-2`

Decision state: `ready_with_warnings_for_tracka_gd_groupb_handoff_3`

This cleanup packet defines future Handoff-3 cleanup expectations. It does not remove or create files in Handoff-2.

## Future Local Cleanup Scope

Future Handoff-3 may clean only the local/private output directory represented by `<LOCAL_OUTPUT_DIR>`.

Future cleanup must:

- Remove failed local preview outputs from the future Handoff-3 local output directory.
- Preserve committed evidence summaries.
- Preserve source evidence lockfile references.
- Preserve checksum/provenance summaries when available.
- Record failure classification and retry decision.

Future cleanup must not:

- Delete source evidence docs.
- Delete committed manifests.
- Perform GCS cleanup.
- Create or revoke signed URLs.
- Touch public artifacts.
- Mutate Supabase.
- Run SQL.
- Call Google Cloud or Secret Manager.
- Run workers, providers, models, Remotion render/export, Lottie browser/player behavior, or Anime.js.

## Failure Classifications

| Classification | Meaning | Future retry disposition |
| --- | --- | --- |
| `blocked_pending_group_b_source_artifacts` | Required source evidence or lockfile references are missing. | Fix source evidence before retry. |
| `blocked_pending_group_b_metadata_fixes` | Timing, fps, duration, dimensions, alpha, or checksum/provenance metadata is incomplete. | Fix metadata before retry. |
| `group_b_private_preview_failed` | Future Handoff-3 local/private preview attempt fails after gates pass. | Preserve evidence and create a fix prompt. |

## Status

Cleanup status: `future_cleanup_packet_ready`

Private preview status: `group_b_private_preview_not_executed`

Supabase update required: `docs/status only`

Supabase update status: `docs_only`

Supabase environment touched: `none`

SQL executed: `none`

Migration deployed: `no`

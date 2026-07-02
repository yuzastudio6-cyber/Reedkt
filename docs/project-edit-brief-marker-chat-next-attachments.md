# Project Edit Brief Marker Chat Next Attachments

The recommended next mock/local milestone after owner review is:

`RP-EDITBRIEF-08 — Marker Attachments: B-roll, Image, Music, SFX`

RP-EDITBRIEF-08 should add metadata-only attachment flows first. It should still avoid uploads, file-byte reads, external URL fetches, signed URLs, media processing, workers, render/progress, providers/models, Supabase commands/migrations, credits, staging, commit, and cleanup unless separately approved.

Marker Chat can already mark B-roll as `needs_asset`, but it does not upload or attach media.

Boundary: no Qwen, no provider, and no Supabase behavior is introduced before the next attachments milestone.

## RP-EDITBRIEF-08 Status

RP-EDITBRIEF-08 implemented Marker Attachments as mock/local metadata-only UI and client adapter work. It does not add real uploads, file-byte reads, external URL fetches, signed URLs, media processing, sound runtime, workers, render/progress, providers/models, Supabase commands/migrations, credits, staging, commit, cleanup, or `ChatNativeEditor` changes.

Next recommended milestone after owner review: `RP-EDITBRIEF-09 — Export Settings Auto-Recommendation + Brief Access`.

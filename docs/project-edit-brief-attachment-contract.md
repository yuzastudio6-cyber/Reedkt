# Project Edit Brief Attachment Contract

Edit Brief attachments are metadata-only in RP-EDITBRIEF-02. They can describe B-roll, images, music tracks, soundtracks, SFX, voiceover labels, documents, reference labels, or reference URL metadata-only placeholders.

Attachment statuses are `metadata_only`, `mock_attached`, `needs_upload_future`, `missing_required_asset`, and `blocked`. These statuses describe future work readiness only.

No fixture attachment reads file bytes, uploads files, fetches external URLs, creates signed URLs, writes storage objects, invokes workers, starts media processing, or mutates Supabase. Labels are safe placeholders, not executable references.

Future milestones may connect this contract to media asset repositories and source sequence metadata after owner approval.

Boundary: Edit Brief is optional inside `ProjectEditSession`; each Marker stays mock/local; there is no repository, no API handler, and no Supabase command.

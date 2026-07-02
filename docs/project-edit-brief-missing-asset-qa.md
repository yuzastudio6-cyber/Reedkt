# Project Edit Brief Missing Asset QA

Marker QA marks a marker as `needs_asset` when the instruction requires metadata that is not present. B-roll markers need B-roll, image, label, or reference metadata. Music markers need music/soundtrack metadata. SFX markers need SFX metadata. Voiceover markers need voiceover or script metadata.

Attachments remain metadata-only. RP-EDITBRIEF-10 does not upload files, read file bytes, fetch external URLs, create signed URLs, process media, run sound runtime, or create worker jobs. The marker can show a missing-asset warning and recommended fix, but no upload or media gate opens.

There is no Qwen, no DeepSeek, no providers, no workers, no render, no credits, no Supabase command, and no planner application.

owner review remains pending for any future storage/media asset lifecycle.

Marker QA boundary summary: mock/local, no Qwen, no DeepSeek, no providers, no workers, no render, no credits, no Supabase command, no planner application, owner review pending.

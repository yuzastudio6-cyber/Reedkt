# Project Edit Brief Attachment Metadata Policy

Marker Attachments are mock/local metadata-only labels. They may contain a safe label, optional notes, a redacted reference URL metadata value, or a future media identifier placeholder. They do not contain raw media, file bytes, signed URLs, extracted frames, audio waveforms, transcripts, or generated artifacts.

Blocked paths:
- no upload
- no file bytes
- no URL fetch
- no media processing
- no sound runtime
- no providers
- no workers
- no render
- no credits
- no Supabase command, migration, read, or write

Music, soundtrack, and SFX attachments are intent metadata only. They do not start sound runtime, Docker, audio analysis, providers, render, workers, or credit activity.

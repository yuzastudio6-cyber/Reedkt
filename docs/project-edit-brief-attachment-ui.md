# Project Edit Brief Attachment UI

The marker drawer now includes a Marker Attachments panel. It supports metadata-only add/remove for B-roll, image, music, soundtrack, SFX, voiceover, document, reference label, and reference URL metadata.

The UI shows chips, a detail card, a kind picker, a disabled upload placeholder, and boundary copy. The disabled upload path intentionally says real uploads arrive after storage/media gates. No file input is active for real work.

Every UI path remains mock/local: no upload, no file bytes, no URL fetch, no media processing, no sound runtime, no providers, no workers, no render, no credits, and no Supabase command or write. React components import only browser-safe client/adapter modules.

RP-EDITBRIEF-09 is the next recommended milestone after owner review.

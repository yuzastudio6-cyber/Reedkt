# Project Edit Brief Marker Attachments System

RP-EDITBRIEF-08 adds mock/local Marker Attachments for Edit Brief markers. A Marker Attachment is a marker-scoped metadata-only record for B-roll, image, music, soundtrack, SFX, voiceover, document, reference label, or reference URL metadata. It helps clarify marker intent without becoming a media asset upload.

Boundaries are strict: no upload, no file bytes, no URL fetch, no media processing, no sound runtime, no providers, no workers, no render, no credits, and no Supabase command or write. Reference URLs are stored as metadata only and displayed in redacted form.

The existing `project.editBrief.markerAttachments.*` route/client/repository seam remains the integration point. No new route IDs, production HTTP routes, Supabase migrations, worker jobs, planner execution, or `ChatNativeEditor` behavior were added.

Status: mock/local metadata-only complete pending verification. Owner decisions remain pending for real uploads, media asset linking, storage gates, planner application, and production persistence.

# Project Edit Brief Mock Fixtures

RP-EDITBRIEF-02 provides deterministic mock fixtures for future Edit Brief work. Fixtures cover optional not-opened state, active empty brief, B-roll markers, music markers, caption markers, cut/remove markers, do-not-use markers, Marker Chat confirmation, clarification, conflict, and changed-after-plan cases.

All fixture records are `mockOnly: true`. Attachment labels such as `mock-broll-city.mp4`, `calm-soundtrack.mp3`, and `product-image-placeholder.png` are metadata-only strings. They are not real files, uploads, signed URLs, source reads, or media processing inputs.

Fixture bundles include briefs, markers, attachments, Marker Chat messages, structured intents, confirmations, conflicts, revisions, application logs, session-level export settings, timeline marker models, and joined bundle records.

This milestone does not create MockDatabase collections, repositories, API handlers, UI behavior, uploads, worker jobs, render jobs, credits, migrations, or Supabase commands.

Boundary: Edit Brief is optional inside `ProjectEditSession`; each Marker stays mock/local; there is no repository, no API handler, and no Supabase command.

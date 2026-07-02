# Project Edit Brief Type Contracts

RP-EDITBRIEF-02 adds the `ProjectEditBrief*` type surface for the optional Edit Brief layer inside a `ProjectEditSession`. The user-facing Edit Chat remains the persistent editing workspace; Edit Brief is a timeline-based instruction layer that can be opened later inside that workspace.

The public model separates:

- `ProjectEditBriefRecord`: one optional brief for an Edit Chat.
- `ProjectEditBriefMarkerRecord`: point or range instructions on the timeline.
- `ProjectEditBriefMarkerMessageRecord`: Marker Chat messages scoped to one marker.
- `ProjectEditBriefMarkerIntentRecord`: structured intent derived from marker notes or future clarification.
- `ProjectEditBriefMarkerAttachmentRecord`: metadata-only attachments for source labels, mock clips, music labels, documents, and future upload placeholders.
- `ProjectEditSessionExportSettingsRecord`: session-level export settings accessible from Brief and Chat.
- `ProjectEditBriefBundleRecord`: joined mock fixture package for future repository/API work.

This is no implementation beyond types, contracts, and mock fixtures. There is no repository, no API handler, no UI route, no runtime behavior, no migration, and no Supabase command.

Owner decisions pending: final marker drawer behavior, marker AI mode defaults, marker precedence against Edit Preference DNA, and future persistence shape.

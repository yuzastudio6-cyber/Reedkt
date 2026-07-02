# Project Edit Brief Export Settings UI

The RP-EDITBRIEF-09 UI replaces the read-only Export Settings summary with an editable mock/local panel inside the existing Edit Brief side panel.

## Visible Controls

- Recommended preset selector.
- Width and height metadata fields.
- Frame-rate selector.
- Caption safe area toggle.
- Save button that writes through the existing `project.editBrief.exportSettings.update` client route.

## Product Boundary

The panel shows session-level Export Settings from `ProjectEditSessionExportSettingsRecord`. Saving settings updates mock/local metadata only. It starts no render/export, no progress, no preview generation, no file bytes read, no URL fetch, no media processing, no Supabase command, no provider/model call, no worker, and no credits.

owner review remains required before production export settings, real render readiness, or media probing can be enabled.

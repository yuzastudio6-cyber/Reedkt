# Project Edit Brief Export Settings Contract

`ProjectEditSessionExportSettingsRecord` is session-level metadata. It is accessible from Edit Brief, but it belongs to the `ProjectEditSession` / Edit Chat rather than to a single Marker.

RP-EDITBRIEF-02 fixtures include mock export settings for vertical social, YouTube standard, square feed, 4:5 feed, website, and custom future states. The settings cover platform target, aspect ratio, resolution, frame rate, format, codec, audio codec, loudness target, caption safe area, safe zone preset, and delivery preset.

These settings are planning metadata only. No render job, preview generation, export, file write, worker lease, credit reservation, provider call, or Supabase command is started.

Owner decisions pending: final production presets, safe-zone policy, render worker mapping, and where durable export settings should live in Supabase.

Boundary: Edit Brief is optional inside `ProjectEditSession`; each Marker stays mock/local; there is no repository, no API handler, and no Supabase command.

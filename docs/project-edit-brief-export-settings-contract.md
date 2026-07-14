# Project Edit Brief Export Settings Contract

`ProjectEditSessionExportSettingsRecord` is session-level metadata. It is accessible from Edit Brief, but it belongs to the `ProjectEditSession` / Edit Chat rather than to a single Marker.

RP-EDITBRIEF-02 fixtures include mock export settings for vertical social, YouTube standard, square feed, 4:5 feed, website, and custom future states. The settings cover platform target, aspect ratio, professional resolution profile, exact resolution, frame rate, format, codec, audio codec, loudness target, caption safe area, safe zone preset, and delivery preset.

The legacy delivery-preset IDs retain their original resolution suffixes for compatibility, but output quality is now an independent `resolutionProfileId`. Registered choices are 1080p Full HD, 2K/1440p, and 4K UHD with exact aspect-aware dimensions. New deterministic recommendations use 4K UHD by default; source-metadata recommendations may preserve an exact lower-resolution source frame. Manual dimensions are classified as `custom` and must still match the confirmed aspect ratio and professional encoding constraints.

The initial edit credit estimate always uses the 4K UHD ceiling. Changing the same approved deliverable between covered 1080p, 2K, and 4K profiles does not create another estimate, reserve credits again, or add an export-time charge. Revised aspect ratio, FPS, duration, additional deliverables, above-4K output, and out-of-profile frames return to planning and approval.

These settings are planning metadata only. No render job, preview generation, export, file write, worker lease, credit reservation, provider call, or Supabase command is started.

Owner decisions pending: final public-delivery codec presets, safe-zone policy, render worker mapping, and where durable export settings should live in Supabase.

Boundary: Edit Brief is optional inside `ProjectEditSession`; each Marker and export-setting update stays mock/local through the existing client/repository seam. There is no production export authority, Supabase command, provider call, render execution, or credit mutation here.

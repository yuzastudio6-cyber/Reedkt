# Production Final Render QA Policy

M16A render QA emits `render_asset_integrity`, `render_timeline_integrity`, caption gates when captions are present, `audio_sync`, `color_export_space`, `mask_subject_coverage`, `enhancement_artifacts`, and `slow_motion_artifacts` when those layers are present.

Export QA emits `export_codec_format`, `export_duration_sync`, `audio_sync`, and `final_delivery`.

`final_delivery` passes only when a private `final_export` artifact exists and all blocking upstream/render/export gates pass. Otherwise final delivery remains blocked.

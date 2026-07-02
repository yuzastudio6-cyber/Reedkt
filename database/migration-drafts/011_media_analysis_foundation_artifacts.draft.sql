-- Draft only: Milestone 6 media analysis foundation artifact notes.
-- Do not apply as an active migration until schema/RLS/storage review is complete.

comment on table media_analysis_reports is
  'Draft production media analysis report table. Milestone 6 reports may be partial after probe/proxy/audio/frame foundation work; speech, scene, audio cleanup, color, OCR, mask, enhancement, and render QA workers fill later sections.';

comment on column media_analysis_reports.status is
  'Milestone 6 supports partial reports. Expected lifecycle includes pending, partial, completed, skipped, and failed, while existing review/block statuses remain policy states.';

comment on table tool_artifacts is
  'Draft production artifacts table. Source media is immutable and never overwritten. Proxy, extracted audio, keyframe, representative frame, and analysis artifacts are private storage references, not persistent signed URLs.';

comment on column tool_artifacts.storage_object_path is
  'Canonical private object path only. Signed URLs are temporary delivery mechanisms and must not be persisted as source of truth.';

comment on column tool_artifacts.artifact_type is
  'Milestone 6 foundation artifact types include proxy_video, extracted_audio, keyframe_image, representative_frame, audio_analysis_json, visual_analysis_json, and scene_report_json where created.';

comment on column tool_artifacts.storage_bucket_purpose is
  'Milestone 6 media foundation writes proxy_video to proxy_media and extracted_audio/keyframe/representative/report artifacts to analysis_artifacts or worker_temp before promotion.';

create index if not exists idx_media_analysis_reports_status
  on media_analysis_reports(status);

create index if not exists idx_tool_artifacts_media_foundation_types
  on tool_artifacts(media_asset_id, artifact_type)
  where artifact_type in (
    'proxy_video',
    'extracted_audio',
    'keyframe_image',
    'representative_frame',
    'scene_report_json',
    'visual_analysis_json',
    'audio_analysis_json'
  );

create index if not exists idx_tool_artifacts_media_foundation_private_paths
  on tool_artifacts(storage_bucket_purpose, storage_object_path)
  where storage_bucket_purpose in (
    'source_media',
    'proxy_media',
    'analysis_artifacts',
    'worker_temp',
    'qa_artifacts'
  );

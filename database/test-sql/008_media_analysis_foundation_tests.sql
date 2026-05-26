-- Draft SQL smoke checks for Milestone 6 media analysis foundation.
-- Intended for review/staging only after draft migrations are applied.

select
  count(*) > 0 as tool_artifacts_supports_media_foundation_columns
from information_schema.columns
where table_schema = 'public'
  and table_name = 'tool_artifacts'
  and column_name in (
    'artifact_type',
    'storage_bucket_purpose',
    'storage_object_path',
    'is_private',
    'source_of_truth'
  );

select
  count(*) = 0 as tool_artifacts_have_no_persistent_signed_url_columns
from information_schema.columns
where table_schema = 'public'
  and table_name = 'tool_artifacts'
  and column_name ilike '%signed%url%';

select
  count(*) > 0 as media_analysis_reports_support_status
from information_schema.columns
where table_schema = 'public'
  and table_name = 'media_analysis_reports'
  and column_name = 'status';

select
  obj_description('tool_artifacts'::regclass) ilike '%Source media is immutable%'
  and obj_description('tool_artifacts'::regclass) ilike '%never overwritten%' as source_media_not_overwritten_rule_documented;

select
  col_description('tool_artifacts'::regclass, ordinal_position) ilike '%Signed URLs%'
  or col_description('tool_artifacts'::regclass, ordinal_position) ilike '%signed URLs%' as signed_url_source_of_truth_rule_documented
from information_schema.columns
where table_schema = 'public'
  and table_name = 'tool_artifacts'
  and column_name = 'storage_object_path';

select
  col_description('tool_artifacts'::regclass, ordinal_position) ilike '%proxy_video%'
  and col_description('tool_artifacts'::regclass, ordinal_position) ilike '%extracted_audio%'
  and col_description('tool_artifacts'::regclass, ordinal_position) ilike '%keyframe_image%'
  and col_description('tool_artifacts'::regclass, ordinal_position) ilike '%representative_frame%' as media_foundation_artifact_types_documented
from information_schema.columns
where table_schema = 'public'
  and table_name = 'tool_artifacts'
  and column_name = 'artifact_type';

select
  col_description('tool_artifacts'::regclass, ordinal_position) ilike '%proxy_media%'
  and col_description('tool_artifacts'::regclass, ordinal_position) ilike '%analysis_artifacts%'
  and col_description('tool_artifacts'::regclass, ordinal_position) ilike '%worker_temp%' as private_media_bucket_purposes_documented
from information_schema.columns
where table_schema = 'public'
  and table_name = 'tool_artifacts'
  and column_name = 'storage_bucket_purpose';

select
  col_description('media_analysis_reports'::regclass, ordinal_position) ilike '%partial%' as media_analysis_reports_can_be_partial
from information_schema.columns
where table_schema = 'public'
  and table_name = 'media_analysis_reports'
  and column_name = 'status';

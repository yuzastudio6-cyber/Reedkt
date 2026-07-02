import {
  PROJECT_EDIT_BRIEF_EXPORT_SETTINGS_BACKEND_SAFETY_FLAGS,
} from './project-edit-brief-export-settings-validation-service'
import type {
  ProjectEditBriefExportSettingsScenario,
} from '../../types/project-edit-brief-export-settings'

type ScenarioTuple = [
  ProjectEditBriefExportSettingsScenario['id'],
  ProjectEditBriefExportSettingsScenario['title'],
  ProjectEditBriefExportSettingsScenario['expectedPreset'],
  ProjectEditBriefExportSettingsScenario['source'],
  ProjectEditBriefExportSettingsScenario['status'],
]

const BASE_SCENARIOS: Array<Omit<ProjectEditBriefExportSettingsScenario, keyof typeof PROJECT_EDIT_BRIEF_EXPORT_SETTINGS_BACKEND_SAFETY_FLAGS | 'mockOnly'>> = ([
  ['instagram_reel_vertical', 'Instagram Reel recommends 1080x1920.', 'instagram_reel_1080x1920', 'session_platform_metadata', 'recommended_mock'],
  ['tiktok_vertical', 'TikTok Reel recommends 1080x1920.', 'tiktok_1080x1920', 'session_platform_metadata', 'recommended_mock'],
  ['youtube_shorts_vertical', 'YouTube Shorts recommends 1080x1920.', 'youtube_shorts_1080x1920', 'session_platform_metadata', 'recommended_mock'],
  ['youtube_standard_landscape', 'YouTube Standard recommends 1920x1080.', 'youtube_standard_1920x1080', 'session_platform_metadata', 'recommended_mock'],
  ['website_landscape', 'Website recommends 1920x1080.', 'website_1920x1080', 'session_platform_metadata', 'recommended_mock'],
  ['internal_review_landscape', 'Internal review recommends 1920x1080.', 'website_1920x1080', 'session_platform_metadata', 'recommended_mock'],
  ['square_feed', 'Square feed recommends 1080x1080.', 'instagram_feed_square_1080x1080', 'session_aspect_metadata', 'recommended_mock'],
  ['ad_square', 'Square ad recommends 1080x1080.', 'instagram_feed_square_1080x1080', 'session_aspect_metadata', 'recommended_mock'],
  ['feed_4x5', 'Social feed 4x5 recommends 1080x1350.', 'instagram_feed_4x5_1080x1350', 'session_aspect_metadata', 'recommended_mock'],
  ['ad_4x5', 'Ad creative 4x5 recommends 1080x1350.', 'instagram_feed_4x5_1080x1350', 'session_aspect_metadata', 'recommended_mock'],
  ['custom_ratio', 'Custom ratio preserves custom metadata.', 'custom', 'custom_mock_metadata', 'custom_preserved_mock'],
  ['manual_instagram_preset', 'Manual preset override can choose Instagram Reel.', 'instagram_reel_1080x1920', 'manual_preset_override', 'user_override_mock'],
  ['manual_tiktok_preset', 'Manual preset override can choose TikTok.', 'tiktok_1080x1920', 'manual_preset_override', 'user_override_mock'],
  ['manual_shorts_preset', 'Manual preset override can choose YouTube Shorts.', 'youtube_shorts_1080x1920', 'manual_preset_override', 'user_override_mock'],
  ['manual_youtube_preset', 'Manual preset override can choose YouTube Standard.', 'youtube_standard_1920x1080', 'manual_preset_override', 'user_override_mock'],
  ['manual_website_preset', 'Manual preset override can choose Website.', 'website_1920x1080', 'manual_preset_override', 'user_override_mock'],
  ['manual_square_preset', 'Manual preset override can choose Square.', 'instagram_feed_square_1080x1080', 'manual_preset_override', 'user_override_mock'],
  ['manual_4x5_preset', 'Manual preset override can choose 4x5.', 'instagram_feed_4x5_1080x1350', 'manual_preset_override', 'user_override_mock'],
  ['manual_custom_preset', 'Manual preset override can choose Custom.', 'custom', 'manual_preset_override', 'custom_preserved_mock'],
  ['existing_settings_safe', 'Existing settings remain metadata only.', 'youtube_standard_1920x1080', 'existing_export_settings', 'recommended_mock'],
  ['caption_safe_area_on', 'Caption safe area remains on for recommendations.', 'instagram_reel_1080x1920', 'session_platform_metadata', 'recommended_mock'],
  ['safe_zone_short_form', 'Short form safe-zone metadata is applied.', 'instagram_reel_1080x1920', 'session_platform_metadata', 'recommended_mock'],
  ['safe_zone_standard', 'Standard safe-zone metadata is applied.', 'youtube_standard_1920x1080', 'session_platform_metadata', 'recommended_mock'],
  ['safe_zone_square', 'Square safe-zone metadata is applied.', 'instagram_feed_square_1080x1080', 'session_aspect_metadata', 'recommended_mock'],
  ['safe_zone_4x5', '4x5 safe-zone metadata is applied.', 'instagram_feed_4x5_1080x1350', 'session_aspect_metadata', 'recommended_mock'],
  ['mp4_only', 'MP4 stays the allowed mock format.', 'instagram_reel_1080x1920', 'session_platform_metadata', 'recommended_mock'],
  ['h264_only', 'H264 stays the allowed mock codec.', 'youtube_standard_1920x1080', 'session_platform_metadata', 'recommended_mock'],
  ['aac_only', 'AAC stays the allowed mock audio codec.', 'website_1920x1080', 'session_platform_metadata', 'recommended_mock'],
  ['no_media_probe', 'Recommendation never probes media files.', 'instagram_reel_1080x1920', 'session_platform_metadata', 'recommended_mock'],
  ['no_file_bytes', 'Recommendation never reads file bytes.', 'instagram_reel_1080x1920', 'session_platform_metadata', 'recommended_mock'],
  ['no_url_fetch', 'Recommendation never fetches external URLs.', 'instagram_reel_1080x1920', 'session_platform_metadata', 'recommended_mock'],
  ['no_render_job', 'Recommendation never starts render.', 'youtube_standard_1920x1080', 'session_platform_metadata', 'recommended_mock'],
  ['no_export_job', 'Recommendation never starts export.', 'youtube_standard_1920x1080', 'session_platform_metadata', 'recommended_mock'],
  ['no_provider_call', 'Recommendation never calls providers.', 'website_1920x1080', 'session_platform_metadata', 'recommended_mock'],
  ['no_worker_job', 'Recommendation never creates worker jobs.', 'website_1920x1080', 'session_platform_metadata', 'recommended_mock'],
  ['no_credit_spend', 'Recommendation never reserves credits.', 'instagram_feed_square_1080x1080', 'session_aspect_metadata', 'recommended_mock'],
  ['update_metadata_only', 'Saved edits remain metadata only.', 'youtube_standard_1920x1080', 'manual_preset_override', 'user_override_mock'],
  ['session_owned', 'Export settings remain ProjectEditSession-owned.', 'youtube_standard_1920x1080', 'session_platform_metadata', 'recommended_mock'],
  ['brief_access_only', 'Brief accesses session settings without owning export execution.', 'instagram_reel_1080x1920', 'session_platform_metadata', 'recommended_mock'],
  ['panel_model_safe', 'UI panel model exposes no raw execution command.', 'instagram_reel_1080x1920', 'session_platform_metadata', 'recommended_mock'],
  ['validation_blocks_mov', 'Future MOV export remains blocked.', 'custom', 'custom_mock_metadata', 'blocked_invalid_settings'],
  ['validation_blocks_bad_resolution', 'Invalid resolution is blocked locally.', 'custom', 'custom_mock_metadata', 'blocked_invalid_settings'],
  ['validation_blocks_bad_frame_rate', 'Invalid frame rate is blocked locally.', 'custom', 'custom_mock_metadata', 'blocked_invalid_settings'],
  ['validation_blocks_non_mock', 'Non-mock settings are blocked locally.', 'custom', 'custom_mock_metadata', 'blocked_invalid_settings'],
  ['qa_smoke_registry', 'Smoke can enumerate the preset registry.', 'instagram_reel_1080x1920', 'session_platform_metadata', 'recommended_mock'],
  ['qa_smoke_client', 'Smoke can use the browser-safe client.', 'youtube_standard_1920x1080', 'session_platform_metadata', 'recommended_mock'],
  ['qa_smoke_docs', 'Docs record no render/export boundary.', 'instagram_feed_4x5_1080x1350', 'session_aspect_metadata', 'recommended_mock'],
  ['qa_smoke_migration_freeze', 'Supabase migration count remains frozen.', 'website_1920x1080', 'session_platform_metadata', 'recommended_mock'],
  ] satisfies ScenarioTuple[]).map(([id, title, expectedPreset, source, status]) => ({
  id,
  title,
  expectedPreset,
  source,
  status,
}))

export function listMockProjectEditBriefExportSettingsScenarios(): ProjectEditBriefExportSettingsScenario[] {
  return BASE_SCENARIOS.map((scenario) => ({
    ...scenario,
    mockOnly: true,
    ...PROJECT_EDIT_BRIEF_EXPORT_SETTINGS_BACKEND_SAFETY_FLAGS,
  }))
}

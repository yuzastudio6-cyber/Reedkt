-- Local/mock data only. Do not run in production without review.
-- This script demonstrates the ReeditPro database flow after RP-DB-03 through RP-DB-10.
-- It assumes all migrations have been applied in timestamp order.
--
-- Important auth note:
-- public.user_profiles.id references auth.users(id). Before running this locally,
-- create or update a local Supabase auth user with this exact id:
-- 00000000-0000-4000-8000-000000000001
-- The script checks for that row up front and stops before inserting public data if it is missing.

begin;

do $$
declare
  mock_user_id uuid := '00000000-0000-4000-8000-000000000001';
begin
  if to_regclass('auth.users') is null then
    raise exception 'auth.users does not exist. Run this only in a local Supabase database with Auth installed.';
  end if;

  if not exists (select 1 from auth.users where id = mock_user_id) then
    raise exception 'Missing local auth.users row for %. Create a local mock auth user with this id before running this script.', mock_user_id;
  end if;
end $$;

insert into public.user_profiles (
  id,
  display_name,
  email,
  metadata
)
values (
  '00000000-0000-4000-8000-000000000001',
  'RP-DB-11 Mock Editor',
  'rp-db-11-local@example.test',
  '{"scenario":"rp_db_11_e2e_mock"}'::jsonb
)
on conflict (id) do update
set
  display_name = excluded.display_name,
  email = excluded.email,
  metadata = excluded.metadata,
  updated_at = now();

insert into public.workspaces (
  id,
  owner_user_id,
  name,
  slug,
  plan_id,
  workspace_type,
  metadata
)
values (
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000001',
  'RP-DB-11 Local QA Workspace',
  'rp-db-11-local-qa',
  (select id from public.plans where slug = 'personal'),
  'personal',
  '{"scenario":"rp_db_11_e2e_mock","credits_are_mock":true}'::jsonb
)
on conflict (id) do update
set
  name = excluded.name,
  slug = excluded.slug,
  plan_id = excluded.plan_id,
  workspace_type = excluded.workspace_type,
  metadata = excluded.metadata,
  updated_at = now();

insert into public.workspace_members (
  id,
  workspace_id,
  user_id,
  role,
  joined_at
)
values (
  '00000000-0000-4000-8000-000000000003',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000001',
  'owner',
  now()
)
on conflict (workspace_id, user_id) do update
set
  role = excluded.role,
  joined_at = excluded.joined_at,
  updated_at = now();

insert into public.subscriptions (
  id,
  workspace_id,
  plan_id,
  status,
  billing_provider,
  current_period_start,
  current_period_end,
  metadata
)
values (
  '00000000-0000-4000-8000-000000000004',
  '00000000-0000-4000-8000-000000000002',
  (select id from public.plans where slug = 'personal'),
  'active',
  'local_mock',
  now(),
  now() + interval '7 days',
  '{"software_access_only":true,"no_unlimited_ai_editing":true}'::jsonb
)
on conflict (id) do update
set
  status = excluded.status,
  billing_provider = excluded.billing_provider,
  current_period_start = excluded.current_period_start,
  current_period_end = excluded.current_period_end,
  metadata = excluded.metadata,
  updated_at = now();

insert into public.projects (
  id,
  workspace_id,
  created_by,
  title,
  description,
  status,
  target_platform,
  aspect_ratio,
  source_sequence_locked,
  metadata
)
values (
  '00000000-0000-4000-8000-000000000010',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000001',
  'Local QA Luxury Listing Reel',
  'End-to-end mock scenario for a chat-native ReeditPro edit.',
  'preview_ready',
  'tiktok_reels_shorts',
  '9_16',
  true,
  '{"scenario":"rp_db_11_e2e_mock","workflow_context":"luxury_real_estate"}'::jsonb
)
on conflict (id) do update
set
  title = excluded.title,
  description = excluded.description,
  status = excluded.status,
  target_platform = excluded.target_platform,
  aspect_ratio = excluded.aspect_ratio,
  source_sequence_locked = excluded.source_sequence_locked,
  metadata = excluded.metadata,
  updated_at = now();

insert into public.chat_sessions (
  id,
  project_id,
  workspace_id,
  started_by,
  status,
  title,
  last_message_at,
  metadata
)
values (
  '00000000-0000-4000-8000-000000000011',
  '00000000-0000-4000-8000-000000000010',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000001',
  'preview_ready',
  'Luxury listing reel edit',
  now(),
  '{"chat_is_editor":true}'::jsonb
)
on conflict (id) do update
set
  status = excluded.status,
  title = excluded.title,
  last_message_at = excluded.last_message_at,
  metadata = excluded.metadata,
  updated_at = now();

insert into public.chat_messages (
  id,
  chat_session_id,
  project_id,
  workspace_id,
  role,
  actor_user_id,
  content,
  content_json,
  sequence_number,
  is_visible_to_user,
  metadata
)
values
  (
    '00000000-0000-4000-8000-000000000012',
    '00000000-0000-4000-8000-000000000011',
    '00000000-0000-4000-8000-000000000010',
    '00000000-0000-4000-8000-000000000002',
    'user',
    '00000000-0000-4000-8000-000000000001',
    'Please make a polished 30 second luxury real estate reel from these clips. Keep the order as context, use clean cuts, calm premium music, captions, and only use Stroke Motion if it helps explain the investment line.',
    '{"requested_edit_level":"signature_edit","credit_preference":"balanced"}'::jsonb,
    1,
    true,
    '{"source_clip_count":4}'::jsonb
  ),
  (
    '00000000-0000-4000-8000-000000000013',
    '00000000-0000-4000-8000-000000000011',
    '00000000-0000-4000-8000-000000000010',
    '00000000-0000-4000-8000-000000000002',
    'assistant',
    null,
    'I mapped the source sequence, drafted an edit plan, estimated credits, and prepared a preview path. I will wait for approval before generation or rendering.',
    '{"approval_gate":"plan_and_credits_required"}'::jsonb,
    2,
    true,
    '{"system_note":"mock assistant planning response"}'::jsonb
  ),
  (
    '00000000-0000-4000-8000-000000000017',
    '00000000-0000-4000-8000-000000000011',
    '00000000-0000-4000-8000-000000000010',
    '00000000-0000-4000-8000-000000000002',
    'assistant',
    null,
    'Preview is ready for review. QA passed, and I found one optional caption revision to consider.',
    '{"preview_ready":true}'::jsonb,
    3,
    true,
    '{"render_id":"00000000-0000-4000-8000-000000000920"}'::jsonb
  ),
  (
    '00000000-0000-4000-8000-000000000019',
    '00000000-0000-4000-8000-000000000011',
    '00000000-0000-4000-8000-000000000010',
    '00000000-0000-4000-8000-000000000002',
    'user',
    '00000000-0000-4000-8000-000000000001',
    'Revision request: soften the investment caption and keep it away from the kitchen detail shot.',
    '{"revision_scope":"caption","timecode_seconds":14.2}'::jsonb,
    4,
    true,
    '{"revision_request_id":"00000000-0000-4000-8000-000000000950"}'::jsonb
  )
on conflict (id) do update
set
  content = excluded.content,
  content_json = excluded.content_json,
  metadata = excluded.metadata;

insert into public.inline_chat_cards (
  id,
  chat_message_id,
  chat_session_id,
  project_id,
  workspace_id,
  card_type,
  title,
  summary,
  payload,
  status
)
values
  (
    '00000000-0000-4000-8000-000000000014',
    '00000000-0000-4000-8000-000000000013',
    '00000000-0000-4000-8000-000000000011',
    '00000000-0000-4000-8000-000000000010',
    '00000000-0000-4000-8000-000000000002',
    'source_sequence',
    'Source Sequence Map',
    'Uploaded order is preserved as planning context, not final edit order.',
    '{"source_clip_sequence_id":"00000000-0000-4000-8000-000000000200","uploaded_order":[1,2,3,4]}'::jsonb,
    'active'
  ),
  (
    '00000000-0000-4000-8000-000000000015',
    '00000000-0000-4000-8000-000000000013',
    '00000000-0000-4000-8000-000000000011',
    '00000000-0000-4000-8000-000000000010',
    '00000000-0000-4000-8000-000000000002',
    'approval_request',
    'Approve Plan And Credits',
    'Generation waits for plan approval, credit approval, and credit reservation.',
    '{"edit_plan_id":"00000000-0000-4000-8000-000000000330","credit_estimate_id":"00000000-0000-4000-8000-000000000610"}'::jsonb,
    'completed'
  ),
  (
    '00000000-0000-4000-8000-000000000018',
    '00000000-0000-4000-8000-000000000017',
    '00000000-0000-4000-8000-000000000011',
    '00000000-0000-4000-8000-000000000010',
    '00000000-0000-4000-8000-000000000002',
    'preview_ready',
    'Preview Ready',
    'A preview render is ready for chat review.',
    '{"render_id":"00000000-0000-4000-8000-000000000920","qa_report_id":"00000000-0000-4000-8000-000000000940"}'::jsonb,
    'active'
  )
on conflict (id) do update
set
  title = excluded.title,
  summary = excluded.summary,
  payload = excluded.payload,
  status = excluded.status,
  updated_at = now();

insert into public.chat_actions (
  id,
  inline_chat_card_id,
  chat_session_id,
  project_id,
  workspace_id,
  action_type,
  label,
  payload,
  is_primary,
  requires_approval,
  executed_by,
  executed_at
)
values (
  '00000000-0000-4000-8000-000000000016',
  '00000000-0000-4000-8000-000000000015',
  '00000000-0000-4000-8000-000000000011',
  '00000000-0000-4000-8000-000000000010',
  '00000000-0000-4000-8000-000000000002',
  'approve',
  'Approve plan and reserve 92 credits',
  '{"edit_plan_id":"00000000-0000-4000-8000-000000000330","credit_estimate_id":"00000000-0000-4000-8000-000000000610"}'::jsonb,
  true,
  true,
  '00000000-0000-4000-8000-000000000001',
  now()
)
on conflict (id) do nothing;

insert into public.media_assets (
  id,
  workspace_id,
  project_id,
  created_by,
  asset_type,
  processing_status,
  file_name,
  display_name,
  mime_type,
  storage_provider,
  storage_bucket,
  storage_path,
  file_size_bytes,
  duration_seconds,
  width,
  height,
  frame_rate,
  has_audio,
  has_video,
  metadata
)
values
  ('00000000-0000-4000-8000-000000000101','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000001','source_video','analysis_ready','entry-living-room-walkthrough.mp4','Entry living room walkthrough','video/mp4','local_mock','mock-media','rp-db-11/source/entry-living-room-walkthrough.mp4',42000000,8.4,1080,1920,30,true,true,'{"uploaded_order":1}'::jsonb),
  ('00000000-0000-4000-8000-000000000102','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000001','source_video','analysis_ready','kitchen-detail-shots.mov','Kitchen detail shots','video/quicktime','local_mock','mock-media','rp-db-11/source/kitchen-detail-shots.mov',38000000,7.2,1080,1920,30,true,true,'{"uploaded_order":2}'::jsonb),
  ('00000000-0000-4000-8000-000000000103','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000001','source_video','analysis_ready','speaker-investment-line.mp4','Speaker investment line','video/mp4','local_mock','mock-media','rp-db-11/source/speaker-investment-line.mp4',22000000,6.1,1080,1920,30,true,true,'{"uploaded_order":3,"contains_spoken_investment_line":true}'::jsonb),
  ('00000000-0000-4000-8000-000000000104','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000001','source_video','analysis_ready','exterior-backyard.mp4','Exterior backyard','video/mp4','local_mock','mock-media','rp-db-11/source/exterior-backyard.mp4',46000000,9.0,1080,1920,30,true,true,'{"uploaded_order":4}'::jsonb),
  ('00000000-0000-4000-8000-000000000105','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000001','preview_render','uploaded','local-preview-render.mp4','Local preview render','video/mp4','local_mock','mock-renders','rp-db-11/renders/local-preview-render.mp4',88000000,30.0,1080,1920,30,true,true,'{"mock_output":true}'::jsonb),
  ('00000000-0000-4000-8000-000000000106','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000001','final_export','pending','local-final-export-placeholder.mp4','Local final export placeholder','video/mp4','local_mock','mock-exports','rp-db-11/exports/local-final-export-placeholder.mp4',null,null,1080,1920,30,true,true,'{"placeholder":true}'::jsonb)
on conflict (id) do update
set
  processing_status = excluded.processing_status,
  storage_path = excluded.storage_path,
  metadata = excluded.metadata,
  updated_at = now();

insert into public.source_clip_sequences (
  id,
  project_id,
  workspace_id,
  chat_session_id,
  created_by,
  name,
  description,
  is_active,
  locked_at,
  metadata
)
values (
  '00000000-0000-4000-8000-000000000200',
  '00000000-0000-4000-8000-000000000010',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000011',
  '00000000-0000-4000-8000-000000000001',
  'Luxury listing source sequence',
  'Uploaded order is context for planning and not automatically final edit order.',
  true,
  now(),
  '{"source_order_is_not_final_order":true}'::jsonb
)
on conflict (id) do update
set
  description = excluded.description,
  locked_at = excluded.locked_at,
  metadata = excluded.metadata,
  updated_at = now();

insert into public.source_clip_sequence_items (
  id,
  source_clip_sequence_id,
  project_id,
  workspace_id,
  media_asset_id,
  uploaded_order,
  status,
  user_note,
  is_important,
  detected_role,
  possible_uses,
  analysis_status,
  metadata
)
values
  ('00000000-0000-4000-8000-000000000201','00000000-0000-4000-8000-000000000200','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000101',1,'active','Open with the living room movement.',true,'opening_walkthrough','["hook","arrival","space reveal"]'::jsonb,'analysis_ready','{"source_sequence_context":true}'::jsonb),
  ('00000000-0000-4000-8000-000000000202','00000000-0000-4000-8000-000000000200','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000102',2,'active','Use as premium detail texture.',false,'detail_broll','["detail montage","transition texture"]'::jsonb,'analysis_ready','{}'::jsonb),
  ('00000000-0000-4000-8000-000000000203','00000000-0000-4000-8000-000000000200','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000103',3,'active','Investment line should stay respectful and clear.',true,'speaker_value_line','["voiceover beat","caption emphasis","optional stroke motion"]'::jsonb,'analysis_ready','{"contains_key_message":true}'::jsonb),
  ('00000000-0000-4000-8000-000000000204','00000000-0000-4000-8000-000000000200','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000104',4,'active','Close with backyard and exterior lifestyle.',true,'closing_exterior','["lifestyle close","CTA background"]'::jsonb,'analysis_ready','{}'::jsonb)
on conflict (id) do update
set
  uploaded_order = excluded.uploaded_order,
  detected_role = excluded.detected_role,
  possible_uses = excluded.possible_uses,
  metadata = excluded.metadata,
  updated_at = now();

insert into public.intent_analyses (
  id,
  workspace_id,
  project_id,
  chat_session_id,
  chat_message_id,
  created_by_user_id,
  detected_user_goal,
  user_goal_summary,
  requested_style,
  requested_platform,
  requested_aspect_ratio,
  edit_complexity,
  hook_policy,
  credit_sensitivity,
  must_follow_instructions,
  avoid_instructions,
  open_questions,
  confidence,
  raw_input_snapshot,
  analysis_payload
)
values (
  '00000000-0000-4000-8000-000000000300',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000010',
  '00000000-0000-4000-8000-000000000011',
  '00000000-0000-4000-8000-000000000012',
  '00000000-0000-4000-8000-000000000001',
  'Create a polished luxury real estate reel from four uploaded clips.',
  'A 30 second premium listing reel with clean cuts, captions, calm music, and optional signature overlay for the spoken investment line.',
  'premium calm luxury',
  'tiktok_reels_shorts',
  '9_16',
  'signature_edit',
  'recommended',
  'balanced',
  '["Respect uploaded source order as planning context.","Keep captions readable.","Do not start generation before approval."]'::jsonb,
  '["Do not overuse SFX.","Do not treat uploaded order as automatically final order."]'::jsonb,
  '[]'::jsonb,
  'high',
  '{"chat_message_id":"00000000-0000-4000-8000-000000000012"}'::jsonb,
  '{"workflow_context":"luxury_real_estate","user_goal_understood":true}'::jsonb
)
on conflict (id) do update
set
  user_goal_summary = excluded.user_goal_summary,
  analysis_payload = excluded.analysis_payload,
  updated_at = now();

insert into public.source_sequence_maps (
  id,
  workspace_id,
  project_id,
  chat_session_id,
  source_clip_sequence_id,
  intent_analysis_id,
  summary,
  detected_story_order,
  strong_moments,
  weak_moments,
  clip_role_summary,
  ai_notes
)
values (
  '00000000-0000-4000-8000-000000000301',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000010',
  '00000000-0000-4000-8000-000000000011',
  '00000000-0000-4000-8000-000000000200',
  '00000000-0000-4000-8000-000000000300',
  'Source order shows walkthrough, details, spoken investment line, then exterior close.',
  'Open with space, show details, add value line, close on lifestyle.',
  '["entry movement","speaker line","backyard close"]'::jsonb,
  '["kitchen details need tighter pacing"]'::jsonb,
  '[{"uploaded_order":1,"role":"hook"},{"uploaded_order":2,"role":"detail texture"},{"uploaded_order":3,"role":"value statement"},{"uploaded_order":4,"role":"closing lifestyle"}]'::jsonb,
  '{"source_order_not_final_order":true}'::jsonb
)
on conflict (id) do update
set
  summary = excluded.summary,
  ai_notes = excluded.ai_notes,
  updated_at = now();

insert into public.source_sequence_map_items (
  id,
  source_sequence_map_id,
  workspace_id,
  project_id,
  source_clip_sequence_item_id,
  media_asset_id,
  uploaded_order,
  detected_role,
  story_function,
  strengths,
  concerns,
  possible_uses,
  recommended_use,
  should_preserve_order,
  ai_notes
)
values
  ('00000000-0000-4000-8000-000000000311','00000000-0000-4000-8000-000000000301','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000201','00000000-0000-4000-8000-000000000101',1,'hook_walkthrough','establish premium space','["smooth movement","strong opening"]'::jsonb,'[]'::jsonb,'["first shot","intro background"]'::jsonb,'Use as opening hook.',true,'Keep first unless user approves restructure.'),
  ('00000000-0000-4000-8000-000000000312','00000000-0000-4000-8000-000000000301','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000202','00000000-0000-4000-8000-000000000102',2,'detail_broll','premium texture','["clean detail shots"]'::jsonb,'["may feel slow if held too long"]'::jsonb,'["cutaways","music beat montage"]'::jsonb,'Use as tight detail insert.',true,'Shorten to maintain pacing.'),
  ('00000000-0000-4000-8000-000000000313','00000000-0000-4000-8000-000000000301','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000203','00000000-0000-4000-8000-000000000103',3,'speaker_value_line','main meaning beat','["clear voice","key sales line"]'::jsonb,'["caption must not feel pushy"]'::jsonb,'["voiceover","caption","optional stroke motion"]'::jsonb,'Use as central story/value beat.',true,'Optional Stroke Motion route for one phrase only.'),
  ('00000000-0000-4000-8000-000000000314','00000000-0000-4000-8000-000000000301','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000204','00000000-0000-4000-8000-000000000104',4,'closing_exterior','final lifestyle proof','["strong close","outdoor appeal"]'::jsonb,'[]'::jsonb,'["closing CTA","final beat"]'::jsonb,'Use as final close.',true,'End with exterior.')
on conflict (id) do update
set
  detected_role = excluded.detected_role,
  recommended_use = excluded.recommended_use,
  ai_notes = excluded.ai_notes;

insert into public.recommended_edit_structures (
  id,
  workspace_id,
  project_id,
  chat_session_id,
  intent_analysis_id,
  source_sequence_map_id,
  structure_summary,
  preserve_source_order,
  restructure_reason,
  hook_policy,
  structure_steps,
  user_approval_required
)
values (
  '00000000-0000-4000-8000-000000000320',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000010',
  '00000000-0000-4000-8000-000000000011',
  '00000000-0000-4000-8000-000000000300',
  '00000000-0000-4000-8000-000000000301',
  'Preserve source order with tighter pacing and a central value beat.',
  true,
  null,
  'recommended',
  '[{"order":1,"step":"arrival hook"},{"order":2,"step":"premium details"},{"order":3,"step":"investment value line"},{"order":4,"step":"backyard close"}]'::jsonb,
  true
)
on conflict (id) do update
set
  structure_summary = excluded.structure_summary,
  structure_steps = excluded.structure_steps,
  updated_at = now();

insert into public.edit_plans (
  id,
  workspace_id,
  project_id,
  chat_session_id,
  created_by_user_id,
  intent_analysis_id,
  source_sequence_map_id,
  recommended_edit_structure_id,
  plan_version,
  status,
  edit_complexity,
  goal_summary,
  workflow_context,
  target_platform,
  aspect_ratio,
  hook_policy,
  approval_required,
  approved_at,
  approved_by,
  approval_chat_action_id,
  plan_payload
)
values (
  '00000000-0000-4000-8000-000000000330',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000010',
  '00000000-0000-4000-8000-000000000011',
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000300',
  '00000000-0000-4000-8000-000000000301',
  '00000000-0000-4000-8000-000000000320',
  1,
  'approved',
  'signature_edit',
  'Premium real estate reel with clean professional edit quality and one optional Stroke Motion explanation beat.',
  'luxury real estate listing reel',
  'tiktok_reels_shorts',
  '9_16',
  'recommended',
  true,
  now(),
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000016',
  '{"approval_gate":"approved_before_generation","source_order_preserved":true}'::jsonb
)
on conflict (id) do update
set
  status = excluded.status,
  plan_payload = excluded.plan_payload,
  updated_at = now();

insert into public.story_beat_maps (
  id,
  workspace_id,
  project_id,
  edit_plan_id,
  summary,
  beat_map_payload
)
values (
  '00000000-0000-4000-8000-000000000340',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000010',
  '00000000-0000-4000-8000-000000000330',
  'Hook, details, value line, lifestyle close.',
  '{"beats":["hook","proof","value","cta"]}'::jsonb
)
on conflict (id) do update
set
  summary = excluded.summary,
  updated_at = now();

insert into public.story_beats (
  id,
  story_beat_map_id,
  workspace_id,
  project_id,
  edit_plan_id,
  beat_order,
  beat_type,
  status,
  label,
  summary,
  start_time_seconds,
  end_time_seconds,
  emotional_tone,
  viewer_purpose,
  metadata
)
values
  ('00000000-0000-4000-8000-000000000341','00000000-0000-4000-8000-000000000340','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000330',1,'hook','planned','Arrival Hook','Show the premium living space immediately.',0,8.4,'calm premium','stop scroll without hype','{}'::jsonb),
  ('00000000-0000-4000-8000-000000000342','00000000-0000-4000-8000-000000000340','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000330',2,'proof','planned','Details And Value','Use details plus speaker line to explain value.',8.4,21.7,'confident','build trust','{}'::jsonb),
  ('00000000-0000-4000-8000-000000000343','00000000-0000-4000-8000-000000000340','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000330',3,'cta','planned','Lifestyle Close','Close on exterior and soft CTA.',21.7,30.0,'aspirational','invite inquiry','{}'::jsonb)
on conflict (id) do update
set
  summary = excluded.summary,
  updated_at = now();

insert into public.edit_plan_segments (
  id,
  workspace_id,
  project_id,
  edit_plan_id,
  story_beat_id,
  source_clip_sequence_item_id,
  media_asset_id,
  segment_order,
  source_start_seconds,
  source_end_seconds,
  output_start_seconds,
  output_end_seconds,
  transcript_text,
  story_beat_label,
  segment_purpose,
  ai_understanding,
  recommended_action,
  signature_system,
  signature_required,
  signature_optional,
  signature_reason,
  credit_impact,
  notes_for_editor,
  must_follow_rules,
  avoid_rules,
  segment_payload
)
values
  ('00000000-0000-4000-8000-000000000351','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000330','00000000-0000-4000-8000-000000000341','00000000-0000-4000-8000-000000000201','00000000-0000-4000-8000-000000000101',1,0,8.4,0,7.4,null,'Arrival Hook','Show the property immediately.','The entry movement is the strongest hook.','Use clean cuts and gentle speed trim.','none',false,false,null,'low','Basic professional cut, no signature system needed.','["Keep premium calm pacing."]'::jsonb,'["Do not add random transition effects."]'::jsonb,'{}'::jsonb),
  ('00000000-0000-4000-8000-000000000352','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000330','00000000-0000-4000-8000-000000000342','00000000-0000-4000-8000-000000000202','00000000-0000-4000-8000-000000000102',2,0,7.2,7.4,13.5,null,'Details And Value','Show kitchen details as premium proof.','The details should feel crisp and not slow.','Use short detail inserts on music beats.','none',false,false,null,'low','Keep captions away from detail highlights.','[]'::jsonb,'["Do not overcut."]'::jsonb,'{}'::jsonb),
  ('00000000-0000-4000-8000-000000000353','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000330','00000000-0000-4000-8000-000000000342','00000000-0000-4000-8000-000000000203','00000000-0000-4000-8000-000000000103',3,0,6.1,13.5,21.7,'This home is not just beautiful, it is positioned for long-term value.','Details And Value','Explain the investment line without making it aggressive.','The speaker line is where a subtle story overlay may help.','Use captions and optional Stroke Motion line to support meaning.','stroke_motion',false,true,'A simple continuous line can connect beauty to long-term value without heavy generation.','medium','Use signature only after approval and keep it subtle.','["Keep the value line tasteful.","Make the overlay understandable without words."]'::jsonb,'["Do not make it feel like a hard sales pitch."]'::jsonb,'{"stroke_motion_candidate":true}'::jsonb),
  ('00000000-0000-4000-8000-000000000354','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000330','00000000-0000-4000-8000-000000000343','00000000-0000-4000-8000-000000000204','00000000-0000-4000-8000-000000000104',4,0,9.0,21.7,30.0,null,'Lifestyle Close','Close with calm lifestyle appeal.','Backyard exterior gives a natural ending.','Use clean transition and final title card.','none',false,false,null,'low','Let ambience breathe.','[]'::jsonb,'["No loud SFX."]'::jsonb,'{}'::jsonb)
on conflict (id) do update
set
  recommended_action = excluded.recommended_action,
  notes_for_editor = excluded.notes_for_editor,
  updated_at = now();

insert into public.signature_routes (
  id,
  workspace_id,
  project_id,
  edit_plan_id,
  edit_plan_segment_id,
  signature_system,
  requirement,
  reason,
  timing_notes,
  credit_impact,
  approval_needed,
  user_can_remove,
  worker_target,
  route_payload
)
values (
  '00000000-0000-4000-8000-000000000361',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000010',
  '00000000-0000-4000-8000-000000000330',
  '00000000-0000-4000-8000-000000000353',
  'stroke_motion',
  'recommended',
  'A single continuous Stroke Motion line can support the investment sentence without changing the source edit.',
  'Start at the word beautiful and resolve at long-term value.',
  'medium',
  true,
  true,
  'stroke_motion_story_agent',
  '{"video_type_does_not_force_signature":true,"per_segment_routing":true}'::jsonb
)
on conflict (id) do update
set
  reason = excluded.reason,
  route_payload = excluded.route_payload,
  updated_at = now();

insert into public.edit_instructions (
  id,
  workspace_id,
  project_id,
  edit_plan_id,
  edit_plan_segment_id,
  instruction_type,
  target_worker,
  instruction_text,
  priority,
  must_follow,
  avoid,
  source_chat_message_id,
  created_by_agent,
  status,
  instruction_payload
)
values
  ('00000000-0000-4000-8000-000000000371','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000330','00000000-0000-4000-8000-000000000353','stroke_motion','stroke_motion_story_agent','Use one continuous stroke line through relationship, tension, separation, divine message, and restoration in the sample source-reading plan.', 'must_follow', true, false, '00000000-0000-4000-8000-000000000012', 'rp_db_11_mock_planner', 'active', '{"example":"Joseph and Mary source reading worker note"}'::jsonb),
  ('00000000-0000-4000-8000-000000000372','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000330','00000000-0000-4000-8000-000000000353','caption','caption_agent','Basic edit and captions must remain professional, readable, and voice-first.', 'must_follow', true, false, '00000000-0000-4000-8000-000000000012', 'rp_db_11_mock_planner', 'active', '{"basic_is_professional":true}'::jsonb)
on conflict (id) do update
set
  instruction_text = excluded.instruction_text,
  instruction_payload = excluded.instruction_payload,
  updated_at = now();

insert into public.edit_quality_profiles (
  id,
  workspace_id,
  project_id,
  edit_plan_id,
  quality_level,
  edit_complexity,
  professional_standard,
  generation_budget_level,
  pacing_style,
  transition_policy,
  music_policy,
  sfx_policy,
  audio_cleanup_policy,
  caption_policy,
  signature_policy,
  quality_goal,
  user_instruction_summary,
  worker_notes,
  profile_payload
)
values (
  '00000000-0000-4000-8000-000000000400',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000010',
  '00000000-0000-4000-8000-000000000330',
  'signature',
  'signature_edit',
  'premium_brand',
  'balanced',
  'premium_smooth',
  'premium_subtle',
  'subtle_bed',
  'subtle_when_needed',
  'voice_leveling',
  'premium_subtle',
  'allow_if_useful',
  'Every edit must feel professionally finished. Basic clean editing is still high quality.',
  'Preserve calm luxury tone, readable captions, and no generation before approval.',
  'Edit level changes complexity and cost, not professional standard.',
  '{"basic_edit_is_professional":true}'::jsonb
)
on conflict (id) do update
set
  quality_goal = excluded.quality_goal,
  profile_payload = excluded.profile_payload,
  updated_at = now();

insert into public.pacing_analysis (
  id,
  workspace_id,
  project_id,
  edit_plan_id,
  edit_plan_segment_id,
  story_beat_id,
  speaker_energy,
  speech_speed,
  pause_quality,
  dead_space_detected,
  emotional_intensity,
  recommended_pacing,
  cut_density,
  preserve_breaths,
  preserve_emotional_pauses,
  reason,
  analysis_payload
)
values (
  '00000000-0000-4000-8000-000000000401',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000010',
  '00000000-0000-4000-8000-000000000330',
  '00000000-0000-4000-8000-000000000353',
  '00000000-0000-4000-8000-000000000342',
  'calm',
  'moderate',
  'natural_breath',
  false,
  'premium calm',
  'premium_smooth',
  'medium',
  true,
  true,
  'Preserve natural pause in the spoken investment line.',
  '{"professional_basic_quality":true}'::jsonb
)
on conflict (id) do update set reason = excluded.reason, updated_at = now();

insert into public.cut_decisions (
  id,
  workspace_id,
  project_id,
  edit_plan_id,
  edit_plan_segment_id,
  source_clip_sequence_item_id,
  media_asset_id,
  cut_order,
  source_start_seconds,
  source_end_seconds,
  output_start_seconds,
  output_end_seconds,
  cut_type,
  cut_reason,
  preserve_context,
  affects_sentence,
  confidence,
  worker_note,
  cut_payload
)
values (
  '00000000-0000-4000-8000-000000000402',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000010',
  '00000000-0000-4000-8000-000000000330',
  '00000000-0000-4000-8000-000000000353',
  '00000000-0000-4000-8000-000000000203',
  '00000000-0000-4000-8000-000000000103',
  1,
  0,
  6.1,
  13.5,
  21.7,
  'preserve_emotional_pause',
  'Professional editing includes knowing when not to cut the pause before the value phrase.',
  true,
  false,
  'high',
  'Do not remove the pause that makes the value line feel considered.',
  '{"decision":"preserve_pause"}'::jsonb
)
on conflict (id) do update set cut_reason = excluded.cut_reason, updated_at = now();

insert into public.transition_plans (
  id,
  workspace_id,
  project_id,
  edit_plan_id,
  from_segment_id,
  to_segment_id,
  transition_order,
  transition_type,
  transition_reason,
  mood,
  speed,
  sound_effect_needed,
  music_sync_point,
  credit_impact,
  worker_note,
  transition_payload
)
values (
  '00000000-0000-4000-8000-000000000403',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000010',
  '00000000-0000-4000-8000-000000000330',
  '00000000-0000-4000-8000-000000000352',
  '00000000-0000-4000-8000-000000000353',
  1,
  'soft_cut',
  'Move from detail B-roll into speaker line without random effects.',
  'premium calm',
  'subtle',
  false,
  'low music bed downbeat',
  'low',
  'Context-based transition only.',
  '{"transition_is_contextual":true}'::jsonb
)
on conflict (id) do update set transition_reason = excluded.transition_reason, updated_at = now();

insert into public.audio_environment_analysis (
  id,
  workspace_id,
  project_id,
  media_asset_id,
  edit_plan_id,
  edit_plan_segment_id,
  environment_type,
  room_tone_type,
  ambient_environment,
  background_noise_type,
  noise_severity,
  reverb_level,
  echo_level,
  hum_detected,
  wind_detected,
  crowd_detected,
  traffic_detected,
  voice_clarity_score,
  recommended_cleanup,
  preserve_natural_ambience,
  notes,
  analysis_payload
)
values (
  '00000000-0000-4000-8000-000000000404',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000010',
  '00000000-0000-4000-8000-000000000103',
  '00000000-0000-4000-8000-000000000330',
  '00000000-0000-4000-8000-000000000353',
  'home_interior',
  'soft room tone',
  'quiet interior',
  'low HVAC',
  'low',
  'low',
  'low',
  false,
  false,
  false,
  false,
  88,
  'voice_leveling',
  true,
  'Preserve natural room tone; do not strip all ambience automatically.',
  '{"room_tone_should_remain":true}'::jsonb
)
on conflict (id) do update set notes = excluded.notes, updated_at = now();

insert into public.ambient_sound_plans (
  id,
  workspace_id,
  project_id,
  edit_plan_id,
  edit_plan_segment_id,
  audio_environment_analysis_id,
  ambient_needed,
  ambient_type,
  source_or_generated,
  mix_level,
  transition_role,
  reason,
  worker_note,
  ambient_payload
)
values (
  '00000000-0000-4000-8000-000000000405',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000010',
  '00000000-0000-4000-8000-000000000330',
  '00000000-0000-4000-8000-000000000353',
  '00000000-0000-4000-8000-000000000404',
  true,
  'home_interior',
  'source',
  'low',
  'smooth under voice',
  'Keeps the speaker line natural.',
  'Do not make the voice sound isolated.',
  '{"source_room_tone":true}'::jsonb
)
on conflict (id) do update set reason = excluded.reason, updated_at = now();

insert into public.music_plans (
  id,
  workspace_id,
  project_id,
  edit_plan_id,
  music_needed,
  music_role,
  music_mood,
  music_energy,
  music_start_strategy,
  music_end_strategy,
  ducking_strategy,
  beat_sync_needed,
  reference_music_influence,
  license_source,
  worker_note,
  music_payload
)
values (
  '00000000-0000-4000-8000-000000000406',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000010',
  '00000000-0000-4000-8000-000000000330',
  true,
  'premium_polish',
  'calm luxury',
  'medium_low',
  'fade in under first movement',
  'soft resolve under exterior close',
  'voice_first',
  true,
  'subtle premium bed only',
  'mock licensed library',
  'Keep music below speech and avoid hype.',
  '{"voice_first":true}'::jsonb
)
on conflict (id) do update set worker_note = excluded.worker_note, updated_at = now();

insert into public.sound_effect_plans (
  id,
  workspace_id,
  project_id,
  edit_plan_id,
  edit_plan_segment_id,
  transition_plan_id,
  signature_route_id,
  sfx_needed,
  sfx_type,
  sfx_reason,
  timing_anchor,
  volume_level,
  avoid_overpowering_voice,
  credit_impact,
  worker_note,
  sfx_payload
)
values (
  '00000000-0000-4000-8000-000000000407',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000010',
  '00000000-0000-4000-8000-000000000330',
  '00000000-0000-4000-8000-000000000353',
  '00000000-0000-4000-8000-000000000403',
  '00000000-0000-4000-8000-000000000361',
  true,
  'stroke_draw_sound',
  'Optional subtle line-draw sound only if it helps the Stroke Motion overlay.',
  'start of value phrase',
  'low',
  true,
  'low',
  'SFX must never overpower voice.',
  '{"subtle_only":true}'::jsonb
)
on conflict (id) do update set worker_note = excluded.worker_note, updated_at = now();

insert into public.caption_plans (
  id,
  workspace_id,
  project_id,
  edit_plan_id,
  caption_needed,
  caption_policy,
  caption_density,
  style_intent,
  positioning_strategy,
  avoid_face_overlap,
  avoid_visual_overlay_overlap,
  word_emphasis_enabled,
  editable_after_preview,
  worker_note,
  caption_payload
)
values (
  '00000000-0000-4000-8000-000000000408',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000010',
  '00000000-0000-4000-8000-000000000330',
  true,
  'premium_subtle',
  'medium',
  'premium_subtle',
  'lower safe area, avoid kitchen details and Stroke Motion overlay',
  true,
  true,
  true,
  true,
  'Captions must be readable and avoid overlay collision.',
  '{"avoid_overlay_collision":true}'::jsonb
)
on conflict (id) do update set worker_note = excluded.worker_note, updated_at = now();

insert into public.edit_quality_checks (
  id,
  workspace_id,
  project_id,
  edit_plan_id,
  edit_plan_segment_id,
  check_type,
  status,
  score,
  issue,
  recommendation,
  requires_retry,
  checked_by,
  check_payload
)
values (
  '00000000-0000-4000-8000-000000000409',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000010',
  '00000000-0000-4000-8000-000000000330',
  '00000000-0000-4000-8000-000000000353',
  'professional_standard',
  'passed',
  93,
  null,
  'Proceed after plan and credit approval.',
  false,
  'rp_db_11_mock_quality_agent',
  '{"basic_edit_clean_standard_met":true}'::jsonb
)
on conflict (id) do update set status = excluded.status, updated_at = now();

insert into public.stroke_motion_plans (
  id,
  workspace_id,
  project_id,
  chat_session_id,
  chat_message_id,
  edit_plan_id,
  edit_plan_segment_id,
  signature_route_id,
  credit_estimate_id,
  status,
  understanding_mode,
  source_text_type,
  source_reference,
  source_excerpt,
  spoken_transcript_excerpt,
  story_summary,
  meaning_expansion_summary,
  animation_goal,
  style_level,
  transition_strategy,
  timing_strategy,
  continuous_line_strategy,
  transparent_overlay_required,
  approval_required,
  approved_at,
  approved_by,
  generation_status,
  worker_notes,
  must_follow_rules,
  avoid_rules,
  plan_payload
)
values (
  '00000000-0000-4000-8000-000000000500',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000010',
  '00000000-0000-4000-8000-000000000011',
  '00000000-0000-4000-8000-000000000012',
  '00000000-0000-4000-8000-000000000330',
  '00000000-0000-4000-8000-000000000353',
  '00000000-0000-4000-8000-000000000361',
  null,
  'approved',
  'source_reading_mode',
  'scripture',
  'Matthew 1:18-25 sample only',
  'Joseph and Mary are engaged, Joseph misunderstands, a message brings clarity, and restoration follows.',
  'This home is not just beautiful, it is positioned for long-term value.',
  'Source reading example: relationship, misunderstanding, quiet separation, divine message, restored trust, and protection.',
  'The plan expands the source into symbolic beats before animation: relationship line, tension crack, separation path, message light, restored connection, protective circle.',
  'Make the idea understandable without words using one continuous stroke line.',
  'balanced',
  'connected_story_line',
  'word-level timing around the value phrase',
  true,
  true,
  true,
  now(),
  '00000000-0000-4000-8000-000000000001',
  'generated',
  'Do not make Mary look guilty. Show Josephs misunderstanding respectfully. Keep divine presence symbolic, not literal. Use one continuous stroke line if possible. Make the animation understandable without words.',
  '["Do not make Mary look guilty.","Show Josephs misunderstanding respectfully.","Keep divine presence symbolic, not literal.","Use one continuous stroke line if possible.","Make the animation understandable without words."]'::jsonb,
  '["Do not make Stroke Motion Bible-only.","Do not use literal divine imagery.","Do not overpower the source video."]'::jsonb,
  '{"sample_only":true,"source_reading_requires_meaning_expansion":true}'::jsonb
)
on conflict (id) do update
set
  status = excluded.status,
  worker_notes = excluded.worker_notes,
  plan_payload = excluded.plan_payload,
  updated_at = now();

insert into public.stroke_motion_meaning_expansions (
  id,
  stroke_motion_plan_id,
  workspace_id,
  project_id,
  source_text_type,
  source_reference,
  source_excerpt,
  plain_language_summary,
  expanded_story_beats,
  interpretation_notes,
  confidence,
  requires_user_confirmation,
  must_follow_rules,
  avoid_rules,
  created_by_agent
)
values (
  '00000000-0000-4000-8000-000000000501',
  '00000000-0000-4000-8000-000000000500',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000010',
  'scripture',
  'Matthew 1:18-25 sample only',
  'Joseph and Mary are engaged, Joseph misunderstands, receives a message, and acts with care.',
  'A relationship is strained by misunderstanding, then clarified and protected.',
  '["relationship","misunderstanding","quiet separation","message","restoration","protection"]'::jsonb,
  'Example demonstrates source reading mode and is not limited to Bible content.',
  'high',
  false,
  '["Show Josephs misunderstanding respectfully.","Keep Mary innocent."]'::jsonb,
  '["No literal divine figure."]'::jsonb,
  'rp_db_11_mock_stroke_motion_agent'
)
on conflict (id) do update set plain_language_summary = excluded.plain_language_summary, updated_at = now();

insert into public.stroke_motion_beats (
  id,
  stroke_motion_plan_id,
  workspace_id,
  project_id,
  edit_plan_segment_id,
  story_beat_id,
  beat_order,
  story_beat_label,
  meaning,
  visual_action,
  motion_path,
  transition_in,
  transition_out,
  start_time_seconds,
  end_time_seconds,
  matched_words,
  timing_anchor_label,
  sfx_hint,
  credit_impact,
  worker_notes,
  must_follow_rules,
  avoid_rules,
  beat_payload,
  render_status
)
values
  ('00000000-0000-4000-8000-000000000511','00000000-0000-4000-8000-000000000500','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000353','00000000-0000-4000-8000-000000000342',1,'Relationship','Relationship and trust exist first.','Draw one line connecting two simple figures.','left-to-right connection line','draw_on','line_tension',13.5,15.2,'not just beautiful','value phrase begins','soft_draw','medium','Keep line elegant and minimal.','["One continuous line."]'::jsonb,'[]'::jsonb,'{}'::jsonb,'generated'),
  ('00000000-0000-4000-8000-000000000512','00000000-0000-4000-8000-000000000500','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000353','00000000-0000-4000-8000-000000000342',2,'Misunderstanding','Confusion creates tension but not guilt.','The line cracks gently without blaming either figure.','center crack','line_tension','message_line',15.2,18.2,'positioned for','middle value phrase','soft_draw','medium','Do not make Mary look guilty.','["Show misunderstanding respectfully."]'::jsonb,'["No accusatory symbols."]'::jsonb,'{}'::jsonb,'generated'),
  ('00000000-0000-4000-8000-000000000513','00000000-0000-4000-8000-000000000500','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000353','00000000-0000-4000-8000-000000000342',3,'Restoration','Clarity restores connection and protection.','A symbolic message line repairs the connection and closes as a protective circle.','message to circle','message_line','circle_close',18.2,21.7,'long-term value','value phrase resolves','message_chime','medium','Keep divine presence symbolic.','["Make it understandable without words."]'::jsonb,'["No literal divine figure."]'::jsonb,'{}'::jsonb,'generated')
on conflict (id) do update set visual_action = excluded.visual_action, updated_at = now();

insert into public.stroke_motion_characters (
  id,
  stroke_motion_plan_id,
  workspace_id,
  project_id,
  character_key,
  display_name,
  role,
  description,
  visual_style,
  emotion_state,
  is_symbolic,
  character_payload
)
values
  ('00000000-0000-4000-8000-000000000521','00000000-0000-4000-8000-000000000500','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000010','joseph','Joseph','main_subject','A simple respectful figure showing misunderstanding and care.','minimal stroke figure','confused to resolved',true,'{}'::jsonb),
  ('00000000-0000-4000-8000-000000000522','00000000-0000-4000-8000-000000000500','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000010','mary','Mary','main_subject','A simple respectful figure, never shown as guilty.','minimal stroke figure','quiet and protected',true,'{}'::jsonb)
on conflict (id) do update set description = excluded.description, updated_at = now();

insert into public.stroke_motion_symbols (
  id,
  stroke_motion_plan_id,
  workspace_id,
  project_id,
  symbol_key,
  symbol_type,
  label,
  meaning,
  visual_style,
  usage_notes,
  symbol_payload
)
values
  ('00000000-0000-4000-8000-000000000531','00000000-0000-4000-8000-000000000500','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000010','relationship_line','connection_line','Relationship Line','Connection, tension, restoration, and protection.','one continuous white stroke','Keep it clean over video.','{}'::jsonb),
  ('00000000-0000-4000-8000-000000000532','00000000-0000-4000-8000-000000000500','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000010','message_light','glow','Symbolic Message','A symbolic message or insight, not a literal figure.','soft glow point with line','Use sparingly.','{}'::jsonb)
on conflict (id) do update set meaning = excluded.meaning, updated_at = now();

insert into public.stroke_motion_beat_characters (id, stroke_motion_beat_id, stroke_motion_character_id, role_in_beat, action_in_beat)
values
  ('00000000-0000-4000-8000-000000000541','00000000-0000-4000-8000-000000000511','00000000-0000-4000-8000-000000000521','connected','stands linked by line'),
  ('00000000-0000-4000-8000-000000000542','00000000-0000-4000-8000-000000000511','00000000-0000-4000-8000-000000000522','connected','stands linked by line'),
  ('00000000-0000-4000-8000-000000000543','00000000-0000-4000-8000-000000000512','00000000-0000-4000-8000-000000000521','confused','line cracks near Joseph'),
  ('00000000-0000-4000-8000-000000000544','00000000-0000-4000-8000-000000000513','00000000-0000-4000-8000-000000000522','protected','connection closes safely')
on conflict (id) do nothing;

insert into public.stroke_motion_beat_symbols (id, stroke_motion_beat_id, stroke_motion_symbol_id, role_in_beat, action_in_beat)
values
  ('00000000-0000-4000-8000-000000000551','00000000-0000-4000-8000-000000000511','00000000-0000-4000-8000-000000000531','connection','draws between figures'),
  ('00000000-0000-4000-8000-000000000552','00000000-0000-4000-8000-000000000512','00000000-0000-4000-8000-000000000531','tension','line cracks softly'),
  ('00000000-0000-4000-8000-000000000553','00000000-0000-4000-8000-000000000513','00000000-0000-4000-8000-000000000532','message','repairs connection')
on conflict (id) do nothing;

insert into public.stroke_motion_transitions (
  id,
  stroke_motion_plan_id,
  workspace_id,
  project_id,
  from_beat_id,
  to_beat_id,
  transition_order,
  transition_type,
  transition_description,
  motion_path,
  duration_seconds,
  timing_notes,
  sfx_hint,
  worker_notes,
  transition_payload
)
values
  ('00000000-0000-4000-8000-000000000561','00000000-0000-4000-8000-000000000500','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000511','00000000-0000-4000-8000-000000000512',1,'line_to_crack','Relationship line gently becomes tension crack.','center line tension',0.4,'on phrase positioned for','soft_draw','Do not use harsh break.', '{}'::jsonb),
  ('00000000-0000-4000-8000-000000000562','00000000-0000-4000-8000-000000000500','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000512','00000000-0000-4000-8000-000000000513',2,'connection_to_circle','Message line repairs connection and closes into circle.','message line arc',0.6,'on phrase long-term value','message_chime','Keep symbolic and subtle.', '{}'::jsonb)
on conflict (id) do update set transition_description = excluded.transition_description, updated_at = now();

insert into public.stroke_motion_timing_anchors (
  id,
  stroke_motion_plan_id,
  stroke_motion_beat_id,
  workspace_id,
  project_id,
  anchor_type,
  anchor_label,
  matched_text,
  start_time_seconds,
  end_time_seconds,
  word_index_start,
  word_index_end,
  manual_note,
  confidence,
  anchor_payload
)
values
  ('00000000-0000-4000-8000-000000000571','00000000-0000-4000-8000-000000000500','00000000-0000-4000-8000-000000000511','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000010','phrase','value phrase start','not just beautiful',13.5,15.2,0,2,'Start the continuous line here.','high','{}'::jsonb),
  ('00000000-0000-4000-8000-000000000572','00000000-0000-4000-8000-000000000500','00000000-0000-4000-8000-000000000513','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000010','phrase','value phrase close','long-term value',18.2,21.7,6,8,'Close the protective circle here.','high','{}'::jsonb)
on conflict (id) do update set manual_note = excluded.manual_note, updated_at = now();

insert into public.stroke_motion_storyboard_frames (
  id,
  stroke_motion_plan_id,
  stroke_motion_beat_id,
  workspace_id,
  project_id,
  frame_order,
  title,
  description,
  visual_composition,
  camera_or_overlay_position,
  expected_viewer_understanding,
  frame_payload
)
values
  ('00000000-0000-4000-8000-000000000581','00000000-0000-4000-8000-000000000500','00000000-0000-4000-8000-000000000511','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000010',1,'Connection Drawn','One clean line connects two figures.','Lower third transparent overlay.','Safe lower-right area.','Viewer understands relationship or connection.','{}'::jsonb),
  ('00000000-0000-4000-8000-000000000582','00000000-0000-4000-8000-000000000500','00000000-0000-4000-8000-000000000513','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000010',2,'Restored Circle','Line repairs and closes into protective circle.','Small symbolic circle, no literal divine figure.','Safe lower-right area.','Viewer understands restoration and protection.','{}'::jsonb)
on conflict (id) do update set description = excluded.description, updated_at = now();

insert into public.stroke_motion_generation_specs (
  id,
  stroke_motion_plan_id,
  workspace_id,
  project_id,
  preferred_output_format,
  transparent_background_required,
  word_level_timing_required,
  deterministic_renderer_preferred,
  suggested_renderer,
  suggested_ai_provider,
  duration_seconds,
  width,
  height,
  frame_rate,
  style_constraints,
  timing_constraints,
  prompt,
  negative_prompt,
  worker_notes,
  spec_payload
)
values (
  '00000000-0000-4000-8000-000000000591',
  '00000000-0000-4000-8000-000000000500',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000010',
  'svg',
  true,
  true,
  true,
  'svg_renderer',
  null,
  8.2,
  1080,
  1920,
  30,
  '{"stroke_width":"thin","tone":"premium minimal","transparent_overlay":true}'::jsonb,
  '{"word_level_timing":true,"anchors":["00000000-0000-4000-8000-000000000571","00000000-0000-4000-8000-000000000572"]}'::jsonb,
  'Create a subtle continuous line animation that communicates relationship, misunderstanding, message, restoration, and protection.',
  'No literal divine figure. No guilt framing. No heavy AI video generation.',
  'Prefer deterministic SVG/Lottie/Remotion style renderer for transparent overlay and word-level timing.',
  '{"deterministic_renderer_preferred":true}'::jsonb
)
on conflict (id) do update set worker_notes = excluded.worker_notes, updated_at = now();

insert into public.credit_wallets (
  id,
  workspace_id,
  user_id,
  wallet_type,
  name,
  cached_available_credits,
  cached_reserved_credits,
  cached_spent_credits,
  cached_refunded_credits,
  last_calculated_at,
  metadata
)
values (
  '00000000-0000-4000-8000-000000000600',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000001',
  'personal',
  'RP-DB-11 Mock Wallet',
  8,
  92,
  0,
  0,
  now(),
  '{"weekly_bonus_source":true}'::jsonb
)
on conflict (id) do update
set
  cached_available_credits = excluded.cached_available_credits,
  cached_reserved_credits = excluded.cached_reserved_credits,
  metadata = excluded.metadata,
  updated_at = now();

insert into public.credit_grants (
  id,
  credit_wallet_id,
  workspace_id,
  user_id,
  source_type,
  status,
  original_amount,
  remaining_amount,
  retail_value_cents,
  subscription_id,
  grant_reason,
  expires_at,
  metadata
)
values (
  '00000000-0000-4000-8000-000000000601',
  '00000000-0000-4000-8000-000000000600',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000001',
  'weekly_bonus',
  'partially_used',
  100,
  8,
  500,
  '00000000-0000-4000-8000-000000000004',
  'Personal weekly bonus credits for local mock scenario.',
  now() + interval '7 days',
  '{"mock_weekly_bonus":true}'::jsonb
)
on conflict (id) do update
set
  status = excluded.status,
  remaining_amount = excluded.remaining_amount,
  metadata = excluded.metadata,
  updated_at = now();

insert into public.credit_estimates (
  id,
  workspace_id,
  project_id,
  chat_session_id,
  chat_message_id,
  inline_chat_card_id,
  edit_plan_id,
  status,
  total_estimated_credits,
  minimum_estimated_credits,
  maximum_estimated_credits,
  available_credits_snapshot,
  reserved_credits_snapshot,
  purchased_credits_snapshot,
  weekly_bonus_credits_snapshot,
  estimate_reason,
  estimate_payload,
  expires_at,
  shown_to_user_at,
  approved_at,
  created_by_agent
)
values (
  '00000000-0000-4000-8000-000000000610',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000010',
  '00000000-0000-4000-8000-000000000011',
  '00000000-0000-4000-8000-000000000013',
  '00000000-0000-4000-8000-000000000015',
  '00000000-0000-4000-8000-000000000330',
  'approved',
  92,
  84,
  110,
  100,
  0,
  0,
  100,
  'Professional signature edit with one deterministic Stroke Motion overlay and preview render.',
  '{"approval_required_before_generation":true,"estimate_then_approval_then_reservation":true}'::jsonb,
  now() + interval '1 day',
  now(),
  now(),
  'rp_db_11_mock_credit_estimator'
)
on conflict (id) do update
set
  status = excluded.status,
  total_estimated_credits = excluded.total_estimated_credits,
  estimate_payload = excluded.estimate_payload,
  updated_at = now();

insert into public.credit_estimate_line_items (
  id,
  credit_estimate_id,
  workspace_id,
  project_id,
  edit_plan_id,
  edit_plan_segment_id,
  signature_route_id,
  line_item_type,
  usage_category,
  label,
  description,
  estimated_credits,
  is_optional,
  is_premium,
  requires_user_approval,
  provider_hint,
  model_hint,
  line_payload
)
values
  ('00000000-0000-4000-8000-000000000611','00000000-0000-4000-8000-000000000610','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000330',null,null,'basic_edit_cleanup','basic_edit','Professional clean edit','Clean cuts, voice leveling, readable captions, and QA.',24,false,false,false,null,null,'{"basic_is_professional":true}'::jsonb),
  ('00000000-0000-4000-8000-000000000612','00000000-0000-4000-8000-000000000610','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000330','00000000-0000-4000-8000-000000000353','00000000-0000-4000-8000-000000000361','stroke_motion','stroke_motion','Subtle Stroke Motion overlay','Deterministic transparent SVG overlay for the value line.',34,true,false,true,'svg_renderer','rp_db_11_svg_line_renderer','{"transparent_overlay":true}'::jsonb),
  ('00000000-0000-4000-8000-000000000613','00000000-0000-4000-8000-000000000610','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000330',null,null,'render_preview','rendering','Preview render','Compose source clips, captions, audio, and generated overlay.',34,false,false,false,null,null,'{"render_type":"preview"}'::jsonb)
on conflict (id) do nothing;

insert into public.credit_approvals (
  id,
  workspace_id,
  project_id,
  chat_session_id,
  chat_message_id,
  chat_action_id,
  inline_chat_card_id,
  credit_estimate_id,
  edit_plan_id,
  status,
  approved_by,
  approved_at,
  approval_note,
  approval_payload
)
values (
  '00000000-0000-4000-8000-000000000620',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000010',
  '00000000-0000-4000-8000-000000000011',
  '00000000-0000-4000-8000-000000000013',
  '00000000-0000-4000-8000-000000000016',
  '00000000-0000-4000-8000-000000000015',
  '00000000-0000-4000-8000-000000000610',
  '00000000-0000-4000-8000-000000000330',
  'approved',
  '00000000-0000-4000-8000-000000000001',
  now(),
  'User approved plan and 92-credit estimate in chat.',
  '{"approved_in_chat":true}'::jsonb
)
on conflict (id) do update set status = excluded.status, updated_at = now();

insert into public.credit_reservations (
  id,
  credit_wallet_id,
  workspace_id,
  project_id,
  chat_session_id,
  credit_estimate_id,
  credit_approval_id,
  edit_plan_id,
  status,
  reserved_credits,
  spent_credits,
  released_credits,
  refunded_credits,
  reservation_reason,
  idempotency_key,
  reserved_at,
  expires_at,
  metadata
)
values (
  '00000000-0000-4000-8000-000000000630',
  '00000000-0000-4000-8000-000000000600',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000010',
  '00000000-0000-4000-8000-000000000011',
  '00000000-0000-4000-8000-000000000610',
  '00000000-0000-4000-8000-000000000620',
  '00000000-0000-4000-8000-000000000330',
  'reserved',
  92,
  0,
  0,
  0,
  'Reserve credits after chat approval and before generation/render jobs.',
  'rp-db-11-reservation',
  now(),
  now() + interval '1 day',
  '{"reserved_before_generation":true}'::jsonb
)
on conflict (id) do update
set
  status = excluded.status,
  reserved_credits = excluded.reserved_credits,
  metadata = excluded.metadata,
  updated_at = now();

insert into public.credit_reservation_line_items (
  id,
  credit_reservation_id,
  credit_estimate_line_item_id,
  credit_grant_id,
  workspace_id,
  project_id,
  usage_category,
  reserved_credits,
  spent_credits,
  released_credits,
  refunded_credits,
  line_payload
)
values
  ('00000000-0000-4000-8000-000000000631','00000000-0000-4000-8000-000000000630','00000000-0000-4000-8000-000000000611','00000000-0000-4000-8000-000000000601','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000010','basic_edit',24,0,0,0,'{}'::jsonb),
  ('00000000-0000-4000-8000-000000000632','00000000-0000-4000-8000-000000000630','00000000-0000-4000-8000-000000000612','00000000-0000-4000-8000-000000000601','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000010','stroke_motion',34,0,0,0,'{}'::jsonb),
  ('00000000-0000-4000-8000-000000000633','00000000-0000-4000-8000-000000000630','00000000-0000-4000-8000-000000000613','00000000-0000-4000-8000-000000000601','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000010','rendering',34,0,0,0,'{}'::jsonb)
on conflict (id) do update set reserved_credits = excluded.reserved_credits, updated_at = now();

insert into public.credit_ledger_entries (
  id,
  credit_wallet_id,
  credit_grant_id,
  workspace_id,
  user_id,
  entry_type,
  amount,
  balance_after,
  related_project_id,
  related_edit_plan_id,
  related_reservation_id,
  related_estimate_id,
  related_chat_message_id,
  related_chat_action_id,
  idempotency_key,
  description,
  metadata
)
values
  ('00000000-0000-4000-8000-000000000640','00000000-0000-4000-8000-000000000600','00000000-0000-4000-8000-000000000601','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000001','weekly_bonus_grant',100,100,'00000000-0000-4000-8000-000000000010',null,null,null,null,null,'rp-db-11-weekly-bonus','Mock Personal weekly bonus credit grant.','{"retail_value_cents":500}'::jsonb),
  ('00000000-0000-4000-8000-000000000641','00000000-0000-4000-8000-000000000600','00000000-0000-4000-8000-000000000601','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000001','reservation',-92,8,'00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000330','00000000-0000-4000-8000-000000000630','00000000-0000-4000-8000-000000000610','00000000-0000-4000-8000-000000000013','00000000-0000-4000-8000-000000000016','rp-db-11-reserve-92','Reserve credits after chat approval.','{"reserved_before_generation":true}'::jsonb)
on conflict (id) do nothing;

insert into public.job_batches (
  id,
  workspace_id,
  project_id,
  chat_session_id,
  edit_plan_id,
  credit_estimate_id,
  credit_reservation_id,
  status,
  batch_name,
  batch_purpose,
  current_stage,
  progress_percent,
  priority,
  created_by_user_id,
  created_by_agent,
  idempotency_key,
  input_payload,
  output_payload,
  metadata,
  started_at,
  completed_at
)
values (
  '00000000-0000-4000-8000-000000000700',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000010',
  '00000000-0000-4000-8000-000000000011',
  '00000000-0000-4000-8000-000000000330',
  '00000000-0000-4000-8000-000000000610',
  '00000000-0000-4000-8000-000000000630',
  'completed',
  'RP-DB-11 mock editor pipeline',
  'Demonstrate chat to export placeholder flow.',
  'preview_ready',
  100,
  'normal',
  '00000000-0000-4000-8000-000000000001',
  'rp_db_11_mock_orchestrator',
  'rp-db-11-job-batch',
  '{"chat_message_id":"00000000-0000-4000-8000-000000000012"}'::jsonb,
  '{"render_id":"00000000-0000-4000-8000-000000000920"}'::jsonb,
  '{"approval_and_credit_gate_satisfied":true}'::jsonb,
  now(),
  now()
)
on conflict (id) do update
set
  status = excluded.status,
  output_payload = excluded.output_payload,
  updated_at = now();

insert into public.jobs (
  id,
  job_batch_id,
  workspace_id,
  project_id,
  chat_session_id,
  chat_message_id,
  edit_plan_id,
  edit_plan_segment_id,
  credit_estimate_id,
  credit_reservation_id,
  job_type,
  status,
  priority,
  worker_target,
  runtime_type,
  job_name,
  depends_on_all,
  input_payload,
  output_payload,
  attempt_count,
  max_attempts,
  idempotency_key,
  scheduled_for,
  started_at,
  completed_at,
  progress_percent,
  metadata
)
values
  ('00000000-0000-4000-8000-000000000701','00000000-0000-4000-8000-000000000700','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000011','00000000-0000-4000-8000-000000000012','00000000-0000-4000-8000-000000000330',null,'00000000-0000-4000-8000-000000000610','00000000-0000-4000-8000-000000000630','transcription','completed','normal','media_analysis_agent','frontend_mock','Transcription',true,'{}'::jsonb,'{"transcript_ready":true}'::jsonb,1,3,'rp-db-11-job-transcription',now(),now(),now(),100,'{}'::jsonb),
  ('00000000-0000-4000-8000-000000000702','00000000-0000-4000-8000-000000000700','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000011','00000000-0000-4000-8000-000000000012','00000000-0000-4000-8000-000000000330',null,'00000000-0000-4000-8000-000000000610','00000000-0000-4000-8000-000000000630','media_analysis','completed','normal','media_analysis_agent','frontend_mock','Media analysis',true,'{}'::jsonb,'{"media_analysis_ready":true}'::jsonb,1,3,'rp-db-11-job-media-analysis',now(),now(),now(),100,'{}'::jsonb),
  ('00000000-0000-4000-8000-000000000703','00000000-0000-4000-8000-000000000700','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000011','00000000-0000-4000-8000-000000000012','00000000-0000-4000-8000-000000000330',null,'00000000-0000-4000-8000-000000000610','00000000-0000-4000-8000-000000000630','intent_analysis','completed','normal','chat_intent_agent','frontend_mock','Intent analysis',true,'{}'::jsonb,'{"intent_analysis_id":"00000000-0000-4000-8000-000000000300"}'::jsonb,1,3,'rp-db-11-job-intent',now(),now(),now(),100,'{}'::jsonb),
  ('00000000-0000-4000-8000-000000000704','00000000-0000-4000-8000-000000000700','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000011',null,'00000000-0000-4000-8000-000000000330',null,'00000000-0000-4000-8000-000000000610','00000000-0000-4000-8000-000000000630','edit_quality_planning','completed','normal','edit_quality_agent','frontend_mock','Edit quality planning',true,'{}'::jsonb,'{"edit_quality_profile_id":"00000000-0000-4000-8000-000000000400"}'::jsonb,1,3,'rp-db-11-job-quality-planning',now(),now(),now(),100,'{}'::jsonb),
  ('00000000-0000-4000-8000-000000000705','00000000-0000-4000-8000-000000000700','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000011',null,'00000000-0000-4000-8000-000000000330','00000000-0000-4000-8000-000000000353','00000000-0000-4000-8000-000000000610','00000000-0000-4000-8000-000000000630','stroke_motion_planning','completed','normal','stroke_motion_story_agent','frontend_mock','Stroke Motion planning',true,'{}'::jsonb,'{"stroke_motion_plan_id":"00000000-0000-4000-8000-000000000500"}'::jsonb,1,3,'rp-db-11-job-stroke-planning',now(),now(),now(),100,'{}'::jsonb),
  ('00000000-0000-4000-8000-000000000706','00000000-0000-4000-8000-000000000700','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000011',null,'00000000-0000-4000-8000-000000000330',null,'00000000-0000-4000-8000-000000000610','00000000-0000-4000-8000-000000000630','credit_estimation','completed','normal','credit_estimation_agent','frontend_mock','Credit estimation',true,'{}'::jsonb,'{"credit_estimate_id":"00000000-0000-4000-8000-000000000610"}'::jsonb,1,3,'rp-db-11-job-credit-estimation',now(),now(),now(),100,'{}'::jsonb),
  ('00000000-0000-4000-8000-000000000707','00000000-0000-4000-8000-000000000700','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000011',null,'00000000-0000-4000-8000-000000000330','00000000-0000-4000-8000-000000000353','00000000-0000-4000-8000-000000000610','00000000-0000-4000-8000-000000000630','generation','completed','normal','stroke_motion_generation_worker','frontend_mock','Generation request',true,'{}'::jsonb,'{"generation_request_id":"00000000-0000-4000-8000-000000000810"}'::jsonb,1,3,'rp-db-11-job-generation',now(),now(),now(),100,'{"approval_and_credit_gate_satisfied":true}'::jsonb),
  ('00000000-0000-4000-8000-000000000708','00000000-0000-4000-8000-000000000700','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000011',null,'00000000-0000-4000-8000-000000000330',null,'00000000-0000-4000-8000-000000000610','00000000-0000-4000-8000-000000000630','render_preview','completed','normal','render_worker','frontend_mock','Render preview',true,'{}'::jsonb,'{"render_id":"00000000-0000-4000-8000-000000000920"}'::jsonb,1,3,'rp-db-11-job-render-preview',now(),now(),now(),100,'{}'::jsonb),
  ('00000000-0000-4000-8000-000000000709','00000000-0000-4000-8000-000000000700','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000011',null,'00000000-0000-4000-8000-000000000330',null,'00000000-0000-4000-8000-000000000610','00000000-0000-4000-8000-000000000630','quality_check','completed','normal','quality_check_agent','frontend_mock','Quality check',true,'{}'::jsonb,'{"qa_report_id":"00000000-0000-4000-8000-000000000940"}'::jsonb,1,3,'rp-db-11-job-quality-check',now(),now(),now(),100,'{}'::jsonb)
on conflict (id) do update
set
  status = excluded.status,
  output_payload = excluded.output_payload,
  updated_at = now();

insert into public.job_dependencies (
  id,
  workspace_id,
  project_id,
  job_id,
  depends_on_job_id,
  dependency_reason,
  required_status
)
values
  ('00000000-0000-4000-8000-000000000751','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000703','00000000-0000-4000-8000-000000000701','Intent uses transcript.','completed'),
  ('00000000-0000-4000-8000-000000000752','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000704','00000000-0000-4000-8000-000000000703','Quality planning follows intent.','completed'),
  ('00000000-0000-4000-8000-000000000753','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000705','00000000-0000-4000-8000-000000000704','Stroke Motion planning follows quality plan.','completed'),
  ('00000000-0000-4000-8000-000000000754','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000706','00000000-0000-4000-8000-000000000705','Credit estimate follows signature planning.','completed'),
  ('00000000-0000-4000-8000-000000000755','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000707','00000000-0000-4000-8000-000000000706','Generation waits for approved estimate and reservation.','completed'),
  ('00000000-0000-4000-8000-000000000756','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000708','00000000-0000-4000-8000-000000000707','Render waits for generated asset.','completed'),
  ('00000000-0000-4000-8000-000000000757','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000709','00000000-0000-4000-8000-000000000708','QA waits for preview render.','completed')
on conflict (id) do nothing;

insert into public.generation_providers (
  id,
  provider_key,
  name,
  provider_type,
  runtime_type,
  description,
  is_active,
  supports_video,
  supports_image,
  supports_audio,
  supports_transparent_background,
  supports_svg,
  supports_lottie,
  supports_remotion,
  supports_word_level_timing,
  supports_style_reference,
  gpu_required,
  secret_reference_name,
  cost_multiplier,
  provider_payload
)
values (
  '00000000-0000-4000-8000-000000000800',
  'rp_db_11_deterministic_overlay_renderer',
  'RP-DB-11 Deterministic Overlay Renderer',
  'custom_deterministic_renderer',
  'local_mock',
  'Local mock provider for SVG/Lottie/Remotion-style transparent overlays. No real provider call.',
  true,
  false,
  false,
  false,
  true,
  true,
  true,
  true,
  true,
  false,
  false,
  null,
  1,
  '{"mock_only":true,"stores_secrets":false}'::jsonb
)
on conflict (provider_key) do update
set
  name = excluded.name,
  provider_payload = excluded.provider_payload,
  updated_at = now();

insert into public.generation_provider_capabilities (
  id,
  generation_provider_id,
  capability,
  is_supported,
  max_duration_seconds,
  max_width,
  max_height,
  supports_transparency,
  supports_timing_constraints,
  supports_prompt_weights,
  capability_payload
)
values (
  '00000000-0000-4000-8000-000000000801',
  '00000000-0000-4000-8000-000000000800',
  'transparent_overlay',
  true,
  60,
  1080,
  1920,
  true,
  true,
  false,
  '{"word_level_timing":true}'::jsonb
)
on conflict (generation_provider_id, capability) do update
set
  is_supported = excluded.is_supported,
  capability_payload = excluded.capability_payload;

insert into public.generation_provider_models (
  id,
  generation_provider_id,
  model_key,
  model_name,
  display_name,
  description,
  is_active,
  default_quality_level,
  default_credit_cost,
  cost_per_request_credits,
  max_duration_seconds,
  max_resolution,
  supports_transparent_background,
  supports_word_level_timing,
  supports_seed,
  model_payload
)
values (
  '00000000-0000-4000-8000-000000000802',
  '00000000-0000-4000-8000-000000000800',
  'rp_db_11_svg_line_renderer',
  'rp_db_11_svg_line_renderer',
  'RP-DB-11 SVG Line Renderer',
  'Mock deterministic renderer for Stroke Motion overlay specs.',
  true,
  'preview',
  34,
  34,
  60,
  '1080x1920',
  true,
  true,
  true,
  '{"mock_only":true}'::jsonb
)
on conflict (generation_provider_id, model_key) do update
set
  model_name = excluded.model_name,
  model_payload = excluded.model_payload,
  updated_at = now();

insert into public.generation_requests (
  id,
  workspace_id,
  project_id,
  chat_session_id,
  chat_message_id,
  edit_plan_id,
  edit_plan_segment_id,
  signature_route_id,
  stroke_motion_plan_id,
  stroke_motion_beat_id,
  stroke_motion_generation_spec_id,
  job_id,
  credit_estimate_id,
  credit_reservation_id,
  generation_provider_id,
  generation_provider_model_id,
  request_type,
  status,
  quality_level,
  signature_system,
  provider_type,
  model_name,
  prompt,
  negative_prompt,
  style_constraints,
  timing_constraints,
  output_requirements,
  transparent_background_required,
  word_level_timing_required,
  duration_seconds,
  width,
  height,
  frame_rate,
  seed,
  estimated_credits,
  actual_credits,
  failure_category,
  idempotency_key,
  provider_request_id,
  worker_notes,
  request_payload,
  queued_at,
  started_at,
  completed_at
)
values (
  '00000000-0000-4000-8000-000000000810',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000010',
  '00000000-0000-4000-8000-000000000011',
  '00000000-0000-4000-8000-000000000013',
  '00000000-0000-4000-8000-000000000330',
  '00000000-0000-4000-8000-000000000353',
  '00000000-0000-4000-8000-000000000361',
  '00000000-0000-4000-8000-000000000500',
  '00000000-0000-4000-8000-000000000511',
  '00000000-0000-4000-8000-000000000591',
  '00000000-0000-4000-8000-000000000707',
  '00000000-0000-4000-8000-000000000610',
  '00000000-0000-4000-8000-000000000630',
  '00000000-0000-4000-8000-000000000800',
  '00000000-0000-4000-8000-000000000802',
  'stroke_motion_animation',
  'completed',
  'preview',
  'stroke_motion',
  'custom_deterministic_renderer',
  'rp_db_11_svg_line_renderer',
  'Render subtle continuous Stroke Motion line overlay for the value phrase.',
  'No literal divine figure. No heavy AI video generation.',
  '{"premium_minimal":true}'::jsonb,
  '{"word_level_timing_required":true}'::jsonb,
  '{"format":"svg","transparent_background":true}'::jsonb,
  true,
  true,
  8.2,
  1080,
  1920,
  30,
  'rp-db-11-seed',
  34,
  34,
  'none',
  'rp-db-11-generation-request',
  'local-mock-provider-request',
  'Created only after edit plan approval and credit reservation.',
  '{"approval_and_credit_gate_satisfied":true}'::jsonb,
  now(),
  now(),
  now()
)
on conflict (id) do update
set
  status = excluded.status,
  request_payload = excluded.request_payload,
  updated_at = now();

insert into public.generation_request_inputs (
  id,
  generation_request_id,
  workspace_id,
  project_id,
  input_role,
  media_asset_id,
  edit_plan_segment_id,
  signature_route_id,
  stroke_motion_plan_id,
  stroke_motion_beat_id,
  source_start_seconds,
  source_end_seconds,
  input_text,
  input_payload
)
values
  ('00000000-0000-4000-8000-000000000811','00000000-0000-4000-8000-000000000810','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000010','source_video','00000000-0000-4000-8000-000000000103','00000000-0000-4000-8000-000000000353','00000000-0000-4000-8000-000000000361','00000000-0000-4000-8000-000000000500','00000000-0000-4000-8000-000000000511',0,6.1,'Speaker investment line source clip.','{}'::jsonb),
  ('00000000-0000-4000-8000-000000000812','00000000-0000-4000-8000-000000000810','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000010','stroke_motion_plan',null,'00000000-0000-4000-8000-000000000353','00000000-0000-4000-8000-000000000361','00000000-0000-4000-8000-000000000500','00000000-0000-4000-8000-000000000513',null,null,'Use one continuous symbolic line; avoid literal divine figure.','{"source_reading_mode":true}'::jsonb)
on conflict (id) do nothing;

insert into public.generated_assets (
  id,
  workspace_id,
  project_id,
  generation_request_id,
  job_id,
  created_by_user_id,
  asset_type,
  asset_status,
  asset_format,
  quality_level,
  signature_system,
  file_name,
  display_name,
  storage_provider,
  storage_bucket,
  storage_path,
  duration_seconds,
  width,
  height,
  frame_rate,
  transparent_background,
  word_level_timing,
  usable_for_render,
  metadata
)
values (
  '00000000-0000-4000-8000-000000000820',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000010',
  '00000000-0000-4000-8000-000000000810',
  '00000000-0000-4000-8000-000000000707',
  '00000000-0000-4000-8000-000000000001',
  'stroke_motion_overlay',
  'ready',
  'svg',
  'preview',
  'stroke_motion',
  'stroke-motion-value-line.svg',
  'Stroke Motion value line overlay',
  'local_mock',
  'mock-generated-assets',
  'rp-db-11/generated/stroke-motion-value-line.svg',
  8.2,
  1080,
  1920,
  30,
  true,
  true,
  true,
  '{"intermediate_asset_not_final_render":true}'::jsonb
)
on conflict (id) do update
set
  asset_status = excluded.asset_status,
  storage_path = excluded.storage_path,
  usable_for_render = excluded.usable_for_render,
  updated_at = now();

insert into public.generated_asset_versions (
  id,
  generated_asset_id,
  workspace_id,
  project_id,
  version_number,
  generation_request_id,
  version_label,
  change_reason,
  storage_path,
  metadata
)
values (
  '00000000-0000-4000-8000-000000000821',
  '00000000-0000-4000-8000-000000000820',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000010',
  1,
  '00000000-0000-4000-8000-000000000810',
  'Initial preview overlay',
  'Mock generation output for RP-DB-11.',
  'rp-db-11/generated/stroke-motion-value-line.svg',
  '{"mock_only":true}'::jsonb
)
on conflict (id) do nothing;

insert into public.generated_asset_timing_maps (
  id,
  generated_asset_id,
  workspace_id,
  project_id,
  edit_plan_id,
  edit_plan_segment_id,
  stroke_motion_plan_id,
  start_time_seconds,
  end_time_seconds,
  timeline_offset_seconds,
  timing_payload
)
values (
  '00000000-0000-4000-8000-000000000830',
  '00000000-0000-4000-8000-000000000820',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000010',
  '00000000-0000-4000-8000-000000000330',
  '00000000-0000-4000-8000-000000000353',
  '00000000-0000-4000-8000-000000000500',
  13.5,
  21.7,
  0,
  '{"word_level_timing":true,"anchors":["00000000-0000-4000-8000-000000000571","00000000-0000-4000-8000-000000000572"]}'::jsonb
)
on conflict (id) do update set timing_payload = excluded.timing_payload, updated_at = now();

insert into public.generation_events (
  id,
  generation_request_id,
  generated_asset_id,
  workspace_id,
  project_id,
  event_type,
  message,
  status,
  progress_percent,
  payload
)
values (
  '00000000-0000-4000-8000-000000000840',
  '00000000-0000-4000-8000-000000000810',
  '00000000-0000-4000-8000-000000000820',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000010',
  'completed',
  'Mock deterministic overlay generated.',
  'completed',
  100,
  '{"no_real_provider_called":true}'::jsonb
)
on conflict (id) do nothing;

insert into public.generation_request_costs (
  id,
  generation_request_id,
  workspace_id,
  project_id,
  estimated_internal_cost_cents,
  actual_internal_cost_cents,
  estimated_user_credits,
  actual_user_credits,
  cost_reason,
  cost_payload
)
values (
  '00000000-0000-4000-8000-000000000850',
  '00000000-0000-4000-8000-000000000810',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000010',
  0,
  0,
  34,
  34,
  'Mock deterministic renderer cost tracked separately from ledger.',
  '{"separate_from_user_credit_ledger":true}'::jsonb
)
on conflict (id) do update set cost_payload = excluded.cost_payload, updated_at = now();

update public.stroke_motion_generation_specs
set generation_request_id = '00000000-0000-4000-8000-000000000810',
    updated_at = now()
where id = '00000000-0000-4000-8000-000000000591';

update public.signature_routes
set generation_request_id = '00000000-0000-4000-8000-000000000810',
    updated_at = now()
where id = '00000000-0000-4000-8000-000000000361';

insert into public.render_jobs (
  id,
  workspace_id,
  project_id,
  chat_session_id,
  chat_message_id,
  edit_plan_id,
  job_id,
  job_batch_id,
  credit_estimate_id,
  credit_reservation_id,
  status,
  render_type,
  quality_level,
  output_format,
  render_name,
  render_description,
  timeline_spec,
  render_settings,
  width,
  height,
  frame_rate,
  duration_seconds,
  estimated_credits,
  actual_credits,
  failure_category,
  idempotency_key,
  worker_runtime,
  worker_notes,
  progress_percent,
  progress_message,
  queued_at,
  started_at,
  completed_at
)
values (
  '00000000-0000-4000-8000-000000000900',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000010',
  '00000000-0000-4000-8000-000000000011',
  '00000000-0000-4000-8000-000000000017',
  '00000000-0000-4000-8000-000000000330',
  '00000000-0000-4000-8000-000000000708',
  '00000000-0000-4000-8000-000000000700',
  '00000000-0000-4000-8000-000000000610',
  '00000000-0000-4000-8000-000000000630',
  'completed',
  'preview',
  'preview',
  'mp4',
  'Local QA preview render',
  'Mock render job combining source clips, captions, music, and Stroke Motion overlay.',
  '{"source_sequence_id":"00000000-0000-4000-8000-000000000200","generated_asset_ids":["00000000-0000-4000-8000-000000000820"]}'::jsonb,
  '{"resolution":"1080x1920","format":"mp4","mock_only":true}'::jsonb,
  1080,
  1920,
  30,
  30,
  34,
  34,
  'none',
  'rp-db-11-render-preview',
  'frontend_mock',
  'Render jobs require orchestration approval and credit reservation before running.',
  100,
  'Mock preview render complete.',
  now(),
  now(),
  now()
)
on conflict (id) do update
set
  status = excluded.status,
  timeline_spec = excluded.timeline_spec,
  updated_at = now();

insert into public.render_job_inputs (
  id,
  render_job_id,
  workspace_id,
  project_id,
  input_type,
  media_asset_id,
  generated_asset_id,
  edit_plan_segment_id,
  signature_route_id,
  stroke_motion_plan_id,
  source_start_seconds,
  source_end_seconds,
  timeline_start_seconds,
  timeline_end_seconds,
  layer_name,
  z_index,
  input_payload
)
values
  ('00000000-0000-4000-8000-000000000911','00000000-0000-4000-8000-000000000900','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000010','source_video','00000000-0000-4000-8000-000000000101',null,'00000000-0000-4000-8000-000000000351',null,null,0,8.4,0,7.4,'source_video_1',0,'{"composition_role":"base"}'::jsonb),
  ('00000000-0000-4000-8000-000000000912','00000000-0000-4000-8000-000000000900','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000010','source_video','00000000-0000-4000-8000-000000000103',null,'00000000-0000-4000-8000-000000000353',null,null,0,6.1,13.5,21.7,'speaker_line',0,'{"composition_role":"base"}'::jsonb),
  ('00000000-0000-4000-8000-000000000913','00000000-0000-4000-8000-000000000900','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000010','stroke_motion_asset',null,'00000000-0000-4000-8000-000000000820','00000000-0000-4000-8000-000000000353','00000000-0000-4000-8000-000000000361','00000000-0000-4000-8000-000000000500',null,null,13.5,21.7,'stroke_motion_overlay',10,'{"transparent_overlay":true}'::jsonb)
on conflict (id) do nothing;

insert into public.renders (
  id,
  workspace_id,
  project_id,
  chat_session_id,
  edit_plan_id,
  render_job_id,
  job_id,
  status,
  render_type,
  quality_level,
  output_format,
  media_asset_id,
  display_name,
  storage_provider,
  storage_bucket,
  storage_path,
  file_size_bytes,
  duration_seconds,
  width,
  height,
  frame_rate,
  preview_chat_message_id,
  preview_inline_chat_card_id,
  render_payload
)
values (
  '00000000-0000-4000-8000-000000000920',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000010',
  '00000000-0000-4000-8000-000000000011',
  '00000000-0000-4000-8000-000000000330',
  '00000000-0000-4000-8000-000000000900',
  '00000000-0000-4000-8000-000000000708',
  'ready',
  'preview',
  'preview',
  'mp4',
  '00000000-0000-4000-8000-000000000105',
  'Local QA Preview Render',
  'local_mock',
  'mock-renders',
  'rp-db-11/renders/local-preview-render.mp4',
  88000000,
  30,
  1080,
  1920,
  30,
  '00000000-0000-4000-8000-000000000017',
  '00000000-0000-4000-8000-000000000018',
  '{"generated_assets_are_intermediate":true}'::jsonb
)
on conflict (id) do update
set
  status = excluded.status,
  render_payload = excluded.render_payload,
  updated_at = now();

insert into public.render_events (
  id,
  render_job_id,
  render_id,
  workspace_id,
  project_id,
  event_type,
  message,
  status,
  progress_percent,
  payload
)
values (
  '00000000-0000-4000-8000-000000000930',
  '00000000-0000-4000-8000-000000000900',
  '00000000-0000-4000-8000-000000000920',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000010',
  'completed',
  'Preview render completed in local mock flow.',
  'completed',
  100,
  '{"no_real_rendering":true}'::jsonb
)
on conflict (id) do nothing;

insert into public.preview_reviews (
  id,
  workspace_id,
  project_id,
  chat_session_id,
  render_id,
  edit_plan_id,
  status,
  reviewed_by,
  review_note,
  changes_requested_at,
  metadata
)
values (
  '00000000-0000-4000-8000-000000000931',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000010',
  '00000000-0000-4000-8000-000000000011',
  '00000000-0000-4000-8000-000000000920',
  '00000000-0000-4000-8000-000000000330',
  'changes_requested',
  '00000000-0000-4000-8000-000000000001',
  'Preview is strong. Soften one caption before export.',
  now(),
  '{"chat_native_review":true}'::jsonb
)
on conflict (id) do update
set
  status = excluded.status,
  review_note = excluded.review_note,
  updated_at = now();

insert into public.review_comments (
  id,
  workspace_id,
  project_id,
  preview_review_id,
  render_id,
  chat_session_id,
  chat_message_id,
  author_user_id,
  status,
  timecode_seconds,
  comment_text,
  priority,
  metadata
)
values (
  '00000000-0000-4000-8000-000000000932',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000010',
  '00000000-0000-4000-8000-000000000931',
  '00000000-0000-4000-8000-000000000920',
  '00000000-0000-4000-8000-000000000011',
  '00000000-0000-4000-8000-000000000019',
  '00000000-0000-4000-8000-000000000001',
  'open',
  14.2,
  'Soften the investment caption and avoid covering the kitchen detail shot.',
  'normal',
  '{"source":"chat"}'::jsonb
)
on conflict (id) do update
set
  comment_text = excluded.comment_text,
  updated_at = now();

insert into public.qa_reports (
  id,
  workspace_id,
  project_id,
  edit_plan_id,
  render_job_id,
  render_id,
  job_id,
  status,
  overall_score,
  summary,
  requires_retry,
  checked_by,
  qa_payload,
  started_at,
  completed_at
)
values (
  '00000000-0000-4000-8000-000000000940',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000010',
  '00000000-0000-4000-8000-000000000330',
  '00000000-0000-4000-8000-000000000900',
  '00000000-0000-4000-8000-000000000920',
  '00000000-0000-4000-8000-000000000709',
  'passed',
  91,
  'Preview is professionally ready, with one non-blocking caption refinement requested by the user.',
  false,
  'rp_db_11_mock_quality_agent',
  '{"qa_prevents_poor_previews":true}'::jsonb,
  now(),
  now()
)
on conflict (id) do update
set
  status = excluded.status,
  summary = excluded.summary,
  updated_at = now();

insert into public.qa_report_items (
  id,
  qa_report_id,
  workspace_id,
  project_id,
  edit_plan_segment_id,
  check_type,
  status,
  score,
  issue,
  recommendation,
  requires_retry,
  timecode_seconds,
  related_generated_asset_id,
  related_render_input_id,
  item_payload
)
values
  ('00000000-0000-4000-8000-000000000941','00000000-0000-4000-8000-000000000940','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000353','caption_readability','warning',84,'Caption is readable but the wording can be softer.','Revise caption text before final export if user wants.',false,14.2,null,'00000000-0000-4000-8000-000000000912','{"non_blocking_revision":true}'::jsonb),
  ('00000000-0000-4000-8000-000000000942','00000000-0000-4000-8000-000000000940','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000010','00000000-0000-4000-8000-000000000353','stroke_motion_timing','passed',95,null,'Timing map aligns to the spoken value phrase.',false,18.2,'00000000-0000-4000-8000-000000000820','00000000-0000-4000-8000-000000000913','{"word_level_timing":true}'::jsonb),
  ('00000000-0000-4000-8000-000000000943','00000000-0000-4000-8000-000000000940','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000010',null,'professional_standard','passed',93,null,'Basic/professional quality standard met.',false,null,null,null,'{"basic_is_not_low_quality":true}'::jsonb)
on conflict (id) do update set status = excluded.status, updated_at = now();

insert into public.revision_requests (
  id,
  workspace_id,
  project_id,
  chat_session_id,
  chat_message_id,
  preview_review_id,
  review_comment_id,
  render_id,
  edit_plan_id,
  status,
  revision_scope,
  cost_level,
  requested_by,
  requested_change,
  requires_new_generation,
  requires_new_render,
  estimated_extra_credits,
  credit_estimate_id,
  credit_reservation_id,
  worker_notes,
  revision_payload,
  submitted_at
)
values (
  '00000000-0000-4000-8000-000000000950',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000010',
  '00000000-0000-4000-8000-000000000011',
  '00000000-0000-4000-8000-000000000019',
  '00000000-0000-4000-8000-000000000931',
  '00000000-0000-4000-8000-000000000932',
  '00000000-0000-4000-8000-000000000920',
  '00000000-0000-4000-8000-000000000330',
  'submitted',
  'caption',
  'low',
  '00000000-0000-4000-8000-000000000001',
  'Soften the investment caption and keep it away from the kitchen detail shot.',
  false,
  true,
  4,
  '00000000-0000-4000-8000-000000000610',
  '00000000-0000-4000-8000-000000000630',
  'Caption-only revision should not require new generation unless user changes Stroke Motion.',
  '{"chat_native_revision":true}'::jsonb,
  now()
)
on conflict (id) do update
set
  status = excluded.status,
  requested_change = excluded.requested_change,
  updated_at = now();

insert into public.revision_request_items (
  id,
  revision_request_id,
  workspace_id,
  project_id,
  revision_scope,
  edit_plan_segment_id,
  signature_route_id,
  generated_asset_id,
  stroke_motion_plan_id,
  render_input_id,
  timecode_seconds,
  description,
  requires_new_generation,
  requires_new_render,
  item_payload
)
values (
  '00000000-0000-4000-8000-000000000951',
  '00000000-0000-4000-8000-000000000950',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000010',
  'caption',
  '00000000-0000-4000-8000-000000000353',
  '00000000-0000-4000-8000-000000000361',
  '00000000-0000-4000-8000-000000000820',
  '00000000-0000-4000-8000-000000000500',
  '00000000-0000-4000-8000-000000000912',
  14.2,
  'Caption wording and placement around kitchen detail shot.',
  false,
  true,
  '{"affected_caption_only":true}'::jsonb
)
on conflict (id) do nothing;

insert into public.exports (
  id,
  workspace_id,
  project_id,
  chat_session_id,
  chat_message_id,
  render_id,
  edit_plan_id,
  job_id,
  status,
  export_platform,
  export_format,
  display_name,
  export_settings,
  media_asset_id,
  storage_provider,
  storage_bucket,
  storage_path,
  requested_by,
  requested_at,
  metadata
)
values (
  '00000000-0000-4000-8000-000000000960',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000010',
  '00000000-0000-4000-8000-000000000011',
  '00000000-0000-4000-8000-000000000017',
  '00000000-0000-4000-8000-000000000920',
  '00000000-0000-4000-8000-000000000330',
  null,
  'draft',
  'tiktok_reels_shorts',
  'mp4',
  'Final export placeholder',
  '{"awaiting_revision_resolution":true,"requires_preview_approval":true}'::jsonb,
  '00000000-0000-4000-8000-000000000106',
  'local_mock',
  'mock-exports',
  'rp-db-11/exports/local-final-export-placeholder.mp4',
  '00000000-0000-4000-8000-000000000001',
  now(),
  '{"placeholder_only":true}'::jsonb
)
on conflict (id) do update
set
  status = excluded.status,
  export_settings = excluded.export_settings,
  updated_at = now();

insert into public.export_variants (
  id,
  export_id,
  workspace_id,
  project_id,
  variant_name,
  export_platform,
  export_format,
  aspect_ratio,
  width,
  height,
  frame_rate,
  media_asset_id,
  storage_path,
  variant_payload
)
values (
  '00000000-0000-4000-8000-000000000961',
  '00000000-0000-4000-8000-000000000960',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000010',
  '9:16 social preview placeholder',
  'tiktok_reels_shorts',
  'mp4',
  '9_16',
  1080,
  1920,
  30,
  '00000000-0000-4000-8000-000000000106',
  'rp-db-11/exports/local-final-export-placeholder.mp4',
  '{"placeholder_only":true}'::jsonb
)
on conflict (id) do update
set
  variant_payload = excluded.variant_payload,
  updated_at = now();

update public.edit_plans
set credit_estimate_id = '00000000-0000-4000-8000-000000000610',
    updated_at = now()
where id = '00000000-0000-4000-8000-000000000330';

update public.stroke_motion_plans
set credit_estimate_id = '00000000-0000-4000-8000-000000000610',
    updated_at = now()
where id = '00000000-0000-4000-8000-000000000500';

update public.projects
set current_chat_session_id = '00000000-0000-4000-8000-000000000011',
    current_edit_plan_id = '00000000-0000-4000-8000-000000000330',
    updated_at = now()
where id = '00000000-0000-4000-8000-000000000010';

update public.user_profiles
set default_workspace_id = '00000000-0000-4000-8000-000000000002',
    updated_at = now()
where id = '00000000-0000-4000-8000-000000000001';

commit;

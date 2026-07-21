-- Deterministic local-only fixture for the canonical V3 verification suite.
-- This file is included inside a transaction by each test and never targets a
-- remote Supabase project.

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-4111-8111-111111111111',
    'authenticated', 'authenticated', 'owner-a@example.test', '', clock_timestamp(),
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
    clock_timestamp(), clock_timestamp()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-4222-8222-222222222222',
    'authenticated', 'authenticated', 'owner-b@example.test', '', clock_timestamp(),
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
    clock_timestamp(), clock_timestamp()
  );

insert into public.profiles (id, display_name) values
  ('11111111-1111-4111-8111-111111111111', 'Owner A'),
  ('22222222-2222-4222-8222-222222222222', 'Owner B');

insert into public.workspaces (id, owner_user_id, name) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '11111111-1111-4111-8111-111111111111', 'Workspace A'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '22222222-2222-4222-8222-222222222222', 'Workspace B');

insert into public.workspace_members (workspace_id, user_id, role) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '11111111-1111-4111-8111-111111111111', 'owner'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '22222222-2222-4222-8222-222222222222', 'owner');

insert into public.projects (id, workspace_id, owner_user_id, title, editing_category) values
  (
    'aaaaaaaa-1000-4000-8000-000000000001',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '11111111-1111-4111-8111-111111111111',
    'Project A', 'documentary'
  ),
  (
    'bbbbbbbb-1000-4000-8000-000000000001',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    '22222222-2222-4222-8222-222222222222',
    'Project B', 'documentary'
  );

insert into public.edit_sessions (id, project_id, workspace_id) values
  (
    'aaaaaaaa-2000-4000-8000-000000000001',
    'aaaaaaaa-1000-4000-8000-000000000001',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  ),
  (
    'bbbbbbbb-2000-4000-8000-000000000001',
    'bbbbbbbb-1000-4000-8000-000000000001',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
  );

with frame_authority as (
  select * from (values
    (
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid,
      'aaaaaaaa-1000-4000-8000-000000000001'::uuid,
      'aaaaaaaa-2000-4000-8000-000000000001'::uuid,
      'aaaaaaaa-8000-4000-8000-000000000001'::uuid,
      '16:9'::text,
      '2026-07-21T12:00:00.000Z'::text
    ),
    (
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'::uuid,
      'bbbbbbbb-1000-4000-8000-000000000001'::uuid,
      'bbbbbbbb-2000-4000-8000-000000000001'::uuid,
      'bbbbbbbb-8000-4000-8000-000000000001'::uuid,
      '16:9'::text,
      '2026-07-21T12:00:00.000Z'::text
    )
  ) as fixture(workspace_id, project_id, edit_session_id, confirmation_id, aspect_ratio, confirmed_at)
), frame_json as (
  select frame_authority.*,
    jsonb_build_object(
      'schemaVersion', 'edit-reference-production-output-frame-authority-v1',
      'repositoryAuthority', 'supabase_rls_transactional',
      'sourceAuthority', 'canonical_exact_edit_preference_frame_confirmation',
      'workspaceId', workspace_id::text,
      'projectId', project_id::text,
      'editSessionId', edit_session_id::text,
      'planningInputRevision', 0,
      'exactEditPreferenceRecordRevision', 0,
      'confirmationId', confirmation_id::text,
      'aspectRatio', aspect_ratio,
      'confirmedAt', confirmed_at,
      'browserSuppliedAuthorityAccepted', false
    ) as authority
  from frame_authority
)
insert into public.exact_edit_preference_states (
  workspace_id, project_id, edit_session_id, preference_fingerprint_sha256,
  output_frame_confirmed, output_frame_confirmation_id,
  output_frame_aspect_ratio, output_frame_confirmed_at,
  output_frame_authority_digest_sha256
)
select
  workspace_id, project_id, edit_session_id, repeat('0', 64), true,
  confirmation_id, aspect_ratio, confirmed_at::timestamptz,
  public.reeditpro_sha256_json(authority)
from frame_json;

insert into public.edit_references (
  id, workspace_id, owner_user_id, name, description, record_json
) values
  (
    'aaaaaaaa-3000-4000-8000-000000000001',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '11111111-1111-4111-8111-111111111111',
    'Documentary reference A', 'Tenant A reference', '{"scope":"tenant-a"}'::jsonb
  ),
  (
    'bbbbbbbb-3000-4000-8000-000000000001',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    '22222222-2222-4222-8222-222222222222',
    'Documentary reference B', 'Tenant B reference', '{"scope":"tenant-b"}'::jsonb
  );

insert into public.preference_study_sessions (
  id, workspace_id, edit_reference_id, status, title, record_json
) values
  (
    'aaaaaaaa-4000-4000-8000-000000000001',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'aaaaaaaa-3000-4000-8000-000000000001',
    'approved', 'Study A', '{"scope":"tenant-a"}'::jsonb
  ),
  (
    'bbbbbbbb-4000-4000-8000-000000000001',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'bbbbbbbb-3000-4000-8000-000000000001',
    'approved', 'Study B', '{"scope":"tenant-b"}'::jsonb
  );

insert into public.preference_dna_versions (
  id, workspace_id, edit_reference_id, study_session_id, version,
  content_digest, status, approval_id, record_json
) values
  (
    'aaaaaaaa-5000-4000-8000-000000000001',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'aaaaaaaa-3000-4000-8000-000000000001',
    'aaaaaaaa-4000-4000-8000-000000000001',
    1, repeat('5', 64), 'approved', 'approval-a', '{"scope":"tenant-a"}'::jsonb
  ),
  (
    'bbbbbbbb-5000-4000-8000-000000000001',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'bbbbbbbb-3000-4000-8000-000000000001',
    'bbbbbbbb-4000-4000-8000-000000000001',
    1, repeat('6', 64), 'approved', 'approval-b', '{"scope":"tenant-b"}'::jsonb
  );

insert into public.preference_dna_qa_results (
  id, workspace_id, edit_reference_id, study_session_id, dna_version_id,
  dna_content_digest, status, result_digest, record_json
) values
  (
    'aaaaaaaa-6000-4000-8000-000000000001',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'aaaaaaaa-3000-4000-8000-000000000001',
    'aaaaaaaa-4000-4000-8000-000000000001',
    'aaaaaaaa-5000-4000-8000-000000000001',
    repeat('5', 64), 'passed', repeat('a', 64), '{"scope":"tenant-a"}'::jsonb
  ),
  (
    'bbbbbbbb-6000-4000-8000-000000000001',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'bbbbbbbb-3000-4000-8000-000000000001',
    'bbbbbbbb-4000-4000-8000-000000000001',
    'bbbbbbbb-5000-4000-8000-000000000001',
    repeat('6', 64), 'passed', repeat('b', 64), '{"scope":"tenant-b"}'::jsonb
  );

insert into public.preference_applications (
  id, workspace_id, edit_reference_id, study_session_id, dna_version_id,
  dna_qa_result_id, project_id, edit_session_id, version, content_digest,
  context_hash, target_understanding_package_digest, status,
  connection_state, runtime_source, record_json
) values
  (
    'aaaaaaaa-7000-4000-8000-000000000001',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'aaaaaaaa-3000-4000-8000-000000000001',
    'aaaaaaaa-4000-4000-8000-000000000001',
    'aaaaaaaa-5000-4000-8000-000000000001',
    'aaaaaaaa-6000-4000-8000-000000000001',
    'aaaaaaaa-1000-4000-8000-000000000001',
    'aaaaaaaa-2000-4000-8000-000000000001',
    1, repeat('7', 64), repeat('8', 64), repeat('9', 64),
    'prepared', 'not_connected', 'verified_live',
    jsonb_build_object(
      'schemaVersion', 'preference-application-record-v3',
      'id', 'aaaaaaaa-7000-4000-8000-000000000001',
      'workspaceId', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'projectId', 'aaaaaaaa-1000-4000-8000-000000000001',
      'editSessionId', 'aaaaaaaa-2000-4000-8000-000000000001',
      'editReferenceId', 'aaaaaaaa-3000-4000-8000-000000000001',
      'dnaVersionId', 'aaaaaaaa-5000-4000-8000-000000000001',
      'contentDigest', repeat('7', 64), 'contextHash', repeat('8', 64),
      'targetUnderstandingPackageDigest', repeat('9', 64),
      'status', 'prepared', 'targetIntegrationStatus', 'not_connected'
    )
  ),
  (
    'aaaaaaaa-7000-4000-8000-000000000002',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'aaaaaaaa-3000-4000-8000-000000000001',
    'aaaaaaaa-4000-4000-8000-000000000001',
    'aaaaaaaa-5000-4000-8000-000000000001',
    'aaaaaaaa-6000-4000-8000-000000000001',
    'aaaaaaaa-1000-4000-8000-000000000001',
    'aaaaaaaa-2000-4000-8000-000000000001',
    2, repeat('c', 64), repeat('d', 64), repeat('e', 64),
    'prepared', 'not_connected', 'verified_live',
    jsonb_build_object(
      'schemaVersion', 'preference-application-record-v3',
      'id', 'aaaaaaaa-7000-4000-8000-000000000002',
      'workspaceId', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'projectId', 'aaaaaaaa-1000-4000-8000-000000000001',
      'editSessionId', 'aaaaaaaa-2000-4000-8000-000000000001',
      'editReferenceId', 'aaaaaaaa-3000-4000-8000-000000000001',
      'dnaVersionId', 'aaaaaaaa-5000-4000-8000-000000000001',
      'contentDigest', repeat('c', 64), 'contextHash', repeat('d', 64),
      'targetUnderstandingPackageDigest', repeat('e', 64),
      'status', 'prepared', 'targetIntegrationStatus', 'not_connected'
    )
  ),
  (
    'bbbbbbbb-7000-4000-8000-000000000001',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'bbbbbbbb-3000-4000-8000-000000000001',
    'bbbbbbbb-4000-4000-8000-000000000001',
    'bbbbbbbb-5000-4000-8000-000000000001',
    'bbbbbbbb-6000-4000-8000-000000000001',
    'bbbbbbbb-1000-4000-8000-000000000001',
    'bbbbbbbb-2000-4000-8000-000000000001',
    1, repeat('1', 64), repeat('2', 64), repeat('3', 64),
    'prepared', 'not_connected', 'verified_live',
    '{"schemaVersion":"preference-application-record-v3","scope":"tenant-b"}'::jsonb
  );

insert into public.edit_plan_versions (
  id, workspace_id, project_id, edit_session_id, version, status,
  plan_digest_sha256
) values
  (
    'aaaaaaaa-9000-4000-8000-000000000001',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'aaaaaaaa-1000-4000-8000-000000000001',
    'aaaaaaaa-2000-4000-8000-000000000001',
    1, 'draft', repeat('4', 64)
  ),
  (
    'bbbbbbbb-9000-4000-8000-000000000001',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'bbbbbbbb-1000-4000-8000-000000000001',
    'bbbbbbbb-2000-4000-8000-000000000001',
    1, 'draft', repeat('5', 64)
  );

insert into public.edit_credit_estimates (
  id, workspace_id, project_id, edit_session_id, edit_plan_version_id,
  version, status, estimate_digest_sha256, estimate_json
) values
  (
    'aaaaaaaa-a000-4000-8000-000000000001',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'aaaaaaaa-1000-4000-8000-000000000001',
    'aaaaaaaa-2000-4000-8000-000000000001',
    'aaaaaaaa-9000-4000-8000-000000000001',
    1, 'draft', repeat('6', 64), '{"internalCostOnly":true}'::jsonb
  ),
  (
    'bbbbbbbb-a000-4000-8000-000000000001',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'bbbbbbbb-1000-4000-8000-000000000001',
    'bbbbbbbb-2000-4000-8000-000000000001',
    'bbbbbbbb-9000-4000-8000-000000000001',
    1, 'draft', repeat('7', 64), '{"internalCostOnly":true}'::jsonb
  );

update public.exact_edit_preference_states
set current_draft_plan_version_id = case workspace_id
      when 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' then 'aaaaaaaa-9000-4000-8000-000000000001'::uuid
      else 'bbbbbbbb-9000-4000-8000-000000000001'::uuid
    end,
    current_draft_estimate_id = case workspace_id
      when 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' then 'aaaaaaaa-a000-4000-8000-000000000001'::uuid
      else 'bbbbbbbb-a000-4000-8000-000000000001'::uuid
    end;

insert into public.preference_assets (
  id, workspace_id, edit_reference_id, study_session_id, storage_object_id,
  storage_generation, storage_etag, checksum_sha256, asset_kind, metadata_json
) values
  (
    'aaaaaaaa-d000-4000-8000-000000000001',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'aaaaaaaa-3000-4000-8000-000000000001',
    'aaaaaaaa-4000-4000-8000-000000000001',
    'tenant-a/reference/source.mp4', '1', 'etag-a', repeat('a', 64),
    'source', '{"durationSeconds":21600,"sizeBytes":268435456000}'::jsonb
  ),
  (
    'bbbbbbbb-d000-4000-8000-000000000001',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'bbbbbbbb-3000-4000-8000-000000000001',
    'bbbbbbbb-4000-4000-8000-000000000001',
    'tenant-b/reference/source.mp4', '1', 'etag-b', repeat('b', 64),
    'source', '{"durationSeconds":7200,"sizeBytes":10737418240}'::jsonb
  );

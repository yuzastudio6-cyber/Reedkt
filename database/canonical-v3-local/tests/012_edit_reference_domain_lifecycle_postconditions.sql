\set ON_ERROR_STOP on
\echo 'canonical-v3-local: persisted evidence/DNA/QA/approval lifecycle postconditions'

do $$
declare
  approved_count integer;
  approved_dna_id uuid;
  long_form_event_id uuid;
  long_form_operation_count integer;
begin
  select count(*) into approved_count
  from public.preference_dna_lifecycle_events event
  join public.preference_dna_versions dna on dna.id = event.dna_version_id
  join public.preference_dna_qa_results qa on qa.id = event.qa_result_id
  where event.event_type = 'approved'
    and dna.status in ('approved', 'superseded')
    and dna.approval_id = event.event_json->'approval'->>'id'
    and qa.dna_version_id = dna.id
    and qa.study_session_id = dna.study_session_id
    and qa.edit_reference_id = dna.edit_reference_id
    and qa.workspace_id = dna.workspace_id;
  if approved_count < 2
  then raise exception 'EDIT_REFERENCE_DOMAIN_APPROVAL_PROJECTION_MISSING_%', approved_count; end if;

  if exists (
    select 1 from public.preference_dna_lifecycle_events event
    join public.preference_dna_versions dna on dna.id = event.dna_version_id
    where event.event_type = 'superseded' and dna.status <> 'superseded'
  ) then raise exception 'EDIT_REFERENCE_DOMAIN_SUPERSESSION_PROJECTION_INVALID'; end if;

  if exists (
    select 1 from public.edit_reference_domain_audit_events audit
    where audit.event_type = 'preference_dna_version_approved'
      and (
        audit.event_json->>'dnaVersionId' is null
        or audit.event_json->>'dnaQaResultId' is null
        or not exists (
          select 1 from public.preference_dna_lifecycle_events event
          where event.dna_version_id = (audit.event_json->>'dnaVersionId')::uuid
            and event.qa_result_id = (audit.event_json->>'dnaQaResultId')::uuid
            and event.event_type = 'approved'
        )
      )
  ) then raise exception 'EDIT_REFERENCE_DOMAIN_APPROVAL_AUDIT_BINDING_INVALID'; end if;

  select dna.id into approved_dna_id
  from public.preference_dna_versions dna
  join public.preference_dna_lifecycle_events event
    on event.dna_version_id = dna.id and event.event_type = 'approved'
  order by dna.created_at, dna.id
  limit 1;

  begin
    update public.preference_dna_versions
    set record_json = record_json || '{"tampered":true}'::jsonb
    where id = approved_dna_id;
    raise exception 'EDIT_REFERENCE_DOMAIN_DNA_CONTENT_MUTATION_ALLOWED';
  exception when object_not_in_prerequisite_state then null;
  end;

  begin
    delete from public.preference_dna_lifecycle_events
    where dna_version_id = approved_dna_id and event_type = 'approved';
    raise exception 'EDIT_REFERENCE_DOMAIN_LIFECYCLE_DELETE_ALLOWED';
  exception when object_not_in_prerequisite_state then null;
  end;

  select count(distinct operation) into long_form_operation_count
  from public.preference_evidence_asset_long_form_events;
  if long_form_operation_count < 3
    or not exists (
      select 1 from public.preference_evidence_asset_long_form_events
      where operation = 'preference_study.long_form_study.start'
    )
    or not exists (
      select 1 from public.preference_evidence_asset_long_form_events
      where operation = 'preference_study.long_form_study.control.pause'
    )
    or not exists (
      select 1 from public.preference_evidence_asset_long_form_events
      where operation = 'preference_study.long_form_study.control.resume'
    )
  then
    raise exception 'EDIT_REFERENCE_LONG_FORM_DOMAIN_EVENTS_MISSING_%',
      long_form_operation_count;
  end if;

  if exists (
    select 1
    from public.preference_evidence_asset_long_form_events event
    join public.preference_long_form_study_runs run
      on run.id = event.study_run_id
     and run.workspace_id = event.workspace_id
    join public.preference_long_form_study_plans plan
      on plan.id = run.study_plan_id
    join public.preference_evidence_assets asset
      on asset.id = event.reference_asset_id
     and asset.study_session_id = event.study_session_id
     and asset.edit_reference_id = event.edit_reference_id
     and asset.workspace_id = event.workspace_id
    join public.preference_study_messages message
      on message.id = event.assistant_message_id
     and message.study_session_id = event.study_session_id
     and message.edit_reference_id = event.edit_reference_id
     and message.workspace_id = event.workspace_id
    where event.external_run_id <> run.external_run_id
      or event.run_revision <> (event.summary_json->>'runRevision')::bigint
      or event.summary_json->>'planId' <> plan.external_plan_id
      or event.summary_json->>'planDigestSha256' <> plan.plan_digest
      or event.summary_json->>'referenceAssetId' <> asset.id::text
      or event.media_metadata_json->>'hasAudio'
        <> event.summary_json->>'sourceHasAudio'
      or message.runtime_source <> 'deterministic_evidence'
  ) then
    raise exception 'EDIT_REFERENCE_LONG_FORM_DOMAIN_LINEAGE_INVALID';
  end if;

  if exists (
    select 1
    from public.preference_evidence_assets asset
    join public.preference_evidence_asset_long_form_events event
      on event.reference_asset_id = asset.id
    where not (
      public.reeditpro_build_edit_reference_domain_aggregate_v2(
        event.actor_user_id,
        event.workspace_id
      )->'assets' @> jsonb_build_array(
        asset.record_json || jsonb_build_object(
          'longFormStudy', event.summary_json,
          'mediaMetadata', event.media_metadata_json
        )
      )
    )
      and event.event_sequence = (
        select max(latest.event_sequence)
        from public.preference_evidence_asset_long_form_events latest
        where latest.reference_asset_id = event.reference_asset_id
      )
  ) then
    raise exception 'EDIT_REFERENCE_LONG_FORM_AGGREGATE_PROJECTION_MISSING';
  end if;

  if has_table_privilege(
      'anon',
      'public.preference_evidence_asset_long_form_events',
      'SELECT,INSERT,UPDATE,DELETE'
    )
    or has_table_privilege(
      'authenticated',
      'public.preference_evidence_asset_long_form_events',
      'SELECT,INSERT,UPDATE,DELETE'
    )
    or has_table_privilege(
      'service_role',
      'public.preference_evidence_asset_long_form_events',
      'SELECT,INSERT,UPDATE,DELETE'
    )
  then
    raise exception 'EDIT_REFERENCE_LONG_FORM_EVENT_DIRECT_GRANT_PRESENT';
  end if;
  if has_function_privilege(
      'anon',
      'public.mutate_edit_reference_long_form_domain_command_v1(text,uuid,jsonb,text,text)',
      'EXECUTE'
    )
    or has_function_privilege(
      'authenticated',
      'public.mutate_edit_reference_long_form_domain_command_v1(text,uuid,jsonb,text,text)',
      'EXECUTE'
    )
    or not has_function_privilege(
      'service_role',
      'public.mutate_edit_reference_long_form_domain_command_v1(text,uuid,jsonb,text,text)',
      'EXECUTE'
    )
  then
    raise exception 'EDIT_REFERENCE_LONG_FORM_DOMAIN_RPC_ROLE_INVALID';
  end if;
  if has_function_privilege(
      'anon',
      'public.reeditpro_register_pre_plan_source_v1(text,jsonb)',
      'EXECUTE'
    )
    or not has_function_privilege(
      'authenticated',
      'public.reeditpro_register_pre_plan_source_v1(text,jsonb)',
      'EXECUTE'
    )
    or has_function_privilege(
      'service_role',
      'public.reeditpro_register_pre_plan_source_v1(text,jsonb)',
      'EXECUTE'
    )
  then
    raise exception 'EDIT_REFERENCE_SOURCE_REGISTRATION_RPC_ROLE_INVALID';
  end if;

  select id into long_form_event_id
  from public.preference_evidence_asset_long_form_events
  order by committed_at, id
  limit 1;
  begin
    update public.preference_evidence_asset_long_form_events
    set summary_json = summary_json || '{"tampered":true}'::jsonb
    where id = long_form_event_id;
    raise exception 'EDIT_REFERENCE_LONG_FORM_EVENT_MUTATION_ALLOWED';
  exception when object_not_in_prerequisite_state then null;
  end;
end;
$$;

\echo 'PASS 012_edit_reference_domain_lifecycle_postconditions'

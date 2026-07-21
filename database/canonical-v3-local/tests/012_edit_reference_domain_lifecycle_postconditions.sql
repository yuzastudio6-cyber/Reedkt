\set ON_ERROR_STOP on
\echo 'canonical-v3-local: persisted evidence/DNA/QA/approval lifecycle postconditions'

do $$
declare
  approved_count integer;
  approved_dna_id uuid;
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
end;
$$;

\echo 'PASS 012_edit_reference_domain_lifecycle_postconditions'

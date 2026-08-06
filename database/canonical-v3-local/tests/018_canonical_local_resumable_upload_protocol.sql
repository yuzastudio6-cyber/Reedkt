\set ON_ERROR_STOP on
\echo 'canonical-v3-local: local resumable upload protocol postconditions'

do $$
declare
  claim_source text;
  commit_source text;
begin
  select pg_get_functiondef(
    'public.reeditpro_claim_upload_target_v1(text,jsonb)'::regprocedure
  ) into claim_source;
  select pg_get_functiondef(
    'public.reeditpro_commit_upload_target_v1(text,jsonb)'::regprocedure
  ) into commit_source;

  if claim_source not like '%resumable_content_range_v1%'
    or commit_source not like '%resumable_content_range_v1%'
    or commit_source not like '%gcs_resumable%'
    or commit_source not like '%supportsResume%' then
    raise exception 'LOCAL_RESUMABLE_UPLOAD_PROTOCOL_NOT_INSTALLED';
  end if;

  if has_function_privilege(
      'anon',
      'public.reeditpro_claim_upload_target_v1(text,jsonb)',
      'EXECUTE'
    )
    or has_function_privilege(
      'service_role',
      'public.reeditpro_claim_upload_target_v1(text,jsonb)',
      'EXECUTE'
    )
    or not has_function_privilege(
      'authenticated',
      'public.reeditpro_claim_upload_target_v1(text,jsonb)',
      'EXECUTE'
    )
    or has_function_privilege(
      'anon',
      'public.reeditpro_commit_upload_target_v1(text,jsonb)',
      'EXECUTE'
    )
    or has_function_privilege(
      'service_role',
      'public.reeditpro_commit_upload_target_v1(text,jsonb)',
      'EXECUTE'
    )
    or not has_function_privilege(
      'authenticated',
      'public.reeditpro_commit_upload_target_v1(text,jsonb)',
      'EXECUTE'
    ) then
    raise exception 'LOCAL_RESUMABLE_UPLOAD_RPC_ROLE_BOUNDARY_INVALID';
  end if;
end;
$$;

\echo 'PASS 018_canonical_local_resumable_upload_protocol'

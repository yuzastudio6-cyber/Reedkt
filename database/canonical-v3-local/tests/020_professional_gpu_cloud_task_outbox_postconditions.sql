begin;

do $$
declare
  created_count integer;
  unknown_count integer;
  not_created_count integer;
  duplicate_task_name_count integer;
begin
  select count(*) filter (where status = 'created'),
    count(*) filter (where status = 'outcome_unknown'),
    count(*) filter (where status = 'not_created')
  into created_count, unknown_count, not_created_count
  from public.professional_gpu_cloud_task_outbox
  where queue_id = 'weeditpro-professional-gpu-production-v1'
    and runtime_region = 'us-central1';
  if created_count <> 1 or unknown_count <> 1 or not_created_count <> 1 then
    raise exception 'GPU_TASK_OUTBOX_OUTCOME_SET_INVALID';
  end if;

  select count(*) into duplicate_task_name_count
  from (
    select task_name from public.professional_gpu_cloud_task_outbox
    group by task_name having count(*) > 1
  ) duplicate_names;
  if duplicate_task_name_count <> 0 then
    raise exception 'GPU_TASK_OUTBOX_TASK_NAME_DUPLICATE';
  end if;

  if exists (
    select 1 from public.professional_gpu_cloud_task_outbox
    where record_json->>'databaseRecordPersistedBeforeCloudTasksCreate'
        <> 'true'
      or record_json->>'automaticCreateRetryAllowed' <> 'false'
      or record_json->>'automaticNewExecutionAttemptAllowed' <> 'false'
      or record_json->>'customerCreditsMutated' <> 'false'
      or record_json->>'productionAuthorityGranted' <> 'false'
      or record_hash <> public.reeditpro_sha256_json(
        record_json - 'recordHash'
      )
  ) then
    raise exception 'GPU_TASK_OUTBOX_CLOSED_RECORD_INVALID';
  end if;

  if not exists (
    select 1
    from public.professional_gpu_cloud_task_outbox outbox
    join public.professional_gpu_fair_queue_entries entry
      on entry.queue_id = outbox.queue_id
      and entry.runtime_region = outbox.runtime_region
      and entry.queue_entry_id = outbox.queue_entry_id
    where outbox.status = 'created'
      and entry.status = 'dispatched'
      and entry.cloud_task_dispatch_receipt_ref =
        outbox.record_json->'dispatchResult'->'cloudTaskRef'
  ) or not exists (
    select 1
    from public.professional_gpu_cloud_task_outbox outbox
    join public.professional_gpu_fair_queue_entries entry
      on entry.queue_id = outbox.queue_id
      and entry.runtime_region = outbox.runtime_region
      and entry.queue_entry_id = outbox.queue_entry_id
    where outbox.status = 'outcome_unknown'
      and entry.status = 'reconciliation_required'
      and entry.cloud_task_dispatch_receipt_ref is null
      and entry.dispatched_at is null
  ) or not exists (
    select 1
    from public.professional_gpu_cloud_task_outbox outbox
    join public.professional_gpu_fair_queue_entries entry
      on entry.queue_id = outbox.queue_id
      and entry.runtime_region = outbox.runtime_region
      and entry.queue_entry_id = outbox.queue_entry_id
    where outbox.status = 'not_created'
      and entry.status = 'queued'
      and entry.claim_id is null
  ) then
    raise exception 'GPU_TASK_OUTBOX_QUEUE_RECONCILIATION_INVALID';
  end if;
end;
$$;

do $$
begin
  if has_function_privilege(
      'anon',
      'public.weeditpro_begin_professional_gpu_cloud_task_create_v1(text,jsonb)',
      'execute'
    ) or has_function_privilege(
      'authenticated',
      'public.weeditpro_begin_professional_gpu_cloud_task_create_v1(text,jsonb)',
      'execute'
    ) or not has_function_privilege(
      'service_role',
      'public.weeditpro_begin_professional_gpu_cloud_task_create_v1(text,jsonb)',
      'execute'
    ) or has_table_privilege(
      'anon', 'public.professional_gpu_cloud_task_outbox', 'select'
    ) or has_table_privilege(
      'authenticated', 'public.professional_gpu_cloud_task_outbox', 'select'
    ) then
    raise exception 'GPU_TASK_OUTBOX_GRANTS_INVALID';
  end if;
end;
$$;

rollback;

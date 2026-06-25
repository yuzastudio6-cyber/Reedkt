# RP-INTERNAL-BETA-SUPABASE-TARGET-OWNER-INPUT-1

Implement the next internal beta gate after `RP-INTERNAL-BETA-SUPABASE-TARGET-RLS-STORAGE-VALIDATION-1`.

Goal: record explicit owner input for the non-production Supabase target before any remote RLS/storage validation or service-role runtime work.

Required owner input:

- approved non-production Supabase project ref or explicit rejection;
- target environment class: local, dev, staging, or other non-production;
- whether remote validation is approved;
- whether SQL/advisor/storage readback is approved;
- whether service-role secret payload access is explicitly still forbidden or separately approved;
- rollback/cleanup boundary;
- confirmation that frontend never receives service-role credentials;
- confirmation that public buckets and public artifacts remain blocked.

Boundary:

- Do not apply migrations unless an explicit migration execution prompt approves it.
- Do not mutate remote Supabase unless the prompt names the target and confirmation gate.
- Do not read service-role secret payloads into logs or docs.
- Do not expose service-role credentials to frontend code.
- Do not create signed URLs or public artifacts.
- Do not enqueue jobs, execute workers, process media, call providers/models, render/export, or unlock beta/production.

Expected conservative result if owner target evidence is still incomplete:

`blocked_pending_named_supabase_target_owner_input`

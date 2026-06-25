# RP-INTERNAL-BETA-SUPABASE-TARGET-OWNER-DECISION-1

Implement the owner decision after `RP-INTERNAL-BETA-SUPABASE-TARGET-OWNER-INPUT-1`.

Goal: explicitly approve or reject a non-production Supabase target for internal beta remote validation.

Required owner decision:

- approved non-production Supabase project ref or explicit rejection;
- target environment class: local, dev, staging, or other non-production;
- whether remote RLS/storage validation is approved;
- whether SQL/advisor/storage readback is approved;
- whether service-role secret payload access remains forbidden or is separately approved;
- rollback/cleanup boundary;
- confirmation that frontend never receives service-role credentials;
- confirmation that public buckets and public artifacts remain blocked;
- allowed commands, if any, for the next remote validation packet.

Boundary:

- Do not apply migrations unless an explicit migration execution prompt approves it.
- Do not mutate remote Supabase unless the prompt names the target and confirmation gate.
- Do not read service-role secret payloads into logs or docs.
- Do not expose service-role credentials to frontend code.
- Do not create signed URLs or public artifacts.
- Do not enqueue jobs, execute workers, process media, call providers/models, render/export, or unlock beta/production.

Expected conservative result if owner target evidence is still incomplete:

`blocked_pending_named_supabase_target_owner_input`

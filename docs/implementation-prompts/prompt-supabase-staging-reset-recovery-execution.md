# Prompt: Supabase Staging Reset Recovery Execution

Use this prompt only after the reset failure triage packet is reviewed and a human/operator approves one exact recovery strategy.

Current triage decision: `recovery_path_manual_operator_review_required`.

Do not run this prompt unless the future approval names the selected recovery path, confirms backup/restore sufficiency, proves the approved staging target, and defines post-recovery verification. Track B backfill remains a later separate phase after migration history and registry schema/RLS verification pass.

Forbidden unless separately approved: reset retry, schema deploy, migration repair, direct/manual SQL, Track B row writes, production Supabase, provider calls, route/tool/worker execution, media processing, Track A, beta, and production unlocks.

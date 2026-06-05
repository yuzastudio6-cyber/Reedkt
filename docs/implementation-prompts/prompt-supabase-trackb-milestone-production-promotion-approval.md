# Prompt: Supabase Track B Milestone Production Promotion Approval

Use this prompt only after the guarded staging Track B milestone backfill has passed and a Foundation/Supabase owner has reviewed the redacted staging evidence.

Required input:

- Staging backfill export validation report.
- Staging schema/RLS check report.
- Staging write and verification reports.
- Audit and rollback reports.
- Human approval for production promotion planning.

This prompt must remain approval/planning only unless a later prompt explicitly approves production SQL. Production writes, production migrations, provider calls, route/tool/worker execution, media processing, beta unlock, production unlock, and Track A remain blocked by default.

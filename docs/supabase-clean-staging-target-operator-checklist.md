# Supabase Clean Staging Target Operator Checklist

Decision: `approved_for_future_clean_supabase_staging_branch`

Future execution must complete these checks before creating any clean target:

- Confirm current staging data is disposable for internal testing and does not need preservation.
- Confirm production is excluded and no production secrets or targets are used.
- Confirm Supabase branch availability and cost before creating a clean staging target.
- Prefer a clean Supabase staging branch; use a new staging project only if branch availability or cost blocks the branch path.
- Create or update server-only secret references for the clean target without printing payloads.
- Apply migrations and verify schema/RLS only in a separate execution phase.
- Keep Track B milestone backfill as a separate guarded phase after clean schema verification.

Track B milestone backfill remains a later separate guarded phase after clean schema/RLS verification.

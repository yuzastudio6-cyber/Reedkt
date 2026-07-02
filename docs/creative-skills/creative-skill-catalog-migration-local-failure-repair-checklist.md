# RP-SKILLS-40 Local Failure Repair Checklist

## Failure

- [x] RP-SKILLS-39 failure confirmed.
- [x] Failed migration inspected.
- [x] Ambiguous `description` located.
- [x] Root cause documented.
- [x] Adjacent same-statement ambiguity documented after reset surfaced it.

## Patch

- [x] Only `supabase/migrations/202605130007_generation_providers_generated_assets.sql` was patched.
- [x] Ambiguous seed fields were qualified with `seed.`.
- [x] Original seed values and behavior were preserved.
- [x] No new migration was created.
- [x] Creative Skill catalog migrations were not changed.
- [x] No conflict swallowing or exception hiding was added.

## Local Verification

- [x] Remote-safety preflight ran before local Supabase commands.
- [x] Patched local ports were checked.
- [x] Local Supabase start ran.
- [x] `supabase db reset --local --no-seed` ran.
- [x] The chain passed `202605130007_generation_providers_generated_assets.sql` after repair.
- [x] A new blocker was documented.
- [x] Minimal Creative Skill smoke was skipped because the chain did not reach the Creative Skill catalog migrations.
- [x] Local stack was stopped with `supabase stop --project-id reeditpro-local`.

## Boundaries

- [x] Protected files were hash-baselined before edits.
- [x] Creative Skill migrations stayed unchanged.
- [x] Canonical manifest stayed unchanged.
- [x] TypeScript contracts stayed unchanged.
- [x] Mock fixtures stayed unchanged.
- [x] Package files stayed unchanged.
- [x] No remote Supabase was used.
- [x] No `supabase link` was run.
- [x] No `supabase db push` was run.
- [x] No runtime, UI, provider, worker, job, credit, approval, render/export, or app behavior was added.

## Fail The Prompt If

- Remote Supabase is used.
- `supabase link` is run.
- `supabase db push` is run.
- The migration patch is broad or unrelated.
- Another migration is patched without approval.
- Creative Skill migrations are changed.
- The canonical manifest is changed.
- TypeScript, mocks, or package files are changed.
- The error is swallowed instead of fixed.
- Local command output leaks credentials or full connection strings.
- The existing local `reeditpro` stack is stopped.

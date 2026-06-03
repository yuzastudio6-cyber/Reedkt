# Local Supabase Manual Checklist

This checklist is for manual setup before the first executable local RLS smoke test. It is evidence-only and does not authorize SQL execution in Prompt 20C, Prompt 20D, or Prompt 20E.

## Required Local Tools

- [ ] Host architecture verified with `uname -m`.
- [ ] Node path verified as arm64 and Node.js 20 or later.
- [ ] Supabase CLI path verified.
- [ ] Supabase CLI architecture verified as compatible with host.
- [ ] Supabase CLI version command succeeds.
- [ ] Docker command exists.
- [ ] Docker daemon is reachable and local.
- [ ] `psql` exists or an approved future local SQL executor is selected.
- [ ] `supabase/config.toml` exists.
- [ ] `supabase/config.toml` has no remote/staging/production project ref.
- [ ] no `.supabase/project-ref` or `.supabase/.temp/project-ref` exists.

## Safety Checks

- [ ] No secret values are printed.
- [ ] No service-role keys are present in the validation environment.
- [ ] No provider keys are present in the validation environment.
- [ ] No Stripe keys are present in the validation environment.
- [ ] No signed URL values are used as test inputs.
- [ ] No staging or production project ref is linked.
- [ ] No `supabase link` command is run.
- [ ] No remote SQL command is run.
- [ ] No migration command is run in Prompt 20C, Prompt 20D, or Prompt 20E.
- [ ] No local SQL is run in Prompt 20C, Prompt 20D, or Prompt 20E.
- [ ] No `supabase status` command is run in Prompt 20D.
- [ ] No host tool install, download, global npm install, or `npx` command is run in Prompt 20E.

## Readiness Checks

Run only these Prompt 20E commands:

```sh
npm run --silent supabase:local:toolchain:probe
npm run --silent supabase:local:preflight
npm run supabase:rls:list-tests
npm run supabase:rls:local:dry-run
```

Expected Prompt 20E result:

- host probe and preflight may remain `blocked`;
- list mode succeeds without inspecting Supabase status;
- dry-run executes no SQL and reports `callsSupabaseStatus=false`;
- `manualSetupRequired` is accurate;
- `canProceedToPrompt20B` distinguishes environment readiness from the first SQL candidate work item;
- `nextRecommendedPrompt` is Prompt 20B only when non-SQL environment blockers are cleared, otherwise Prompt 20F/manual host repair verification.

Future `supabase start` and local SQL are allowed only in Prompt 20B or a setup verification prompt after local-only safety is proven.

## Evidence Checklist

- [ ] CLI path/version/architecture recorded.
- [ ] Docker version/status recorded.
- [ ] `psql` path/version recorded or missing blocker recorded.
- [ ] preflight JSON recorded.
- [ ] runner list JSON recorded.
- [ ] runner dry-run JSON recorded.
- [ ] no remote target confirmation recorded.
- [ ] no SQL execution confirmation recorded.

## Prompt 20B Gate

Prompt 20B should wait until all non-SQL environment gates are true:

- [ ] `canProceedToPrompt20B=true`
- [ ] `remoteRiskDetected=false`
- [ ] local DB URL is localhost-only and redacted in evidence
- [ ] run mode remains guarded by `--confirm-local-only`

`canRunLocalSql=true` remains stricter: it also requires an executable SQL candidate under `database/test-sql/local/`. If the environment is ready but no executable candidate exists, Prompt 20B may create the first candidate and then run it through the guarded runner.

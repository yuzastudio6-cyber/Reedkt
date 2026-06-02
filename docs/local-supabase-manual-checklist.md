# Local Supabase Manual Checklist

This checklist is for manual setup before the first executable local RLS smoke test. It is evidence-only and does not authorize SQL execution in Prompt 20C.

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
- [ ] No migration command is run in Prompt 20C.
- [ ] No local SQL is run in Prompt 20C.

## Readiness Checks

Run only these Prompt 20C commands:

```sh
npm run --silent supabase:local:preflight
npm run supabase:rls:list-tests
npm run supabase:rls:local:dry-run
```

Expected Prompt 20C result:

- preflight may remain `blocked`;
- list mode succeeds without inspecting Supabase status;
- dry-run executes no SQL;
- `manualSetupRequired` is accurate;
- `nextRecommendedPrompt` is Prompt 20D unless `canRunLocalSql=true`.

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

Prompt 20B should wait until all are true:

- [ ] `canRunLocalSql=true`
- [ ] `remoteRiskDetected=false`
- [ ] local DB URL is localhost-only and redacted in evidence
- [ ] executable SQL candidate exists under `database/test-sql/local/`
- [ ] run mode remains guarded by `--confirm-local-only`

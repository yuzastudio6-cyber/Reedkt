# MODEL-DRYRUN-2A Static Budget Plan

Status: `static_budget_preflight_created`.

MODEL-DRYRUN-2A keeps `maxTotalTokens=7200`. It does not solve the guardrail by expanding the budget.

## Static Projection

The preflight uses committed sanitized MODEL-DRYRUN-2 evidence and current case config only:

- Qwen prompt tokens from evidence: `866`
- Qwen approved case count: `4`
- Qwen max output tokens per case after non-thinking control: `650`
- projected Qwen completion tokens: `2600`
- DeepSeek total tokens from evidence: `1127`
- projected total tokens: `4593`
- max total tokens: `7200`
- projected margin: `2607`
- required margin: `600`

The static projection passes with enough margin for one guarded retry after `enable_thinking: false` is present in the Qwen request body.

## Preflight Command

```sh
npm run --silent model-provider:dryrun-token-budget:preflight
```

The preflight must pass before the approved synthetic provider dry-run retry is attempted. If it fails, MODEL-DRYRUN-2A remains blocked and no provider retry should run.

## Retry Gate

The provider retry is allowed exactly once only if all of the following are true:

- static token budget preflight passes;
- no provider secret payload environment variables are present;
- required provider dry-run confirmations are present;
- the provider dry-run still resolves exact Secret Manager refs only;
- the run remains synthetic-only;
- the case matrix remains seven approved synthetic provider calls;
- `maxTotalTokens=7200` remains unchanged.

No worker execution, tool execution, route execution, raw prompt execution, broad provider runtime, media processing, browser capture, Docker/Cloud Run execution, Supabase mutation, SQL execution, storage transfer, signed URL creation, public artifact creation, production deployment, external beta unlock, paid production unlock, Google Cloud Secret Manager payload exposure, secret commit, raw provider response commit, broad service-role handler, or production/beta unlock was enabled.

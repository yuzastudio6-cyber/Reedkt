# MERGE-0 Milestone PR Body Template

Status: `merge_readiness_packet_created`.

Use this template for future milestone PRs.

```md
## Summary
- What changed.
- Why this milestone exists.

## Capability Enabled
- `none; <milestone scope only>` or the exact approved capability.

## Validation
- Local commands run and outcomes.
- Environment-blocked commands with exact blocker.

## GitHub CI / Check Status
- Check rollup: <passed | failed | missing_checks | pending>.
- If checks are absent, explain whether the base lacks workflows.

## Supabase Update Classification
- Supabase update required: `docs/status only`.
- Supabase update status: `docs_only`.
- Supabase environment touched: `none`.
- SQL executed: `none`.
- Migration deployed: `no`.

## Runtime Scope
- Runtime executed: <yes/no and exact approved scope>.

## No-Scope Statement
No PR merge, branch deletion, Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.

## Blockers
- Current blockers and owner.

## Parent / Base Dependency
- Parent PR: <number or none>.
- Base branch: <branch>.

## Downstream Child PRs
- Child PRs: <numbers or none>.

## Merge Readiness
- State: <readiness state>.
- Recommended action: <one sentence>.

## Next Prompt
- <next prompt>.
```

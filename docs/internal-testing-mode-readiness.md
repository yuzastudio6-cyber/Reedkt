# Internal Testing Mode Readiness

## Purpose

Internal testing mode is the stage where ReEditPro can be signed into, tested repeatedly, broken safely, fixed, and retested before external beta or paid production.

Paid users are not required for this stage.

## Allowed In Internal Testing

Internal testing may allow:

- signed-in internal testers
- repeated break/fix iteration
- local-dev fixture testing
- internal dry-run E2E checks
- mock or test credit estimates
- approved snapshot gate testing
- tool readiness diagnostics
- bounded tool execution evidence collection
- private artifact manifest validation
- operator status readback

These scopes are allowed only inside the internal testing boundary and only with the normal safety gates for expensive work.

## Still Blocked

Internal testing does not allow:

- external beta launch
- real-user-media beta
- paid user onboarding
- live billing or Stripe charges
- production credit wallet mutation
- public artifact delivery
- production launch

Paid production blockers protect paid production only. They must not be interpreted as a reason to stop safe internal break/fix testing.

## Hard Guardrails

Internal testing still requires:

- auth for internal testers
- approved plan snapshot before expensive work
- approved credit estimate before expensive work
- credit reservation before expensive work
- mock or test credits only
- idempotent job and cost event identifiers
- private artifact manifests
- no raw prompts as execution source
- no secrets or signed URLs as source truth
- no frontend heavy tool execution

## Gate Separation

The readiness ladder is:

1. Internal dry-run.
2. Internal break/fix testing.
3. Bounded tool execution evidence.
4. External beta.
5. Real-user-media beta.
6. Paid production.

Each stage must pass its own evidence gate. A later-stage blocker must block only that later unsafe action, not earlier safe testing.

## Validation

Run:

```bash
npm run smoke:beta-readiness
npm run smoke:beta-readiness-operator-status
npm run smoke:beta-readiness-blocker-ledger
npm run smoke:prod-runtime-contracts
npm run smoke:prod-cost-controls
npm run smoke:worker
npm run typecheck:server
git diff --check
```

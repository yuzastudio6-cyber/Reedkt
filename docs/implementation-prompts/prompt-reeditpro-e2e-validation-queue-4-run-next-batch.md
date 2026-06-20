# REEDITPRO-E2E-VALIDATION-QUEUE-4: run next batch, no execution

Queue 4 may continue the validation queue after queue-3 dependency hydration blockers are recorded. It must not retry #255 or #260 unless a hydration-fix prompt clears their blockers first.

```json reeditpro-e2e-validation-queue-4-run-next-batch
{
  "prompt": "REEDITPRO-E2E-VALIDATION-QUEUE-4: run next batch, no execution",
  "sourceDecision": "reeditpro_e2e_validation_queue_3_blocked_validation_failures",
  "doNotRetryWithoutFix": [255, 260, 264, 300, 305],
  "selectionRules": [
    "Select only clean, non-draft, non-superseded PRs.",
    "Exclude Supabase, SQL, provider/model, runtime, worker/route, media, browser-capture, Docker, artifact, billing, beta, and production scope unless a prompt explicitly scopes a docs-only validation.",
    "Use dependency hydration only for validation and require package files unchanged."
  ],
  "requiredEvidence": [
    "PR #539 merged",
    "PR #245 merged externally",
    "PR #263 merged externally",
    "Queue-3 blockers for PR #255 and PR #260 preserved"
  ],
  "noScopeStatement": "No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, or broad service-role handler was enabled."
}
```

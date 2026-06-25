# RP-CREDITS-01-INTERNAL-BETA-CREDIT-LEDGER-RUNTIME-SCAFFOLD

Use this prompt only after `RP-BACKEND-02-INTERNAL-BETA-SERVICE-ROLE-RUNTIME-SCAFFOLD` is merged and validated.

Implement the next narrow internal beta milestone for a fail-closed internal credit ledger runtime scaffold.

Requirements:

- Keep Stripe/payment processing disabled.
- Do not spend, reserve, release, or refund real credits without explicit runtime approval and local/staging validation.
- Do not run workers, providers, rendering, media processing, signed/public artifact creation, or beta/production unlocks.
- Preserve the rule that workers execute approved snapshots only and cannot start from raw chat.
- Keep frontend code from writing credit ledger, reservation, or worker state directly.

Expected conservative result if no explicit runtime approval is supplied:

- Decision: `completed_disabled_internal_beta_credit_ledger_runtime_scaffold_no_spend`
- Execution: `completed_fail_closed_credit_ledger_scaffold_no_credit_mutation`
- Credit mutation: `false`
- Stripe/payment processing: `disabled`
- Internal beta end-to-end status: `not_ready`

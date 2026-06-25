# RP-BACKEND-02-INTERNAL-BETA-SERVICE-ROLE-RUNTIME-SCAFFOLD

Use this prompt only after `RP-BACKEND-01-INTERNAL-BETA-SERVICE-ROLE-API-CONTRACTS` is merged and validated.

Implement the next narrow internal beta backend milestone by adding disabled-by-default service-role route handler scaffolds for the RP-BACKEND-01 contract ids.

Requirements:

- Keep real route execution disabled unless an explicit local/staging runtime flag is present.
- Do not connect to remote Supabase without explicit environment approval.
- Do not execute workers, providers, rendering, media processing, signed/public artifact creation, Stripe/payment processing, or beta/production unlocks.
- Enforce approved snapshot and credit reservation gates before any future job enqueue handler can leave disabled mode.
- Preserve frontend prohibition on service-role mutation.

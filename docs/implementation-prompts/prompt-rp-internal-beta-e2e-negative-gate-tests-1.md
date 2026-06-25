# RP-INTERNAL-BETA-E2E-NEGATIVE-GATE-TESTS-1

Use this prompt only after `RP-PROVIDER-01-INTERNAL-BETA-DISABLED-PROVIDER-ADAPTER-SCAFFOLD` is merged and validated.

Implement the next narrow internal beta milestone for negative gate tests around the disabled internal beta lane.

Requirements:

- Test that no generation starts before approved plan and credit estimate approval.
- Test that credits cannot be spent without a reservation.
- Test that frontend code cannot call providers or service-role runtime directly.
- Test that worker execution cannot start from raw chat.
- Test that private artifacts cannot become public artifacts or signed URLs without a separate approved policy.
- Test Basic/Pro no-Veo and Premium final-fallback-only Veo policy.
- Do not call providers, read secrets, run workers, render, process media, mutate Supabase, run SQL, create signed/public artifacts, charge Stripe, or unlock beta/production.

Expected conservative result if no explicit runtime approval is supplied:

- Decision: `completed_internal_beta_negative_gate_tests_for_disabled_runtime_lane`
- Execution: `completed_tests_only_no_runtime_unlock`
- Internal beta end-to-end status: `not_ready`

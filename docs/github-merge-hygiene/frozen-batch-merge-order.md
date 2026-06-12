# Frozen Batch Merge Order

Decision: `frozen_batch_parent_first_order_ready`

Merge execution is a separate future phase. It may merge only approved PRs listed in `docs/github-merge-hygiene/frozen-merge-batch.json`.

| Order | PR | Base | Head | SHA | Approved |
| --- | --- | --- | --- | --- | --- |
| 1 | #205 | `codex/rp-foundation-26c-supabase-advisor-draft-remediation-packet` | `codex/rp-foundation-xchat-0-cross-chat-ownership-registry` | `bbc357b7ddb4f56117252f72e5909f3f7f399098` | true |
| 2 | #222 | `codex/rp-activation-52g-controlled-internal-test-go-no-go-handoff-dispatch` | `codex/rp-activation-52h-cross-workstream-handoff-tracking` | `03680b3b5795c9c63d6b25b0a45d2e35a4774f36` | true |
| 3 | #247 | `codex/rp-foundation-supabase-remote-schema-equivalence-review` | `codex/rp-foundation-supabase-schema-parity-remediation-strategy` | `a1f72046af6a1150ed71f04425fc4be27abe7f36` | true |
| 4 | #248 | `codex/rp-foundation-supabase-schema-parity-remediation-strategy` | `codex/rp-foundation-supabase-staging-reset-approval-packet` | `bdc0362705b05ace64c3f52e5c951198a41e59f2` | true |
| 5 | #252 | `codex/rp-foundation-supabase-staging-reset-approval-packet` | `codex/rp-foundation-supabase-staging-data-impact-backup-approval` | `acbecccd5e7b9fa40ec743b305bc410fa1bd2d90` | true |
| 6 | #259 | `codex/rp-foundation-supabase-staging-data-impact-backup-approval` | `codex/rp-foundation-supabase-staging-reset-reapply-execution` | `2cdedc2a5cb65b9bed5ae8da77073eda1aa79c10` | true |
| 7 | #262 | `codex/rp-foundation-supabase-staging-reset-reapply-execution` | `codex/rp-foundation-supabase-staging-reset-failure-triage` | `bac80ccd7384819de29e0ce710fd5e963700ad2e` | true |
| 8 | #265 | `codex/rp-foundation-supabase-staging-reset-failure-triage` | `codex/rp-foundation-supabase-staging-reset-retry-approval` | `082d8681f92180b673a35e80767306794be5a3e2` | true |
| 9 | #269 | `codex/rp-foundation-supabase-staging-reset-retry-approval` | `codex/rp-foundation-supabase-staging-reset-retry-execution` | `e6ed4f2dbf6f772a8ffb9dcf7c9e7a482798ef2d` | true |
| 10 | #271 | `codex/rp-foundation-supabase-staging-reset-retry-execution` | `codex/rp-foundation-supabase-reset-retry-failure-diagnostics` | `a9fa107beb98af4995af8eb7137b594363fad88d` | true |
| 11 | #274 | `codex/rp-foundation-supabase-reset-retry-failure-diagnostics` | `codex/rp-foundation-supabase-support-escalation-approval` | `4d7c5d17dd2eace174f2f0776d01b442e4d6b36f` | true |
| 12 | #276 | `codex/rp-foundation-supabase-support-escalation-approval` | `codex/rp-foundation-supabase-support-ticket-submission` | `f8583af0b9e3cd6765773a0634c244ac664c193d` | true |
| 13 | #280 | `codex/rp-foundation-supabase-support-ticket-submission` | `codex/rp-foundation-supabase-clean-staging-target-approval` | `dd3659f9c651cf4da39dcacf308e621c2b4c3b94` | true |
| 14 | #283 | `codex/rp-foundation-supabase-clean-staging-target-approval` | `codex/rp-foundation-supabase-clean-staging-branch-execution` | `a423098274a670c6b4d75ca4d4596a9ec2a2b2c5` | true |
| 15 | #292 | `codex/rp-foundation-supabase-clean-staging-branch-execution` | `codex/rp-foundation-supabase-branching-plan-billing-review` | `e194187225c2d1fc5d2f9fe342826b54e118cdf0` | true |
| 16 | #298 | `codex/rp-foundation-supabase-clean-staging-branch-execution` | `codex/rp-foundation-supabase-trackb-clean-staging-backfill` | `6c0c055a7a2b9844ff4f00efe8dbd1ca75e8dbdd` | true |
| 17 | #299 | `codex/rp-foundation-supabase-trackb-clean-staging-backfill` | `codex/rp-product-internal-beta-readiness-aggregation` | `61c715c5dd42d2180cfa823e3c03f11d7a0cc482` | true |
| 18 | #302 | `codex/rp-product-internal-beta-readiness-aggregation` | `codex/rp-product-internal-testing-scope-freeze-signoff` | `d2581a09844f834cc453ea4548267526daab7b78` | true |
| 19 | #306 | `codex/rp-product-internal-testing-scope-freeze-signoff` | `codex/rp-product-restricted-internal-testing-launch-rehearsal` | `93a4afc0853ddbb983bd8663d4fa4a6c2c9d51e1` | true |
| 20 | #309 | `codex/rp-product-restricted-internal-testing-launch-rehearsal` | `codex/rp-product-restricted-internal-testing-start-gate` | `aa9bac85ce7334e171cb233350b66edb37512fc0` | true |
| 21 | #311 | `codex/rp-product-restricted-internal-testing-start-gate` | `codex/rp-product-restricted-internal-testing-session-0` | `1493ab86881e58990534a6007b5ecbd2eb7d39fb` | true |
| 22 | #314 | `codex/rp-product-restricted-internal-testing-session-0` | `codex/rp-model-orchestration-qwen-deepseek-repo-audit` | `dc83d8368125332ef51a26a17745fc6b98d3e29a` | true |
| 23 | #318 | `codex/rp-model-orchestration-qwen-deepseek-repo-audit` | `codex/rp-model-orchestration-qwen-deepseek-dry-run-approval` | `64a52452893c47d7a5972134243af313a2b76ac9` | true |
| 24 | #320 | `codex/rp-model-orchestration-qwen-deepseek-dry-run-approval` | `codex/rp-model-orchestration-qwen-deepseek-provider-dry-run` | `6fa75c385481a6fbbaeac42e969fbb9b37c16147` | true |
| 25 | #322 | `codex/rp-model-orchestration-qwen-deepseek-provider-dry-run` | `codex/rp-model-orchestration-qwen-dashscope-auth-repair` | `ce50e3548c4bc493bd2ad903c384088321e5bb71` | true |
| 26 | #327 | `codex/rp-model-orchestration-qwen-dashscope-auth-repair` | `codex/rp-model-orchestration-plan-snapshot-contract` | `6bf552c6ed330cc5843389a5bac20e17c5551c05` | true |
| 27 | #337 | `codex/rp-model-orchestration-plan-snapshot-contract` | `codex/rp-model-orchestration-plan-snapshot-dry-run-validation` | `e762d297dc9ea236b8c2c85585ff2fd781ea3e77` | true |


Before each merge, run the entry's verification command and stop if the PR state, draft status, merge state, head SHA, or base branch differs from the frozen batch entry.

No runtime execution, Supabase mutation, provider call, public artifact, signed URL delivery, production, external beta, paid production, or raw prompt execution is allowed.

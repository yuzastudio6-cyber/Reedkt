# Connected Supabase Performance Advisor Triage

The connected read-only audit reported many unindexed foreign-key findings across runtime/foundation tables. Prompt 26A records examples and triage only. It does not create index migrations or execute SQL.

## Why This Matters

Unindexed foreign keys can cause slow joins, slow deletes/updates, heavier locks, and poor staging validation signal. They are usually not data-exposure issues by themselves, but they are staging and production readiness blockers when the affected tables are part of runtime workflows.

## Reported Examples

| Table | Likely domain | Priority | Future action |
| --- | --- | --- | --- |
| `ambient_sound_plans` | audio/SoundSync planning | medium | Review FK columns and add safe indexes if needed. |
| `api_idempotency_keys` | backend idempotency | high | Index request/workspace/project references used by replay checks. |
| `approved_plan_snapshots` | approved execution input | high | Index project/workspace/version references used by reads and gates. |
| `chat_actions` | chat-native editor | medium | Review project/message references. |
| `chat_attachments` | chat-native uploads | medium | Review message/project/media references. |
| `chat_messages` | chat-native editor | medium | Review thread/project references. |
| `credit_approvals` | credit approval gate | high | Index approved snapshot/project/user references. |
| `credit_estimates` | credit estimate gate | high | Index project/plan references used before approval. |
| `credit_ledger_entries` | credit ledger | high | Index reservation/user/project references. |
| `credit_reservations` | credit reservation | high | Index project/snapshot/user references. |
| `edit_plans` | edit planning | medium | Review workspace/project/user references. |

## Future Index Migration Strategy

- Build a complete advisor export first.
- Group indexes by domain and migration risk.
- Use deterministic index names.
- Prefer additive `create index if not exists` migrations.
- Validate locally and in approved staging before production.
- Avoid adding indexes without confirming column existence across schema-era migrations.

## Current Decision

Prompt 26A records the performance findings and recommends Prompt 26B/26E. No index migration is created.


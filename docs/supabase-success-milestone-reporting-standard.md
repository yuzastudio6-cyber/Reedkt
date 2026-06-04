# Supabase Success Milestone Reporting Standard

Future Prompt 24+ summaries must state what happened to Supabase explicitly. A successful repo milestone is not the same thing as a successful Supabase update.

## Required Summary Fields

Every Supabase-adjacent final response and validation doc should include:

| Field | Allowed values |
| --- | --- |
| `Supabase update required` | `none`, `docs/status only`, `local evidence only`, `staging approval packet`, `staging update candidate`, `staging validation required`, `production candidate` |
| `Supabase update status` | `not_needed`, `pending_human_approval`, `local_evidence_recorded`, `ready_for_staging_review`, `ready_for_staging_dry_run`, `blocked`, `applied_to_staging`, `validated_in_staging` |
| `Supabase environment touched` | `none`, `local`, `staging`, `production` |
| `SQL executed` | `none`, `local guarded runner`, `staging approved`, `production approved` |
| `Migration deployed` | `no`, `local only`, `staging approved`, `production approved` |
| `Evidence docs` | repo paths or redacted external evidence references |
| `Blockers` | exact remaining blockers |
| `Next Supabase action` | next prompt or human action |

## Required Caveats

If staging did not run, say so. If production did not run, say so. If approval is future-scoped, name the future prompt. If the Supabase dashboard shows no new activity, explain whether that is expected.

## Prompt 23S Reporting Line

Prompt 23S reporting line:

`Supabase update required: docs/status only; Supabase update status: docs_only; Supabase environment touched: none; SQL executed: none; migration deployed: no; next Supabase action: Prompt 24 guarded staging validation after execution-time gates.`

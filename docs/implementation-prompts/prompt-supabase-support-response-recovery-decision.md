# Supabase Support Response Recovery Decision

Use this prompt only after the manual Supabase support ticket has been submitted and a response is available.

## Required Inputs

- Ticket reference from the operator.
- Supabase response, redacted for secrets/private data.
- Current support submission packet decision: `support_ticket_ready_for_manual_operator_submission`
- Manual packet path: `docs/activation-supabase-support-ticket-submission-reports/support_ticket_manual_submission_packet.json`

## Required Behavior

- Classify support guidance into safe recovery options.
- Keep reset, deploy, migration repair, Track B backfill, and production blocked unless a later explicit execution phase approves a specific action.
- Do not include DB URLs, passwords, keys, tokens, private payloads, signed URLs, row contents, or production data.
- Recommend the next recovery phase while preserving staging-only scope.

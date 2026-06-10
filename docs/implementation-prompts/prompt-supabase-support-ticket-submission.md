# Supabase Support Ticket Submission

Use this prompt only after PR #271 diagnostics and this support escalation approval packet are reviewed.

## Required Inputs

- Approved decision: `approved_for_future_manual_supabase_support_ticket`
- Approved redacted packet: `docs/activation-supabase-support-escalation-approval-reports/support_escalation_redacted_packet.json`
- Redaction review: `passed`

## Allowed Future Action

Submit a manual Supabase dashboard support ticket using only the approved redacted packet. The ticket must target staging project `wmyyttnynmteqgcdishd`.

## Blocked Actions

Do not run CLI `--create-ticket`, debug reset logs, reset retry, `db push`, migration repair, schema deploy, Track B backfill, production SQL, direct DDL/DML, provider calls, worker/tool/route execution, media processing, Track A, beta unlock, or production unlock inside the submission phase unless a later prompt explicitly approves that narrower action.

## Required Result

Record ticket submission metadata only: support channel, redacted ticket reference, submitted-by role, submission time, no secret payloads viewed or attached, and next recovery recommendation.

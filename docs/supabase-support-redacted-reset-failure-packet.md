# Supabase Support Redacted Reset Failure Packet

Status: `ready_for_manual_support_ticket_submission_in_future_phase`

This is the human-readable companion to `support_escalation_redacted_packet.json`. It contains staging-safe metadata only.

## Redacted Command Class

`npm exec --yes --package supabase@latest -- supabase db reset --db-url [REDACTED_STAGING_DB_URL] --no-seed`

## Failure Summary

- Sanitized failure class: `reset_retry_command_failed_exact_cause_not_proven`
- Exact failure cause proven: `false`
- Staging SQL may have run before this packet: `true`
- Post-failure state classifier: `unchanged_failed_state`
- Target registry migration: `202606050001`

## Exclusions

No database URL values, database passwords, service role keys, anon keys, personal access tokens, signed URLs, provider keys, private backup payloads, private media URLs, row contents, or production targets are included.

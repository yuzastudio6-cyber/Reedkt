# Agent Finding Schema

Agent findings are structured evidence records, not commands.

Required fields:

- `findingId`
- `agentId`
- `timestamp`
- `subject`
- `evidenceRefs`
- `confidence`
- `severity`
- `findingType`
- `summary`
- `recommendation`
- `uncertainty`
- `blocked`
- `blockedReason`
- `downstreamIntentCandidates`

Findings must not include raw secret values, public artifact URLs as source of truth, unapproved provider calls, or direct tool execution commands.

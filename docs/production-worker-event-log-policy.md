# Production Worker Event Log Policy

## Purpose

Worker events give operators and users progress visibility without leaking sensitive execution payloads.

## Sanitization Rules

Events must not contain:

- raw prompts;
- raw user chat;
- signed URLs;
- service-role keys;
- provider API keys;
- secret values;
- full provider payloads;
- media bytes.

Events may contain:

- event name;
- job ID;
- worker type;
- progress percent;
- short message;
- sanitized payload summary;
- created timestamp.

## Milestone 4 Boundary

Events are generated in memory for smoke validation. Draft SQL stores `payload_summary_json` only and includes comments/constraints for sanitized summaries.

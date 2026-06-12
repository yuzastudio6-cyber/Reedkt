# Provider Data Policy

Allowed to Qwen in a future approved phase:

- sanitized video evidence manifests
- shot and timeline summaries
- tool capability summaries
- safe user edit instructions
- professional editing standard schemas
- non-sensitive project context

Allowed to DeepSeek in a future approved phase:

- sanitized coding task manifests
- small safe interface definitions
- redacted test failure summaries
- generated fixture data
- tool/spec descriptions

Blocked:

- raw user video/audio/images
- signed URLs as source of truth
- service-role keys
- DB URLs
- provider keys
- Stripe keys
- private media URLs
- raw Supabase rows
- unredacted sensitive transcripts
- raw provider payloads or responses

PROVIDER-1 sends no data to DeepSeek or Qwen.

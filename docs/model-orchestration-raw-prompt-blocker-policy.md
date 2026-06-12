# Model Orchestration Raw Prompt Blocker Policy

Blocked paths:
- raw chat to worker execution
- raw prompt to tool route execution
- provider response to direct mutation
- provider response to public artifact
- provider response to signed URL source of truth

Allowed future path requires structured findings, typed edit intents, approved plan snapshots, and a separate worker/provider execution approval phase.

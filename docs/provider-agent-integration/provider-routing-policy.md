# Provider Routing Policy

Provider Gateway must enforce:

- Qwen only for head-agent planning/decision candidate outputs.
- DeepSeek only for coding/spec proposal outputs.
- Qwen cannot execute tools or workers.
- DeepSeek cannot execute code or tools.
- Neither model can handle secrets, execute raw prompts, chain providers, or
  bypass Producer/QA gates.
- Worker Runtime executes only approved plan snapshots.
- Owner workstreams validate their own tool outputs.

This policy does not add runtime adapters, ProviderRoute values, provider calls,
or model execution. Qwen and DeepSeek remain policy/model records only.

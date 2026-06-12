# DeepSeek V4 Provider Approval

PROVIDER-1 records DeepSeek official evidence for:

- `deepseek-v4-pro`
- `deepseek-v4-flash`
- OpenAI-compatible base URL `https://api.deepseek.com`
- Anthropic-compatible base URL `https://api.deepseek.com/anthropic`
- 1M context
- JSON output
- tool calls
- thinking and non-thinking modes
- FIM in non-thinking mode
- legacy compatibility names `deepseek-chat` and `deepseek-reasoner`, scheduled
  for deprecation on 2026-07-24

DeepSeek V4-Pro is approved only as a future coding/spec proposal specialist.
DeepSeek V4-Flash is recorded only as a future cheaper/simple coding fallback
candidate. Neither model may execute code, shell commands, workers, tools,
provider chaining, Supabase schema mutation, private media analysis, secret
handling, or frontend service-role exposure.

DeepSeek pricing must be rechecked from the official pricing page before any
future live validation. PROVIDER-1 does not freeze permanent prices.

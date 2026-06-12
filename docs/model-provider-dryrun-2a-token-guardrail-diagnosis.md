# MODEL-DRYRUN-2A Token Guardrail Diagnosis

Status: `token_guardrail_fix_prepared`.

MODEL-DRYRUN-2 did not fail on auth, region, endpoint, schema, Qwen timeout, DeepSeek, or unsafe output. It failed after success because reported provider tokens exceeded the local dry-run cap.

## Token Evidence

| Provider | Case | Prompt | Completion | Total |
| --- | --- | ---: | ---: | ---: |
| Qwen | `synthetic_edit_intent_extraction` | 213 | 1522 | 1735 |
| Qwen | `synthetic_timeline_planning` | 214 | 1439 | 1653 |
| Qwen | `synthetic_tool_route_metadata_recommendation` | 221 | 1259 | 1480 |
| Qwen | `synthetic_provider_fallback_comparison` | 218 | 1629 | 1847 |
| DeepSeek | `synthetic_blocker_classification` | 225 | 141 | 366 |
| DeepSeek | `synthetic_rejected_raw_prompt_to_worker` | 233 | 139 | 372 |
| DeepSeek | `synthetic_cost_scope_risk_explanation` | 238 | 151 | 389 |

Totals:

- Qwen prompt tokens: `866`
- Qwen completion tokens: `5849`
- Qwen total tokens: `6715`
- DeepSeek total tokens: `1127`
- overall total: `7842`
- `maxTotalTokens=7200`
- overage: `642`

## Diagnosis

The Qwen sanitized response bodies were small, but reported Qwen completion token counts were large. The Qwen request already used `max_tokens: 650`, `stream: false`, `qwen3.7-plus`, and the approved US DashScope endpoint. The current Alibaba Qwen API reference states that `max_tokens` does not limit chain-of-thought. Therefore, the narrow repo-side fix is to add `enable_thinking: false` to Qwen requests while keeping the approved model, timeout, max output token target, case matrix, and `maxTotalTokens=7200` cap unchanged.

DeepSeek remains unchanged because it already uses the existing control path and disables thinking with `thinking: { type: 'disabled' }`.

## Fix

MODEL-DRYRUN-2A adds the Qwen request control:

```json
{
  "enable_thinking": false
}
```

The approved seven synthetic provider cases remain unchanged. No `qwen3.7-max`, provider chaining, worker execution, tool execution, route execution, media processing, Supabase mutation, SQL execution, public artifact, signed URL, production, or beta scope is introduced.

No worker execution, tool execution, route execution, raw prompt execution, broad provider runtime, media processing, browser capture, Docker/Cloud Run execution, Supabase mutation, SQL execution, storage transfer, signed URL creation, public artifact creation, production deployment, external beta unlock, paid production unlock, Google Cloud Secret Manager payload exposure, secret commit, raw provider response commit, broad service-role handler, or production/beta unlock was enabled.

# Edit Reference long-form semantic reasoning route

Date: 2026-07-20
Status: source contract and controlled smoke verified; live provider routing remains gated

## Outcome

Long-form Edit Reference semantic synthesis no longer treats Qwen 3.7 as the unconditional main reasoning model. It now consumes the same backend-owned reasoning order as the rest of ReEditPro:

1. Kimi K3 is the primary reasoning route.
2. Qwen 3.7 is the first fallback only after one allowed terminal Kimi failure.
3. DeepSeek V4 Pro is the final fallback only after one allowed terminal Qwen failure.
4. Qwen2.5-VL remains a visual-understanding specialist and cannot satisfy this reasoning route.

The feature does not mint route authority and does not create provider clients. It accepts one exact server-issued authorization bound to the long-form semantic lane, bounded evidence context, approved usage estimate, internal-cost budget, immutable rate card, maximum internal-cost ceiling, idempotency digest, attempt identity, and immediately preceding fallback state.

## Fail-closed provider resolution

Kimi and DeepSeek must be supplied by the shared backend provider resolver with route, boundary, and exact model identity matching the authorization. The existing Qwen long-form provider can be wrapped only for an already-authorized priority-2 Qwen fallback. Supplying that Qwen provider to a Kimi-primary attempt does not call it and cannot silently substitute it.

Provider resolution makes no model call. The semantic stage calls the provider only after route and cost validation. A completed live result must then return the exact authorized model ID, safe bounded runtime provenance, structured-evidence proof, one provider/model call, no nested worker creation, and no remote mutation. Missing or mismatched authority fails before the call; invalid result provenance fails the semantic output.

## Durable output lineage

Each new live semantic work output records:

- the exact Kimi, Qwen, or DeepSeek route ID;
- the route attempt ID;
- the shared authorization digest;
- the exact provider/model provenance;
- the immutable internal-cost usage lineage; and
- a route-derived tool identity (`kimi_k3`, `qwen_3_7`, or `deepseek_v4_pro`).

Controlled local outputs retain `controlled_specialist_fixture`, null route authority, no provider call, no customer price, and no customer-credit mutation. Existing raw reference media, transcript, OCR, signed URL, local path, and provider payload exclusion remains unchanged.

Previously persisted controlled/local v5 outputs that predate the three route-lineage fields remain readable and resumable. That compatibility is intentionally limited to non-live evidence. Any historical or forged `verified_live` output without the exact route ID, attempt ID, and authorization digest is rejected rather than being promoted or silently attributed to Qwen.

## Verification

The focused adversarial smoke proves:

- Kimi resolves as primary through the injected shared resolver;
- Qwen compatibility cannot satisfy a Kimi attempt and is not called;
- Qwen resolves only with valid fallback authority;
- DeepSeek resolves only as the final authorized fallback;
- missing, tampered, or route-substituted authority fails closed;
- request identity changes with the bounded semantic context;
- a live Kimi work output carries Kimi tool and authorization lineage;
- legacy controlled outputs remain readable while legacy live outputs without route authority fail closed; and
- provider routing remains separate from customer price, credits, and service fees.

Run:

```text
npm run smoke:edit-reference-long-form-semantic-reasoning-route
```

## Honest remaining boundary

This slice does not implement or activate Moonshot/Kimi, Alibaba/Qwen, or DeepSeek transports; Secret Manager; the shared fallback scheduler; hosted workers; live usage reconciliation; Supabase; billing; or deployment. It does not prove a live multi-hour semantic run. The backend must inject reviewed providers and exact route authorizations through the durable pre-plan worker authority, then produce same-release live cost, retry, timeout, fallback, and full-source coverage evidence before the model-routing production gate can pass.

`productionReady` remains `false`.

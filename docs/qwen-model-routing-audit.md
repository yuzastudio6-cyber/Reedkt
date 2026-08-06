# Reasoning Model Routing Audit

RP-QWEN-00 originally audited Qwen as the default edit brain. That decision is superseded by the 2026-07-18 Kimi-primary route.

The current source of truth is `src/lib/model-role-routing-contract.ts` for role capabilities and `src/lib/reasoning-model-routing-contract.ts` for exact ordered fallback transitions. Provider boundaries are registered in `src/backend/cloud/provider-gateway-contracts.ts`; provisional internal provider rates and attempt evidence are in `server/reasoning-model-cost/`.

## Existing Routing

- Kimi K3 is primary for reasoning, planning, creative judgment, QA reasoning, coding, and Remotion drafts.
- Qwen 3.7 is the first full-capability fallback.
- DeepSeek V4 Pro is the final full-capability fallback.
- Qwen2.5-VL remains the separate visual specialist and is not part of the reasoning fallback chain.
- Retained identifiers containing `main` or `tool_code` are compatibility names, not route authority.
- Route smokes verify exact order, allowed versus blocking failures, model-role capabilities, per-attempt internal cost, and absence of provider/customer-charge side effects.

## Reuse Plan

All planning, approved-snapshot, private-manifest, gateway, and future worker consumers must use the canonical route contract. A consumer must not infer primary/fallback status from a legacy identifier.

## Gaps

- Routing and rate cards remain provider-call-free contracts.
- No durable attempt repository or one-use live provider dispatcher exists in this slice.
- No owner-approved production provider activation or Secret Manager value read occurred.
- Native Qwen CNY cost cannot be normalized to USD without a versioned external FX snapshot.
- Marker Chat and Edit Reference/Edit Preference compatibility consumers still require their externally owned reconciliation handoff before Kimi-primary product readiness can be claimed.

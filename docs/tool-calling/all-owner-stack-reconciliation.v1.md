# All-Owner Stack Reconciliation v1

## Purpose

The all-owner stack reconciliation layer keeps the Reeditpro tool-calling brain aware of every owner lane, not only launch/core tools. It combines live registry/tool-calling metadata with repo-local owner evidence and unmerged-owner evidence signals so future milestones know which tools are first-class, studied, installed/proven, blocked, pending expansion, or covered by owner work that must not be duplicated.

## Sources

- First-class runtime identity comes only from `server/tool-registry`.
- Tool-calling coverage comes from explicit study cards, capability cards, adapter contracts, safe command intent policies, fixture definitions, controlled probes, and fixture-bound probes.
- Owner evidence comes from existing docs, workers, Docker/requirements files, migration drafts, smoke/e2e surfaces, and the unmerged-owner evidence overlay.
- Open and draft PR evidence is candidate-only and duplicate-risk evidence, never final source of truth.

## Runtime Boundary

The reconciliation matrix is diagnostics and planning metadata only. It does not execute tools, process media, dispatch workers, call providers, mutate Supabase, run SQL, create migrations, create signed URLs, mutate `package-lock.json`, or unlock beta/production.

Owner labels and lanes are not runtime ranking dimensions. Runtime selection must still use first-class `ProductionToolId` values, operation capability, input/output compatibility, ranking policy, quality gates, fallback rules, resource profile, and future telemetry.

## Duplicate Prevention

Future tool-calling milestones must run the refresh gate, unmerged-owner evidence overlay, and all-owner reconciliation before adding new registry IDs, study cards, adapters, command intents, fixtures, probes, worker-route integration, or Supabase/runtime table work. If an owner branch already covers install proof, runtime proof, Docker requirements, worker routing, or policy evidence, tool-calling should reference that work or wait for merge instead of duplicating it.

## Recommendations

The analyzer groups next steps by owner lane:

- Sound/Music/Audio and SFX/SoundSync candidates need owner install/model/provider proof before registry expansion.
- AI graphics/static/chart/model candidates need package, license, model-weight, and runtime proof before first-class promotion.
- Track A native/container tools need owner proof and must reuse existing final-render/caption/container lanes.
- Track B external fixture-bound probes should wait for controlled probe availability evidence.
- Worker/Supabase route integration should wait for tool-specific execution evidence and reuse existing runtime/table systems.

# AI Graphics External-Beta Readiness Gate

Decision: `ai_graphics_external_beta_readiness_gate_prepared_with_runtime_blocks`

This gate is the product-facing external-beta checkpoint for the 21 AI graphics tools. It does not replace the internal evidence chain. It joins the current install, production mapping, ranking, runtime-proof, and tool-call readiness evidence into one answer: what would still block real external users from calling these tools.

## Current State

- Tools covered: `21`
- Product-facing capabilities covered: `12`
- Installed for planned surface: `21`
- Production mapped tools: `21`
- GPU-targeted heavy/model tools: `8`
- Heavy/model tools incorrectly targeting CPU: `0`
- External-beta-ready now: `0`
- External-beta blocked now: `21`
- Production-ready now: `0`

## Evidence Separation

- Default evidence keeps `0` of `21` tools external-beta ready.
- A complete future evidence packet can make `21` of `21` tools external-beta ready with provided evidence, but that still does not mark tools ready now.
- Current runtime, worker, route, provider/model, browser/WebGL/canvas, GPU/model, public artifact, signed URL, internal beta, external beta, and production gates remain false.

## External-Beta Evidence Packet

The readiness gate can consume `--external-beta-evidence-packet` from `ai-graphics:external-beta-evidence-packet:validate`. That packet accepts only private/backend/owner evidence refs for internal runtime soak, external QA, cost/concurrency/privacy/rollback, incident response, and external-beta owner approval. Public URLs, signed URL refs, public artifact refs, and raw HTTP refs are rejected before the readiness gate can count a tool as an external-beta candidate with provided evidence.

The readiness gate can also consume `--external-beta-evidence-admission-bundle` from `ai-graphics:external-beta-evidence-admission-bundle` and `--external-beta-worker-dispatch-smoke-proof` from `ai-graphics:external-beta-worker-dispatch-smoke-proof`. The admission bundle joins all-21 technical proof with private/backend external-beta evidence refs. The dispatch-smoke proof accepts the queue-to-worker handoff shape only when all 21 in-memory worker leases are created and released with no live worker dispatch, no tool execution, no GPU startup, and no public artifacts.

## Required External-Beta Gates

- All 21 tools are properly installed for the planned ReeditPro surface.
- All 21 tools map to production tool IDs with no duplicate AI graphics mappings.
- Internal beta technical evidence is accepted for all 21 tools.
- Internal beta runtime soak is accepted with real worker/tool-call evidence.
- External-beta worker dispatch smoke proof is accepted without tool execution.
- External-beta QA is accepted with rollback-ready evidence.
- Cost, concurrency, privacy, rollback, and incident-response gates are accepted.
- External-beta owner approval is granted after runtime soak.

## GPU Policy

The eight heavy/model tools target native NVIDIA L4 GPU runtimes. GPU runtime is on-demand only, starts only for an approved future worker or tool call, uses ephemeral proof/runtime containers, and does not allow CPU fallback for heavy/model paths.

## Result

The external-beta gate is prepared, but launch remains blocked. The next real milestone is to collect native runtime proof, model-manifest proof, internal runtime soak, external QA, cost/concurrency/privacy/rollback evidence, incident-response evidence, and owner approval without weakening the current tool execution boundary.

# QWEN Transport Dependency Contract

Packet: `RP-EXTERNAL-BETA-QWEN-TRANSPORT-DEPENDENCY-ENABLEMENT-CURRENT-IMPORT-1`

Decision: `completed_current_base_qwen_transport_dependency_enablement_contract_preflight_required`

Execution: `completed_fail_closed_transport_dependency_contract_no_runtime_invocation`

## Required Dependency Surfaces

| Dependency | Status in this packet |
| --- | --- |
| service-role lease and claim dependency | `contract_recorded_enabled_false` |
| idempotency/runtime message dependency | `contract_recorded_enabled_false` |
| approved snapshot handoff dependency | `contract_recorded_enabled_false` |
| QWEN dispatch adapter dependency | `contract_recorded_enabled_false` |
| private invoke envelope dependency | `contract_recorded_enabled_false` |
| private invoke transport dependency | `contract_recorded_enabled_false` |
| response classification dependency | `contract_recorded_enabled_false` |
| QA/audit/cost/credit dependency | `contract_recorded_enabled_false` |
| cleanup/rollback dependency | `contract_recorded_enabled_false` |
| beta/production lock dependency | `contract_recorded_enabled_false` |

## Future Injected Boundaries

The only approved future transport seam names are:

- `resolveServiceUrl`
- `resolveAudience`
- `fetchIdentityToken`
- `sendRequest`

These names are recorded as future dependency boundaries only. The packet does not resolve a Cloud Run URL, does not resolve an audience, does not fetch an identity token, and does not send a request.

## Current Runtime Posture

- Dependencies enabled now: `false`
- Ready for real worker dispatch: `false`
- Cloud Run service discovery after token probe: `false`
- Cloud Run invocation: `false`
- service URL resolved now: `false`
- audience resolved now: `false`
- identity token fetch: `false`
- request sent: `false`
- QWEN2.5-VL execution: `false`
- worker execution: `false`
- worker dispatch: `false`
- generated asset creation: `false`
- Supabase mutation: `false`
- SQL execution: `false`
- credit mutation: `false`
- production unlock: `false`

Next prompt: `RP-EXTERNAL-BETA-QWEN-TRANSPORT-DEPENDENCY-PREFLIGHT-CURRENT-1`.

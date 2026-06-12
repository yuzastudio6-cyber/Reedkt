# Capability Routing Fields

Status: `ready_for_owner_review`.

Capability routing fields are planning contract fields only. They do not route live work.

## Required Routing Fields

| Field | Purpose |
| --- | --- |
| `requestedCapabilities` | Structured capabilities requested by compiled edit intent. |
| `candidateToolRefs` | Candidate tools or routes that could satisfy the capability after future owner gates. |
| `selectedToolPlan` | Future selected plan after scoring, QA requirements, and owner review. |
| `toolReadinessRequirements` | Required package/runtime, license, provenance, safety, artifact, and QA evidence. |
| `workerExecutionGate` | Worker approval and prerequisite state; default false. |
| `toolRouteExecutionGate` | Tool and route approval state; default false. |
| `providerExecutionGate` | Provider runtime approval state; default false. |

## Required Default Gates

```json
{
  "workerExecutionApproved": false,
  "toolExecutionApproved": false,
  "routeExecutionApproved": false,
  "providerRuntimeApproved": false,
  "internalBetaApproved": false,
  "externalBetaApproved": false,
  "productionApproved": false
}
```

## Routing Constraints

The contract must preserve ReeditPro model routing policy:

- provider routing remains planning data until approved;
- Basic and Pro cannot use Veo;
- Premium can use Veo only as final fallback/rescue;
- controlled tools are preferred for exact text, charts, maps, captions, diagrams, and evidence graphics;
- candidate tools are not executable until a later explicit owner gate.

No Secret Manager payloads, raw provider responses, raw prompts, private URLs, signed URLs, public artifacts, provider calls, worker execution, tool execution, route execution, Supabase mutation, SQL execution, storage transfer, beta unlock, or production unlock were enabled.

import type { SharedAgentToolArchitectureQaGateId } from './shared-agent-tool-architecture-types'

export const sharedAgentToolArchitectureMandatoryGates: SharedAgentToolArchitectureQaGateId[] = [
  'agent_roles_defined',
  'tool_ownership_defined',
  'capability_manifest_schema',
  'agent_finding_schema',
  'edit_intent_schema',
  'approved_plan_snapshot_schema',
  'routing_policy',
  'source_of_truth_policy',
  'cross_track_handoff_template',
  'blocked_features',
]

export const sharedAgentPlanSafetyPolicy = {
  policyId: 'phase52a-agent-generated-plan-qa-policy',
  checks: [
    'Every finding must reference evidence.',
    'Every edit intent must declare risk, privacy impact, approval requirement, and runtime scope.',
    'Every candidate plan must pass Producer and QA/Safety review.',
    'Workers must receive approved plan snapshots only.',
    'Plans must fail closed on secrets, public artifacts, raw prompt execution, blocked providers, and unknown tool routes.',
  ],
} as const

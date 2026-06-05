import type { SchemaDefinition } from './shared-agent-tool-architecture-types'

export const agentFindingSchema: SchemaDefinition = {
  schemaId: 'agent_finding_v1',
  description: 'Structured finding emitted by a specialist agent before any edit intent or plan route is selected.',
  requiredFields: [
    'findingId',
    'agentId',
    'timestamp',
    'subject',
    'evidenceRefs',
    'confidence',
    'severity',
    'findingType',
    'summary',
    'recommendation',
    'uncertainty',
    'blocked',
    'blockedReason',
    'downstreamIntentCandidates',
  ],
  forbiddenFields: [
    'rawSecretValue',
    'publicArtifactUrlAsSourceOfTruth',
    'unapprovedProviderCall',
    'directToolExecutionCommand',
  ],
  policyNotes: [
    'Findings are evidence-linked and advisory.',
    'Findings cannot contain secret values, public artifact URLs as source of truth, provider execution, or direct tool commands.',
  ],
}

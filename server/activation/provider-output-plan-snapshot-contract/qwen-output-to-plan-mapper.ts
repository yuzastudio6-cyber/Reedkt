import type {
  ProviderDryRunEvidenceResult,
  SelectedIntent,
} from './provider-output-plan-snapshot-types'

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function ownerForRoute(routeLabel: string) {
  if (routeLabel.includes('caption')) return 'COORDINATOR_PRODUCER_QA' as const
  if (routeLabel.includes('chart')) return 'AI_TOOLS_CREATIVE_GRAPHICS' as const
  if (routeLabel.includes('map')) return 'MAP_GEOSPATIAL' as const
  if (routeLabel.includes('timeline')) return 'MODEL_ORCHESTRATION' as const
  return 'MODEL_ORCHESTRATION' as const
}

function intentIdForRoute(routeLabel: string, index: number) {
  return `plansnapshot1_intent_${routeLabel.replace(/[^0-9A-Za-z]+/g, '_').replace(/^_+|_+$/g, '') || index + 1}`
}

export function mapQwenOutputToSelectedIntents(qwen: ProviderDryRunEvidenceResult | undefined): SelectedIntent[] {
  if (!qwen) return []
  const output = qwen.normalizedOutput
  const summary = asString(output.candidateSummary) ||
    'Qwen produced candidate planning metadata for owner review only.'
  const routeLabels = asArray(output.toolRouteHints)
    .map(asString)
    .filter(Boolean)

  return routeLabels.map((routeLabel, index) => ({
    intentId: intentIdForRoute(routeLabel, index),
    sourceSchema: 'plan_snapshot_candidate_v1',
    sourceCaseId: qwen.caseId,
    routeLabel,
    selectedReason: `${summary} Route label retained as non-executing intent metadata.`,
    ownerRoute: ownerForRoute(routeLabel),
    executionAllowed: false,
    routeExecutionAllowed: false,
    ownerReviewRequired: true,
  }))
}

export function mapQwenOutputToPlanLimits(qwen: ProviderDryRunEvidenceResult | undefined) {
  const output = qwen?.normalizedOutput ?? {}
  const creditRiskNotes = asString(output.creditRiskNotes) || 'No credit-spend authority is granted by this candidate snapshot.'
  const requiredApprovals = asArray(output.requiredApprovals).map(asString).filter(Boolean)
  return {
    qaRequirements: [
      'Validate candidate snapshot schema before any downstream use.',
      'Confirm all provider route labels remain metadata-only.',
      'Require owner review for every selected intent before runtime handoff.',
      ...requiredApprovals.map((approval) => `Source approval carried forward: ${approval}`),
    ],
    costLimits: [
      creditRiskNotes,
      'No credits may be reserved or spent from this candidate snapshot.',
      'No provider, worker, route, rendering, media, or production costs are authorized.',
    ],
    privacyLimits: [
      'Use committed sanitized provider dry-run reports only.',
      'Do not store raw prompts, raw provider responses, provider secrets, signed URLs, DB URLs, service-role keys, or media payloads.',
      'Private gs:// artifact refs are metadata only and are not signed URL sources of truth.',
    ],
  }
}

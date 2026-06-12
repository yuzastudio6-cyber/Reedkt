import type {
  ImplementationProposalRef,
  ProviderDryRunEvidenceResult,
} from './provider-output-plan-snapshot-types'

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function riskLevelForFinding(finding: string, risks: string[]): ImplementationProposalRef['riskLevel'] {
  const text = `${finding} ${risks.join(' ')}`.toLowerCase()
  if (text.includes('high')) return 'high'
  if (text.includes('medium')) return 'medium'
  if (text.includes('low')) return 'low'
  return 'unknown'
}

export function mapDeepSeekOutputToImplementationProposalRefs(
  deepseek: ProviderDryRunEvidenceResult | undefined,
): ImplementationProposalRef[] {
  if (!deepseek) return []
  const output = deepseek.normalizedOutput
  const findings = asArray(output.findings).map(asString).filter(Boolean)
  const risks = asArray(output.risks).map(asString).filter(Boolean)
  const confidence = asNumber(output.confidence)

  return findings.map((finding, index) => ({
    proposalId: `plansnapshot1_deepseek_proposal_${index + 1}`,
    sourceSchema: 'agent_findings_v1',
    sourceCaseId: deepseek.caseId,
    finding: confidence === undefined ? finding : `${finding} Confidence: ${confidence}.`,
    riskLevel: riskLevelForFinding(finding, risks),
    ownerRoute: 'MODEL_ORCHESTRATION',
    executionAllowed: false,
    ownerReviewRequired: true,
  }))
}

export function mapDeepSeekOutputToRuntimeLimits(deepseek: ProviderDryRunEvidenceResult | undefined): string[] {
  const blockedActions = asArray(deepseek?.normalizedOutput.blockedActions).map(asString).filter(Boolean)
  return [
    'DeepSeek findings are implementation proposal references only.',
    'No DeepSeek output may execute code, tools, workers, routes, providers, media, SQL, migrations, or secret handling.',
    ...blockedActions.map((action) => `Provider dry-run blocked action carried forward: ${action}`),
  ]
}

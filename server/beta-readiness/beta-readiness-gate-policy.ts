export const betaReadinessLaunchStages = [
  'internal_dry_run',
  'bounded_tool_execution',
  'external_beta',
  'real_user_media_beta',
  'paid_production',
] as const

export type BetaReadinessLaunchStage = typeof betaReadinessLaunchStages[number]

export interface BetaReadinessGateDecision {
  stage: BetaReadinessLaunchStage
  allowed: boolean
  blockers: string[]
  evidence: string[]
}

export type BetaReadinessStageDecisions = Record<BetaReadinessLaunchStage, BetaReadinessGateDecision>

export interface EvaluateBetaReadinessGatePolicyInput {
  e2eDryRunPassed?: boolean
  safetyDocsExist?: boolean
  costDocsExist?: boolean
  boundedToolExecutionReady?: boolean
  requiredChecklistBlocked?: boolean
  productionReadinessBlocked?: boolean
  deploymentApproved?: boolean
  securityApproved?: boolean
  storageApproved?: boolean
  modelLicensesApproved?: boolean
  legalApproved?: boolean
  monitoringApproved?: boolean
  supportApproved?: boolean
  realUserMediaBetaApproved?: boolean
  privateMediaApproval?: boolean
  artifactPrivacyEvidenceReady?: boolean
  paidProductionApproved?: boolean
  productionDeploymentApproved?: boolean
  billingLedgerPersistenceApproved?: boolean
  costControlsApproved?: boolean
  observabilityApproved?: boolean
  incidentRunbookApproved?: boolean
  finalDeliveryShareApproved?: boolean
  hardLaunchBlockersPresent?: boolean
}

export function evaluateBetaReadinessGatePolicy(
  input: EvaluateBetaReadinessGatePolicyInput = {},
): BetaReadinessStageDecisions {
  const internalDryRunBlockers = [
    ...(input.e2eDryRunPassed === false ? ['E2E dry-run evidence is missing.'] : []),
    ...(input.safetyDocsExist === false ? ['Safety documentation is missing.'] : []),
    ...(input.costDocsExist === false ? ['Cost-control documentation is missing.'] : []),
  ]
  const internalDryRun = decision(
    'internal_dry_run',
    internalDryRunBlockers,
    [
      ...(input.e2eDryRunPassed === false ? [] : ['E2E dry-run evidence is present.']),
      ...(input.safetyDocsExist === false ? [] : ['Safety documentation is present.']),
      ...(input.costDocsExist === false ? [] : ['Cost-control documentation is present.']),
    ],
  )

  const boundedToolExecutionBlockers = [
    ...prefixPrerequisiteBlockers('Internal dry-run gate', internalDryRun),
    ...(input.boundedToolExecutionReady === false ? ['Bounded tool execution evidence is missing.'] : []),
  ]
  const boundedToolExecution = decision(
    'bounded_tool_execution',
    boundedToolExecutionBlockers,
    boundedToolExecutionBlockers.length === 0 ? ['Bounded tool execution remains constrained to approved backend gates.'] : [],
  )

  const externalBetaBlockers = [
    ...prefixPrerequisiteBlockers('Bounded tool execution gate', boundedToolExecution),
    ...(input.requiredChecklistBlocked ? ['Required external-beta checklist items remain blocked.'] : []),
    ...(input.productionReadinessBlocked !== false ? ['Production readiness summary remains blocked.'] : []),
    ...(input.deploymentApproved ? [] : ['Human-run deployment approval is missing.']),
    ...(input.securityApproved ? [] : ['Security approval is missing.']),
    ...(input.storageApproved ? [] : ['Storage/privacy approval is missing.']),
    ...(input.modelLicensesApproved ? [] : ['Model weight and license approval is missing.']),
    ...(input.legalApproved ? [] : ['Legal approval is missing.']),
    ...(input.monitoringApproved ? [] : ['Monitoring/observability approval is missing.']),
    ...(input.supportApproved ? [] : ['Support/incident-response approval is missing.']),
  ]
  const externalBeta = decision(
    'external_beta',
    externalBetaBlockers,
    externalBetaBlockers.length === 0
      ? ['External beta launch evidence and owner approvals are complete for the supplied scope.']
      : [],
  )

  const realUserMediaBetaBlockers = [
    ...prefixPrerequisiteBlockers('External beta gate', externalBeta),
    ...(input.realUserMediaBetaApproved ? [] : ['Real user media beta approval is missing.']),
    ...(input.privateMediaApproval ? [] : ['Private/user-media approval is missing.']),
    ...(input.artifactPrivacyEvidenceReady ? [] : ['Private artifact/privacy evidence is missing.']),
  ]
  const realUserMediaBeta = decision(
    'real_user_media_beta',
    realUserMediaBetaBlockers,
    realUserMediaBetaBlockers.length === 0
      ? ['Real-user-media beta evidence and privacy approvals are complete for the supplied scope.']
      : [],
  )

  const paidProductionBlockers = [
    ...prefixPrerequisiteBlockers('Real-user-media beta gate', realUserMediaBeta),
    ...(input.paidProductionApproved ? [] : ['Paid production approval is missing.']),
    ...(input.productionDeploymentApproved ? [] : ['Production deployment approval is missing.']),
    ...(input.billingLedgerPersistenceApproved ? [] : ['Billing ledger persistence approval is missing.']),
    ...(input.costControlsApproved ? [] : ['Cost-control approval is missing.']),
    ...(input.observabilityApproved ? [] : ['Production observability approval is missing.']),
    ...(input.incidentRunbookApproved ? [] : ['Incident runbook approval is missing.']),
    ...(input.finalDeliveryShareApproved ? [] : ['Final delivery/share approval is missing.']),
    ...(input.hardLaunchBlockersPresent ? ['Hard launch blockers remain present.'] : []),
  ]
  const paidProduction = decision(
    'paid_production',
    paidProductionBlockers,
    paidProductionBlockers.length === 0
      ? ['Paid production launch evidence, billing persistence, cost controls, and operations approvals are complete for the supplied scope.']
      : [],
  )

  return {
    internal_dry_run: internalDryRun,
    bounded_tool_execution: boundedToolExecution,
    external_beta: externalBeta,
    real_user_media_beta: realUserMediaBeta,
    paid_production: paidProduction,
  }
}

function decision(
  stage: BetaReadinessLaunchStage,
  blockers: string[],
  evidence: string[],
): BetaReadinessGateDecision {
  return {
    stage,
    allowed: blockers.length === 0,
    blockers: uniqueStrings(blockers),
    evidence: uniqueStrings(evidence),
  }
}

function prefixPrerequisiteBlockers(
  label: string,
  prerequisite: BetaReadinessGateDecision,
): string[] {
  if (prerequisite.allowed) return []
  return prerequisite.blockers.map((blocker) => `${label}: ${blocker}`)
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)]
}

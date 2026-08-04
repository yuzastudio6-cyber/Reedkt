import type { BetaLaunchStage, BetaLaunchStageGate, BetaReadinessChecklistItem } from './beta-readiness-types'

export interface BetaLaunchGateEvidence {
  e2eDryRunPassed?: boolean
  safetyDocsExist?: boolean
  costDocsExist?: boolean
  deploymentApproved?: boolean
  securityApproved?: boolean
  storageApproved?: boolean
  modelLicensesApproved?: boolean
  productionReadinessBlocked?: boolean
  approvedPlanSnapshotGatePresent?: boolean
  creditEstimateGatePresent?: boolean
  creditReservationGatePresent?: boolean
  idempotencyGatePresent?: boolean
  rawPromptStorageBlocked?: boolean
  secretScrubbingEnabled?: boolean
  signedUrlSourceTruthBlocked?: boolean
  licenseModelWeightReviewApproved?: boolean
  privateMediaApproval?: boolean
  artifactPrivacyEvidence?: boolean
  productionDeploymentApproved?: boolean
  billingLedgerPersistenceApproved?: boolean
  costControlsApproved?: boolean
  incidentRunbookApproved?: boolean
  observabilityApproved?: boolean
  legalApproval?: boolean
  checklist?: BetaReadinessChecklistItem[]
}

type GateRequirement = {
  key: keyof BetaLaunchGateEvidence
  blocker: string
}

const hardSafetyRequirements: GateRequirement[] = [
  { key: 'approvedPlanSnapshotGatePresent', blocker: 'Approved plan snapshot gate is missing.' },
  { key: 'creditEstimateGatePresent', blocker: 'Credit estimate gate is missing.' },
  { key: 'creditReservationGatePresent', blocker: 'Credit reservation gate is missing.' },
  { key: 'idempotencyGatePresent', blocker: 'Idempotency gate is missing.' },
  { key: 'rawPromptStorageBlocked', blocker: 'Raw prompt storage blocker is missing.' },
  { key: 'secretScrubbingEnabled', blocker: 'Secret scrubbing evidence is missing.' },
  { key: 'signedUrlSourceTruthBlocked', blocker: 'Signed URLs must be blocked as source truth.' },
  { key: 'licenseModelWeightReviewApproved', blocker: 'License/model-weight review approval is missing.' },
]

const externalBetaRequirements: GateRequirement[] = [
  { key: 'e2eDryRunPassed', blocker: 'Dry-run E2E evidence is missing.' },
  { key: 'safetyDocsExist', blocker: 'Safety documentation evidence is missing.' },
  { key: 'costDocsExist', blocker: 'Cost-control documentation evidence is missing.' },
  { key: 'deploymentApproved', blocker: 'Deployment approval is missing.' },
  { key: 'securityApproved', blocker: 'Security approval is missing.' },
  { key: 'storageApproved', blocker: 'Storage/privacy approval is missing.' },
  { key: 'modelLicensesApproved', blocker: 'Model weight and license approval is missing.' },
]

const realUserMediaRequirements: GateRequirement[] = [
  { key: 'privateMediaApproval', blocker: 'Private/user media approval is missing.' },
  { key: 'artifactPrivacyEvidence', blocker: 'Artifact privacy and retention evidence is missing.' },
]

const paidProductionRequirements: GateRequirement[] = [
  { key: 'productionDeploymentApproved', blocker: 'Production deployment approval is missing.' },
  { key: 'billingLedgerPersistenceApproved', blocker: 'Billing/ledger persistence approval is missing.' },
  { key: 'costControlsApproved', blocker: 'Production cost controls approval is missing.' },
  { key: 'incidentRunbookApproved', blocker: 'Incident runbook approval is missing.' },
  { key: 'observabilityApproved', blocker: 'Observability approval is missing.' },
  { key: 'legalApproval', blocker: 'Legal/commercial launch approval is missing.' },
]

function missingRequirements(evidence: BetaLaunchGateEvidence, requirements: GateRequirement[]) {
  return requirements
    .filter((requirement) => evidence[requirement.key] !== true)
    .map((requirement) => requirement.blocker)
}

function requiredChecklistBlockers(checklist: BetaReadinessChecklistItem[] | undefined) {
  return (checklist ?? [])
    .filter((item) => item.requiredForExternalBeta && item.status === 'blocked')
    .map((item) => `${item.label} blocks external beta.`)
}

function warningChecklistItems(checklist: BetaReadinessChecklistItem[] | undefined) {
  return (checklist ?? [])
    .filter((item) => item.status === 'warning')
    .map((item) => `${item.label} needs launch review.`)
}

function gate(stage: BetaLaunchStage, blockers: string[], warnings: string[] = []): BetaLaunchStageGate {
  return {
    stage,
    allowed: blockers.length === 0,
    blockers: [...new Set(blockers)],
    warnings: [...new Set(warnings)],
  }
}

export function evaluateBetaLaunchStageGates(evidence: BetaLaunchGateEvidence = {}): BetaLaunchStageGate[] {
  const internalDryRunBlockers = missingRequirements(evidence, [
    { key: 'e2eDryRunPassed', blocker: 'Dry-run E2E evidence is missing.' },
    { key: 'safetyDocsExist', blocker: 'Safety documentation evidence is missing.' },
    { key: 'costDocsExist', blocker: 'Cost-control documentation evidence is missing.' },
  ])
  const hardSafetyBlockers = missingRequirements(evidence, hardSafetyRequirements)
  const boundedToolExecutionBlockers = [
    ...internalDryRunBlockers,
    ...hardSafetyBlockers,
  ]
  const externalBetaBlockers = [
    ...boundedToolExecutionBlockers,
    ...missingRequirements(evidence, externalBetaRequirements),
    ...requiredChecklistBlockers(evidence.checklist),
    ...(evidence.productionReadinessBlocked ? ['Production readiness summary remains blocked.'] : []),
  ]
  const realUserMediaBlockers = [
    ...externalBetaBlockers,
    ...missingRequirements(evidence, realUserMediaRequirements),
  ]
  const paidProductionBlockers = [
    ...realUserMediaBlockers,
    ...missingRequirements(evidence, paidProductionRequirements),
  ]
  const checklistWarnings = warningChecklistItems(evidence.checklist)

  return [
    gate('internal_dry_run', internalDryRunBlockers, checklistWarnings),
    gate('bounded_tool_execution', boundedToolExecutionBlockers, checklistWarnings),
    gate('external_beta', externalBetaBlockers, checklistWarnings),
    gate('real_user_media_beta', realUserMediaBlockers, checklistWarnings),
    gate('paid_production', paidProductionBlockers, checklistWarnings),
  ]
}

export function findBetaLaunchStageGate(gates: BetaLaunchStageGate[], stage: BetaLaunchStage): BetaLaunchStageGate {
  const found = gates.find((candidate) => candidate.stage === stage)
  if (!found) {
    throw new Error(`Missing beta launch stage gate: ${stage}`)
  }
  return found
}

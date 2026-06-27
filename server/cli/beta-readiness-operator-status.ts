import { buildBetaPlatformEvidenceManifest } from '../beta-readiness/platform-evidence-manifest'
import { buildToolBetaExecutionReadinessReport } from '../beta-readiness/tool-beta-execution-readiness'
import {
  buildBetaPlatformStagingEvidencePreflight,
  type BetaPlatformStagingEvidencePreflightReport,
} from './beta-platform-staging-evidence-preflight'
import {
  buildBetaToolsCoreRealCheckEvidencePreflight,
  type BetaToolsCoreRealCheckEvidencePreflightReport,
} from './beta-tools-core-real-check-evidence-preflight'
import type { BetaPlatformStagingEvidenceProbeEnv } from './beta-platform-staging-evidence-probe'
import type { BetaToolsCoreRealCheckEvidenceEnv } from './beta-tools-core-real-check-evidence'

export interface BetaReadinessOperatorStatusEnv extends
  BetaPlatformStagingEvidenceProbeEnv,
  BetaToolsCoreRealCheckEvidenceEnv {}

export interface BetaReadinessOperatorStatusReport {
  ok: boolean
  operatorInputsReady: boolean
  toolEvidenceReady: boolean
  platformEvidenceReady: boolean
  currentGate: {
    totalTools: number
    ownerCoverageToolCount: number
    readinessSpecToolCount: number
    blockers: number
    platformBlockers: number
    productReadyLocalOssCount: number
    externalBetaToolExecutionAllowed: boolean
    productionToolExecutionAllowed: boolean
    blockerPolicy: string
  }
  toolEvidence: {
    command: 'npm run beta:tools:core-real-check-evidence'
    preflightCommand: 'npm run beta:tools:core-real-check-evidence-preflight'
    readyToRunCli: boolean
    readyToRecordAcceptedEvidence: boolean
    missingConfiguration: string[]
    confirmationGaps: string[]
    invalidToolIds: string[]
    secretLikeInputPaths: string[]
  }
  platformEvidence: {
    command: 'npm run beta:platform:staging-evidence-probe'
    preflightCommand: 'npm run beta:platform:staging-evidence-preflight'
    readyToRunCollector: boolean
    readyToRecordEvidencePacket: boolean
    missingConfiguration: string[]
    missingOwnerApprovals: string[]
    missingAttestations: string[]
    secretLikeInputPaths: string[]
  }
  manifest: {
    requirements: number
    remainingRequiredEvidence: number
    localProofCommands: string[]
    blockersAreEvidenceGaps: boolean
  }
  nextActions: string[]
  warnings: string[]
}

export function buildBetaReadinessOperatorStatus(
  env: BetaReadinessOperatorStatusEnv,
): BetaReadinessOperatorStatusReport {
  const toolEvidence = buildBetaToolsCoreRealCheckEvidencePreflight(env)
  const platformEvidence = buildBetaPlatformStagingEvidencePreflight(env)
  const readiness = buildToolBetaExecutionReadinessReport()
  const manifest = buildBetaPlatformEvidenceManifest()
  const toolEvidenceReady = toolEvidence.readyToRecordAcceptedEvidence
  const platformEvidenceReady = platformEvidence.readyToRecordEvidencePacket
  const operatorInputsReady = toolEvidenceReady && platformEvidenceReady

  return {
    ok: operatorInputsReady,
    operatorInputsReady,
    toolEvidenceReady,
    platformEvidenceReady,
    currentGate: {
      totalTools: readiness.totalTools,
      ownerCoverageToolCount: readiness.ownerCoverageToolCount,
      readinessSpecToolCount: readiness.readinessSpecToolCount,
      blockers: readiness.blockers.length,
      platformBlockers: readiness.platformBlockers.length,
      productReadyLocalOssCount: readiness.productReadyLocalOssCount,
      externalBetaToolExecutionAllowed: readiness.externalBetaToolExecutionAllowed,
      productionToolExecutionAllowed: readiness.productionToolExecutionAllowed,
      blockerPolicy: readiness.blockerPolicy,
    },
    toolEvidence: toolEvidenceSummary(toolEvidence),
    platformEvidence: platformEvidenceSummary(platformEvidence),
    manifest: {
      requirements: manifest.requirements.length,
      remainingRequiredEvidence: manifest.remainingRequiredEvidence.length,
      localProofCommands: manifest.localProofCommands,
      blockersAreEvidenceGaps: manifest.policy.blockersAreEvidenceGaps,
    },
    nextActions: buildNextActions(toolEvidence, platformEvidence),
    warnings: [
      'This operator status is no-network and does not call the deployed backend, run tool checks, write evidence, enable external beta, or enable production.',
      'External beta and production remain disabled until accepted tool evidence, deployed platform evidence, and launch approvals are complete.',
      'Bearer tokens and service-role secrets are never printed; the report uses preflight summaries only.',
    ],
  }
}

function toolEvidenceSummary(
  report: BetaToolsCoreRealCheckEvidencePreflightReport,
): BetaReadinessOperatorStatusReport['toolEvidence'] {
  return {
    command: 'npm run beta:tools:core-real-check-evidence',
    preflightCommand: 'npm run beta:tools:core-real-check-evidence-preflight',
    readyToRunCli: report.readyToRunCli,
    readyToRecordAcceptedEvidence: report.readyToRecordAcceptedEvidence,
    missingConfiguration: report.missingConfiguration,
    confirmationGaps: report.confirmationGaps,
    invalidToolIds: report.invalidToolIds,
    secretLikeInputPaths: report.secretLikeInputPaths,
  }
}

function platformEvidenceSummary(
  report: BetaPlatformStagingEvidencePreflightReport,
): BetaReadinessOperatorStatusReport['platformEvidence'] {
  return {
    command: 'npm run beta:platform:staging-evidence-probe',
    preflightCommand: 'npm run beta:platform:staging-evidence-preflight',
    readyToRunCollector: report.readyToRunCollector,
    readyToRecordEvidencePacket: report.readyToRecordEvidencePacket,
    missingConfiguration: report.missingConfiguration,
    missingOwnerApprovals: report.missingOwnerApprovals,
    missingAttestations: report.missingAttestations,
    secretLikeInputPaths: report.secretLikeInputPaths,
  }
}

function buildNextActions(
  toolEvidence: BetaToolsCoreRealCheckEvidencePreflightReport,
  platformEvidence: BetaPlatformStagingEvidencePreflightReport,
): string[] {
  const actions: string[] = []

  if (!toolEvidence.readyToRecordAcceptedEvidence) {
    actions.push('Set the missing REEDITPRO_BETA_TOOLS_* values, then rerun npm run beta:tools:core-real-check-evidence-preflight.')
  } else {
    actions.push('Run npm run beta:tools:core-real-check-evidence against deployed staging to record bounded per-tool accepted evidence.')
  }

  if (!platformEvidence.readyToRecordEvidencePacket) {
    actions.push('Set the missing REEDITPRO_BETA_PLATFORM_* values, owner approvals, and attestations, then rerun npm run beta:platform:staging-evidence-preflight.')
  } else {
    actions.push('Run npm run beta:platform:staging-evidence-probe against deployed staging to record platform evidence.')
  }

  actions.push('After both evidence packets exist, rerun npm run smoke:tool-beta-execution-readiness and the beta readiness API smoke from the final source SHA.')
  return actions
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = buildBetaReadinessOperatorStatus(process.env)
  console.log(JSON.stringify(report, null, 2))
  if (!report.operatorInputsReady) {
    process.exitCode = 1
  }
}

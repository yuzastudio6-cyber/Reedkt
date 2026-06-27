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
import {
  buildBetaReadinessLaunchApprovalEvidencePreflight,
  type BetaReadinessLaunchApprovalEvidencePreflightReport,
} from './beta-readiness-launch-approval-evidence-preflight'
import type { BetaPlatformStagingEvidenceProbeEnv } from './beta-platform-staging-evidence-probe'
import type { BetaToolsCoreRealCheckEvidenceEnv } from './beta-tools-core-real-check-evidence'
import type { BetaReadinessLaunchApprovalEvidenceEnv } from './beta-readiness-launch-approval-evidence'

export interface BetaReadinessOperatorStatusEnv extends
  BetaPlatformStagingEvidenceProbeEnv,
  BetaToolsCoreRealCheckEvidenceEnv,
  BetaReadinessLaunchApprovalEvidenceEnv {}

export interface BetaReadinessOperatorStatusReport {
  ok: boolean
  operatorInputsReady: boolean
  toolEvidenceReady: boolean
  platformEvidenceReady: boolean
  launchApprovalEvidenceReady: boolean
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
    safeBlockerReductionAllowed: boolean
    blockedActionScope: string[]
    allowedForwardProgressScopes: string[]
  }
  toolEvidence: {
    previewCommand: 'npm run beta:tools:core-real-check-preview'
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
  launchApprovalEvidence: {
    command: 'npm run beta:readiness:launch-approval-evidence'
    preflightCommand: 'npm run beta:readiness:launch-approval-evidence-preflight'
    readyToRecordLaunchApprovalEvidence: boolean
    missingConfiguration: string[]
    missingOwnerApprovals: string[]
    missingEvidenceNotes: string[]
    confirmationGaps: string[]
    rejectedScope: string[]
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
  const launchApprovalEvidence = buildBetaReadinessLaunchApprovalEvidencePreflight(env)
  const readiness = buildToolBetaExecutionReadinessReport()
  const manifest = buildBetaPlatformEvidenceManifest()
  const toolEvidenceReady = toolEvidence.readyToRecordAcceptedEvidence
  const platformEvidenceReady = platformEvidence.readyToRecordEvidencePacket
  const launchApprovalEvidenceReady = launchApprovalEvidence.readyToRecordLaunchApprovalEvidence
  const operatorInputsReady = toolEvidenceReady && platformEvidenceReady && launchApprovalEvidenceReady

  return {
    ok: operatorInputsReady,
    operatorInputsReady,
    toolEvidenceReady,
    platformEvidenceReady,
    launchApprovalEvidenceReady,
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
      safeBlockerReductionAllowed: readiness.safeBlockerReductionAllowed,
      blockedActionScope: readiness.blockedActionScope,
      allowedForwardProgressScopes: buildAllowedForwardProgressScopes(readiness.safeBlockerReductionAllowed),
    },
    toolEvidence: toolEvidenceSummary(toolEvidence),
    platformEvidence: platformEvidenceSummary(platformEvidence),
    launchApprovalEvidence: launchApprovalEvidenceSummary(launchApprovalEvidence),
    manifest: {
      requirements: manifest.requirements.length,
      remainingRequiredEvidence: manifest.remainingRequiredEvidence.length,
      localProofCommands: manifest.localProofCommands,
      blockersAreEvidenceGaps: manifest.policy.blockersAreEvidenceGaps,
    },
    nextActions: buildNextActions(toolEvidence, platformEvidence, launchApprovalEvidence),
    warnings: [
      'This operator status is no-network and does not call the deployed backend, run tool checks, write evidence, enable external beta, or enable production.',
      'External beta and production remain disabled until accepted tool evidence, deployed platform evidence, and launch approvals are complete.',
      'Blocked beta/production actions do not block bounded source reviews, local proofs, diagnostics, QA packets, deployment preflights, or owner approval evidence that retire named blockers.',
      'Bearer tokens and service-role secrets are never printed; the report uses preflight summaries only.',
    ],
  }
}

function buildAllowedForwardProgressScopes(safeBlockerReductionAllowed: boolean): string[] {
  if (!safeBlockerReductionAllowed) return []

  return [
    'source_review',
    'local_dependency_install_proof',
    'bounded_command_import_container_proof',
    'safe_blocker_reduction_preview',
    'diagnostics_and_qa_packets',
    'deployment_preflight_and_platform_evidence_collection',
    'owner_approval_packet_collection',
    'rollback_monitoring_support_planning',
  ]
}

function toolEvidenceSummary(
  report: BetaToolsCoreRealCheckEvidencePreflightReport,
): BetaReadinessOperatorStatusReport['toolEvidence'] {
  return {
    previewCommand: 'npm run beta:tools:core-real-check-preview',
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

function launchApprovalEvidenceSummary(
  report: BetaReadinessLaunchApprovalEvidencePreflightReport,
): BetaReadinessOperatorStatusReport['launchApprovalEvidence'] {
  return {
    command: 'npm run beta:readiness:launch-approval-evidence',
    preflightCommand: 'npm run beta:readiness:launch-approval-evidence-preflight',
    readyToRecordLaunchApprovalEvidence: report.readyToRecordLaunchApprovalEvidence,
    missingConfiguration: report.missingConfiguration,
    missingOwnerApprovals: report.missingOwnerApprovals,
    missingEvidenceNotes: report.missingEvidenceNotes,
    confirmationGaps: report.confirmationGaps,
    rejectedScope: report.rejectedScope,
    secretLikeInputPaths: report.secretLikeInputPaths,
  }
}

function buildNextActions(
  toolEvidence: BetaToolsCoreRealCheckEvidencePreflightReport,
  platformEvidence: BetaPlatformStagingEvidencePreflightReport,
  launchApprovalEvidence: BetaReadinessLaunchApprovalEvidencePreflightReport,
): string[] {
  const actions: string[] = []

  if (!toolEvidence.readyToRecordAcceptedEvidence) {
    actions.push('Run npm run beta:tools:core-real-check-preview with REEDITPRO_BETA_TOOLS_PREVIEW_* values to collect a local no-write blocker-reduction preview, then set the missing REEDITPRO_BETA_TOOLS_* values and rerun npm run beta:tools:core-real-check-evidence-preflight.')
  } else {
    actions.push('Run npm run beta:tools:core-real-check-preview locally first, then run npm run beta:tools:core-real-check-evidence against deployed staging to record bounded per-tool accepted evidence.')
  }

  if (!platformEvidence.readyToRecordEvidencePacket) {
    actions.push('Set the missing REEDITPRO_BETA_PLATFORM_* values, owner approvals, and attestations, then rerun npm run beta:platform:staging-evidence-preflight.')
  } else {
    actions.push('Run npm run beta:platform:staging-evidence-probe against deployed staging to record platform evidence.')
  }

  if (!launchApprovalEvidence.readyToRecordLaunchApprovalEvidence) {
    actions.push('Set the missing REEDITPRO_BETA_LAUNCH_* values, owner approvals, evidence notes, and external-beta confirmation, then rerun npm run beta:readiness:launch-approval-evidence-preflight.')
  } else {
    actions.push('Run npm run beta:readiness:launch-approval-evidence against deployed staging to record top-level external-beta launch approval evidence.')
  }

  actions.push('After tool, platform, and launch approval evidence packets exist, rerun npm run beta:readiness:operator-status-api, smoke:tool-beta-execution-readiness, and the beta readiness API smoke from the final source SHA.')
  actions.push('After deployed operator status reports external beta ready, use npm run beta:readiness:scope-approval-evidence-preflight with REEDITPRO_BETA_SCOPE_APPROVAL_MODE=real_user_media_beta; after real-user-media beta is ready, repeat with REEDITPRO_BETA_SCOPE_APPROVAL_MODE=paid_production.')
  return actions
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = buildBetaReadinessOperatorStatus(process.env)
  console.log(JSON.stringify(report, null, 2))
  if (!report.operatorInputsReady) {
    process.exitCode = 1
  }
}

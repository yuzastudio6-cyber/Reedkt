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
    blockerForwardProgressPolicy: {
      intentionalBlanketBlocksAllowed: false
      blockerScope: string
      safeForwardProgressRequired: true
      nextSafeActionRequiredForBlockers: true
    }
    safeBlockerReductionAllowed: boolean
    blockedActionScope: string[]
    allowedForwardProgressScopes: string[]
  }
  toolEvidence: {
    previewCommand: 'npm run beta:tools:core-real-check-preview'
    hydratedPreviewCommand: 'npm run beta:tools:core-real-check-preview:hydrated'
    hydrationSetupCommand: 'npm run tools:readiness:install-core-python'
    localAcceptedEvidenceBundleCommand: 'npm run beta:tools:local-accepted-evidence-bundle'
    localAcceptedEvidenceCollectorCommand: 'npm run beta:tools:local-accepted-evidence-collector'
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
      blockerForwardProgressPolicy: readiness.blockerForwardProgressPolicy,
      safeBlockerReductionAllowed: readiness.safeBlockerReductionAllowed,
      blockedActionScope: readiness.blockedActionScope,
      allowedForwardProgressScopes: readiness.safeBlockerReductionAllowed
        ? readiness.allowedForwardProgressScopes
        : [],
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

function toolEvidenceSummary(
  report: BetaToolsCoreRealCheckEvidencePreflightReport,
): BetaReadinessOperatorStatusReport['toolEvidence'] {
  return {
    previewCommand: 'npm run beta:tools:core-real-check-preview',
    hydratedPreviewCommand: 'npm run beta:tools:core-real-check-preview:hydrated',
    hydrationSetupCommand: 'npm run tools:readiness:install-core-python',
    localAcceptedEvidenceBundleCommand: 'npm run beta:tools:local-accepted-evidence-bundle',
    localAcceptedEvidenceCollectorCommand: 'npm run beta:tools:local-accepted-evidence-collector',
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
    actions.push('Run npm run beta:tools:core-real-check-preview with REEDITPRO_BETA_TOOLS_PREVIEW_* values to collect a local no-write blocker-reduction preview; for Python-backed core tools, first run npm run tools:readiness:install-core-python, then npm run beta:tools:core-real-check-preview:hydrated. After preview passes, set the missing REEDITPRO_BETA_TOOLS_* values and rerun npm run beta:tools:core-real-check-evidence-preflight.')
    actions.push('For the remaining libass subtitle-filter warning, run npm run beta:tools:libass-container-proof-preflight against an approved render/tool-readiness image; this can reduce libass execution evidence without claiming product-ready caption burn-in.')
    actions.push('After libass filter proof passes, run npm run beta:tools:libass-synthetic-burnin-qa-preflight to collect synthetic-only caption burn-in/font QA evidence before product-ready local OSS acceptance is recorded.')
    actions.push('After core hydrated preview and libass synthetic QA pass, run npm run beta:tools:local-accepted-evidence-bundle to confirm the combined local accepted tool set and remaining staging gates before recording deployed evidence.')
    actions.push('After the local accepted evidence bundle passes, run npm run beta:tools:local-accepted-evidence-collector against deployed staging to record core and libass evidence and verify operator-status readback.')
    actions.push('After synthetic libass QA passes, run npm run beta:tools:libass-synthetic-burnin-qa-evidence-preflight, then npm run beta:tools:libass-synthetic-burnin-qa-evidence against deployed staging to record accepted libass evidence.')
  } else {
    actions.push('Run npm run beta:tools:core-real-check-preview locally first; use npm run beta:tools:core-real-check-preview:hydrated after npm run tools:readiness:install-core-python for Python-backed core tools. Then run npm run beta:tools:local-accepted-evidence-bundle before running npm run beta:tools:local-accepted-evidence-collector against deployed staging. If recording individually instead of as a bundle, run npm run beta:tools:core-real-check-evidence for core tools and npm run beta:tools:libass-synthetic-burnin-qa-evidence for libass.')
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

  actions.push('Before staging API deploy, a higher-privilege GCP owner must apply the exact staging IAM/runtime prerequisites directly: Artifact Registry get/upload access for the deployer on us-central1/reeditpro-staging-workers, creation or selection of reeditpro-api-staging@reeditpro.iam.gserviceaccount.com, deployer iam.serviceAccounts.actAs on that runtime account, deployer describe access for fixed staging API Secret Manager entries, and runtime secret accessor on only those fixed entries. Cloud Run deploy permissions are still proven by read-only audit run 28321041675, but the guarded owner-remediation workflow beta-readiness-api-staging-owner-remediation.yml still proves through source-truth run 28310853041 that the deployer cannot self-remediate the remaining owner-side permissions.')
  actions.push('Use docs/beta-readiness/api-staging-input-discovery/2026-06-28-api-staging-owner-remediation-command-packet.md as the current higher-privilege owner command packet; it intentionally omits Cloud Run role mutation because run 28321041675 proves Cloud Run deploy permissions, and it keeps deployer secret access metadata-only.')
  actions.push('After higher-privilege owner remediation, rerun the read-only default-branch prerequisite audit with gh workflow run beta-readiness-api-staging-owner-prerequisite-audit.yml --repo yuzastudio6-cyber/Reedkt --ref codex/reeditpro-web-ui-shell --field confirm_staging_api_owner_prerequisite_audit=AUDIT_STAGING_BETA_API_OWNER_PREREQUISITES --field artifact_region=us-central1 --field artifact_repository=reeditpro-staging-workers --field deployer_service_account=sa-remotion-render-worker@reeditpro.iam.gserviceaccount.com --field runtime_service_account=reeditpro-api-staging@reeditpro.iam.gserviceaccount.com --field service_name=reeditpro-api-staging; current source truth run 28321041675 proves artifactregistry.repositories.get/uploadArtifacts, runtime service-account existence, deployer act-as-runtime, and fixed secret-entry describe access remain blocked.')
  actions.push('After higher-privilege owner remediation, rerun the read-only default-branch input discovery workflow with gh workflow run beta-readiness-api-staging-input-discovery.yml --repo yuzastudio6-cyber/Reedkt --ref codex/reeditpro-web-ui-shell --field confirm_staging_api_input_discovery=READ_STAGING_BETA_API_DEPLOY_INPUTS and exact artifact/service-account fields; current source truth records exactArtifactRepository blocked by artifactregistry.repositories.get on reeditpro-staging-workers and exactRuntimeServiceAccount blocked because reeditpro-api-staging@reeditpro.iam.gserviceaccount.com does not exist.')
  actions.push('After the local accepted evidence bundle passes and staging deploy inputs are owner-proven, dispatch the guarded default-branch workflow with gh workflow run beta-readiness-api-staging-deploy.yml --repo yuzastudio6-cyber/Reedkt --ref codex/reeditpro-web-ui-shell and the exact tools-branch source SHA, immutable image tag, Artifact Registry inputs, owner-approved deployer service account, runtime API service account, and service_name=reeditpro-api-staging; then run npm run beta:readiness:api-deployment-preflight to prove the API URL, deployed source SHA, image, service account, and secret bindings are coherent before any deployed evidence call.')
  actions.push('After API deployment preflight passes, set REEDITPRO_BETA_DEPLOYED_EVIDENCE_SOURCE_SHA to the current deployed staging source SHA, then run npm run beta:readiness:deployed-evidence-input-manifest to verify the 14-tool bundle inputs, libass container image, platform approvals, and launch approvals before any deployed evidence call.')
  actions.push('After the local accepted evidence bundle, deployed evidence input manifest, platform staging evidence preflight, and launch approval preflight all pass, run npm run beta:readiness:external-beta-evidence-collector to record tool/platform/launch evidence and require final external-beta operator-status readback in one fail-closed sequence.')
  actions.push('After tool, platform, and launch approval evidence packets exist, rerun npm run beta:readiness:operator-status-api, smoke:tool-beta-execution-readiness, and the beta readiness API smoke from the final source SHA.')
  actions.push('After deployed operator status reports external beta ready, use npm run beta:readiness:scope-approval-evidence-preflight with REEDITPRO_BETA_SCOPE_APPROVAL_MODE=real_user_media_beta; after real-user-media beta is ready, repeat with REEDITPRO_BETA_SCOPE_APPROVAL_MODE=paid_production, or run npm run beta:readiness:scope-approval-sequence when both later approvals and evidence notes are ready.')
  actions.push('When all external-beta, real-user-media beta, and paid-production approval evidence inputs are available, run npm run beta:readiness:paid-production-evidence-collector to sequence the full evidence/readback path and require final paid-production operator-status readiness.')
  return actions
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = buildBetaReadinessOperatorStatus(process.env)
  console.log(JSON.stringify(report, null, 2))
  if (!report.operatorInputsReady) {
    process.exitCode = 1
  }
}

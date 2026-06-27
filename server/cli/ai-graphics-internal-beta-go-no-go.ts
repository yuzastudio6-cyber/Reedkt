import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  buildAiGraphicsInternalBetaGoNoGo,
} from '../tool-registry/ai-graphics-internal-beta-go-no-go'
import type {
  AiGraphicsBetaEvidenceBundle,
  AiGraphicsBetaEvidenceBundleInput,
} from '../tool-registry/ai-graphics-beta-evidence-bundle'
import type {
  AiGraphicsBetaProductionReadinessRollup,
} from '../tool-registry/ai-graphics-beta-production-readiness-rollup'

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag)
}

function valueAfterFlag(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  return index >= 0 ? process.argv[index + 1] : undefined
}

function readJsonFile(flag: string): unknown | undefined {
  const filePath = valueAfterFlag(flag)
  if (!filePath) return undefined

  const resolvedPath = resolve(filePath)
  if (!existsSync(resolvedPath)) {
    throw new Error(`Evidence packet file does not exist for ${flag}: ${filePath}`)
  }

  return JSON.parse(readFileSync(resolvedPath, 'utf8'))
}

function readJsonObjectFile(flag: string): Record<string, unknown> | undefined {
  const parsed = readJsonFile(flag)
  if (!parsed) return undefined
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error(`Evidence packet file for ${flag} must contain a JSON object`)
  }
  return parsed as Record<string, unknown>
}

function readJsonPath(filePath: string): unknown {
  const resolvedPath = resolve(filePath)
  if (!existsSync(resolvedPath)) {
    throw new Error(`Evidence packet file does not exist: ${filePath}`)
  }

  return JSON.parse(readFileSync(resolvedPath, 'utf8'))
}

function readProofPacket(flag: string, committedPath: string): unknown | undefined {
  const fromFlag = readJsonFile(flag)
  if (fromFlag) return fromFlag
  if (hasFlag('--use-committed-js-runtime-proofs')) return readJsonPath(committedPath)
  return undefined
}

function isBetaEvidenceBundle(value: unknown): value is AiGraphicsBetaEvidenceBundle {
  return Boolean(
    typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value) &&
      (value as Record<string, unknown>).decision ===
        'ai_graphics_beta_evidence_bundle_validator_prepared_with_fail_closed_defaults' &&
      Array.isArray((value as Record<string, unknown>).tools) &&
      Array.isArray((value as Record<string, unknown>).gpuRuntimeTargetedTools),
  )
}

function readPrebuiltEvidenceBundle(): {
  evidenceBundle?: AiGraphicsBetaEvidenceBundle
  evidenceSourceMode:
    | 'constructed_from_cli_flags'
    | 'beta_evidence_bundle_packet'
    | 'beta_evidence_local_assembly_packet'
} {
  const betaEvidenceBundlePacket = readJsonObjectFile('--beta-evidence-bundle-packet')
  const localAssemblyPacket = readJsonObjectFile('--beta-evidence-local-assembly-packet')

  if (betaEvidenceBundlePacket && localAssemblyPacket) {
    throw new Error(
      'Use either --beta-evidence-bundle-packet or --beta-evidence-local-assembly-packet, not both',
    )
  }

  if (betaEvidenceBundlePacket) {
    if (!isBetaEvidenceBundle(betaEvidenceBundlePacket)) {
      throw new Error('--beta-evidence-bundle-packet does not contain an AI graphics beta evidence bundle')
    }
    return {
      evidenceBundle: betaEvidenceBundlePacket,
      evidenceSourceMode: 'beta_evidence_bundle_packet',
    }
  }

  if (localAssemblyPacket) {
    const evidenceBundle = localAssemblyPacket.betaEvidenceBundle
    if (!isBetaEvidenceBundle(evidenceBundle)) {
      throw new Error(
        '--beta-evidence-local-assembly-packet does not contain betaEvidenceBundle',
      )
    }
    return {
      evidenceBundle,
      evidenceSourceMode: 'beta_evidence_local_assembly_packet',
    }
  }

  return { evidenceSourceMode: 'constructed_from_cli_flags' }
}

function isBetaProductionReadinessRollup(
  packet: unknown,
): packet is AiGraphicsBetaProductionReadinessRollup {
  if (!packet || typeof packet !== 'object' || Array.isArray(packet)) return false
  const record = packet as Record<string, unknown>
  const booleans = record.booleans
  return (
    record.decision === 'ai_graphics_beta_production_readiness_rollup_prepared_with_runtime_blocks' &&
    record.status === 'owner_approved_worker_gates_ready_runtime_still_blocked' &&
    record.totalAiGraphicsTools === 21 &&
    record.totalProductFacingCapabilities === 12 &&
    record.productionWorkerGateChecksAcceptedWithProvidedEvidence === 21 &&
    record.capabilityProductionWorkerGateScenariosAcceptedWithProvidedEvidence === 12 &&
    record.hardFailedProductionWorkerGateChecksWithProvidedEvidence === 0 &&
    record.internalBetaReadyNowTools === 0 &&
    record.externalBetaReadyNowTools === 0 &&
    record.productionReadyNowTools === 0 &&
    Boolean(
      booleans &&
      typeof booleans === 'object' &&
      !Array.isArray(booleans) &&
      (booleans as Record<string, unknown>).internalBetaGoNoGoReadyWithProvidedEvidence === true &&
      (booleans as Record<string, unknown>).sourceProductionWorkerGateAcceptedWithProvidedEvidence === true &&
      (booleans as Record<string, unknown>).gpuRuntimeOnDemandOnly === true &&
      (booleans as Record<string, unknown>).agentCanExecuteToolsNow === false &&
      (booleans as Record<string, unknown>).workerQueueApprovedNow === false &&
      (booleans as Record<string, unknown>).productionWorkerJobEnqueueApprovedNow === false &&
      (booleans as Record<string, unknown>).productionWorkerDispatchApprovedNow === false &&
      (booleans as Record<string, unknown>).gpuRuntimeApprovedNow === false &&
      (booleans as Record<string, unknown>).runtimeReadyNow === false &&
      (booleans as Record<string, unknown>).internalBetaReadyNow === false &&
      (booleans as Record<string, unknown>).externalBetaReadyNow === false &&
      (booleans as Record<string, unknown>).productionReadyNow === false
    )
  )
}

function readSourceBetaProductionReadinessRollupPacket(): {
  sourceBetaProductionReadinessRollupPacket?: AiGraphicsBetaProductionReadinessRollup
  rollupSourceMode: 'constructed_from_cli_flags' | 'beta_production_readiness_rollup_packet'
} {
  const packet = readJsonFile('--beta-production-readiness-rollup-packet')
  if (!packet) return { rollupSourceMode: 'constructed_from_cli_flags' }
  if (!isBetaProductionReadinessRollup(packet)) {
    throw new Error(
      '--beta-production-readiness-rollup-packet must report owner_approved_worker_gates_ready_runtime_still_blocked with all 21 worker gate checks, all 12 capability scenarios, zero hard failures, on-demand GPU policy, and runtime gates still false.',
    )
  }

  return {
    sourceBetaProductionReadinessRollupPacket: packet,
    rollupSourceMode: 'beta_production_readiness_rollup_packet',
  }
}

const allTechnicalGatesPassed = hasFlag('--all-technical-gates-passed')
const prebuiltEvidence = readPrebuiltEvidenceBundle()
const sourceRollupPacket = readSourceBetaProductionReadinessRollupPacket()
if (sourceRollupPacket.sourceBetaProductionReadinessRollupPacket && prebuiltEvidence.evidenceBundle) {
  throw new Error(
    'Use either --beta-production-readiness-rollup-packet or a beta evidence packet, not both',
  )
}
const evidenceBundleInput: AiGraphicsBetaEvidenceBundleInput | undefined =
  prebuiltEvidence.evidenceBundle || sourceRollupPacket.sourceBetaProductionReadinessRollupPacket
    ? undefined
    : {
        approvedPlanSnapshotGatePassed:
          allTechnicalGatesPassed || hasFlag('--approved-plan-snapshot-gate-passed'),
        creditReservationGatePassed:
          allTechnicalGatesPassed || hasFlag('--credit-reservation-gate-passed'),
        artifactBoundaryGatePassed:
          allTechnicalGatesPassed || hasFlag('--artifact-boundary-gate-passed'),
        toolRouteGatePassed:
          allTechnicalGatesPassed || hasFlag('--tool-route-gate-passed'),
        workerGatePassed:
          allTechnicalGatesPassed || hasFlag('--worker-gate-passed'),
        browserCanvasWebglSandboxPassed: hasFlag('--browser-canvas-webgl-sandbox-passed'),
        modelWeightManifestReviewPacket: readJsonFile('--model-weight-manifest-review-packet') as
          AiGraphicsBetaEvidenceBundleInput['modelWeightManifestReviewPacket'],
        gpuRuntimeProofResultPacket: readJsonFile('--gpu-runtime-proof-result-packet') as
          AiGraphicsBetaEvidenceBundleInput['gpuRuntimeProofResultPacket'],
        nodeRuntimeProofPacket: readProofPacket(
          '--node-runtime-proof-packet',
          'docs/tool-intelligence/ai-graphics/node-runtime-proof.json',
        ) as AiGraphicsBetaEvidenceBundleInput['nodeRuntimeProofPacket'],
        browserRuntimeProofPacket: readProofPacket(
          '--browser-runtime-proof-packet',
          'docs/tool-intelligence/ai-graphics/browser-runtime-proof.json',
        ) as AiGraphicsBetaEvidenceBundleInput['browserRuntimeProofPacket'],
        satoriFontRuntimeProofPacket: readProofPacket(
          '--satori-font-runtime-proof-packet',
          'docs/tool-intelligence/ai-graphics/satori-font-runtime-proof.json',
        ) as AiGraphicsBetaEvidenceBundleInput['satoriFontRuntimeProofPacket'],
      }

const goNoGo = buildAiGraphicsInternalBetaGoNoGo({
  sourceBetaProductionReadinessRollupPacket:
    sourceRollupPacket.sourceBetaProductionReadinessRollupPacket,
  evidenceBundle: prebuiltEvidence.evidenceBundle,
  evidenceBundleInput,
  ownerApprovalGranted: hasFlag('--owner-approval-granted'),
  ownerApprovalRef: valueAfterFlag('--owner-approval-ref'),
  ownerApproverRole: valueAfterFlag('--owner-approver-role') ?? 'AI_TOOLS_CREATIVE_GRAPHICS_OWNER',
  internalBetaGoNoGoApproved: hasFlag('--internal-beta-go-no-go-approved'),
  internalBetaGoNoGoRef: valueAfterFlag('--internal-beta-go-no-go-ref'),
  internalBetaGoNoGoApproverRole:
    valueAfterFlag('--internal-beta-go-no-go-approver-role') ?? 'AI_TOOLS_CREATIVE_GRAPHICS_OWNER',
})

const output = {
  ...goNoGo,
  input: {
    validatorOnly: true,
    evidenceSourceMode: prebuiltEvidence.evidenceSourceMode,
    rollupSourceMode: sourceRollupPacket.rollupSourceMode,
    betaProductionReadinessRollupPacketRead:
      Boolean(sourceRollupPacket.sourceBetaProductionReadinessRollupPacket),
    betaEvidenceBundlePacketRead: Boolean(valueAfterFlag('--beta-evidence-bundle-packet')),
    betaEvidenceLocalAssemblyPacketRead: Boolean(valueAfterFlag('--beta-evidence-local-assembly-packet')),
    ownerApprovalRefProvided: Boolean(valueAfterFlag('--owner-approval-ref')),
    internalBetaGoNoGoRefProvided: Boolean(valueAfterFlag('--internal-beta-go-no-go-ref')),
    evidencePacketFilesRead: [
      valueAfterFlag('--beta-evidence-bundle-packet'),
      valueAfterFlag('--beta-evidence-local-assembly-packet'),
      valueAfterFlag('--beta-production-readiness-rollup-packet'),
      valueAfterFlag('--model-weight-manifest-review-packet'),
      valueAfterFlag('--gpu-runtime-proof-result-packet'),
      valueAfterFlag('--node-runtime-proof-packet'),
      valueAfterFlag('--browser-runtime-proof-packet'),
      valueAfterFlag('--satori-font-runtime-proof-packet'),
    ].filter(Boolean).length,
    committedJsRuntimeProofsRead: hasFlag('--use-committed-js-runtime-proofs'),
    dependencyInstallPerformed: false,
    packageLockMutationPerformed: false,
    toolExecutionPerformed: false,
    workerExecutionPerformed: false,
    routeExecutionPerformed: false,
    productionWorkerDispatchPerformed: false,
    productionWorkerRouteExecutionPerformed: false,
    providerRuntimePerformed: false,
    browserWebglCanvasRuntimePerformed: false,
    gpuRuntimePerformed: false,
    modelWeightsDownloaded: false,
    modelWeightsLoaded: false,
    mediaProcessingPerformed: false,
    publicArtifactCreated: false,
    signedUrlCreated: false,
  },
}

console.log(JSON.stringify(output, null, 2))

if (
  hasFlag('--require-internal-beta-go-no-go-approved') &&
  !goNoGo.booleans.all21ToolsInternalBetaGoNoGoApprovedWithProvidedEvidence
) {
  process.exitCode = 2
}

if (hasFlag('--require-runtime-ready') || hasFlag('--require-external-beta-ready') || hasFlag('--require-production-ready')) {
  process.exitCode = 3
}

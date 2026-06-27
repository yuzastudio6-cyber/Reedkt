import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  buildAiGraphicsInternalBetaGoNoGoOwnerApproval,
} from '../tool-registry/ai-graphics-internal-beta-go-no-go-owner-approval'
import type {
  AiGraphicsInternalBetaGoNoGo,
} from '../tool-registry/ai-graphics-internal-beta-go-no-go'
import type {
  AiGraphicsBetaEvidenceBundleInput,
} from '../tool-registry/ai-graphics-beta-evidence-bundle'

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

function isInternalBetaGoNoGoPacket(value: unknown): value is AiGraphicsInternalBetaGoNoGo {
  return Boolean(
    typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value) &&
      (value as Record<string, unknown>).decision ===
        'ai_graphics_internal_beta_go_no_go_contract_prepared_with_runtime_blocks' &&
      typeof (value as Record<string, unknown>).status === 'string' &&
      typeof (value as Record<string, unknown>).booleans === 'object',
  )
}

function readSourceGoNoGoPacket(): {
  sourceGoNoGo?: AiGraphicsInternalBetaGoNoGo
  sourceEvidenceMode: 'constructed_from_cli_flags' | 'internal_beta_go_no_go_packet'
} {
  const sourcePacket = readJsonObjectFile('--internal-beta-go-no-go-packet')
  if (!sourcePacket) return { sourceEvidenceMode: 'constructed_from_cli_flags' }
  if (!isInternalBetaGoNoGoPacket(sourcePacket)) {
    throw new Error(
      '--internal-beta-go-no-go-packet does not contain an AI graphics internal beta go/no-go packet',
    )
  }
  return {
    sourceGoNoGo: sourcePacket,
    sourceEvidenceMode: 'internal_beta_go_no_go_packet',
  }
}

const allTechnicalGatesPassed = hasFlag('--all-technical-gates-passed')
const sourcePacket = readSourceGoNoGoPacket()
const evidenceBundleInput: AiGraphicsBetaEvidenceBundleInput | undefined =
  sourcePacket.sourceGoNoGo
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
        workerGatePassed: allTechnicalGatesPassed || hasFlag('--worker-gate-passed'),
        browserCanvasWebglSandboxPassed: hasFlag('--browser-canvas-webgl-sandbox-passed'),
        modelWeightManifestReviewPacket: readJsonFile(
          '--model-weight-manifest-review-packet',
        ) as AiGraphicsBetaEvidenceBundleInput['modelWeightManifestReviewPacket'],
        gpuRuntimeProofResultPacket: readJsonFile(
          '--gpu-runtime-proof-result-packet',
        ) as AiGraphicsBetaEvidenceBundleInput['gpuRuntimeProofResultPacket'],
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

const ownerApprovalGranted = hasFlag('--internal-beta-go-no-go-owner-approval-granted')
const ownerApprovalRef = valueAfterFlag('--internal-beta-go-no-go-owner-approval-ref')
const ownerApproverRole =
  valueAfterFlag('--internal-beta-go-no-go-owner-approver-role') ??
  'AI_TOOLS_CREATIVE_GRAPHICS_OWNER'

const ownerApproval = buildAiGraphicsInternalBetaGoNoGoOwnerApproval({
  sourceInternalBetaGoNoGoPacket: sourcePacket.sourceGoNoGo,
  evidenceBundleInput,
  ownerApprovalGranted: hasFlag('--owner-approval-granted'),
  ownerApprovalRef: valueAfterFlag('--owner-approval-ref'),
  ownerApproverRole: valueAfterFlag('--owner-approver-role') ?? 'AI_TOOLS_CREATIVE_GRAPHICS_OWNER',
  internalBetaGoNoGoOwnerApprovalGranted: ownerApprovalGranted,
  internalBetaGoNoGoOwnerApprovalRef: ownerApprovalRef,
  internalBetaGoNoGoOwnerApproverRole: ownerApproverRole,
})

const output = {
  ...ownerApproval,
  input: {
    validatorOnly: true,
    sourceEvidenceMode: sourcePacket.sourceEvidenceMode,
    internalBetaGoNoGoPacketRead: Boolean(valueAfterFlag('--internal-beta-go-no-go-packet')),
    ownerApprovalRefProvided: Boolean(valueAfterFlag('--owner-approval-ref')),
    internalBetaGoNoGoOwnerApprovalRefProvided: Boolean(ownerApprovalRef),
    evidencePacketFilesRead: [
      valueAfterFlag('--internal-beta-go-no-go-packet'),
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
  hasFlag('--require-internal-beta-go-no-go-owner-approved') &&
  !ownerApproval.booleans.all21ToolsInternalBetaGoNoGoOwnerApprovedWithProvidedEvidence
) {
  process.exitCode = 2
}

if (hasFlag('--require-runtime-ready') || hasFlag('--require-external-beta-ready') || hasFlag('--require-production-ready')) {
  process.exitCode = 3
}

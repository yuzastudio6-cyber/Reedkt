import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  buildAiGraphicsInternalBetaRuntimeEnqueueApproval,
} from '../tool-registry/ai-graphics-internal-beta-runtime-enqueue-approval'
import type {
  AiGraphicsInternalBetaGoNoGoOwnerApproval,
} from '../tool-registry/ai-graphics-internal-beta-go-no-go-owner-approval'
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

function isGoNoGoOwnerApprovalPacket(
  value: unknown,
): value is AiGraphicsInternalBetaGoNoGoOwnerApproval {
  return Boolean(
    typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value) &&
      (value as Record<string, unknown>).decision ===
        'ai_graphics_internal_beta_go_no_go_owner_approved_with_runtime_blocks' &&
      typeof (value as Record<string, unknown>).status === 'string' &&
      typeof (value as Record<string, unknown>).booleans === 'object',
  )
}

const falseGateKeys = [
  'agentCanExecuteToolsNow',
  'routeExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'workerQueueApprovedNow',
  'productionWorkerJobEnqueueApprovedNow',
  'productionWorkerDispatchApprovedNow',
  'productionWorkerRouteExecutionApprovedNow',
  'toolExecutionApprovedNow',
  'providerRuntimeApprovedNow',
  'browserWebglCanvasRuntimeApprovedNow',
  'gpuRuntimeApprovedNow',
  'runtimeReadyNow',
  'internalBetaReadyNow',
  'externalBetaReadyNow',
  'productionReadyNow',
  'dependencyInstallPerformed',
  'packageLockMutationPerformed',
  'toolExecutionPerformed',
  'workerExecutionPerformed',
  'routeExecutionPerformed',
  'productionWorkerDispatchPerformed',
  'productionWorkerRouteExecutionPerformed',
  'providerRuntimePerformed',
  'browserWebglCanvasRuntimePerformed',
  'gpuRuntimePerformed',
  'modelWeightsDownloaded',
  'modelWeightsLoaded',
  'mediaProcessingPerformed',
  'supabaseMutationPerformed',
  'gcsUploadPerformed',
  'publicArtifactCreated',
  'signedUrlCreated',
] as const

function assertBooleanField(
  object: Record<string, unknown>,
  key: string,
  expected: boolean,
  flag: string,
): void {
  if (object[key] !== expected) {
    throw new Error(
      `${flag} must have ${key}=${String(expected)}; received ${String(object[key])}`,
    )
  }
}

function assertNumberField(
  object: Record<string, unknown>,
  key: string,
  expected: number,
  flag: string,
): void {
  if (object[key] !== expected) {
    throw new Error(`${flag} must have ${key}=${expected}; received ${String(object[key])}`)
  }
}

function validateGoNoGoOwnerApprovalPacket(
  packet: AiGraphicsInternalBetaGoNoGoOwnerApproval,
  flag: string,
): void {
  const packetRecord = packet as unknown as Record<string, unknown>
  const booleans = packetRecord.booleans
  if (typeof booleans !== 'object' || booleans === null || Array.isArray(booleans)) {
    throw new Error(`${flag} must contain a booleans object`)
  }
  const booleanRecord = booleans as Record<string, unknown>

  if (packet.status !== 'internal_beta_go_no_go_owner_approved_runtime_still_blocked') {
    throw new Error(`${flag} must be owner-approved and runtime-blocked; received ${packet.status}`)
  }
  assertNumberField(packetRecord, 'totalAiGraphicsTools', 21, flag)
  assertNumberField(packetRecord, 'totalProductFacingCapabilities', 12, flag)
  assertNumberField(packetRecord, 'ownerApprovedToolsWithProvidedEvidence', 21, flag)
  assertNumberField(packetRecord, 'ownerApprovedCapabilitiesWithProvidedEvidence', 12, flag)
  assertNumberField(packetRecord, 'internalBetaReadyNowTools', 0, flag)
  assertNumberField(packetRecord, 'externalBetaReadyNowTools', 0, flag)
  assertNumberField(packetRecord, 'productionReadyNowTools', 0, flag)

  for (const [key, expected] of Object.entries({
    sourceInternalBetaGoNoGoAccepted: true,
    internalBetaGoNoGoOwnerApprovalRecordAccepted: true,
    all21ToolsCovered: true,
    all12CapabilitiesCovered: true,
    all21ToolsInternalBetaGoNoGoOwnerApprovedWithProvidedEvidence: true,
    agentCanSelectForPlanning: true,
  })) {
    assertBooleanField(booleanRecord, key, expected, flag)
  }
  for (const key of falseGateKeys) {
    assertBooleanField(booleanRecord, key, false, flag)
  }

  const sourceGoNoGo = packetRecord.sourceGoNoGo
  if (typeof sourceGoNoGo !== 'object' || sourceGoNoGo === null || Array.isArray(sourceGoNoGo)) {
    throw new Error(`${flag} must include the sourceGoNoGo packet`)
  }
  const sourceRecord = sourceGoNoGo as Record<string, unknown>
  if (sourceRecord.status !== 'internal_beta_go_no_go_approved_runtime_still_blocked') {
    throw new Error(`${flag} sourceGoNoGo must be approved and runtime-blocked`)
  }
}

function readSourceGoNoGoOwnerApprovalPacket(): {
  sourceGoNoGoOwnerApproval?: AiGraphicsInternalBetaGoNoGoOwnerApproval
  sourceEvidenceMode: 'constructed_from_cli_flags' | 'internal_beta_go_no_go_owner_approval_packet'
} {
  const sourcePacket = readJsonObjectFile('--internal-beta-go-no-go-owner-approval-packet')
  if (!sourcePacket) return { sourceEvidenceMode: 'constructed_from_cli_flags' }
  if (!isGoNoGoOwnerApprovalPacket(sourcePacket)) {
    throw new Error(
      '--internal-beta-go-no-go-owner-approval-packet does not contain an AI graphics internal beta go/no-go owner approval packet',
    )
  }
  validateGoNoGoOwnerApprovalPacket(
    sourcePacket,
    '--internal-beta-go-no-go-owner-approval-packet',
  )
  return {
    sourceGoNoGoOwnerApproval: sourcePacket,
    sourceEvidenceMode: 'internal_beta_go_no_go_owner_approval_packet',
  }
}

const allTechnicalGatesPassed = hasFlag('--all-technical-gates-passed')
const sourcePacket = readSourceGoNoGoOwnerApprovalPacket()
const evidenceBundleInput: AiGraphicsBetaEvidenceBundleInput | undefined =
  sourcePacket.sourceGoNoGoOwnerApproval
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

const runtimeEnqueueApproval = buildAiGraphicsInternalBetaRuntimeEnqueueApproval({
  sourceGoNoGoOwnerApprovalPacket: sourcePacket.sourceGoNoGoOwnerApproval,
  evidenceBundleInput,
  ownerApprovalGranted: hasFlag('--owner-approval-granted'),
  ownerApprovalRef: valueAfterFlag('--owner-approval-ref'),
  ownerApproverRole: valueAfterFlag('--owner-approver-role') ?? 'AI_TOOLS_CREATIVE_GRAPHICS_OWNER',
  internalBetaGoNoGoOwnerApprovalGranted:
    hasFlag('--internal-beta-go-no-go-owner-approval-granted'),
  internalBetaGoNoGoOwnerApprovalRef:
    valueAfterFlag('--internal-beta-go-no-go-owner-approval-ref'),
  internalBetaGoNoGoOwnerApproverRole:
    valueAfterFlag('--internal-beta-go-no-go-owner-approver-role') ??
    'AI_TOOLS_CREATIVE_GRAPHICS_OWNER',
  internalBetaRuntimeEnqueueApprovalGranted:
    hasFlag('--internal-beta-runtime-enqueue-approval-granted'),
  internalBetaRuntimeEnqueueApprovalRef:
    valueAfterFlag('--internal-beta-runtime-enqueue-approval-ref'),
  internalBetaRuntimeEnqueueApproverRole:
    valueAfterFlag('--internal-beta-runtime-enqueue-approver-role') ??
    'AI_TOOLS_CREATIVE_GRAPHICS_OWNER',
})

const output = {
  ...runtimeEnqueueApproval,
  input: {
    validatorOnly: true,
    sourceEvidenceMode: sourcePacket.sourceEvidenceMode,
    internalBetaGoNoGoOwnerApprovalPacketRead: Boolean(
      valueAfterFlag('--internal-beta-go-no-go-owner-approval-packet'),
    ),
    internalBetaGoNoGoOwnerApprovalRefProvided:
      Boolean(valueAfterFlag('--internal-beta-go-no-go-owner-approval-ref')),
    internalBetaRuntimeEnqueueApprovalRefProvided:
      Boolean(valueAfterFlag('--internal-beta-runtime-enqueue-approval-ref')),
    evidencePacketFilesRead: [
      valueAfterFlag('--internal-beta-go-no-go-owner-approval-packet'),
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
  hasFlag('--require-internal-beta-runtime-enqueue-approved') &&
  !runtimeEnqueueApproval.booleans.all21RuntimeEnqueueScopesApprovedWithProvidedEvidence
) {
  process.exitCode = 2
}

if (hasFlag('--require-live-worker-queue') || hasFlag('--require-runtime-ready') || hasFlag('--require-production-ready')) {
  process.exitCode = 3
}

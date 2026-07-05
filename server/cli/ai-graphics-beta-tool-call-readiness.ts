import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  buildAiGraphicsBetaToolCallReadiness,
} from '../tool-registry/ai-graphics-beta-tool-call-readiness'
import type {
  AiGraphicsBetaEvidenceBundle,
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

const allSharedGatesPassed = hasFlag('--all-shared-gates-passed')
const allTechnicalGatesPassed = allSharedGatesPassed || hasFlag('--all-technical-gates-passed')
const prebuiltEvidence = readPrebuiltEvidenceBundle()
const evidenceBundleInput: AiGraphicsBetaEvidenceBundleInput | undefined =
  prebuiltEvidence.evidenceBundle
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
        internalBetaOwnerApprovalGranted:
          allSharedGatesPassed || hasFlag('--internal-beta-owner-approval-granted'),
        modelWeightManifestReviewPacket: readJsonFile('--model-weight-manifest-review-packet') as
          AiGraphicsBetaEvidenceBundleInput['modelWeightManifestReviewPacket'],
        gpuRuntimeProofResultPacket: readJsonFile('--gpu-runtime-proof-result-packet') as
          AiGraphicsBetaEvidenceBundleInput['gpuRuntimeProofResultPacket'],
        sourceExternalBetaNativeGpuProofCollectionPacket:
          readJsonFile('--external-beta-native-gpu-proof-collection-packet') as
            AiGraphicsBetaEvidenceBundleInput['sourceExternalBetaNativeGpuProofCollectionPacket'],
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

const readiness = buildAiGraphicsBetaToolCallReadiness(
  prebuiltEvidence.evidenceBundle
    ? { evidenceBundle: prebuiltEvidence.evidenceBundle }
    : { evidenceBundleInput },
)
const output = {
  ...readiness,
  input: {
    evaluatorOnly: true,
    evidenceSourceMode: prebuiltEvidence.evidenceSourceMode,
    betaEvidenceBundlePacketRead: Boolean(valueAfterFlag('--beta-evidence-bundle-packet')),
    betaEvidenceLocalAssemblyPacketRead: Boolean(valueAfterFlag('--beta-evidence-local-assembly-packet')),
    evidencePacketFilesRead: [
      valueAfterFlag('--beta-evidence-bundle-packet'),
      valueAfterFlag('--beta-evidence-local-assembly-packet'),
      valueAfterFlag('--model-weight-manifest-review-packet'),
      valueAfterFlag('--gpu-runtime-proof-result-packet'),
      valueAfterFlag('--external-beta-native-gpu-proof-collection-packet'),
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
  hasFlag('--require-all-21-beta-tool-call-ready') &&
  !readiness.all21BetaCallableWhenEvidenceBundlePasses
) {
  process.exitCode = 2
}

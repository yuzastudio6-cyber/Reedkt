import type {
  VisualIntelligenceEvidenceRef,
} from '../../src/types/visual-intelligence'
import { ApiError } from '../errors/api-error'
import type {
  CanonicalSourceAnalysisL4VisualEvidenceToolArtifact,
  CanonicalSourceAnalysisL4VisualEvidenceToolArtifactOwner,
} from './canonical-source-analysis-l4-visual-evidence-tool-artifact-owner'
import {
  CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_TOOL_ARTIFACT_OWNER_VERSION,
  CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_TOOL_ARTIFACT_ROLES,
  createCanonicalSourceAnalysisL4VisualEvidenceToolArtifact,
  getCanonicalSourceAnalysisL4VisualEvidenceToolArtifactRef,
} from './canonical-source-analysis-l4-visual-evidence-tool-artifact-owner'
import type {
  CanonicalSourceAnalysisL4VisualEvidenceWorkerBootstrap,
} from './canonical-source-analysis-l4-visual-evidence-worker-bootstrap-owner'
import {
  assertCanonicalSourceAnalysisL4VisualEvidenceWorkerBootstrap,
} from './canonical-source-analysis-l4-visual-evidence-worker-bootstrap-owner'
import type {
  CanonicalSourceAnalysisL4VisualEvidenceWorkerEvidenceOwner,
} from './canonical-source-analysis-l4-visual-evidence-worker-evidence-owner'
import {
  CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_WORKER_EVIDENCE_OWNER_VERSION,
  createCanonicalSourceAnalysisL4VisualEvidenceWorkerEvidence,
} from './canonical-source-analysis-l4-visual-evidence-worker-evidence-owner'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_QUALIFIED_TOOL_VERSIONS,
} from './canonical-source-analysis-l4-visual-evidence-toolchain-qualification-owner'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const
CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_SIX_TOOL_GPU_EXECUTION_PORT_VERSION =
  'canonical-source-analysis-l4-visual-evidence-six-tool-gpu-execution-port-v2' as const
export const
CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_SIX_TOOL_EXECUTOR_VERSION =
  'canonical-source-analysis-l4-visual-evidence-six-tool-executor-v2' as const
export const
CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_SIX_TOOL_GPU_OUTPUT_VERSION =
  'canonical-source-analysis-l4-visual-evidence-six-tool-gpu-output-v2' as const

type ArtifactPayload = CanonicalSourceAnalysisL4VisualEvidenceToolArtifact[
  'payload'
]
type ArtifactRole = CanonicalSourceAnalysisL4VisualEvidenceToolArtifact[
  'role'
]

export interface CanonicalSourceAnalysisL4VisualEvidenceSixToolGpuOutput {
  readonly schemaVersion: typeof
  CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_SIX_TOOL_GPU_OUTPUT_VERSION
  readonly invocationId: string
  readonly acceleratorClass: 'nvidia_l4'
  readonly allocatedGpuCount: 1
  readonly gpuDeviceEvidenceRef: VisualIntelligenceEvidenceRef
  readonly cudaRuntimeEvidenceRef: VisualIntelligenceEvidenceRef
  readonly gpuDecodeEvidenceRef: VisualIntelligenceEvidenceRef
  readonly completeSourceCoverageEvidenceRef: VisualIntelligenceEvidenceRef
  readonly tools: ReadonlyArray<Readonly<{
    role: ArtifactRole
    toolVersion: string
    executionRef: VisualIntelligenceEvidenceRef
    payload: ArtifactPayload
  }>>
  readonly exactGenerationEtagChecksumAndLengthRereadVerified: true
  readonly substantiveGpuExecutionVerified: true
  readonly gpuDecodeVerified: true
  readonly allCanonicalSourceFramesAccountedFor: true
  readonly skippedCanonicalFrameCount: 0
  readonly substantiveCpuMediaProcessingUsed: false
  readonly runtimeNetworkDownloadPerformed: false
  readonly callerPathUrlBytesCommandOrEnvironmentAccepted: false
  readonly workerStartedAt: string
  readonly workerCompletedAt: string
  readonly activeExecutionMilliseconds: number
  readonly persistedPrivateArtifactBytes: number
  readonly classAOperationCount: number
  readonly classBOperationCount: number
  readonly outputDigestSha256: string
}

export interface CanonicalSourceAnalysisL4VisualEvidenceSixToolGpuExecutionPort {
  readonly schemaVersion: typeof
  CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_SIX_TOOL_GPU_EXECUTION_PORT_VERSION
  readonly fixedServerOwnedToolchain: true
  readonly callerPathUrlBytesCommandOrEnvironmentAccepted: false
  readonly substantiveCpuMediaProcessingAllowed: false
  executeExact(
    bootstrap: CanonicalSourceAnalysisL4VisualEvidenceWorkerBootstrap,
  ): Promise<unknown>
}

export interface CanonicalSourceAnalysisL4VisualEvidenceSixToolExecutor {
  readonly schemaVersion: typeof
  CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_SIX_TOOL_EXECUTOR_VERSION
  readonly operationOwner: 'visual_intelligence'
  readonly acceleratorClass: 'nvidia_l4'
  readonly fixedSixToolOrder: readonly [
    'ffprobe', 'ffmpeg', 'pyscenedetect', 'opencv', 'ocr', 'ffmpeg',
  ]
  readonly substantiveCpuMediaProcessingAllowed: false
  readonly runtimeNetworkDownloadAllowed: false
  readonly callerPathUrlBytesCommandOrEnvironmentAccepted: false
  executeAndPersist(
    bootstrap: CanonicalSourceAnalysisL4VisualEvidenceWorkerBootstrap,
  ): Promise<Readonly<{
    status: 'completed'
    invocationId: string
    toolArtifactRefs: readonly VisualIntelligenceEvidenceRef[]
    workerEvidenceRef: VisualIntelligenceEvidenceRef
    exactCreateOnlyArtifactAndWorkerEvidenceRereadVerified: true
    terminalCloudRunExecutionClaimed: false
    scaleBackToZeroClaimedByWorker: false
    accountEffectiveCostClaimedByWorker: false
    customerCreditMutated: false
    publicDeliveryGranted: false
    productionAuthorityGranted: false
  }>>
}

const OUTPUT_KEYS = [
  'schemaVersion', 'invocationId', 'acceleratorClass', 'allocatedGpuCount',
  'gpuDeviceEvidenceRef', 'cudaRuntimeEvidenceRef', 'gpuDecodeEvidenceRef',
  'completeSourceCoverageEvidenceRef', 'tools',
  'exactGenerationEtagChecksumAndLengthRereadVerified',
  'substantiveGpuExecutionVerified', 'gpuDecodeVerified',
  'allCanonicalSourceFramesAccountedFor', 'skippedCanonicalFrameCount',
  'substantiveCpuMediaProcessingUsed', 'runtimeNetworkDownloadPerformed',
  'callerPathUrlBytesCommandOrEnvironmentAccepted', 'workerStartedAt',
  'workerCompletedAt', 'activeExecutionMilliseconds',
  'persistedPrivateArtifactBytes', 'classAOperationCount',
  'classBOperationCount', 'outputDigestSha256',
] as const
const TOOL_KEYS = [
  'role', 'toolVersion', 'executionRef', 'payload',
] as const
const FIXED_TOOLS = [
  'ffprobe', 'ffmpeg', 'pyscenedetect', 'opencv', 'ocr', 'ffmpeg',
] as const

export function createCanonicalSourceAnalysisL4VisualEvidenceSixToolGpuOutput(
  input: Omit<CanonicalSourceAnalysisL4VisualEvidenceSixToolGpuOutput,
    'schemaVersion' | 'outputDigestSha256'>,
): CanonicalSourceAnalysisL4VisualEvidenceSixToolGpuOutput {
  assertPlainSerializedData(input, 'source_visual_six_tool_gpu_output_input')
  const payload = {
    schemaVersion:
      CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_SIX_TOOL_GPU_OUTPUT_VERSION,
    ...structuredClone(input),
  }
  return assertCanonicalSourceAnalysisL4VisualEvidenceSixToolGpuOutput({
    ...payload,
    outputDigestSha256: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalSourceAnalysisL4VisualEvidenceSixToolGpuOutput(
  value: unknown,
): CanonicalSourceAnalysisL4VisualEvidenceSixToolGpuOutput {
  assertPlainSerializedData(value, 'source_visual_six_tool_gpu_output')
  assertExactRecord(value, OUTPUT_KEYS,
    'source_visual_six_tool_gpu_output_shape_invalid')
  const output = value as unknown as
    CanonicalSourceAnalysisL4VisualEvidenceSixToolGpuOutput
  const tools = Array.isArray(output.tools) ? output.tools : []
  tools.forEach((tool) => assertExactRecord(
    tool,
    TOOL_KEYS,
    'source_visual_six_tool_gpu_output_tool_shape_invalid',
  ))
  const withoutDigest = { ...output } as Record<string, unknown>
  Reflect.deleteProperty(withoutDigest, 'outputDigestSha256')
  const elapsed = Date.parse(output.workerCompletedAt)
    - Date.parse(output.workerStartedAt)
  if (
    output.schemaVersion !==
      CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_SIX_TOOL_GPU_OUTPUT_VERSION
    || !safeId(output.invocationId)
    || output.acceleratorClass !== 'nvidia_l4'
    || output.allocatedGpuCount !== 1
    || !validRef(output.gpuDeviceEvidenceRef)
    || !validRef(output.cudaRuntimeEvidenceRef)
    || !validRef(output.gpuDecodeEvidenceRef)
    || !validRef(output.completeSourceCoverageEvidenceRef)
    || tools.length !==
      CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_TOOL_ARTIFACT_ROLES.length
    || stableAuthorityStringify(tools.map((tool) => tool.role)) !==
      stableAuthorityStringify(
        CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_TOOL_ARTIFACT_ROLES,
      )
    || tools.some((tool) =>
      !safeVersion(tool.toolVersion)
      || tool.toolVersion !== expectedArtifactToolVersion(tool.role)
      || !validRef(tool.executionRef)
      || !tool.payload
      || typeof tool.payload !== 'object')
    || !output.exactGenerationEtagChecksumAndLengthRereadVerified
    || !output.substantiveGpuExecutionVerified
    || !output.gpuDecodeVerified
    || !output.allCanonicalSourceFramesAccountedFor
    || output.skippedCanonicalFrameCount !== 0
    || output.substantiveCpuMediaProcessingUsed
    || output.runtimeNetworkDownloadPerformed
    || output.callerPathUrlBytesCommandOrEnvironmentAccepted
    || !Number.isSafeInteger(output.activeExecutionMilliseconds)
    || output.activeExecutionMilliseconds < 1
    || !Number.isSafeInteger(output.persistedPrivateArtifactBytes)
    || output.persistedPrivateArtifactBytes < 0
    || !Number.isSafeInteger(output.classAOperationCount)
    || output.classAOperationCount < 1
    || !Number.isSafeInteger(output.classBOperationCount)
    || output.classBOperationCount < 1
    || !Number.isFinite(elapsed)
    || elapsed !== output.activeExecutionMilliseconds
    || !/^[a-f0-9]{64}$/u.test(output.outputDigestSha256)
    || output.outputDigestSha256 !== sha256AuthorityValue(withoutDigest)
  ) throw conflict('source_visual_six_tool_gpu_output_invalid')
  return deepFreeze(structuredClone(output))
}

export function createCanonicalSourceAnalysisL4VisualEvidenceSixToolExecutor(
  input: Readonly<{
    executionPort:
      CanonicalSourceAnalysisL4VisualEvidenceSixToolGpuExecutionPort
    toolArtifactOwner:
      CanonicalSourceAnalysisL4VisualEvidenceToolArtifactOwner
    workerEvidenceOwner:
      CanonicalSourceAnalysisL4VisualEvidenceWorkerEvidenceOwner
  }>,
): CanonicalSourceAnalysisL4VisualEvidenceSixToolExecutor {
  assertDependencies(input)
  return Object.freeze({
    schemaVersion:
      CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_SIX_TOOL_EXECUTOR_VERSION,
    operationOwner: 'visual_intelligence' as const,
    acceleratorClass: 'nvidia_l4' as const,
    fixedSixToolOrder: FIXED_TOOLS,
    substantiveCpuMediaProcessingAllowed: false as const,
    runtimeNetworkDownloadAllowed: false as const,
    callerPathUrlBytesCommandOrEnvironmentAccepted: false as const,
    async executeAndPersist(
      rawBootstrap: CanonicalSourceAnalysisL4VisualEvidenceWorkerBootstrap,
    ) {
      const bootstrap =
        assertCanonicalSourceAnalysisL4VisualEvidenceWorkerBootstrap(
          rawBootstrap,
        )
      const output =
        assertCanonicalSourceAnalysisL4VisualEvidenceSixToolGpuOutput(
          await input.executionPort.executeExact(bootstrap),
        )
      if (output.invocationId !== bootstrap.invocationId) {
        throw conflict('source_visual_six_tool_gpu_invocation_mismatch')
      }
      const artifacts = output.tools.map((tool) => {
        const release = bootstrap.toolReleaseRefs.find((item) =>
          item.role === tool.role)
        if (!release) throw conflict(
          'source_visual_six_tool_gpu_release_binding_missing',
        )
        return createCanonicalSourceAnalysisL4VisualEvidenceToolArtifact({
          invocationId: bootstrap.invocationId,
          role: tool.role,
          tool: toolForRole(tool.role),
          operationId: release.operationId,
          toolVersion: tool.toolVersion,
          runtimeReleaseRef: release.runtimeReleaseRef,
          executionRef: tool.executionRef,
          sourceObjectIdentityDigestSha256:
            sha256AuthorityValue(bootstrap.sourceObject),
          sourceTimelineDigestSha256:
            sha256AuthorityValue(bootstrap.sourceTimeline),
          sourceProbeAuthorityRef:
            bootstrap.sourceTimeline.sourceProbeAuthorityRef,
          sourceDurationFrames: bootstrap.sourceTimeline.durationFrames,
          sourceWidth: bootstrap.sourceObject.width,
          sourceHeight: bootstrap.sourceObject.height,
          sourceFrameAuthorityDigestSha256:
            sha256AuthorityValue(bootstrap.sourceTimeline.sourceFrameAuthority),
          payload: tool.payload,
          acceleratorClass: 'nvidia_l4',
          allocatedGpuCount: 1,
          exactSourceChecksumBound: true,
          exactCanonicalResultRereadVerified: true,
          substantiveGpuExecutionVerified: true,
          substantiveCpuMediaProcessingUsed: false,
          runtimeNetworkDownloadPerformed: false,
          callerPathUrlBytesCommandOrEnvironmentAccepted: false,
          customerCreditMutated: false,
          publicDeliveryGranted: false,
          productionAuthorityGranted: false,
        })
      })
      const persistedArtifacts = [] as VisualIntelligenceEvidenceRef[]
      for (const artifact of artifacts) {
        const persisted = await input.toolArtifactOwner.persistCreateOnly(
          artifact,
        )
        if (!sameRef(
          persisted.artifactRef,
          getCanonicalSourceAnalysisL4VisualEvidenceToolArtifactRef(artifact),
        )) throw conflict('source_visual_six_tool_gpu_artifact_ref_mismatch')
        persistedArtifacts.push(persisted.artifactRef)
      }
      const toolEvidence = [{
        role: 'media_probe' as const,
        tool: 'ffprobe' as const,
        operationId: bootstrap.toolReleaseRefs[0]!.operationId,
        toolVersion: 'canonical-source-probe-reread-v1',
        evidenceRef: bootstrap.sourceTimeline.sourceProbeAuthorityRef,
        runtimeReleaseRef: bootstrap.toolReleaseRefs[0]!.runtimeReleaseRef,
        executionRef: bootstrap.sourceTimeline.sourceProbeAuthorityRef,
        exactSourceChecksumBound: true as const,
        exactCanonicalResultRereadVerified: true as const,
        substantiveCpuExecutionUsed: false as const,
      }, ...artifacts.map((artifact) => ({
        role: artifact.role,
        tool: artifact.tool,
        operationId: artifact.operationId,
        toolVersion: artifact.toolVersion,
        evidenceRef:
          getCanonicalSourceAnalysisL4VisualEvidenceToolArtifactRef(artifact),
        runtimeReleaseRef: artifact.runtimeReleaseRef,
        executionRef: artifact.executionRef,
        exactSourceChecksumBound: true as const,
        exactCanonicalResultRereadVerified: true as const,
        substantiveCpuExecutionUsed: false as const,
      }))]
      const evidence =
        createCanonicalSourceAnalysisL4VisualEvidenceWorkerEvidence({
          bootstrap,
          invocationId: bootstrap.invocationId,
          bootstrapRef: rawDigestRef(
            `${bootstrap.invocationId}.bootstrap`,
            bootstrap.bootstrapDigestSha256,
          ),
          envelopeRef: bootstrap.envelopeRef,
          consumptionRef: bootstrap.consumptionRef,
          admissionRef: bootstrap.admissionRef,
          releaseRef: bootstrap.releaseRef,
          cloudRunOperationRef: bootstrap.cloudRunOperationRef,
          sourceObjectIdentityDigestSha256:
            sha256AuthorityValue(bootstrap.sourceObject),
          sourceTimelineDigestSha256:
            sha256AuthorityValue(bootstrap.sourceTimeline),
          sourceProbeAuthorityRef:
            bootstrap.sourceTimeline.sourceProbeAuthorityRef,
          acceleratorClass: 'nvidia_l4',
          allocatedGpuCount: 1,
          gpuDeviceEvidenceRef: output.gpuDeviceEvidenceRef,
          cudaRuntimeEvidenceRef: output.cudaRuntimeEvidenceRef,
          gpuDecodeEvidenceRef: output.gpuDecodeEvidenceRef,
          completeSourceCoverageEvidenceRef:
            output.completeSourceCoverageEvidenceRef,
          toolEvidence,
          exactGenerationEtagChecksumAndLengthRereadVerified: true,
          substantiveGpuExecutionVerified: true,
          gpuDecodeVerified: true,
          allCanonicalSourceFramesAccountedFor: true,
          skippedCanonicalFrameCount: 0,
          substantiveCpuMediaProcessingUsed: false,
          runtimeNetworkDownloadPerformed: false,
          callerPathUrlBytesCommandOrEnvironmentAccepted: false,
          workerStartedAt: output.workerStartedAt,
          workerCompletedAt: output.workerCompletedAt,
          activeExecutionMilliseconds: output.activeExecutionMilliseconds,
          persistedPrivateArtifactBytes: output.persistedPrivateArtifactBytes,
          classAOperationCount: output.classAOperationCount,
          classBOperationCount: output.classBOperationCount,
          terminalCloudRunExecutionClaimed: false,
          scaleBackToZeroClaimedByWorker: false,
          accountEffectiveCostClaimedByWorker: false,
          customerCreditMutated: false,
          publicDeliveryGranted: false,
          productionAuthorityGranted: false,
        })
      const persistedWorker = await input.workerEvidenceOwner.persistCreateOnly({
        bootstrap,
        evidence,
      })
      return Object.freeze({
        status: 'completed' as const,
        invocationId: bootstrap.invocationId,
        toolArtifactRefs: Object.freeze(persistedArtifacts.map((item) =>
          Object.freeze({ ...item }))),
        workerEvidenceRef: Object.freeze({
          ...persistedWorker.workerEvidenceRef,
        }),
        exactCreateOnlyArtifactAndWorkerEvidenceRereadVerified: true as const,
        terminalCloudRunExecutionClaimed: false as const,
        scaleBackToZeroClaimedByWorker: false as const,
        accountEffectiveCostClaimedByWorker: false as const,
        customerCreditMutated: false as const,
        publicDeliveryGranted: false as const,
        productionAuthorityGranted: false as const,
      })
    },
  })
}

function assertDependencies(input: Parameters<
  typeof createCanonicalSourceAnalysisL4VisualEvidenceSixToolExecutor
>[0]): void {
  if (
    input.executionPort?.schemaVersion !==
      CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_SIX_TOOL_GPU_EXECUTION_PORT_VERSION
    || !input.executionPort.fixedServerOwnedToolchain
    || input.executionPort.callerPathUrlBytesCommandOrEnvironmentAccepted
    || input.executionPort.substantiveCpuMediaProcessingAllowed
    || typeof input.executionPort.executeExact !== 'function'
    || input.toolArtifactOwner?.ownerVersion !==
      CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_TOOL_ARTIFACT_OWNER_VERSION
    || typeof input.toolArtifactOwner.persistCreateOnly !== 'function'
    || input.workerEvidenceOwner?.schemaVersion !==
      CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_WORKER_EVIDENCE_OWNER_VERSION
    || typeof input.workerEvidenceOwner.persistCreateOnly !== 'function'
  ) throw notReady('source_visual_six_tool_executor_dependencies_invalid')
}

function toolForRole(role: ArtifactRole) {
  return role === 'private_media_transform' ? 'ffmpeg' as const
    : role === 'scene_detection' ? 'pyscenedetect' as const
      : role === 'pixel_measurement' ? 'opencv' as const
        : role === 'exact_visible_text' ? 'ocr' as const
          : 'ffmpeg' as const
}

function expectedArtifactToolVersion(role: unknown): string | null {
  if (
    typeof role !== 'string'
    || !CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_TOOL_ARTIFACT_ROLES
      .includes(role as ArtifactRole)
  ) return null
  return CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_QUALIFIED_TOOL_VERSIONS[
    role as ArtifactRole
  ]
}

function assertExactRecord(
  value: unknown,
  expectedKeys: readonly string[],
  requiredGate: string,
): asserts value is Record<string, unknown> {
  if (
    !value
    || typeof value !== 'object'
    || Array.isArray(value)
    || stableAuthorityStringify(Object.keys(value).sort(compare)) !==
      stableAuthorityStringify([...expectedKeys].sort(compare))
  ) throw conflict(requiredGate)
}

function validRef(value: unknown): value is VisualIntelligenceEvidenceRef {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const ref = value as Partial<VisualIntelligenceEvidenceRef>
  return safeId(ref.id)
    && Number.isSafeInteger(ref.version) && Number(ref.version) > 0
    && typeof ref.contentHash === 'string'
    && /^sha256:[a-f0-9]{64}$/u.test(ref.contentHash)
}

function safeId(value: unknown): value is string {
  return typeof value === 'string'
    && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u.test(value)
    && !value.includes('..')
}

function safeVersion(value: unknown): value is string {
  return typeof value === 'string'
    && /^[A-Za-z0-9][A-Za-z0-9._:+-]{0,239}$/u.test(value)
}

function rawDigestRef(id: string, digest: string) {
  return Object.freeze({ id, version: 1, contentHash: `sha256:${digest}` })
}

function sameRef(
  left: VisualIntelligenceEvidenceRef,
  right: VisualIntelligenceEvidenceRef,
): boolean {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}

function compare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child)
    }
  }
  return value
}

function conflict(requiredGate: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_CONFLICT',
    'The fixed L4 six-tool output conflicts with canonical authority.',
    409,
    { requiredGate },
  )
}

function notReady(requiredGate: string): ApiError {
  return new ApiError(
    'TOOL_NOT_READY',
    'The fixed L4 six-tool executor is not ready.',
    503,
    { requiredGate },
  )
}

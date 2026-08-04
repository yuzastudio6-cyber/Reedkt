import { createHash } from 'node:crypto'

import { z } from 'zod'

import type {
  VisualIntelligenceEvidenceRef,
} from '../../src/types/visual-intelligence'
import { ApiError } from '../errors/api-error'
import {
  VISUAL_INTELLIGENCE_CANONICAL_TOOL_OPERATION_IDS,
} from '../visual-intelligence/visual-intelligence-orchestra-capability-manifest'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import type {
  CanonicalSourceAnalysisL4VisualEvidenceResult,
} from './canonical-source-analysis-l4-visual-evidence-repository'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const
CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_TOOL_ARTIFACT_VERSION =
  'canonical-source-analysis-l4-visual-evidence-tool-artifact-v1' as const
export const
CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_TOOL_ARTIFACT_READ_PORT_VERSION =
  'canonical-source-analysis-l4-visual-evidence-tool-artifact-read-port-v1' as const
export const
CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_TOOL_ARTIFACT_OWNER_VERSION =
  'canonical-source-analysis-l4-visual-evidence-tool-artifact-owner-v1' as const

const DEFAULT_PREFIX =
  'private/orchestra/v1/source-analysis-l4-visual-evidence-tool-artifacts'
const MAXIMUM_RECORD_BYTES = 32 * 1024 * 1024
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const positiveInteger = z.number().int().positive().safe()
const nonnegativeInteger = z.number().int().nonnegative().safe()
const basisPoints = z.number().int().min(0).max(10_000)
const evidenceRefSchema = z.object({
  id: safeId,
  version: positiveInteger,
  contentHash: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
}).strict()
const roles = [
  'private_media_transform',
  'scene_detection',
  'pixel_measurement',
  'exact_visible_text',
  'sampling_policy',
] as const
export const CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_TOOL_ARTIFACT_ROLES =
  Object.freeze([...roles])
export type CanonicalSourceAnalysisL4VisualEvidenceToolArtifactRole =
  typeof roles[number]

const roleDefinitions = Object.freeze({
  private_media_transform: {
    tool: 'ffmpeg',
    operationId: VISUAL_INTELLIGENCE_CANONICAL_TOOL_OPERATION_IDS.ffmpeg,
  },
  scene_detection: {
    tool: 'pyscenedetect',
    operationId:
      VISUAL_INTELLIGENCE_CANONICAL_TOOL_OPERATION_IDS.pyscenedetect,
  },
  pixel_measurement: {
    tool: 'opencv',
    operationId: VISUAL_INTELLIGENCE_CANONICAL_TOOL_OPERATION_IDS.opencv,
  },
  exact_visible_text: {
    tool: 'ocr',
    operationId: VISUAL_INTELLIGENCE_CANONICAL_TOOL_OPERATION_IDS.paddleocr,
  },
  sampling_policy: {
    tool: 'ffmpeg',
    operationId: VISUAL_INTELLIGENCE_CANONICAL_TOOL_OPERATION_IDS.ffmpeg,
  },
} as const)

const transformPayloadSchema = z.object({
  kind: z.literal('private_media_transform'),
  analysisRepresentationRef: evidenceRefSchema,
  outputWidth: positiveInteger.max(16_384),
  outputHeight: positiveInteger.max(16_384),
  decodedCanonicalFrameCount: positiveInteger,
  frameMapDigestSha256: rawSha256,
  nvdecGpuDecodeUsed: z.literal(true),
  cpuVideoDecodeUsed: z.literal(false),
  missingCanonicalFrameCount: z.literal(0),
}).strict()
const scenePayloadSchema = z.object({
  kind: z.literal('scene_detection'),
  sceneAnalysisProxyRef: evidenceRefSchema,
  scenes: z.array(z.object({
    sceneId: safeId,
    startFrame: nonnegativeInteger,
    endFrameExclusive: positiveInteger,
    boundaryConfidenceBasisPoints: basisPoints,
  }).strict()).min(1).max(4_096),
  completeTimelineCoverage: z.literal(true),
  gpuDecodedProxyUsed: z.literal(true),
  cpuVideoDecodeUsed: z.literal(false),
}).strict()
const pixelPayloadSchema = z.object({
  kind: z.literal('pixel_measurement'),
  measurements: z.array(z.object({
    sceneId: safeId,
    sampledFrameCount: positiveInteger.max(65_536),
    meanLumaBasisPoints: basisPoints,
    motionBasisPoints: basisPoints,
    focusBasisPoints: basisPoints,
  }).strict()).min(1).max(4_096),
  completeSceneSetMeasured: z.literal(true),
  gpuDecodedFramesUsed: z.literal(true),
  cpuVideoDecodeUsed: z.literal(false),
}).strict()
const ocrPayloadSchema = z.object({
  kind: z.literal('exact_visible_text'),
  spans: z.array(z.object({
    spanId: safeId,
    sceneId: safeId,
    startFrame: nonnegativeInteger,
    endFrameExclusive: positiveInteger,
    text: z.string().min(1).max(2_048)
      .refine((value) => !/[\0]/u.test(value)),
    confidenceBasisPoints: basisPoints,
    editorDirectedInstructionCandidate: z.boolean(),
  }).strict()).max(16_384),
  textContentIsUntrustedMediaEvidence: z.literal(true),
  instructionsFromTextAreNeverExecuted: z.literal(true),
  paddleGpuInferenceUsed: z.literal(true),
  cpuInferenceUsed: z.literal(false),
}).strict()
const samplingPayloadSchema = z.object({
  kind: z.literal('sampling_policy'),
  samples: z.array(z.object({
    sampleId: safeId,
    sceneId: safeId,
    frame: nonnegativeInteger,
    reason: z.enum([
      'scene_entry', 'scene_midpoint', 'scene_exit',
      'visible_text', 'motion_peak',
    ]),
  }).strict()).min(1).max(65_536),
  completeSceneCoverage: z.literal(true),
  highDetail: z.literal(true),
  everyTimelineFrameInspected: z.literal(false),
  completeTimePixelInspectionClaimAllowed: z.literal(false),
}).strict()
const payloadSchema = z.discriminatedUnion('kind', [
  transformPayloadSchema,
  scenePayloadSchema,
  pixelPayloadSchema,
  ocrPayloadSchema,
  samplingPayloadSchema,
])

const artifactWithoutDigestSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_TOOL_ARTIFACT_VERSION,
  ),
  source: z.literal('canonical_l4_source_visual_evidence_gpu_tool_owner'),
  evidenceClass: z.literal('canonical_private_reread'),
  invocationId: safeId,
  role: z.enum(roles),
  tool: z.enum(['ffmpeg', 'pyscenedetect', 'opencv', 'ocr']),
  operationId: safeId,
  toolVersion: z.string().trim().min(1).max(240),
  runtimeReleaseRef: evidenceRefSchema,
  executionRef: evidenceRefSchema,
  sourceObjectIdentityDigestSha256: rawSha256,
  sourceTimelineDigestSha256: rawSha256,
  sourceProbeAuthorityRef: evidenceRefSchema,
  sourceDurationFrames: positiveInteger,
  sourceWidth: positiveInteger.max(16_384),
  sourceHeight: positiveInteger.max(16_384),
  sourceFrameAuthorityDigestSha256: rawSha256,
  payload: payloadSchema,
  acceleratorClass: z.literal('nvidia_l4'),
  allocatedGpuCount: z.literal(1),
  exactSourceChecksumBound: z.literal(true),
  exactCanonicalResultRereadVerified: z.literal(true),
  substantiveGpuExecutionVerified: z.literal(true),
  substantiveCpuMediaProcessingUsed: z.literal(false),
  runtimeNetworkDownloadPerformed: z.literal(false),
  callerPathUrlBytesCommandOrEnvironmentAccepted: z.literal(false),
  customerCreditMutated: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()
const artifactSchema = artifactWithoutDigestSchema.extend({
  artifactDigestSha256: rawSha256,
}).strict()
export type CanonicalSourceAnalysisL4VisualEvidenceToolArtifact = z.infer<
  typeof artifactSchema
>

const recordWithoutDigestSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_TOOL_ARTIFACT_OWNER_VERSION,
  ),
  recordKind: z.literal('tool_artifact'),
  artifact: artifactSchema,
}).strict()
const recordSchema = recordWithoutDigestSchema.extend({
  recordDigestSha256: rawSha256,
}).strict()

export interface CanonicalSourceAnalysisL4VisualEvidenceToolArtifactReadPort {
  readonly schemaVersion: typeof
  CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_TOOL_ARTIFACT_READ_PORT_VERSION
  readExact(
    invocationId: string,
    role: CanonicalSourceAnalysisL4VisualEvidenceToolArtifactRole,
  ): Promise<CanonicalSourceAnalysisL4VisualEvidenceToolArtifact | null>
}

export interface CanonicalSourceAnalysisL4VisualEvidenceToolArtifactOwner
  extends CanonicalSourceAnalysisL4VisualEvidenceToolArtifactReadPort {
  readonly ownerVersion: typeof
  CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_TOOL_ARTIFACT_OWNER_VERSION
  persistCreateOnly(
    artifact: CanonicalSourceAnalysisL4VisualEvidenceToolArtifact,
  ): Promise<Readonly<{
    disposition: 'created' | 'identical_replay'
    artifactRef: VisualIntelligenceEvidenceRef
    exactCreateOnlyRereadVerified: true
    gpuJobStarted: false
    providerCalled: false
    customerCreditMutated: false
    publicDeliveryGranted: false
    productionAuthorityGranted: false
  }>>
}

export function createCanonicalSourceAnalysisL4VisualEvidenceToolArtifact(
  input: Omit<z.input<typeof artifactWithoutDigestSchema>,
    'schemaVersion' | 'source' | 'evidenceClass'>,
): CanonicalSourceAnalysisL4VisualEvidenceToolArtifact {
  assertPlainSerializedData(input, 'source_visual_tool_artifact_input')
  const payload = artifactWithoutDigestSchema.parse({
    schemaVersion:
      CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_TOOL_ARTIFACT_VERSION,
    source: 'canonical_l4_source_visual_evidence_gpu_tool_owner',
    evidenceClass: 'canonical_private_reread',
    ...input,
  })
  assertArtifactSemantics(payload)
  return assertCanonicalSourceAnalysisL4VisualEvidenceToolArtifact({
    ...payload,
    artifactDigestSha256: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalSourceAnalysisL4VisualEvidenceToolArtifact(
  value: unknown,
): CanonicalSourceAnalysisL4VisualEvidenceToolArtifact {
  assertPlainSerializedData(value, 'source_visual_tool_artifact')
  const artifact = artifactSchema.parse(value)
  const { artifactDigestSha256, ...payload } = artifact
  if (artifactDigestSha256 !== sha256AuthorityValue(payload)) {
    throw conflict('source_visual_tool_artifact_digest_invalid')
  }
  assertArtifactSemantics(payload)
  return deepFreeze(structuredClone(artifact))
}

export function createCanonicalSourceAnalysisL4VisualEvidenceToolArtifactOwner(
  input: Readonly<{
    objectPort: CanonicalCreateOnlyJsonObjectPort
    prefix?: string
  }>,
): CanonicalSourceAnalysisL4VisualEvidenceToolArtifactOwner {
  if (
    typeof input.objectPort?.createOnly !== 'function'
    || typeof input.objectPort?.readExact !== 'function'
  ) throw notReady('source_visual_tool_artifact_object_port_invalid')
  const prefix = normalizePrefix(input.prefix ?? DEFAULT_PREFIX)
  const readExact = async (
    rawInvocationId: string,
    rawRole: CanonicalSourceAnalysisL4VisualEvidenceToolArtifactRole,
  ) => {
    const invocationId = safeId.parse(rawInvocationId)
    const role = z.enum(roles).parse(rawRole)
    const body = await input.objectPort.readExact(
      `${prefix}/${invocationId}/${role}.json`,
    )
    if (!body) return null
    if (!Buffer.isBuffer(body) || body.byteLength < 2
      || body.byteLength > MAXIMUM_RECORD_BYTES) {
      throw conflict('source_visual_tool_artifact_bytes_invalid')
    }
    let parsed: unknown
    try {
      parsed = JSON.parse(body.toString('utf8'))
    } catch {
      throw conflict('source_visual_tool_artifact_json_invalid')
    }
    assertPlainSerializedData(parsed, 'source_visual_tool_artifact_record')
    const record = recordSchema.parse(parsed)
    const { recordDigestSha256, ...payload } = record
    if (
      recordDigestSha256 !== sha256AuthorityValue(payload)
      || record.artifact.invocationId !== invocationId
      || record.artifact.role !== role
      || body.toString('utf8') !== stableAuthorityStringify(record)
    ) throw conflict('source_visual_tool_artifact_record_invalid')
    return structuredClone(
      assertCanonicalSourceAnalysisL4VisualEvidenceToolArtifact(
        record.artifact,
      ),
    )
  }
  return Object.freeze({
    schemaVersion:
      CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_TOOL_ARTIFACT_READ_PORT_VERSION,
    ownerVersion:
      CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_TOOL_ARTIFACT_OWNER_VERSION,
    async persistCreateOnly(rawArtifact) {
      const artifact =
        assertCanonicalSourceAnalysisL4VisualEvidenceToolArtifact(rawArtifact)
      const payload = recordWithoutDigestSchema.parse({
        schemaVersion:
          CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_TOOL_ARTIFACT_OWNER_VERSION,
        recordKind: 'tool_artifact',
        artifact,
      })
      const record = recordSchema.parse({
        ...payload,
        recordDigestSha256: sha256AuthorityValue(payload),
      })
      const body = Buffer.from(stableAuthorityStringify(record), 'utf8')
      if (body.byteLength > MAXIMUM_RECORD_BYTES) {
        throw conflict('source_visual_tool_artifact_record_too_large')
      }
      const created = await input.objectPort.createOnly({
        objectPath:
          `${prefix}/${artifact.invocationId}/${artifact.role}.json`,
        body,
        contentSha256: createHash('sha256').update(body).digest('hex'),
      })
      const reread = await readExact(artifact.invocationId, artifact.role)
      if (!reread || stableAuthorityStringify(reread) !==
        stableAuthorityStringify(artifact)) {
        throw conflict('source_visual_tool_artifact_reread_mismatch')
      }
      return Object.freeze({
        disposition: created === 'created'
          ? 'created' as const
          : 'identical_replay' as const,
        artifactRef:
          getCanonicalSourceAnalysisL4VisualEvidenceToolArtifactRef(artifact),
        exactCreateOnlyRereadVerified: true as const,
        gpuJobStarted: false as const,
        providerCalled: false as const,
        customerCreditMutated: false as const,
        publicDeliveryGranted: false as const,
        productionAuthorityGranted: false as const,
      })
    },
    readExact,
  })
}

export function assertCanonicalSourceAnalysisL4VisualEvidenceToolArtifactSet(
  input: Readonly<{
    result: CanonicalSourceAnalysisL4VisualEvidenceResult
    artifacts: readonly CanonicalSourceAnalysisL4VisualEvidenceToolArtifact[]
  }>,
): ReadonlyArray<CanonicalSourceAnalysisL4VisualEvidenceToolArtifact> {
  const artifacts = input.artifacts.map(
    assertCanonicalSourceAnalysisL4VisualEvidenceToolArtifact,
  )
  if (stableAuthorityStringify(artifacts.map((item) => item.role)) !==
    stableAuthorityStringify(roles)) {
    throw conflict('source_visual_tool_artifact_set_order_invalid')
  }
  for (const artifact of artifacts) {
    const evidence = input.result.toolEvidence.find(
      (item) => item.role === artifact.role,
    )
    if (
      !evidence
      || artifact.invocationId !== input.result.invocationId
      || artifact.sourceObjectIdentityDigestSha256 !==
        sha256AuthorityValue(input.result.sourceObject)
      || artifact.sourceTimelineDigestSha256 !==
        sha256AuthorityValue(sourceTimelineFromResult(input.result))
      || artifact.sourceDurationFrames !== input.result.scope.durationFrames
      || artifact.sourceWidth !== input.result.sourceObject.width
      || artifact.sourceHeight !== input.result.sourceObject.height
      || artifact.sourceFrameAuthorityDigestSha256 !==
        sha256AuthorityValue(input.result.scope.sourceFrameAuthority)
      || !sameRef(artifact.sourceProbeAuthorityRef,
        input.result.scope.sourceProbeAuthorityRef)
      || artifact.tool !== evidence.tool
      || artifact.operationId !== evidence.operationId
      || artifact.toolVersion !== evidence.toolVersion
      || !sameRef(artifact.runtimeReleaseRef, evidence.runtimeReleaseRef)
      || !sameRef(artifact.executionRef, evidence.executionRef)
      || !sameRef(
        getCanonicalSourceAnalysisL4VisualEvidenceToolArtifactRef(artifact),
        evidence.evidenceRef,
      )
    ) throw conflict('source_visual_tool_artifact_result_binding_invalid')
  }
  const sceneArtifact = artifacts[1]!
  const pixelArtifact = artifacts[2]!
  const ocrArtifact = artifacts[3]!
  const samplingArtifact = artifacts[4]!
  if (
    sceneArtifact.payload.kind !== 'scene_detection'
    || pixelArtifact.payload.kind !== 'pixel_measurement'
    || ocrArtifact.payload.kind !== 'exact_visible_text'
    || samplingArtifact.payload.kind !== 'sampling_policy'
  ) throw conflict('source_visual_tool_artifact_set_kind_invalid')
  const scenes = sceneArtifact.payload.scenes
  const sceneIds = scenes.map((scene) => scene.sceneId)
  if (
    stableAuthorityStringify(pixelArtifact.payload.measurements.map(
      (item) => item.sceneId,
    )) !== stableAuthorityStringify(sceneIds)
    || sceneIds.some((sceneId) => !samplingArtifact.payload.samples.some(
      (sample) => sample.sceneId === sceneId,
    ))
    || [...ocrArtifact.payload.spans, ...samplingArtifact.payload.samples]
      .some((item) => {
        const scene = scenes.find((candidate) =>
          candidate.sceneId === item.sceneId)
        const start = 'startFrame' in item ? item.startFrame : item.frame
        const end = 'endFrameExclusive' in item
          ? item.endFrameExclusive
          : item.frame + 1
        return !scene || start < scene.startFrame
          || end > scene.endFrameExclusive
      })
  ) throw conflict('source_visual_tool_artifact_scene_binding_invalid')
  return deepFreeze(structuredClone(artifacts))
}

export function projectCanonicalSourceAnalysisL4VisualEvidenceToolArtifact(
  artifact: CanonicalSourceAnalysisL4VisualEvidenceToolArtifact,
): string {
  const value = assertCanonicalSourceAnalysisL4VisualEvidenceToolArtifact(
    artifact,
  )
  const payload = value.payload.kind === 'scene_detection'
    ? {
        ...value.payload,
        scenes: value.payload.scenes.slice(0, 64),
        omittedSceneCount: Math.max(0, value.payload.scenes.length - 64),
      }
    : value.payload.kind === 'pixel_measurement'
      ? {
          ...value.payload,
          measurements: value.payload.measurements.slice(0, 64),
          omittedMeasurementCount: Math.max(
            0,
            value.payload.measurements.length - 64,
          ),
        }
      : value.payload.kind === 'exact_visible_text'
        ? {
        ...value.payload,
        spans: value.payload.spans.slice(0, 32).map((span) => ({
          spanId: span.spanId,
          sceneId: span.sceneId,
          startFrame: span.startFrame,
          endFrameExclusive: span.endFrameExclusive,
          textDigestSha256: sha256AuthorityValue(span.text),
          characterCount: span.text.length,
          confidenceBasisPoints: span.confidenceBasisPoints,
          editorDirectedInstructionCandidate:
            span.editorDirectedInstructionCandidate,
        })),
        omittedSpanCount: Math.max(0, value.payload.spans.length - 32),
      }
    : value.payload.kind === 'sampling_policy'
      ? {
          ...value.payload,
          samples: value.payload.samples.slice(0, 96),
          omittedSampleCount: Math.max(0, value.payload.samples.length - 96),
        }
      : value.payload
  return stableAuthorityStringify({
    schemaVersion: 'visual-intelligence-deterministic-tool-projection-v1',
    artifactRef: getCanonicalSourceAnalysisL4VisualEvidenceToolArtifactRef(
      value,
    ),
    role: value.role,
    sourceDurationFrames: value.sourceDurationFrames,
    payload,
    mediaTextIsUntrustedContentNotInstructions: true,
    exactCanonicalArtifactRereadVerified: true,
  })
}

function assertArtifactSemantics(
  artifact: z.infer<typeof artifactWithoutDigestSchema>,
): void {
  const expected = roleDefinitions[artifact.role]
  if (
    artifact.tool !== expected.tool
    || artifact.operationId !== expected.operationId
    || artifact.payload.kind !== artifact.role
  ) throw conflict('source_visual_tool_artifact_role_invalid')
  if (artifact.payload.kind === 'private_media_transform') {
    if (artifact.payload.decodedCanonicalFrameCount !==
      artifact.sourceDurationFrames) {
      throw conflict('source_visual_tool_artifact_transform_coverage_invalid')
    }
  } else if (artifact.payload.kind === 'scene_detection') {
    const ids = artifact.payload.scenes.map((scene) => scene.sceneId)
    if (
      new Set(ids).size !== ids.length
      || artifact.payload.scenes[0]?.startFrame !== 0
      || artifact.payload.scenes.at(-1)?.endFrameExclusive !==
        artifact.sourceDurationFrames
      || artifact.payload.scenes.some((scene, index) =>
        scene.startFrame >= scene.endFrameExclusive
        || (index > 0 && artifact.payload.scenes[index - 1]
          ?.endFrameExclusive !== scene.startFrame))
    ) throw conflict('source_visual_tool_artifact_scene_coverage_invalid')
  } else if (artifact.payload.kind === 'pixel_measurement') {
    const ids = artifact.payload.measurements.map((item) => item.sceneId)
    if (new Set(ids).size !== ids.length) {
      throw conflict('source_visual_tool_artifact_pixel_duplicate_invalid')
    }
  } else if (artifact.payload.kind === 'exact_visible_text') {
    const ids = artifact.payload.spans.map((item) => item.spanId)
    if (
      new Set(ids).size !== ids.length
      || artifact.payload.spans.some((item, index) =>
        item.startFrame >= item.endFrameExclusive
        || item.endFrameExclusive > artifact.sourceDurationFrames
        || (index > 0 && item.startFrame <
          artifact.payload.spans[index - 1]!.startFrame))
    ) throw conflict('source_visual_tool_artifact_ocr_order_invalid')
  } else {
    const ids = artifact.payload.samples.map((item) => item.sampleId)
    if (
      new Set(ids).size !== ids.length
      || artifact.payload.samples.some((item, index) =>
        item.frame >= artifact.sourceDurationFrames
        || (index > 0 && item.frame <
          artifact.payload.samples[index - 1]!.frame))
    ) throw conflict('source_visual_tool_artifact_sampling_order_invalid')
  }
}

function sourceTimelineFromResult(
  result: CanonicalSourceAnalysisL4VisualEvidenceResult,
) {
  return {
    sourceSequenceItemId: result.scope.sourceSequenceItemId,
    mediaAssetId: result.scope.mediaAssetId,
    uploadedOrder: result.scope.uploadedOrder,
    durationFrames: result.scope.durationFrames,
    sourceFrameAuthority: result.scope.sourceFrameAuthority,
    sourceProbeAuthorityRef: result.scope.sourceProbeAuthorityRef,
  }
}

export function getCanonicalSourceAnalysisL4VisualEvidenceToolArtifactRef(
  artifact: CanonicalSourceAnalysisL4VisualEvidenceToolArtifact,
): VisualIntelligenceEvidenceRef {
  return Object.freeze({
    id: `${artifact.invocationId}.${artifact.role}.artifact`,
    version: 1,
    contentHash: `sha256:${artifact.artifactDigestSha256}`,
  })
}

function sameRef(
  left: VisualIntelligenceEvidenceRef,
  right: VisualIntelligenceEvidenceRef,
): boolean {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}

function normalizePrefix(value: string): string {
  const prefix = value.replace(/^\/+|\/+$/gu, '')
  if (!prefix || prefix.includes('..') || prefix.includes('//')
    || !/^[A-Za-z0-9][A-Za-z0-9._/:-]{0,1023}$/u.test(prefix)) {
    throw notReady('source_visual_tool_artifact_prefix_invalid')
  }
  return prefix
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
    'Canonical L4 source visual tool evidence conflicts with authority.',
    409,
    { requiredGate },
  )
}

function notReady(requiredGate: string): ApiError {
  return new ApiError(
    'TOOL_NOT_READY',
    'Canonical L4 source visual tool evidence is not ready.',
    503,
    { requiredGate },
  )
}

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
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const
CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_TOOLCHAIN_QUALIFICATION_VERSION =
  'canonical-source-analysis-l4-visual-evidence-toolchain-qualification-v2' as const
export const
CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_TOOLCHAIN_QUALIFICATION_OWNER_VERSION =
  'canonical-source-analysis-l4-visual-evidence-toolchain-qualification-owner-v2' as const
export const
CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_TOOLCHAIN_QUALIFICATION_READ_PORT_VERSION =
  'canonical-source-analysis-l4-visual-evidence-toolchain-qualification-read-port-v2' as const

const DEFAULT_PREFIX =
  'private/orchestra/v1/source-analysis-l4-visual-evidence-toolchain-qualifications'
const MAXIMUM_RECORD_BYTES = 2 * 1024 * 1024
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:+-]*$/u)
  .refine((value) => !value.includes('..'))
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const positiveInteger = z.number().int().positive().safe()
const timestamp = z.string().datetime({ offset: true })
const evidenceRefSchema = z.object({
  id: safeId,
  version: positiveInteger,
  contentHash: prefixedSha256,
}).strict()
const roles = [
  'media_probe', 'private_media_transform', 'scene_detection',
  'pixel_measurement', 'exact_visible_text', 'sampling_policy',
] as const
export const
CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_QUALIFIED_TOOL_VERSIONS =
  Object.freeze({
    media_probe: 'canonical-source-probe-reread-v1',
    private_media_transform:
      'ffmpeg-cuda-nvdec-nvenc-private-qualified-v1',
    scene_detection:
      'PySceneDetect-0.7.1-adaptive-gpu-metric-adapter-v1',
    pixel_measurement:
      'OpenCV-CUDA-cudacodec-private-qualified-v1',
    exact_visible_text:
      'PaddleOCR-3.7.0-PP-OCRv6-GPU-private-qualified-v1',
    sampling_policy:
      'ffmpeg-cuda-high-detail-sampling-policy-v1',
  } as const)
const toolDefinitions = Object.freeze({
  media_probe: {
    tool: 'ffprobe',
    operationId: VISUAL_INTELLIGENCE_CANONICAL_TOOL_OPERATION_IDS.ffprobe,
  },
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

const qualificationToolSchema = z.object({
  role: z.enum(roles),
  tool: z.enum(['ffprobe', 'ffmpeg', 'pyscenedetect', 'opencv', 'ocr']),
  operationId: safeId,
  toolVersion: safeId,
  runtimeReleaseRef: evidenceRefSchema,
  immutableToolArtifactSha256: rawSha256,
  gpuExecutionEvidenceRef: evidenceRefSchema,
}).strict()
const qualificationWithoutDigestSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_TOOLCHAIN_QUALIFICATION_VERSION,
  ),
  source: z.literal(
    'canonical_l4_source_visual_evidence_toolchain_qualification_owner',
  ),
  evidenceClass: z.literal('canonical_private_reread'),
  qualificationId: safeId,
  projectId: z.literal('reeditpro'),
  runtimeRegion: z.literal('us-central1'),
  routeProfileId: z.literal(
    'quality_l4_user_triggered_standard_media_job_v1',
  ),
  acceleratorClass: z.literal('nvidia_l4'),
  configuredGpuType: z.literal('nvidia-l4'),
  runtimePlatform: z.literal('linux_amd64'),
  immutableImageRef: evidenceRefSchema,
  immutableImageDigest: prefixedSha256,
  sourceCommitSha: z.string().regex(/^[a-f0-9]{40}$/u),
  sourceTreeSha: z.string().regex(/^[a-f0-9]{40}$/u),
  imageBuildRef: evidenceRefSchema,
  spdx23SbomRef: evidenceRefSchema,
  vulnerabilityScanRef: evidenceRefSchema,
  signatureVerificationRef: evidenceRefSchema,
  slsaProvenanceRef: evidenceRefSchema,
  qualificationFixtureSetRef: evidenceRefSchema,
  toolReleases: z.array(qualificationToolSchema).length(roles.length),
  qualificationRunRefs: z.array(evidenceRefSchema).length(3),
  deterministicOutputDigestSha256: rawSha256,
  immutableImageDigestRereadVerified: z.literal(true),
  spdx23SbomRereadVerified: z.literal(true),
  criticalHighOrUnknownVulnerabilitiesAbsent: z.literal(true),
  kmsSignatureVerified: z.literal(true),
  slsaProvenanceVerified: z.literal(true),
  actualNvidiaL4Observed: z.literal(true),
  ffprobeMetadataOnlyVerified: z.literal(true),
  ffmpegNvdecGpuDecodeVerified: z.literal(true),
  ffmpegNvencGpuTransformVerified: z.literal(true),
  pySceneDetectGpuMetricAdapterVerified: z.literal(true),
  openCvCudaExecutionVerified: z.literal(true),
  paddleOcrGpuInferenceVerified: z.literal(true),
  exactSourceFrameAccountingVerified: z.literal(true),
  completeTimelineSceneCoverageVerified: z.literal(true),
  embeddedMediaInstructionsRemainUntrusted: z.literal(true),
  substantiveCpuMediaProcessingUsed: z.literal(false),
  runtimeNetworkDownloadPerformed: z.literal(false),
  callerPathUrlBytesCommandOrEnvironmentAccepted: z.literal(false),
  minimumIdleInstances: z.literal(0),
  userTriggeredOnly: z.literal(true),
  customerCreditMutated: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  qualifiedAt: timestamp,
}).strict()
const qualificationSchema = qualificationWithoutDigestSchema.extend({
  qualificationDigestSha256: rawSha256,
}).strict()
export type CanonicalSourceAnalysisL4VisualEvidenceToolchainQualification =
  z.infer<typeof qualificationSchema>

const recordWithoutDigestSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_TOOLCHAIN_QUALIFICATION_OWNER_VERSION,
  ),
  recordKind: z.literal('l4_visual_evidence_toolchain_qualification'),
  qualification: qualificationSchema,
}).strict()
const recordSchema = recordWithoutDigestSchema.extend({
  recordDigestSha256: rawSha256,
}).strict()

export interface CanonicalSourceAnalysisL4VisualEvidenceToolchainQualificationReadPort {
  readonly schemaVersion: typeof
  CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_TOOLCHAIN_QUALIFICATION_READ_PORT_VERSION
  readExact(
    qualificationRef: VisualIntelligenceEvidenceRef,
  ): Promise<CanonicalSourceAnalysisL4VisualEvidenceToolchainQualification | null>
}

export interface CanonicalSourceAnalysisL4VisualEvidenceToolchainQualificationOwner extends
  CanonicalSourceAnalysisL4VisualEvidenceToolchainQualificationReadPort {
  readonly ownerVersion: typeof
  CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_TOOLCHAIN_QUALIFICATION_OWNER_VERSION
  persistCreateOnly(
    qualification: CanonicalSourceAnalysisL4VisualEvidenceToolchainQualification,
  ): Promise<Readonly<{
    disposition: 'created' | 'identical_replay'
    qualificationRef: VisualIntelligenceEvidenceRef
    exactCreateOnlyRereadVerified: true
    customerCreditMutated: false
    publicDeliveryGranted: false
    productionAuthorityGranted: false
  }>>
}

export function createCanonicalSourceAnalysisL4VisualEvidenceToolchainQualification(
  input: Omit<CanonicalSourceAnalysisL4VisualEvidenceToolchainQualification,
    'schemaVersion' | 'source' | 'evidenceClass' |
    'qualificationDigestSha256'>,
): CanonicalSourceAnalysisL4VisualEvidenceToolchainQualification {
  assertPlainSerializedData(input, 'l4_visual_toolchain_qualification_input')
  const payload = qualificationWithoutDigestSchema.parse({
    schemaVersion:
      CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_TOOLCHAIN_QUALIFICATION_VERSION,
    source:
      'canonical_l4_source_visual_evidence_toolchain_qualification_owner',
    evidenceClass: 'canonical_private_reread',
    ...structuredClone(input),
  })
  assertQualificationSemantics(payload)
  return assertCanonicalSourceAnalysisL4VisualEvidenceToolchainQualification({
    ...payload,
    qualificationDigestSha256: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalSourceAnalysisL4VisualEvidenceToolchainQualification(
  value: unknown,
): CanonicalSourceAnalysisL4VisualEvidenceToolchainQualification {
  assertPlainSerializedData(value, 'l4_visual_toolchain_qualification')
  const qualification = qualificationSchema.parse(value)
  const { qualificationDigestSha256, ...payload } = qualification
  if (
    qualificationDigestSha256 !== sha256AuthorityValue(payload)
  ) throw conflict('l4_visual_toolchain_qualification_digest_invalid')
  assertQualificationSemantics(payload)
  return deepFreeze(structuredClone(qualification))
}

export function getCanonicalSourceAnalysisL4VisualEvidenceToolchainQualificationRef(
  value: CanonicalSourceAnalysisL4VisualEvidenceToolchainQualification,
): VisualIntelligenceEvidenceRef {
  const qualification =
    assertCanonicalSourceAnalysisL4VisualEvidenceToolchainQualification(value)
  return Object.freeze({
    id: qualification.qualificationId,
    version: 1,
    contentHash: `sha256:${qualification.qualificationDigestSha256}`,
  })
}

export function createCanonicalSourceAnalysisL4VisualEvidenceToolchainQualificationOwner(
  input: Readonly<{
    objectPort: CanonicalCreateOnlyJsonObjectPort
    prefix?: string
  }>,
): CanonicalSourceAnalysisL4VisualEvidenceToolchainQualificationOwner {
  if (
    typeof input.objectPort?.createOnly !== 'function'
    || typeof input.objectPort?.readExact !== 'function'
  ) throw notReady('l4_visual_toolchain_qualification_object_port_invalid')
  const prefix = normalizePrefix(input.prefix ?? DEFAULT_PREFIX)
  const readExact = async (untrustedRef: VisualIntelligenceEvidenceRef) => {
    const qualificationRef = evidenceRefSchema.parse(untrustedRef)
    const body = await input.objectPort.readExact(
      `${prefix}/${qualificationRef.id}.json`,
    )
    if (!body) return null
    if (!Buffer.isBuffer(body) || body.byteLength < 2
      || body.byteLength > MAXIMUM_RECORD_BYTES) {
      throw conflict('l4_visual_toolchain_qualification_bytes_invalid')
    }
    let parsed: unknown
    try {
      parsed = JSON.parse(body.toString('utf8'))
    } catch {
      throw conflict('l4_visual_toolchain_qualification_json_invalid')
    }
    assertPlainSerializedData(parsed, 'l4_visual_toolchain_qualification_record')
    const record = recordSchema.parse(parsed)
    const { recordDigestSha256, ...payload } = record
    const qualification =
      assertCanonicalSourceAnalysisL4VisualEvidenceToolchainQualification(
        record.qualification,
      )
    const canonicalRef =
      getCanonicalSourceAnalysisL4VisualEvidenceToolchainQualificationRef(
        qualification,
      )
    if (
      recordDigestSha256 !== sha256AuthorityValue(payload)
      || !sameRef(qualificationRef, canonicalRef)
      || body.toString('utf8') !== stableAuthorityStringify(record)
    ) throw conflict('l4_visual_toolchain_qualification_record_invalid')
    return structuredClone(qualification)
  }
  return Object.freeze({
    schemaVersion:
      CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_TOOLCHAIN_QUALIFICATION_READ_PORT_VERSION,
    ownerVersion:
      CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_TOOLCHAIN_QUALIFICATION_OWNER_VERSION,
    readExact,
    async persistCreateOnly(
      rawQualification:
        CanonicalSourceAnalysisL4VisualEvidenceToolchainQualification,
    ) {
      const qualification =
        assertCanonicalSourceAnalysisL4VisualEvidenceToolchainQualification(
          rawQualification,
        )
      const qualificationRef =
        getCanonicalSourceAnalysisL4VisualEvidenceToolchainQualificationRef(
          qualification,
        )
      const payload = recordWithoutDigestSchema.parse({
        schemaVersion:
          CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_TOOLCHAIN_QUALIFICATION_OWNER_VERSION,
        recordKind: 'l4_visual_evidence_toolchain_qualification',
        qualification,
      })
      const record = recordSchema.parse({
        ...payload,
        recordDigestSha256: sha256AuthorityValue(payload),
      })
      const body = Buffer.from(stableAuthorityStringify(record), 'utf8')
      const disposition = await input.objectPort.createOnly({
        objectPath: `${prefix}/${qualification.qualificationId}.json`,
        body,
        contentSha256: createHash('sha256').update(body).digest('hex'),
      })
      const reread = await readExact(qualificationRef)
      if (!reread || stableAuthorityStringify(reread) !==
        stableAuthorityStringify(qualification)) {
        throw conflict('l4_visual_toolchain_qualification_reread_mismatch')
      }
      return Object.freeze({
        disposition: disposition === 'created'
          ? 'created' as const
          : 'identical_replay' as const,
        qualificationRef,
        exactCreateOnlyRereadVerified: true as const,
        customerCreditMutated: false as const,
        publicDeliveryGranted: false as const,
        productionAuthorityGranted: false as const,
      })
    },
  })
}

function assertQualificationSemantics(
  qualification: z.infer<typeof qualificationWithoutDigestSchema>,
): void {
  const refs = qualification.qualificationRunRefs
  if (
    qualification.immutableImageRef.contentHash !==
      qualification.immutableImageDigest
    || stableAuthorityStringify(qualification.toolReleases.map((item) =>
      item.role)) !== stableAuthorityStringify(roles)
    || qualification.toolReleases.some((item) => {
      const expected = toolDefinitions[item.role]
      return item.tool !== expected.tool
        || item.operationId !== expected.operationId
        || item.toolVersion !==
          CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_QUALIFIED_TOOL_VERSIONS[
            item.role
          ]
    })
    || new Set(refs.map(refKey)).size !== refs.length
  ) throw conflict('l4_visual_toolchain_qualification_semantics_invalid')
}

function refKey(value: VisualIntelligenceEvidenceRef): string {
  return `${value.id}:${value.version}:${value.contentHash}`
}

function sameRef(
  left: VisualIntelligenceEvidenceRef,
  right: VisualIntelligenceEvidenceRef,
): boolean {
  return refKey(left) === refKey(right)
}

function normalizePrefix(value: string): string {
  const normalized = value.trim().replace(/^\/+|\/+$/gu, '')
  if (!normalized || normalized.includes('..') || normalized.includes('//')) {
    throw notReady('l4_visual_toolchain_qualification_prefix_invalid')
  }
  return normalized
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
    'The L4 visual-evidence toolchain qualification conflicts with canonical authority.',
    409,
    { requiredGate },
  )
}

function notReady(requiredGate: string): ApiError {
  return new ApiError(
    'TOOL_NOT_READY',
    'The L4 visual-evidence toolchain qualification owner is not ready.',
    503,
    { requiredGate },
  )
}

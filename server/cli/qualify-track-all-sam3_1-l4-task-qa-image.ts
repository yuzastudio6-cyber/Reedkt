import { Storage } from '@google-cloud/storage'
import { z } from 'zod'

import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
  type CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalTrackAllSam31L4TaskQaGcpCloudImageBuildRuntime,
} from '../services/canonical-track-all-sam3_1-l4-task-qa-cloud-image-build-runtime'
import {
  createCanonicalTrackAllSam31L4TaskQaGcpCloudImageBuildObservationRuntime,
} from '../services/canonical-track-all-sam3_1-l4-task-qa-cloud-image-build-observation-runtime'
import {
  assertCanonicalSam31ImageSecurityReview,
  canonicalImageSecurityReviewRef,
} from '../services/canonical-sam3_1-cloud-image-supply-chain-evidence-read-service'
import {
  assertCanonicalTrackAllSam31L4TaskQaPrivateQualificationReceipt,
  canonicalTrackAllSam31L4TaskQaPrivateQualificationRef,
} from '../services/canonical-track-all-sam3_1-l4-task-qa-private-qualification'
import {
  qualifyCanonicalTrackAllSam31L4TaskQaImage,
} from '../services/canonical-track-all-sam3_1-l4-task-qa-image-qualification-owner'
import {
  createCanonicalTrackAllSam31L4TaskQaRuntimeReleaseEvidenceRepository,
} from '../services/canonical-track-all-sam3_1-l4-task-qa-runtime-release-publisher'
import {
  createCanonicalCurrentGoogleCloudGpuRateAuthorityRepository,
} from '../services/canonical-current-google-cloud-gpu-rate-authority-repository'
import {
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'

const CONFIRMATION =
  'qualify-weeditpro-track-all-l4-task-qa-image-v1' as const
const PROJECT_ID = 'reeditpro' as const
const CONTROL_PLANE_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const IMAGE_DIGEST =
  '5ccb7b8be3fae729a07cb38663265fe78419f1e273310f57bed092b09b36dd71' as const
const SECURITY_REVIEW_PREFIX =
  'private/track-all/sam3_1/v1/l4-task-qa/image-security-review/v1/reviews' as const
const PRIVATE_QUALIFICATION_PREFIX =
  'private/track-all/sam3_1/v1/l4-task-qa/private-qualification' as const
const MAXIMUM_RECORD_BYTES = 8 * 1024 * 1024

const safeId = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/u)
  .refine((value) => !value.includes('..') && !value.includes('://'))
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const evidenceRefSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: prefixedSha256,
}).strict()
const versionOneEvidenceRefSchema = evidenceRefSchema.extend({
  version: z.literal(1),
}).strict()
const configurationSchema = z.object({
  GOOGLE_CLOUD_PROJECT_ID: z.literal(PROJECT_ID),
  GCS_CONTROL_PLANE_STATE_BUCKET: z.literal(CONTROL_PLANE_BUCKET),
  WEEDITPRO_CONFIRM_TRACK_ALL_L4_IMAGE_QUALIFICATION:
    z.literal(CONFIRMATION),
  imageBuildAuthorityRef: versionOneEvidenceRefSchema,
  imageBuildTerminalRef: versionOneEvidenceRefSchema,
  vulnerabilityScanRef: evidenceRefSchema,
  securityReviewRef: evidenceRefSchema,
  privateQualificationRef: evidenceRefSchema,
  accountEffectiveL4RateAuthorityRef: evidenceRefSchema,
}).strict()

const configuration = configurationSchema.parse({
  GOOGLE_CLOUD_PROJECT_ID: process.env.GOOGLE_CLOUD_PROJECT_ID,
  GCS_CONTROL_PLANE_STATE_BUCKET:
    process.env.GCS_CONTROL_PLANE_STATE_BUCKET,
  WEEDITPRO_CONFIRM_TRACK_ALL_L4_IMAGE_QUALIFICATION:
    process.env.WEEDITPRO_CONFIRM_TRACK_ALL_L4_IMAGE_QUALIFICATION,
  imageBuildAuthorityRef: environmentRef(
    'WEEDITPRO_TRACK_ALL_L4_IMAGE_BUILD_AUTHORITY',
  ),
  imageBuildTerminalRef: environmentRef(
    'WEEDITPRO_TRACK_ALL_L4_IMAGE_BUILD_TERMINAL',
  ),
  vulnerabilityScanRef: environmentRef(
    'WEEDITPRO_TRACK_ALL_L4_IMAGE_VULNERABILITY_SCAN',
  ),
  securityReviewRef: environmentRef(
    'WEEDITPRO_TRACK_ALL_L4_IMAGE_SECURITY_REVIEW',
  ),
  privateQualificationRef: environmentRef(
    'WEEDITPRO_TRACK_ALL_L4_PRIVATE_QUALIFICATION',
  ),
  accountEffectiveL4RateAuthorityRef: environmentRef(
    'WEEDITPRO_L4_STANDARD_ACCOUNT_EFFECTIVE_RATE_AUTHORITY',
  ),
})

const storage = new Storage({ projectId: configuration.GOOGLE_CLOUD_PROJECT_ID })
const objectPort = createCanonicalGcsSourceAnalysisJsonObjectPort({
  storage,
  bucketName: configuration.GCS_CONTROL_PLANE_STATE_BUCKET,
})
const buildRuntime =
  createCanonicalTrackAllSam31L4TaskQaGcpCloudImageBuildRuntime({ storage })
const observationRuntime =
  createCanonicalTrackAllSam31L4TaskQaGcpCloudImageBuildObservationRuntime({
    storage,
  })
const rateRepository =
  createCanonicalCurrentGoogleCloudGpuRateAuthorityRepository({ objectPort })

const receipt = await qualifyCanonicalTrackAllSam31L4TaskQaImage({
  evidenceRefs: {
    imageBuildAuthorityRef: configuration.imageBuildAuthorityRef,
    imageBuildTerminalRef: configuration.imageBuildTerminalRef,
    securityReviewRef: configuration.securityReviewRef,
    privateQualificationRef: configuration.privateQualificationRef,
    accountEffectiveL4RateAuthorityRef:
      configuration.accountEffectiveL4RateAuthorityRef,
  },
  evidenceReadPort: {
    rereadBuildAuthority: (input) =>
      buildRuntime.repository.rereadBuildAuthority({
        authorityRef: versionOneEvidenceRefSchema.parse(input.authorityRef),
      }),
    rereadBuildTerminal: (input) =>
      observationRuntime.repository.rereadTerminal({
        terminalRef: versionOneEvidenceRefSchema.parse(input.terminalRef),
      }),
    rereadSecurityReview: ({ securityReviewRef }) =>
      rereadSecurityReview({
        objectPort,
        vulnerabilityScanRef: configuration.vulnerabilityScanRef,
        securityReviewRef,
      }),
    rereadPrivateQualification: ({ privateQualificationRef }) =>
      rereadPrivateQualification({ objectPort, privateQualificationRef }),
    rereadApprovedCurrentRate: (input) =>
      rateRepository.rereadApprovedCurrentRate(input),
  },
  evidenceRepository:
    createCanonicalTrackAllSam31L4TaskQaRuntimeReleaseEvidenceRepository({
      objectPort,
    }),
})

process.stdout.write(`${JSON.stringify(receipt)}\n`)

async function rereadSecurityReview(input: {
  objectPort: CanonicalCreateOnlyJsonObjectPort
  vulnerabilityScanRef: z.infer<typeof evidenceRefSchema>
  securityReviewRef: z.infer<typeof evidenceRefSchema>
}) {
  const review = await readCanonicalRecord(
    input.objectPort,
    `${SECURITY_REVIEW_PREFIX}/${IMAGE_DIGEST}/${
      input.vulnerabilityScanRef.contentHash.slice(7)
    }.json`,
    assertCanonicalSam31ImageSecurityReview,
  )
  if (!review
    || !sameRef(review.vulnerabilityScanRef, input.vulnerabilityScanRef)
    || !sameRef(canonicalImageSecurityReviewRef(review),
      input.securityReviewRef)) {
    throw new Error('track_all_l4_security_review_exact_reread_failed')
  }
  return review
}

async function rereadPrivateQualification(input: {
  objectPort: CanonicalCreateOnlyJsonObjectPort
  privateQualificationRef: z.infer<typeof evidenceRefSchema>
}) {
  const receipt = await readCanonicalRecord(
    input.objectPort,
    `${PRIVATE_QUALIFICATION_PREFIX}/${input.privateQualificationRef.id}.json`,
    assertCanonicalTrackAllSam31L4TaskQaPrivateQualificationReceipt,
  )
  if (!receipt || !sameRef(
    canonicalTrackAllSam31L4TaskQaPrivateQualificationRef(receipt),
    input.privateQualificationRef,
  )) throw new Error('track_all_l4_private_qualification_exact_reread_failed')
  return receipt
}

async function readCanonicalRecord<T>(
  objectPort: CanonicalCreateOnlyJsonObjectPort,
  objectPath: string,
  parse: (value: unknown) => T,
): Promise<T | null> {
  const bytes = await objectPort.readExact(objectPath)
  if (!bytes) return null
  if (!Buffer.isBuffer(bytes) || bytes.byteLength < 2
    || bytes.byteLength > MAXIMUM_RECORD_BYTES) {
    throw new Error('track_all_l4_image_qualification_record_bytes_invalid')
  }
  let value: unknown
  try {
    value = JSON.parse(bytes.toString('utf8')) as unknown
  } catch {
    throw new Error('track_all_l4_image_qualification_record_json_invalid')
  }
  const record = parse(value)
  if (stableAuthorityStringify(record) !== bytes.toString('utf8')) {
    throw new Error('track_all_l4_image_qualification_record_not_canonical')
  }
  return record
}

function environmentRef(prefix: string) {
  return {
    id: process.env[`${prefix}_ID`],
    version: Number(process.env[`${prefix}_VERSION`]),
    contentHash: process.env[`${prefix}_CONTENT_HASH`],
  }
}

function sameRef(left: unknown, right: unknown): boolean {
  try {
    return stableAuthorityStringify(evidenceRefSchema.parse(left)) ===
      stableAuthorityStringify(evidenceRefSchema.parse(right))
  } catch {
    return false
  }
}

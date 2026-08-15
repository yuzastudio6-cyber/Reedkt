import { createHash } from 'node:crypto'

import { Storage } from '@google-cloud/storage'
import { z } from 'zod'

import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
  type CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalTrackAllSam31L4TaskQaImageSupplyChainEvidenceReadRequest,
} from './canonical-track-all-sam3_1-l4-task-qa-image-supply-chain-evidence-read'
import type {
  CanonicalTrackAllSam31L4TaskQaCloudImageBuildAuthority,
} from './canonical-track-all-sam3_1-l4-task-qa-cloud-image-build-authority'
import type {
  CanonicalTrackAllSam31L4TaskQaCloudImageBuildSubmission,
} from './canonical-track-all-sam3_1-l4-task-qa-cloud-image-build-service'
import type {
  CanonicalTrackAllSam31L4TaskQaCloudImageBuildTerminal,
} from './canonical-track-all-sam3_1-l4-task-qa-cloud-image-build-observation'
import type {
  CanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildAdmission,
  CanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildSubmission,
  CanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildTerminal,
} from './canonical-track-all-sam3_1-l4-task-qa-image-supply-chain-build'
import {
  canonicalImageSecurityReviewRef,
  createCanonicalSam31ImageSecurityReview,
  createCanonicalSam31ImageSupplyChainGoogleReadTransport,
  listCanonicalImageArtifactAnalysisOccurrences,
  verifyCanonicalImageVulnerabilityOccurrences,
  assertCanonicalSam31ImageSecurityReview,
  type CanonicalSam31ImageSecurityReview,
  type CanonicalSam31ImageSecurityReviewReadPort,
  type CanonicalSam31ImageSupplyChainGoogleReadTransport,
} from './canonical-sam3_1-cloud-image-supply-chain-evidence-read-service'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_IMAGE_SECURITY_REVIEW_OPERATOR_AUTHORITY_VERSION =
  'canonical-track-all-sam3_1-l4-task-qa-image-security-review-operator-authority-v1' as const
export const CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_IMAGE_SECURITY_REVIEW_OPERATOR_VERSION =
  'canonical-track-all-sam3_1-l4-task-qa-image-security-review-operator-v1' as const
export const CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_IMAGE_SECURITY_REVIEW_REPOSITORY_VERSION =
  'canonical-track-all-sam3_1-l4-task-qa-image-security-review-repository-v1' as const
export const TRACK_ALL_SAM3_1_L4_TASK_QA_IMAGE_SECURITY_REVIEW_CONFIRMATION =
  'approve-weeditpro-track-all-l4-task-qa-image-for-private-l4-qualification-v1' as const

const PROJECT_ID = 'reeditpro' as const
const CONTROL_PLANE_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const DEFAULT_PREFIX =
  'private/track-all/sam3_1/v1/l4-task-qa/image-security-review/v1'
const MAXIMUM_RECORD_BYTES = 2 * 1024 * 1024
const safeId = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/u)
  .refine((value) => !value.includes('..') && !value.includes('://'))
const safePrefix = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u)
  .refine((value) =>
    !value.includes('..') && !value.includes('//') && !value.endsWith('/'))
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const evidenceRefSchema = z.object({
  id: safeId,
  version: z.literal(1),
  contentHash: prefixedSha256,
}).strict()
const severityCountsSchema = z.object({
  criticalCount: z.number().int().nonnegative().safe(),
  highCount: z.number().int().nonnegative().safe(),
  mediumCount: z.number().int().nonnegative().safe(),
  lowCount: z.number().int().nonnegative().safe(),
  unknownSeverityCount: z.number().int().nonnegative().safe(),
}).strict()
const scanSchema = z.object({
  scanRef: evidenceRefSchema,
  scanCompletedAt: timestamp,
  occurrenceSnapshotUpdatedAt: timestamp,
  severityCounts: severityCountsSchema,
}).strict()

const operatorAuthorityWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_IMAGE_SECURITY_REVIEW_OPERATOR_AUTHORITY_VERSION,
  ),
  source: z.literal(
    'canonical_server_track_all_sam3_1_l4_task_qa_image_security_review_operator',
  ),
  evidenceClass: z.literal('canonical_private_reread'),
  status: z.literal('authorized_for_private_l4_image_security_review'),
  authorityId: safeId,
  authorityVersion: z.literal(1),
  imageBuildAuthorityRef: evidenceRefSchema,
  imageBuildSubmissionRef: evidenceRefSchema,
  imageBuildTerminalRef: evidenceRefSchema,
  supplyChainAdmissionRef: evidenceRefSchema,
  supplyChainSubmissionRef: evidenceRefSchema,
  supplyChainTerminalRef: evidenceRefSchema,
  immutableImageUri: z.string().regex(
    /^us-central1-docker\.pkg\.dev\/reeditpro\/reeditpro-workers\/reeditpro-track-all-l4-task-qa@sha256:[a-f0-9]{64}$/u,
  ),
  immutableImageDigest: prefixedSha256,
  vulnerabilityScanRef: evidenceRefSchema,
  scanCompletedAt: timestamp,
  occurrenceSnapshotUpdatedAt: timestamp,
  severityCounts: severityCountsSchema,
  severityPolicy: z.literal(
    'artifact_analysis_effective_severity_with_note_fallback_v1',
  ),
  operatorConfirmation: z.literal(
    TRACK_ALL_SAM3_1_L4_TASK_QA_IMAGE_SECURITY_REVIEW_CONFIRMATION,
  ),
  authorizedAt: timestamp,
  exactOccurrenceSnapshotReread: z.literal(true),
  approvedForPrivateL4GpuQualificationOnly: z.literal(true),
  runtimeReleaseGranted: z.literal(false),
  gpuJobDispatched: z.literal(false),
  customerCreditsMutated: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionReady: z.literal(false),
}).strict().superRefine((value, context) => {
  const imageDigest = value.immutableImageUri.match(
    /@sha256:([a-f0-9]{64})$/u,
  )?.[1]
  if (
    value.immutableImageDigest !== `sha256:${imageDigest ?? ''}`
    || value.severityCounts.criticalCount !== 0
    || value.severityCounts.highCount !== 0
    || value.severityCounts.unknownSeverityCount !== 0
    || Date.parse(value.authorizedAt) <
      Date.parse(value.occurrenceSnapshotUpdatedAt)
  ) context.addIssue({
    code: 'custom',
    message: 'Track All L4 image security review authority is not releasable.',
  })
})
const operatorAuthoritySchema = operatorAuthorityWithoutHashSchema.extend({
  authorityHash: rawSha256,
}).strict()
export type CanonicalTrackAllSam31L4TaskQaImageSecurityReviewOperatorAuthority =
  z.infer<typeof operatorAuthoritySchema>

const reviewReadRequestSchema = z.object({
  immutableImageDigest: prefixedSha256,
  vulnerabilityScanRef: evidenceRefSchema,
  scanCompletedAt: timestamp,
  occurrenceSnapshotUpdatedAt: timestamp,
  severityCounts: severityCountsSchema,
}).strict()

export interface CanonicalTrackAllSam31L4TaskQaImageVulnerabilityScanReadPort {
  rereadExact(input: {
    readonly immutableImageUri: string
    readonly immutableImageDigest: string
  }): Promise<z.infer<typeof scanSchema>>
}

export interface CanonicalTrackAllSam31L4TaskQaImageSecurityReviewRepository
  extends CanonicalSam31ImageSecurityReviewReadPort {
  readonly schemaVersion:
    typeof CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_IMAGE_SECURITY_REVIEW_REPOSITORY_VERSION
  persistOperatorAuthorityCreateOnly(input: {
    readonly authority:
      CanonicalTrackAllSam31L4TaskQaImageSecurityReviewOperatorAuthority
  }): Promise<z.infer<typeof evidenceRefSchema>>
  persistApprovedSecurityReviewCreateOnly(input: {
    readonly review: CanonicalSam31ImageSecurityReview
  }): Promise<z.infer<typeof evidenceRefSchema>>
  rereadApprovedReview(input: z.infer<typeof reviewReadRequestSchema>):
    Promise<CanonicalSam31ImageSecurityReview | null>
}

export function createCanonicalTrackAllSam31L4TaskQaImageSecurityReviewOperatorAuthority(
  input: z.input<typeof operatorAuthorityWithoutHashSchema>,
): CanonicalTrackAllSam31L4TaskQaImageSecurityReviewOperatorAuthority {
  assertPlainSerializedData(input, 'track_all_l4_image_security_review_authority')
  const payload = operatorAuthorityWithoutHashSchema.parse(input)
  return operatorAuthoritySchema.parse({
    ...payload,
    authorityHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalTrackAllSam31L4TaskQaImageSecurityReviewOperatorAuthority(
  value: unknown,
): CanonicalTrackAllSam31L4TaskQaImageSecurityReviewOperatorAuthority {
  assertPlainSerializedData(value, 'track_all_l4_image_security_review_authority')
  const parsed = operatorAuthoritySchema.parse(value)
  const { authorityHash, ...payload } = parsed
  if (authorityHash !== sha256AuthorityValue(payload)) {
    throw new Error('track_all_l4_image_security_review_authority_hash_invalid')
  }
  return structuredClone(parsed)
}

export function canonicalTrackAllSam31L4TaskQaImageSecurityReviewOperatorAuthorityRef(
  value: unknown,
) {
  const authority =
    assertCanonicalTrackAllSam31L4TaskQaImageSecurityReviewOperatorAuthority(
      value,
    )
  return evidenceRefSchema.parse({
    id: authority.authorityId,
    version: authority.authorityVersion,
    contentHash: `sha256:${authority.authorityHash}`,
  })
}

export function createCanonicalTrackAllSam31L4TaskQaImageSecurityReviewRepository(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly prefix?: string
  },
): CanonicalTrackAllSam31L4TaskQaImageSecurityReviewRepository {
  assertObjectPort(input.objectPort)
  const prefix = safePrefix.parse(input.prefix ?? DEFAULT_PREFIX)
  const repository:
    CanonicalTrackAllSam31L4TaskQaImageSecurityReviewRepository = {
    schemaVersion:
      CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_IMAGE_SECURITY_REVIEW_REPOSITORY_VERSION,

    async persistOperatorAuthorityCreateOnly({ authority }) {
      const parsed =
        assertCanonicalTrackAllSam31L4TaskQaImageSecurityReviewOperatorAuthority(
          authority,
        )
      const ref =
        canonicalTrackAllSam31L4TaskQaImageSecurityReviewOperatorAuthorityRef(
          parsed,
        )
      await persistExact(input.objectPort, authorityPath(prefix, ref), parsed)
      return ref
    },

    async persistApprovedSecurityReviewCreateOnly({ review }) {
      const parsed = assertCanonicalSam31ImageSecurityReview(review)
      const ref = canonicalImageSecurityReviewRef(parsed)
      await persistExact(
        input.objectPort,
        reviewPath(prefix, {
          immutableImageDigest: parsed.immutableImageDigest,
          vulnerabilityScanRef: parsed.vulnerabilityScanRef,
        }),
        parsed,
      )
      return ref
    },

    async rereadApprovedReview(untrusted) {
      assertPlainSerializedData(untrusted, 'track_all_l4_security_review_read')
      const request = reviewReadRequestSchema.parse(untrusted)
      const review = await readExact(
        input.objectPort,
        reviewPath(prefix, request),
        assertCanonicalSam31ImageSecurityReview,
      )
      if (!review) return null
      if (
        review.immutableImageDigest !== request.immutableImageDigest
        || !sameRef(review.vulnerabilityScanRef, request.vulnerabilityScanRef)
        || review.scanCompletedAt !== request.scanCompletedAt
        || review.occurrenceSnapshotUpdatedAt !==
          request.occurrenceSnapshotUpdatedAt
        || stableAuthorityStringify(review.severityCounts) !==
          stableAuthorityStringify(request.severityCounts)
      ) throw new Error('track_all_l4_security_review_reread_mismatch')
      return review
    },
  }
  return Object.freeze(repository)
}

export function createCanonicalTrackAllSam31L4TaskQaImageVulnerabilityScanReadPort(
  input: {
    readonly googleReadTransport:
      CanonicalSam31ImageSupplyChainGoogleReadTransport
  },
): CanonicalTrackAllSam31L4TaskQaImageVulnerabilityScanReadPort {
  if (!input.googleReadTransport
    || typeof input.googleReadTransport.getJson !== 'function') {
    throw new Error('track_all_l4_vulnerability_scan_transport_invalid')
  }
  const readPort:
    CanonicalTrackAllSam31L4TaskQaImageVulnerabilityScanReadPort = {
    async rereadExact({ immutableImageUri, immutableImageDigest }) {
      const resourceUri = `https://${immutableImageUri}`
      const [discoveryOccurrences, vulnerabilityOccurrences] =
        await Promise.all([
          listCanonicalImageArtifactAnalysisOccurrences(
            input.googleReadTransport,
            `kind="DISCOVERY" AND resourceUrl="${resourceUri}"`,
          ),
          listCanonicalImageArtifactAnalysisOccurrences(
            input.googleReadTransport,
            `kind="VULNERABILITY" AND resourceUrl="${resourceUri}"`,
          ),
        ])
      return scanSchema.parse(verifyCanonicalImageVulnerabilityOccurrences({
        imageDigest: immutableImageDigest,
        resourceUri,
        discoveryOccurrences,
        vulnerabilityOccurrences,
      }))
    },
  }
  return Object.freeze(readPort)
}

export function createCanonicalTrackAllSam31L4TaskQaImageSecurityReviewOperator(
  input: {
    readonly scanReadPort:
      CanonicalTrackAllSam31L4TaskQaImageVulnerabilityScanReadPort
    readonly repository:
      CanonicalTrackAllSam31L4TaskQaImageSecurityReviewRepository
    readonly now?: () => string
  },
) {
  if (!input.scanReadPort
    || typeof input.scanReadPort.rereadExact !== 'function'
    || !input.repository
    || typeof input.repository.persistOperatorAuthorityCreateOnly !== 'function'
    || typeof input.repository.persistApprovedSecurityReviewCreateOnly !==
      'function'
    || typeof input.repository.rereadApprovedReview !== 'function') {
    throw new Error('track_all_l4_security_review_operator_port_invalid')
  }
  return Object.freeze({
    schemaVersion:
      CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_IMAGE_SECURITY_REVIEW_OPERATOR_VERSION,

    async review(value: {
      readonly confirmation: string
      readonly imageBuildAuthority:
        CanonicalTrackAllSam31L4TaskQaCloudImageBuildAuthority
      readonly imageBuildSubmission:
        CanonicalTrackAllSam31L4TaskQaCloudImageBuildSubmission
      readonly imageBuildTerminal:
        CanonicalTrackAllSam31L4TaskQaCloudImageBuildTerminal
      readonly supplyChainAdmission:
        CanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildAdmission
      readonly supplyChainSubmission:
        CanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildSubmission
      readonly supplyChainTerminal:
        CanonicalTrackAllSam31L4TaskQaImageSupplyChainBuildTerminal
    }) {
      if (value.confirmation !==
        TRACK_ALL_SAM3_1_L4_TASK_QA_IMAGE_SECURITY_REVIEW_CONFIRMATION) {
        throw new Error('track_all_l4_security_review_confirmation_missing')
      }
      const request =
        createCanonicalTrackAllSam31L4TaskQaImageSupplyChainEvidenceReadRequest({
          imageBuildAuthority: value.imageBuildAuthority,
          imageBuildSubmission: value.imageBuildSubmission,
          imageBuildTerminal: value.imageBuildTerminal,
          supplyChainAdmission: value.supplyChainAdmission,
          supplyChainSubmission: value.supplyChainSubmission,
          supplyChainTerminal: value.supplyChainTerminal,
        })
      const scan = await input.scanReadPort.rereadExact({
        immutableImageUri: request.immutableImageUri,
        immutableImageDigest: request.immutableImageDigest,
      })
      const now = timestamp.parse(input.now?.() ?? new Date().toISOString())
      const authority =
        createCanonicalTrackAllSam31L4TaskQaImageSecurityReviewOperatorAuthority({
          schemaVersion:
            CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_IMAGE_SECURITY_REVIEW_OPERATOR_AUTHORITY_VERSION,
          source:
            'canonical_server_track_all_sam3_1_l4_task_qa_image_security_review_operator',
          evidenceClass: 'canonical_private_reread',
          status: 'authorized_for_private_l4_image_security_review',
          authorityId:
            `track-all-l4-image-security-review-authority-${scan.scanRef.contentHash.slice(7, 31)}`,
          authorityVersion: 1,
          imageBuildAuthorityRef: request.imageBuildAuthorityRef,
          imageBuildSubmissionRef: request.imageBuildSubmissionRef,
          imageBuildTerminalRef: request.imageBuildTerminalRef,
          supplyChainAdmissionRef: request.supplyChainAdmissionRef,
          supplyChainSubmissionRef: request.supplyChainSubmissionRef,
          supplyChainTerminalRef: request.supplyChainTerminalRef,
          immutableImageUri: request.immutableImageUri,
          immutableImageDigest: request.immutableImageDigest,
          vulnerabilityScanRef: scan.scanRef,
          scanCompletedAt: scan.scanCompletedAt,
          occurrenceSnapshotUpdatedAt: scan.occurrenceSnapshotUpdatedAt,
          severityCounts: scan.severityCounts,
          severityPolicy:
            'artifact_analysis_effective_severity_with_note_fallback_v1',
          operatorConfirmation:
            TRACK_ALL_SAM3_1_L4_TASK_QA_IMAGE_SECURITY_REVIEW_CONFIRMATION,
          authorizedAt: now,
          exactOccurrenceSnapshotReread: true,
          approvedForPrivateL4GpuQualificationOnly: true,
          runtimeReleaseGranted: false,
          gpuJobDispatched: false,
          customerCreditsMutated: false,
          publicDeliveryAuthorized: false,
          productionReady: false,
        })
      const authorityRef =
        await input.repository.persistOperatorAuthorityCreateOnly({ authority })
      const review = createCanonicalSam31ImageSecurityReview({
        reviewId:
          `track-all-l4-image-security-review-${scan.scanRef.contentHash.slice(7, 31)}`,
        immutableImageDigest: request.immutableImageDigest,
        vulnerabilityScanRef: scan.scanRef,
        scanCompletedAt: scan.scanCompletedAt,
        occurrenceSnapshotUpdatedAt: scan.occurrenceSnapshotUpdatedAt,
        severityCounts: scan.severityCounts,
        reviewerAuthorityRef: authorityRef,
        reviewedAt: now,
      })
      const reviewRef =
        await input.repository.persistApprovedSecurityReviewCreateOnly({ review })
      const reread = await input.repository.rereadApprovedReview({
        immutableImageDigest: request.immutableImageDigest,
        vulnerabilityScanRef: scan.scanRef,
        scanCompletedAt: scan.scanCompletedAt,
        occurrenceSnapshotUpdatedAt: scan.occurrenceSnapshotUpdatedAt,
        severityCounts: scan.severityCounts,
      })
      if (!reread
        || !sameRef(reviewRef, canonicalImageSecurityReviewRef(reread))) {
        throw new Error('track_all_l4_security_review_exact_reread_failed')
      }
      return Object.freeze({
        authority,
        authorityRef,
        securityReview: reread,
        securityReviewRef: reviewRef,
        scan,
        runtimeReleaseGranted: false as const,
        gpuJobDispatched: false as const,
        customerCreditsMutated: false as const,
        productionReady: false as const,
      })
    },
  })
}

export function createCanonicalTrackAllSam31L4TaskQaGcpImageSecurityReviewRuntime(
  input: {
    readonly storage?: Storage
    readonly googleReadTransport?:
      CanonicalSam31ImageSupplyChainGoogleReadTransport
  } = {},
) {
  const storage = input.storage ?? new Storage({
    projectId: PROJECT_ID,
    retryOptions: { autoRetry: false, maxRetries: 0 },
  })
  const repository =
    createCanonicalTrackAllSam31L4TaskQaImageSecurityReviewRepository({
      objectPort: createCanonicalGcsSourceAnalysisJsonObjectPort({
        storage,
        bucketName: CONTROL_PLANE_BUCKET,
      }),
    })
  const scanReadPort =
    createCanonicalTrackAllSam31L4TaskQaImageVulnerabilityScanReadPort({
      googleReadTransport: input.googleReadTransport
        ?? createCanonicalSam31ImageSupplyChainGoogleReadTransport(),
    })
  return Object.freeze({
    repository,
    scanReadPort,
    operator:
      createCanonicalTrackAllSam31L4TaskQaImageSecurityReviewOperator({
        repository,
        scanReadPort,
      }),
  })
}

function authorityPath(prefix: string, ref: z.infer<typeof evidenceRefSchema>) {
  return `${prefix}/authorities/${idHash(ref.id)}/${ref.contentHash.slice(7)}.json`
}

function reviewPath(prefix: string, value: {
  immutableImageDigest: string
  vulnerabilityScanRef: z.infer<typeof evidenceRefSchema>
}) {
  return `${prefix}/reviews/${prefixedSha256.parse(
    value.immutableImageDigest,
  ).slice(7)}/${evidenceRefSchema.parse(
    value.vulnerabilityScanRef,
  ).contentHash.slice(7)}.json`
}

async function persistExact(
  port: CanonicalCreateOnlyJsonObjectPort,
  path: string,
  value: unknown,
) {
  const body = recordBody(value)
  const disposition = await port.createOnly({
    objectPath: path,
    body,
    contentSha256: createHash('sha256').update(body).digest('hex'),
  })
  if (!['created', 'already_exists'].includes(disposition)) {
    throw new Error('track_all_l4_security_review_persistence_failed')
  }
  const reread = await port.readExact(path)
  if (!reread || !reread.equals(body)) {
    throw new Error('track_all_l4_security_review_persistence_mismatch')
  }
}

async function readExact<T>(
  port: CanonicalCreateOnlyJsonObjectPort,
  path: string,
  parse: (value: unknown) => T,
): Promise<T | null> {
  const body = await port.readExact(path)
  if (!body) return null
  if (body.byteLength < 2 || body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw new Error('track_all_l4_security_review_record_size_invalid')
  }
  let value: unknown
  try {
    value = JSON.parse(body.toString('utf8'))
  } catch {
    throw new Error('track_all_l4_security_review_record_json_invalid')
  }
  const parsed = parse(value)
  if (!recordBody(parsed).equals(body)) {
    throw new Error('track_all_l4_security_review_record_not_canonical')
  }
  return parsed
}

function recordBody(value: unknown) {
  const body = Buffer.from(stableAuthorityStringify(value), 'utf8')
  if (body.byteLength < 2 || body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw new Error('track_all_l4_security_review_record_size_invalid')
  }
  return body
}

function sameRef(
  left: z.infer<typeof evidenceRefSchema>,
  right: z.infer<typeof evidenceRefSchema>,
) {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}

function idHash(value: string) {
  return createHash('sha256').update(safeId.parse(value), 'utf8').digest('hex')
}

function assertObjectPort(value: CanonicalCreateOnlyJsonObjectPort) {
  if (!value
    || typeof value.createOnly !== 'function'
    || typeof value.readExact !== 'function') {
    throw new Error('track_all_l4_security_review_object_port_invalid')
  }
}

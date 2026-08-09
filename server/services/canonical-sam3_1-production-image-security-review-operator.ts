import { createHash } from 'node:crypto'

import { Storage } from '@google-cloud/storage'
import { z } from 'zod'

import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
  type CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertCanonicalSam31AnyCloudImageBuildAuthority,
  assertCanonicalSam31CloudImageBuildSubmission,
  assertCanonicalSam31CloudImageBuildTerminalObservation,
  type CanonicalSam31AnyCloudImageBuildAuthority,
  type CanonicalSam31CloudImageBuildSubmission,
  type CanonicalSam31CloudImageBuildTerminalObservation,
} from './canonical-sam3_1-cloud-image-build-service'
import {
  canonicalSam31CloudImageBuildAuthorityRef,
  canonicalSam31CloudImageBuildSubmissionRef,
  canonicalSam31CloudImageBuildTerminalObservationRef,
} from './canonical-sam3_1-cloud-image-build-runtime'
import {
  assertCanonicalSam31ImageSupplyChainBuildAdmission,
  assertCanonicalSam31ImageSupplyChainBuildObservation,
  assertCanonicalSam31ImageSupplyChainBuildSubmission,
  imageSupplyChainBuildAdmissionReference,
  imageSupplyChainBuildObservationReference,
  imageSupplyChainBuildSubmissionReference,
  type CanonicalSam31ImageSupplyChainBuildAdmission,
  type CanonicalSam31ImageSupplyChainBuildObservation,
  type CanonicalSam31ImageSupplyChainBuildSubmission,
} from './canonical-sam3_1-cloud-image-supply-chain-build-service'
import {
  assertCanonicalSam31ImageSecurityReview,
  canonicalImageSecurityReviewRef,
  createCanonicalSam31ImageSecurityReview,
  createCanonicalSam31ImageSupplyChainGoogleReadTransport,
  listCanonicalImageArtifactAnalysisOccurrences,
  verifyCanonicalImageVulnerabilityOccurrences,
  type CanonicalSam31ImageSecurityReview,
  type CanonicalSam31ImageSupplyChainGoogleReadTransport,
} from './canonical-sam3_1-cloud-image-supply-chain-evidence-read-service'
import {
  createCanonicalSam31GcpImageSupplyChainReleaseRepository,
  type CanonicalSam31ImageSupplyChainReleaseRepository,
} from './canonical-sam3_1-cloud-image-supply-chain-release-runtime'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_SAM3_1_PRODUCTION_IMAGE_SECURITY_REVIEW_AUTHORITY_VERSION =
  'canonical-sam3_1-production-image-security-review-authority-v1' as const
export const CANONICAL_SAM3_1_PRODUCTION_IMAGE_SECURITY_REVIEW_OPERATOR_VERSION =
  'canonical-sam3_1-production-image-security-review-operator-v1' as const
export const CANONICAL_SAM3_1_PRODUCTION_IMAGE_SECURITY_REVIEW_AUTHORITY_REPOSITORY_VERSION =
  'canonical-sam3_1-production-image-security-review-authority-repository-v1' as const
export const SAM3_1_PRODUCTION_IMAGE_SECURITY_REVIEW_CONFIRMATION =
  'approve-weeditpro-sam31-production-image-for-private-a100-l4-qualification-v1' as const

const PROJECT_ID = 'reeditpro' as const
const CONTROL_BUCKET =
  'reeditpro-production-reeditpro-control-plane-state' as const
const DEFAULT_PREFIX =
  'private/sam3_1/production-image-security-review-authority/v1'
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
const refSchema = z.object({
  id: safeId,
  version: z.literal(1),
  contentHash: prefixedSha256,
}).strict()
const severitySchema = z.object({
  criticalCount: z.number().int().nonnegative().safe(),
  highCount: z.number().int().nonnegative().safe(),
  mediumCount: z.number().int().nonnegative().safe(),
  lowCount: z.number().int().nonnegative().safe(),
  unknownSeverityCount: z.number().int().nonnegative().safe(),
}).strict()
const scanSchema = z.object({
  scanRef: refSchema,
  scanCompletedAt: timestamp,
  occurrenceSnapshotUpdatedAt: timestamp,
  severityCounts: severitySchema,
}).strict()
const authorityWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_PRODUCTION_IMAGE_SECURITY_REVIEW_AUTHORITY_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam3_1_production_image_security_review_operator',
  ),
  evidenceClass: z.literal('canonical_private_reread'),
  status: z.literal(
    'authorized_for_private_a100_l4_image_security_review',
  ),
  authorityId: safeId,
  authorityVersion: z.literal(1),
  imageBuildAuthorityRef: refSchema,
  imageBuildSubmissionRef: refSchema,
  imageBuildTerminalRef: refSchema,
  supplyChainAdmissionRef: refSchema,
  supplyChainSubmissionRef: refSchema,
  supplyChainObservationRef: refSchema,
  immutableImageUri: z.string().regex(
    /^us-central1-docker\.pkg\.dev\/reeditpro\/reeditpro-workers\/reeditpro-sam31-gpu@sha256:[a-f0-9]{64}$/u,
  ),
  immutableImageDigest: prefixedSha256,
  vulnerabilityScanRef: refSchema,
  scanCompletedAt: timestamp,
  occurrenceSnapshotUpdatedAt: timestamp,
  severityCounts: severitySchema,
  severityPolicy: z.literal(
    'artifact_analysis_effective_severity_with_note_fallback_v1',
  ),
  operatorConfirmation: z.literal(
    SAM3_1_PRODUCTION_IMAGE_SECURITY_REVIEW_CONFIRMATION,
  ),
  authorizedAt: timestamp,
  exactImageBuildAndSupplyChainLineageReread: z.literal(true),
  exactOccurrenceSnapshotReread: z.literal(true),
  approvedForPrivateA100AndL4QualificationOnly: z.literal(true),
  runtimeReleaseGranted: z.literal(false),
  gpuJobDispatched: z.literal(false),
  modelOrCheckpointExecuted: z.literal(false),
  customerCreditsMutated: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionReady: z.literal(false),
}).strict().superRefine((value, context) => {
  const digest = value.immutableImageUri.match(
    /@sha256:([a-f0-9]{64})$/u,
  )?.[1]
  if (
    value.immutableImageDigest !== `sha256:${digest ?? ''}`
    || value.severityCounts.criticalCount !== 0
    || value.severityCounts.highCount !== 0
    || value.severityCounts.unknownSeverityCount !== 0
    || Date.parse(value.authorizedAt) <
      Date.parse(value.occurrenceSnapshotUpdatedAt)
  ) context.addIssue({
    code: 'custom',
    message: 'Production SAM 3.1 image security review is not releasable.',
  })
})
const authoritySchema = authorityWithoutHashSchema.extend({
  authorityHash: rawSha256,
}).strict()

export type CanonicalSam31ProductionImageSecurityReviewAuthority = z.infer<
  typeof authoritySchema
>

export interface CanonicalSam31ProductionImageVulnerabilityScanReadPort {
  rereadExact(input: {
    readonly immutableImageUri: string
    readonly immutableImageDigest: string
  }): Promise<z.infer<typeof scanSchema>>
}

export interface CanonicalSam31ProductionImageSecurityReviewAuthorityRepository {
  readonly schemaVersion:
    typeof CANONICAL_SAM3_1_PRODUCTION_IMAGE_SECURITY_REVIEW_AUTHORITY_REPOSITORY_VERSION
  persistCreateOnly(input: {
    readonly authority: CanonicalSam31ProductionImageSecurityReviewAuthority
  }): Promise<z.infer<typeof refSchema>>
  reread(input: {
    readonly authorityRef: z.infer<typeof refSchema>
  }): Promise<CanonicalSam31ProductionImageSecurityReviewAuthority | null>
}

export function createCanonicalSam31ProductionImageSecurityReviewAuthority(
  input: z.input<typeof authorityWithoutHashSchema>,
): CanonicalSam31ProductionImageSecurityReviewAuthority {
  assertPlainSerializedData(input, 'sam31_production_image_security_authority')
  const payload = authorityWithoutHashSchema.parse(input)
  return authoritySchema.parse({
    ...payload,
    authorityHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalSam31ProductionImageSecurityReviewAuthority(
  value: unknown,
): CanonicalSam31ProductionImageSecurityReviewAuthority {
  assertPlainSerializedData(value, 'sam31_production_image_security_authority')
  const parsed = authoritySchema.parse(value)
  const { authorityHash, ...payload } = parsed
  if (authorityHash !== sha256AuthorityValue(payload)) {
    throw new Error('sam31_production_image_security_authority_hash_invalid')
  }
  return structuredClone(parsed)
}

export function canonicalSam31ProductionImageSecurityReviewAuthorityRef(
  value: unknown,
) {
  const authority =
    assertCanonicalSam31ProductionImageSecurityReviewAuthority(value)
  return refSchema.parse({
    id: authority.authorityId,
    version: authority.authorityVersion,
    contentHash: `sha256:${authority.authorityHash}`,
  })
}

export function createCanonicalSam31ProductionImageSecurityReviewAuthorityRepository(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly prefix?: string
  },
): CanonicalSam31ProductionImageSecurityReviewAuthorityRepository {
  assertObjectPort(input.objectPort)
  const prefix = safePrefix.parse(input.prefix ?? DEFAULT_PREFIX)
  const repository:
    CanonicalSam31ProductionImageSecurityReviewAuthorityRepository = {
    schemaVersion:
      CANONICAL_SAM3_1_PRODUCTION_IMAGE_SECURITY_REVIEW_AUTHORITY_REPOSITORY_VERSION,
    async persistCreateOnly({ authority }) {
      const parsed =
        assertCanonicalSam31ProductionImageSecurityReviewAuthority(authority)
      const ref = canonicalSam31ProductionImageSecurityReviewAuthorityRef(
        parsed,
      )
      await persistExact(input.objectPort, authorityPath(prefix, ref), parsed)
      return ref
    },
    async reread({ authorityRef }) {
      const ref = refSchema.parse(authorityRef)
      const value = await readExact(
        input.objectPort,
        authorityPath(prefix, ref),
      )
      if (!value) return null
      const authority =
        assertCanonicalSam31ProductionImageSecurityReviewAuthority(value)
      if (!sameRef(
        canonicalSam31ProductionImageSecurityReviewAuthorityRef(authority),
        ref,
      )) throw new Error('sam31_production_security_authority_ref_changed')
      return authority
    },
  }
  return Object.freeze(repository)
}

export function createCanonicalSam31ProductionImageVulnerabilityScanReadPort(
  input: {
    readonly googleReadTransport:
      CanonicalSam31ImageSupplyChainGoogleReadTransport
  },
): CanonicalSam31ProductionImageVulnerabilityScanReadPort {
  if (typeof input.googleReadTransport?.getJson !== 'function') {
    throw new Error('sam31_production_vulnerability_scan_transport_invalid')
  }
  const readPort: CanonicalSam31ProductionImageVulnerabilityScanReadPort = {
    async rereadExact({ immutableImageUri, immutableImageDigest }) {
      const uri = z.string().regex(
        /^us-central1-docker\.pkg\.dev\/reeditpro\/reeditpro-workers\/reeditpro-sam31-gpu@sha256:[a-f0-9]{64}$/u,
      ).parse(immutableImageUri)
      const digest = prefixedSha256.parse(immutableImageDigest)
      if (!uri.endsWith(`@${digest}`)) {
        throw new Error('sam31_production_vulnerability_image_changed')
      }
      const resourceUrl = `https://${uri}`
      const [discoveryOccurrences, vulnerabilityOccurrences] =
        await Promise.all([
          listCanonicalImageArtifactAnalysisOccurrences(
            input.googleReadTransport,
            `kind="DISCOVERY" AND resourceUrl="${resourceUrl}"`,
          ),
          listCanonicalImageArtifactAnalysisOccurrences(
            input.googleReadTransport,
            `kind="VULNERABILITY" AND resourceUrl="${resourceUrl}"`,
          ),
        ])
      return scanSchema.parse(verifyCanonicalImageVulnerabilityOccurrences({
        imageDigest: digest,
        resourceUri: resourceUrl,
        discoveryOccurrences,
        vulnerabilityOccurrences,
      }))
    },
  }
  return Object.freeze(readPort)
}

export function createCanonicalSam31ProductionImageSecurityReviewOperator(
  input: {
    readonly scanReadPort:
      CanonicalSam31ProductionImageVulnerabilityScanReadPort
    readonly authorityRepository:
      CanonicalSam31ProductionImageSecurityReviewAuthorityRepository
    readonly releaseRepository:
      CanonicalSam31ImageSupplyChainReleaseRepository
    readonly now?: () => string
  },
) {
  assertOperatorPorts(input)
  return Object.freeze({
    schemaVersion:
      CANONICAL_SAM3_1_PRODUCTION_IMAGE_SECURITY_REVIEW_OPERATOR_VERSION,
    async review(value: {
      readonly confirmation: string
      readonly imageBuildAuthority: CanonicalSam31AnyCloudImageBuildAuthority
      readonly imageBuildSubmission: CanonicalSam31CloudImageBuildSubmission
      readonly imageBuildTerminal:
        CanonicalSam31CloudImageBuildTerminalObservation
      readonly supplyChainAdmission:
        CanonicalSam31ImageSupplyChainBuildAdmission
      readonly supplyChainSubmission:
        CanonicalSam31ImageSupplyChainBuildSubmission
      readonly supplyChainObservation:
        CanonicalSam31ImageSupplyChainBuildObservation
    }) {
      assertPlainSerializedData(value, 'sam31_production_security_review_request')
      const request = z.object({
        confirmation: z.literal(
          SAM3_1_PRODUCTION_IMAGE_SECURITY_REVIEW_CONFIRMATION,
        ),
        imageBuildAuthority: z.unknown(),
        imageBuildSubmission: z.unknown(),
        imageBuildTerminal: z.unknown(),
        supplyChainAdmission: z.unknown(),
        supplyChainSubmission: z.unknown(),
        supplyChainObservation: z.unknown(),
      }).strict().parse(value) as typeof value
      const lineage = requireExactProductionLineage(request)
      const scan = scanSchema.parse(
        await input.scanReadPort.rereadExact({
          immutableImageUri: lineage.immutableImageUri,
          immutableImageDigest: lineage.immutableImageDigest,
        }),
      )
      const now = timestamp.parse(input.now?.() ?? new Date().toISOString())
      const authority =
        createCanonicalSam31ProductionImageSecurityReviewAuthority({
          schemaVersion:
            CANONICAL_SAM3_1_PRODUCTION_IMAGE_SECURITY_REVIEW_AUTHORITY_VERSION,
          source:
            'canonical_server_sam3_1_production_image_security_review_operator',
          evidenceClass: 'canonical_private_reread',
          status: 'authorized_for_private_a100_l4_image_security_review',
          authorityId:
            `sam31-production-image-security-${scan.scanRef.contentHash.slice(7, 31)}`,
          authorityVersion: 1,
          ...lineage,
          vulnerabilityScanRef: scan.scanRef,
          scanCompletedAt: scan.scanCompletedAt,
          occurrenceSnapshotUpdatedAt: scan.occurrenceSnapshotUpdatedAt,
          severityCounts: scan.severityCounts,
          severityPolicy:
            'artifact_analysis_effective_severity_with_note_fallback_v1',
          operatorConfirmation:
            SAM3_1_PRODUCTION_IMAGE_SECURITY_REVIEW_CONFIRMATION,
          authorizedAt: now,
          exactImageBuildAndSupplyChainLineageReread: true,
          exactOccurrenceSnapshotReread: true,
          approvedForPrivateA100AndL4QualificationOnly: true,
          runtimeReleaseGranted: false,
          gpuJobDispatched: false,
          modelOrCheckpointExecuted: false,
          customerCreditsMutated: false,
          publicDeliveryAuthorized: false,
          productionReady: false,
        })
      const authorityRef = refSchema.parse(
        await input.authorityRepository.persistCreateOnly({ authority }),
      )
      const rereadAuthority = await input.authorityRepository.reread({
        authorityRef,
      })
      if (!rereadAuthority || rereadAuthority.authorityHash !==
        authority.authorityHash) {
        throw new Error('sam31_production_security_authority_reread_failed')
      }
      const review = createCanonicalSam31ImageSecurityReview({
        reviewId:
          `sam31-production-image-security-review-${scan.scanRef.contentHash.slice(7, 31)}`,
        immutableImageDigest: lineage.immutableImageDigest,
        vulnerabilityScanRef: scan.scanRef,
        scanCompletedAt: scan.scanCompletedAt,
        occurrenceSnapshotUpdatedAt: scan.occurrenceSnapshotUpdatedAt,
        severityCounts: scan.severityCounts,
        reviewerAuthorityRef: authorityRef,
        reviewedAt: now,
      })
      const reviewRef = refSchema.parse(
        await input.releaseRepository.persistApprovedSecurityReviewCreateOnly({
          review,
        }),
      )
      const rereadReviewRaw = await input.releaseRepository
        .rereadApprovedReview({
          immutableImageDigest: lineage.immutableImageDigest,
          vulnerabilityScanRef: scan.scanRef,
          scanCompletedAt: scan.scanCompletedAt,
          occurrenceSnapshotUpdatedAt: scan.occurrenceSnapshotUpdatedAt,
          severityCounts: scan.severityCounts,
        })
      const rereadReview: CanonicalSam31ImageSecurityReview | null =
        rereadReviewRaw
          ? assertCanonicalSam31ImageSecurityReview(rereadReviewRaw)
          : null
      if (!rereadReview || !sameRef(
        reviewRef,
        canonicalImageSecurityReviewRef(rereadReview),
      )) throw new Error('sam31_production_security_review_reread_failed')
      return Object.freeze({
        authority: rereadAuthority,
        authorityRef,
        securityReview: rereadReview,
        securityReviewRef: reviewRef,
        scan,
        runtimeReleaseGranted: false as const,
        gpuJobDispatched: false as const,
        modelOrCheckpointExecuted: false as const,
        customerCreditsMutated: false as const,
        productionReady: false as const,
      })
    },
  })
}

export function createCanonicalSam31GcpProductionImageSecurityReviewRuntime(
  input: {
    readonly storage?: Storage
    readonly googleReadTransport?:
      CanonicalSam31ImageSupplyChainGoogleReadTransport
    readonly now?: () => string
  } = {},
) {
  const storage = input.storage ?? new Storage({
    projectId: PROJECT_ID,
    retryOptions: { autoRetry: false, maxRetries: 0 },
  })
  const authorityRepository =
    createCanonicalSam31ProductionImageSecurityReviewAuthorityRepository({
      objectPort: createCanonicalGcsSourceAnalysisJsonObjectPort({
        storage,
        bucketName: CONTROL_BUCKET,
      }),
    })
  const releaseRepository =
    createCanonicalSam31GcpImageSupplyChainReleaseRepository({ storage })
  const scanReadPort =
    createCanonicalSam31ProductionImageVulnerabilityScanReadPort({
      googleReadTransport: input.googleReadTransport
        ?? createCanonicalSam31ImageSupplyChainGoogleReadTransport(),
    })
  return Object.freeze({
    authorityRepository,
    releaseRepository,
    scanReadPort,
    operator: createCanonicalSam31ProductionImageSecurityReviewOperator({
      authorityRepository,
      releaseRepository,
      scanReadPort,
      now: input.now,
    }),
  })
}

function requireExactProductionLineage(value: {
  readonly imageBuildAuthority: CanonicalSam31AnyCloudImageBuildAuthority
  readonly imageBuildSubmission: CanonicalSam31CloudImageBuildSubmission
  readonly imageBuildTerminal: CanonicalSam31CloudImageBuildTerminalObservation
  readonly supplyChainAdmission: CanonicalSam31ImageSupplyChainBuildAdmission
  readonly supplyChainSubmission: CanonicalSam31ImageSupplyChainBuildSubmission
  readonly supplyChainObservation: CanonicalSam31ImageSupplyChainBuildObservation
}) {
  const authority = assertCanonicalSam31AnyCloudImageBuildAuthority(
    value.imageBuildAuthority,
  )
  const submission = assertCanonicalSam31CloudImageBuildSubmission(
    value.imageBuildSubmission,
  )
  const terminal = assertCanonicalSam31CloudImageBuildTerminalObservation(
    value.imageBuildTerminal,
  )
  const supplyAdmission = assertCanonicalSam31ImageSupplyChainBuildAdmission(
    value.supplyChainAdmission,
  )
  const supplySubmission = assertCanonicalSam31ImageSupplyChainBuildSubmission(
    value.supplyChainSubmission,
  )
  const supplyObservation =
    assertCanonicalSam31ImageSupplyChainBuildObservation(
      value.supplyChainObservation,
    )
  const imageBuildAuthorityRef =
    canonicalSam31CloudImageBuildAuthorityRef(authority)
  const imageBuildSubmissionRef =
    canonicalSam31CloudImageBuildSubmissionRef(submission)
  const imageBuildTerminalRef =
    canonicalSam31CloudImageBuildTerminalObservationRef(terminal)
  const supplyChainAdmissionRef =
    imageSupplyChainBuildAdmissionReference(supplyAdmission)
  const supplyChainSubmissionRef =
    imageSupplyChainBuildSubmissionReference(supplySubmission)
  const supplyChainObservationRef =
    imageSupplyChainBuildObservationReference(supplyObservation)
  if (
    authority.evidenceClass !== 'canonical_private_reread'
    || submission.disposition !== 'submitted'
    || terminal.disposition !==
      'image_built_pending_scan_signature_and_gpu_qualification'
    || !terminal.immutableImageUri
    || !terminal.immutableImageDigest
    || supplyAdmission.status !==
      'authorized_for_private_supply_chain_build'
    || supplySubmission.disposition !== 'submitted'
    || supplyObservation.disposition !==
      'supply_chain_artifacts_ready_pending_exact_reread'
    || supplyObservation.cloudBuildStatus !== 'SUCCESS'
    || !sameRef(submission.authorityRef, imageBuildAuthorityRef)
    || !sameRef(terminal.authorityRef, imageBuildAuthorityRef)
    || !sameRef(terminal.submissionRef, imageBuildSubmissionRef)
    || !sameRef(supplyAdmission.buildAuthorityRef, imageBuildAuthorityRef)
    || !sameRef(
      supplyAdmission.imageBuildSubmissionRef,
      imageBuildSubmissionRef,
    )
    || !sameRef(
      supplyAdmission.imageBuildTerminalObservationRef,
      imageBuildTerminalRef,
    )
    || !sameRef(supplySubmission.admissionRef, supplyChainAdmissionRef)
    || !sameRef(supplyObservation.admissionRef, supplyChainAdmissionRef)
    || !sameRef(supplyObservation.submissionRef, supplyChainSubmissionRef)
    || terminal.immutableImageUri !== supplyAdmission.immutableImageUri
    || terminal.immutableImageUri !== supplyObservation.immutableImageUri
    || terminal.immutableImageDigest !== supplyAdmission.immutableImageDigest
    || terminal.immutableImageDigest !== supplyObservation.immutableImageDigest
  ) throw new Error('sam31_production_image_security_lineage_invalid')
  return Object.freeze({
    imageBuildAuthorityRef,
    imageBuildSubmissionRef,
    imageBuildTerminalRef,
    supplyChainAdmissionRef,
    supplyChainSubmissionRef,
    supplyChainObservationRef,
    immutableImageUri: terminal.immutableImageUri,
    immutableImageDigest: terminal.immutableImageDigest,
  })
}

function authorityPath(prefix: string, ref: z.infer<typeof refSchema>) {
  return `${prefix}/${createHash('sha256').update(ref.id, 'utf8').digest('hex')}/${ref.contentHash.slice(7)}.json`
}

async function persistExact(
  port: CanonicalCreateOnlyJsonObjectPort,
  path: string,
  value: unknown,
) {
  const body = recordBody(value)
  await port.createOnly({
    objectPath: path,
    body,
    contentSha256: createHash('sha256').update(body).digest('hex'),
  })
  const reread = await port.readExact(path)
  if (!reread || !reread.equals(body)) {
    throw new Error('sam31_production_security_record_reread_failed')
  }
}

async function readExact(
  port: CanonicalCreateOnlyJsonObjectPort,
  path: string,
): Promise<unknown | null> {
  const body = await port.readExact(path)
  if (!body) return null
  if (body.byteLength < 2 || body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw new Error('sam31_production_security_record_size_invalid')
  }
  try {
    return JSON.parse(body.toString('utf8'))
  } catch {
    throw new Error('sam31_production_security_record_json_invalid')
  }
}

function recordBody(value: unknown) {
  const body = Buffer.from(stableAuthorityStringify(value), 'utf8')
  if (body.byteLength < 2 || body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw new Error('sam31_production_security_record_size_invalid')
  }
  return body
}

function sameRef(
  left: z.infer<typeof refSchema>,
  right: z.infer<typeof refSchema>,
) {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}

function assertObjectPort(value: CanonicalCreateOnlyJsonObjectPort) {
  if (typeof value?.createOnly !== 'function'
    || typeof value?.readExact !== 'function') {
    throw new Error('sam31_production_security_object_port_invalid')
  }
}

function assertOperatorPorts(input: {
  scanReadPort: CanonicalSam31ProductionImageVulnerabilityScanReadPort
  authorityRepository:
    CanonicalSam31ProductionImageSecurityReviewAuthorityRepository
  releaseRepository: CanonicalSam31ImageSupplyChainReleaseRepository
}) {
  if (
    typeof input.scanReadPort?.rereadExact !== 'function'
    || typeof input.authorityRepository?.persistCreateOnly !== 'function'
    || typeof input.authorityRepository?.reread !== 'function'
    || typeof input.releaseRepository
      ?.persistApprovedSecurityReviewCreateOnly !== 'function'
    || typeof input.releaseRepository?.rereadApprovedReview !== 'function'
  ) throw new Error('sam31_production_security_operator_port_invalid')
}

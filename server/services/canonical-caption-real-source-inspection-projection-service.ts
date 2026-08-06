import { createHash } from 'node:crypto'

import { z } from 'zod'

import { assertClosedContractTree } from
  '../../src/lib/closed-contract-validation'
import type { CaptionDomainCanonicalScope } from
  '../../src/types/caption-domain-contracts'
import type { CaptionDomainRef } from
  '../../src/types/caption-domain-contracts'
import type {
  CaptionRealSourceMultiOutputInspectionVariant,
} from '../../src/types/caption-real-source-multi-output-inspection'
import type {
  CaptionRemotionRealSourceMultiOutputReviewSpec,
} from '../../src/types/caption-remotion-real-source-multi-output-review'
import type {
  CaptionRemotionRealSourceReviewSpec,
} from '../../src/types/caption-remotion-real-source-review'
import type {
  CanonicalCaptionDirectVisualInspectionRepository,
} from '../../src/types/canonical-caption-direct-visual-inspection-evidence'
import {
  CANONICAL_CAPTION_REAL_SOURCE_INSPECTION_BUNDLE_READ_PORT_VERSION,
  CANONICAL_CAPTION_REAL_SOURCE_INSPECTION_BUNDLE_READ_PORT_V2_VERSION,
  CANONICAL_CAPTION_REAL_SOURCE_INSPECTION_BUNDLE_REPOSITORY_VERSION,
  CANONICAL_CAPTION_REAL_SOURCE_INSPECTION_AUTHORITY_READ_PORT_VERSION,
  CANONICAL_CAPTION_REAL_SOURCE_INSPECTION_AUTHORITY_READ_PORT_V2_VERSION,
  CANONICAL_CAPTION_REAL_SOURCE_INSPECTION_AUTHORITY_VERSION,
  CANONICAL_CAPTION_REAL_SOURCE_INSPECTION_PROJECTION_REQUEST_VERSION,
  CANONICAL_CAPTION_REAL_SOURCE_INSPECTION_PROJECTION_SERVICE_VERSION,
  CANONICAL_CAPTION_REAL_SOURCE_INSPECTION_PROJECTION_SERVICE_V2_VERSION,
  type CanonicalCaptionRealSourceInspectionAuthority,
  type CanonicalCaptionRealSourceInspectionAuthorityReadPort,
  type CanonicalCaptionRealSourceInspectionAuthorityReadPortV2,
  type CanonicalCaptionRealSourceInspectionBundle,
  type CanonicalCaptionRealSourceInspectionBundleLocator,
  type CanonicalCaptionRealSourceInspectionBundleReadPort,
  type CanonicalCaptionRealSourceInspectionBundleReadPortV2,
  type CanonicalCaptionRealSourceInspectionBundleRepository,
  type CanonicalCaptionRealSourceInspectionProjectionOutcome,
  type CanonicalCaptionRealSourceInspectionProjectionRequest,
  type CanonicalCaptionRealSourceInspectionProjectionService,
  type CanonicalCaptionRealSourceInspectionProjectionServiceV2,
  type CanonicalCaptionRealSourceInspectionVariant,
} from '../../src/types/canonical-caption-real-source-inspection-projection'
import {
  parseCaptionRealSourceCompleteTimeInspectionReceipt,
} from '../captions-specialist/caption-real-source-complete-time-inspection'
import {
  parseCaptionRealSourceMultiOutputInspectionReceipt,
} from '../captions-specialist/caption-real-source-multi-output-inspection'
import {
  parseCaptionRemotionRealSourceMultiOutputReviewSpec,
} from '../captions-specialist/caption-remotion-real-source-multi-output-review'
import {
  parseCaptionRemotionRealSourceReviewSpec,
} from '../captions-specialist/caption-remotion-real-source-review'
import { calculateSkillContractDigest } from
  '../orchestra/orchestra-skill-contracts'
import {
  createCanonicalCaptionDirectVisualInspectionEvidence,
  isCanonicalCaptionDirectVisualInspectionRepository,
  parseCanonicalCaptionDirectVisualInspectionEvidence,
} from './canonical-caption-direct-visual-inspection-evidence-service'
import type { CanonicalCreateOnlyJsonObjectPort } from
  './canonical-gcs-source-analysis-lifecycle-store'

const safeKey = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const refSchema = z.object({
  id: safeKey,
  version: safeKey,
  contentHash: sha256,
}).strict()
const scopeSchema = z.object({
  ownerUserId: safeKey,
  workspaceId: safeKey,
  projectId: safeKey,
  editSessionId: safeKey,
  planVersionId: safeKey,
  approvedSnapshotRef: refSchema,
  executionPackageRef: refSchema,
  outputId: safeKey,
}).strict()
const requestSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_CAPTION_REAL_SOURCE_INSPECTION_PROJECTION_REQUEST_VERSION),
  requestId: safeKey,
  requestDigestSha256: sha256,
  receiptKind: z.enum([
    'vertical_complete_time_v1',
    'multi_output_complete_time_v1',
  ]),
  receiptRef: refSchema,
  variant: z.enum([
    'vertical_full_motion',
    'vertical_reduced_motion',
    'widescreen_full_motion',
    'widescreen_reduced_motion',
    'square_full_motion',
    'square_reduced_motion',
  ]),
  canonicalScope: scopeSchema,
  confirmedOutputFrameRef: refSchema,
  renderedArtifactRef: refSchema,
  deterministicQaRef: refSchema,
  expectedOriginalSourceRef: refSchema,
  exactCaptionReceiptRereadRequired: z.literal(true),
  exactReviewSpecRereadRequired: z.literal(true),
  canonicalApprovedRunAuthorityRereadRequired: z.literal(true),
  canonicalQualificationReaderMustRevalidateAuthority: z.literal(true),
  callerSuppliedReceiptAccepted: z.literal(false),
  browserLocalCompletionAccepted: z.literal(false),
  mediaBytesAccepted: z.literal(false),
  pathsUrlsOrCredentialsAccepted: z.literal(false),
  providerCallRequested: z.literal(false),
  operationDispatchAuthorityGranted: z.literal(false),
  repairExecutionAuthorityGranted: z.literal(false),
  assetMutationAuthorityGranted: z.literal(false),
  finalQaApprovalGranted: z.literal(false),
  billingAuthorityGranted: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()
const bundleSchema = z.object({
  receiptKind: z.enum([
    'vertical_complete_time_v1',
    'multi_output_complete_time_v1',
  ]),
  receipt: z.unknown(),
  reviewSpecs: z.array(z.unknown()).min(2).max(4),
}).strict()
const authoritySchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_CAPTION_REAL_SOURCE_INSPECTION_AUTHORITY_VERSION),
  authorityId: safeKey,
  authorityDigestSha256: sha256,
  canonicalScope: scopeSchema,
  confirmedOutputFrameRef: refSchema,
  renderedArtifactRef: refSchema,
  deterministicQaRef: refSchema,
  originalSourceRef: refSchema,
  sourceMediaAuthorityRef: refSchema,
  sourceMediaBindingRefs: z.array(refSchema).min(1).max(1_000),
  exactApprovedSnapshotExecutionPackageOutputAndSourceReread: z.literal(true),
}).strict()
const bundleLocatorSchema = z.object({
  canonicalScope: scopeSchema,
  receiptRef: refSchema,
  variant: z.enum([
    'vertical_full_motion',
    'vertical_reduced_motion',
    'widescreen_full_motion',
    'widescreen_reduced_motion',
    'square_full_motion',
    'square_reduced_motion',
  ]),
}).strict()
const prefixSchema = z.string().trim().min(1).max(1_024)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u)
  .refine((value) =>
    !value.includes('..') && !value.includes('//') && !value.endsWith('/'))
const DEFAULT_BUNDLE_PREFIX =
  'private-internal/captions-specialist/v1/real-source-inspection-bundles'
const MAX_BUNDLE_BYTES = 32 * 1024 * 1024
const admittedReadPorts = new WeakSet<object>()
const admittedAuthorityReadPorts = new WeakSet<object>()
const admittedReadPortsV2 = new WeakSet<object>()
const admittedAuthorityReadPortsV2 = new WeakSet<object>()
const admittedBundleRepositories = new WeakSet<object>()

interface SelectedInspectionEvidence {
  observedAt: string
  canonicalScope: CaptionDomainCanonicalScope
  confirmedOutputFrameRef: CaptionDomainRef
  renderedArtifactRef: CaptionDomainRef
  originalSourceRef: CaptionDomainRef
  renderedFrameCount: number
  contactSheetCount: number
  originalResolutionSpotCheckCount: number
}

type InspectionSelection = Pick<
  CanonicalCaptionRealSourceInspectionProjectionRequest,
  'receiptKind' | 'receiptRef' | 'variant'
>

type RequestInput = Omit<
  CanonicalCaptionRealSourceInspectionProjectionRequest,
  'schemaVersion' | 'requestDigestSha256'
>
type AuthorityInput = Omit<
  CanonicalCaptionRealSourceInspectionAuthority,
  'schemaVersion' | 'authorityDigestSha256'
>

export function createCanonicalCaptionRealSourceInspectionAuthority(
  input: AuthorityInput,
): CanonicalCaptionRealSourceInspectionAuthority {
  assertClosedContractTree(input,
    'Canonical Caption real-source inspection authority input')
  const withoutDigest = {
    schemaVersion:
      CANONICAL_CAPTION_REAL_SOURCE_INSPECTION_AUTHORITY_VERSION,
    ...structuredClone(input),
  }
  return parseCanonicalCaptionRealSourceInspectionAuthority({
    ...withoutDigest,
    authorityDigestSha256: calculateSkillContractDigest({
      ...withoutDigest,
      authorityDigestSha256: '',
    }, 'authorityDigestSha256'),
  })
}

export function parseCanonicalCaptionRealSourceInspectionAuthority(
  value: unknown,
): CanonicalCaptionRealSourceInspectionAuthority {
  assertClosedContractTree(value,
    'Canonical Caption real-source inspection authority')
  const authority = authoritySchema.parse(value) as
    CanonicalCaptionRealSourceInspectionAuthority
  const bindingKeys = authority.sourceMediaBindingRefs.map(refKey)
  if (authority.authorityDigestSha256 !== calculateSkillContractDigest(
    authority as unknown as Record<string, unknown>, 'authorityDigestSha256')
    || new Set(bindingKeys).size !== bindingKeys.length
    || bindingKeys.join('|') !== [...bindingKeys].sort(compareUtf16).join('|')) {
    throw new Error(
      'Canonical Caption real-source inspection authority invalid.')
  }
  return structuredClone(authority)
}

export function createCanonicalCaptionRealSourceInspectionProjectionRequest(
  input: RequestInput,
): CanonicalCaptionRealSourceInspectionProjectionRequest {
  assertClosedContractTree(input,
    'Canonical Caption real-source inspection projection request input')
  const withoutDigest = {
    schemaVersion:
      CANONICAL_CAPTION_REAL_SOURCE_INSPECTION_PROJECTION_REQUEST_VERSION,
    ...structuredClone(input),
  }
  return parseCanonicalCaptionRealSourceInspectionProjectionRequest({
    ...withoutDigest,
    requestDigestSha256: calculateSkillContractDigest({
      ...withoutDigest,
      requestDigestSha256: '',
    }, 'requestDigestSha256'),
  })
}

export function parseCanonicalCaptionRealSourceInspectionProjectionRequest(
  value: unknown,
): CanonicalCaptionRealSourceInspectionProjectionRequest {
  assertClosedContractTree(value,
    'Canonical Caption real-source inspection projection request')
  const request = requestSchema.parse(value) as
    CanonicalCaptionRealSourceInspectionProjectionRequest
  if (request.requestDigestSha256 !== calculateSkillContractDigest(
    request as unknown as Record<string, unknown>, 'requestDigestSha256')
    || !variantMatchesKind(request.variant, request.receiptKind)) {
    throw new Error(
      'Canonical Caption real-source inspection projection request invalid.')
  }
  return structuredClone(request)
}

export function createCanonicalCaptionRealSourceInspectionBundleReadPort(
  readExact: CanonicalCaptionRealSourceInspectionBundleReadPort['readExact'],
): CanonicalCaptionRealSourceInspectionBundleReadPort {
  if (typeof readExact !== 'function') {
    throw new Error('Canonical Caption inspection bundle reader required.')
  }
  const port = Object.freeze({
    schemaVersion:
      CANONICAL_CAPTION_REAL_SOURCE_INSPECTION_BUNDLE_READ_PORT_VERSION,
    sourceAuthority:
      'caption_owned_persisted_real_source_inspection_bundle' as const,
    callerSuppliedReceiptAccepted: false as const,
    async readExact(input: { readonly receiptRef: CaptionDomainRef }) {
      return readExact(structuredClone(input))
    },
  })
  admittedReadPorts.add(port)
  return port
}

export function isCanonicalCaptionRealSourceInspectionBundleReadPort(
  value: unknown,
): value is CanonicalCaptionRealSourceInspectionBundleReadPort {
  return Boolean(value && typeof value === 'object'
    && admittedReadPorts.has(value as object))
}

export function createCanonicalCaptionRealSourceInspectionBundleReadPortV2(
  readExact: CanonicalCaptionRealSourceInspectionBundleReadPortV2['readExact'],
): CanonicalCaptionRealSourceInspectionBundleReadPortV2 {
  if (typeof readExact !== 'function') {
    throw new Error('Tenant-scoped Caption inspection reader required.')
  }
  const port = Object.freeze({
    schemaVersion:
      CANONICAL_CAPTION_REAL_SOURCE_INSPECTION_BUNDLE_READ_PORT_V2_VERSION,
    sourceAuthority: (
      'caption_owned_tenant_scoped_persisted_real_source_inspection_bundle'
    ) as const,
    callerSuppliedReceiptAccepted: false as const,
    async readExact(input: CanonicalCaptionRealSourceInspectionBundleLocator) {
      return readExact(parseBundleLocator(input))
    },
  })
  admittedReadPortsV2.add(port)
  return port
}

export function isCanonicalCaptionRealSourceInspectionBundleReadPortV2(
  value: unknown,
): value is CanonicalCaptionRealSourceInspectionBundleReadPortV2 {
  return Boolean(value && typeof value === 'object'
    && admittedReadPortsV2.has(value as object))
}

export function createCanonicalCaptionRealSourceInspectionBundleRepository(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly prefix?: string
  },
): CanonicalCaptionRealSourceInspectionBundleRepository {
  assertObjectPort(input.objectPort)
  const prefix = prefixSchema.parse(input.prefix ?? DEFAULT_BUNDLE_PREFIX)
  const repository = Object.freeze({
    schemaVersion:
      CANONICAL_CAPTION_REAL_SOURCE_INSPECTION_BUNDLE_READ_PORT_V2_VERSION,
    repositoryVersion:
      CANONICAL_CAPTION_REAL_SOURCE_INSPECTION_BUNDLE_REPOSITORY_VERSION,
    sourceAuthority: (
      'caption_owned_tenant_scoped_persisted_real_source_inspection_bundle'
    ) as const,
    callerSuppliedReceiptAccepted: false as const,
    async persistBundleCreateOnly(untrusted: unknown) {
      const envelope = z.object({
        locator: z.unknown(),
        bundle: z.unknown(),
      }).strict().parse(untrusted)
      const locator = parseBundleLocator(envelope.locator)
      const bundle = parseBundleValue(envelope.bundle)
      assertBundleLocator(bundle, locator)
      const body = serializeBundle(bundle)
      const path = bundlePath(prefix, locator)
      const disposition = await input.objectPort.createOnly({
        objectPath: path,
        body,
        contentSha256: createHash('sha256').update(body).digest('hex'),
      })
      const reread = await readPersistedBundle(
        input.objectPort, path, locator)
      if (!reread || !sameCanonical(reread, bundle)) {
        throw new Error('Caption inspection bundle persistence conflict.')
      }
      return disposition === 'created' ? 'created' : 'identical_replay'
    },
    async readExact(untrusted: unknown) {
      const locator = parseBundleLocator(untrusted)
      return readPersistedBundle(
        input.objectPort, bundlePath(prefix, locator), locator)
    },
  })
  admittedReadPortsV2.add(repository)
  admittedBundleRepositories.add(repository)
  return repository
}

export function isCanonicalCaptionRealSourceInspectionBundleRepository(
  value: unknown,
): value is CanonicalCaptionRealSourceInspectionBundleRepository {
  return Boolean(value && typeof value === 'object'
    && admittedBundleRepositories.has(value as object))
}

export function createCanonicalCaptionRealSourceInspectionAuthorityReadPort(
  readExact:
    CanonicalCaptionRealSourceInspectionAuthorityReadPort['readExact'],
): CanonicalCaptionRealSourceInspectionAuthorityReadPort {
  if (typeof readExact !== 'function') {
    throw new Error('Canonical Caption approved-run authority reader required.')
  }
  const port = Object.freeze({
    schemaVersion:
      CANONICAL_CAPTION_REAL_SOURCE_INSPECTION_AUTHORITY_READ_PORT_VERSION,
    sourceAuthority:
      'canonical_backend_approved_caption_run_authority' as const,
    callerSuppliedAuthorityAccepted: false as const,
    async readExact(input: {
      readonly approvedSnapshotRef: CaptionDomainRef
      readonly executionPackageRef: CaptionDomainRef
      readonly outputId: string
      readonly renderedArtifactRef: CaptionDomainRef
    }) {
      return readExact(structuredClone(input))
    },
  })
  admittedAuthorityReadPorts.add(port)
  return port
}

export function isCanonicalCaptionRealSourceInspectionAuthorityReadPort(
  value: unknown,
): value is CanonicalCaptionRealSourceInspectionAuthorityReadPort {
  return Boolean(value && typeof value === 'object'
    && admittedAuthorityReadPorts.has(value as object))
}

export function createCanonicalCaptionRealSourceInspectionAuthorityReadPortV2(
  readExact:
    CanonicalCaptionRealSourceInspectionAuthorityReadPortV2['readExact'],
): CanonicalCaptionRealSourceInspectionAuthorityReadPortV2 {
  if (typeof readExact !== 'function') {
    throw new Error(
      'Tenant-scoped canonical Caption authority reader required.')
  }
  const port = Object.freeze({
    schemaVersion:
      CANONICAL_CAPTION_REAL_SOURCE_INSPECTION_AUTHORITY_READ_PORT_V2_VERSION,
    sourceAuthority:
      'canonical_backend_approved_caption_run_authority' as const,
    callerSuppliedAuthorityAccepted: false as const,
    async readExact(input: {
      readonly canonicalScope:
        CanonicalCaptionRealSourceInspectionProjectionRequest['canonicalScope']
      readonly confirmedOutputFrameRef: CaptionDomainRef
      readonly renderedArtifactRef: CaptionDomainRef
      readonly deterministicQaRef: CaptionDomainRef
    }) {
      const parsed = z.object({
        canonicalScope: scopeSchema,
        confirmedOutputFrameRef: refSchema,
        renderedArtifactRef: refSchema,
        deterministicQaRef: refSchema,
      }).strict().parse(input)
      return readExact(structuredClone(parsed))
    },
  })
  admittedAuthorityReadPortsV2.add(port)
  return port
}

export function isCanonicalCaptionRealSourceInspectionAuthorityReadPortV2(
  value: unknown,
): value is CanonicalCaptionRealSourceInspectionAuthorityReadPortV2 {
  return Boolean(value && typeof value === 'object'
    && admittedAuthorityReadPortsV2.has(value as object))
}

export function createCanonicalCaptionRealSourceInspectionProjectionService(
  input: {
    readonly bundleReadPort:
      CanonicalCaptionRealSourceInspectionBundleReadPort
    readonly authorityReadPort:
      CanonicalCaptionRealSourceInspectionAuthorityReadPort
    readonly evidenceRepository:
      CanonicalCaptionDirectVisualInspectionRepository
  },
): CanonicalCaptionRealSourceInspectionProjectionService {
  if (!isCanonicalCaptionRealSourceInspectionBundleReadPort(
    input.bundleReadPort)
    || !isCanonicalCaptionRealSourceInspectionAuthorityReadPort(
      input.authorityReadPort)
    || !isCanonicalCaptionDirectVisualInspectionRepository(
      input.evidenceRepository)) {
    throw new Error(
      'Canonical Caption real-source inspection projection ports invalid.')
  }
  return Object.freeze({
    schemaVersion:
      CANONICAL_CAPTION_REAL_SOURCE_INSPECTION_PROJECTION_SERVICE_VERSION,
    callerSuppliedReceiptAccepted: false as const,
    callerSuppliedAuthorityAccepted: false as const,
    canonicalApprovedRunAuthorityRereadRequired: true as const,
    canonicalQualificationReaderMustRevalidateAuthority: true as const,
    async project(untrusted: unknown): Promise<
      CanonicalCaptionRealSourceInspectionProjectionOutcome> {
      const request =
        parseCanonicalCaptionRealSourceInspectionProjectionRequest(untrusted)
      const first = await readBundle(input.bundleReadPort, request.receiptRef)
      if (!first) {
        throw new Error(
          'Canonical Caption real-source inspection bundle is missing.')
      }
      const second = await readBundle(input.bundleReadPort, request.receiptRef)
      if (!second || !sameCanonical(first, second)) {
        throw new Error(
          'Canonical Caption real-source inspection bundle changed.')
      }
      const firstAuthority = await readAuthority(
        input.authorityReadPort, request)
      if (!firstAuthority) {
        throw new Error(
          'Canonical Caption approved-run authority is missing.')
      }
      const secondAuthority = await readAuthority(
        input.authorityReadPort, request)
      if (!secondAuthority
        || !sameCanonical(firstAuthority, secondAuthority)) {
        throw new Error(
          'Canonical Caption approved-run authority changed.')
      }
      const selected = selectInspectionEvidence(first, request)
      assertSelectedAuthority(selected, request, firstAuthority)
      const evidence = createCanonicalCaptionDirectVisualInspectionEvidence({
        evidenceId: `caption.direct-inspection.${
          request.receiptRef.contentHash.slice(0, 24)}.${request.variant}.${
          firstAuthority.authorityDigestSha256.slice(0, 24)}`,
        observedAt: selected.observedAt,
        canonicalScope: structuredClone(firstAuthority.canonicalScope),
        confirmedOutputFrameRef:
          structuredClone(firstAuthority.confirmedOutputFrameRef),
        renderedArtifactRef:
          structuredClone(firstAuthority.renderedArtifactRef),
        deterministicQaRef:
          structuredClone(firstAuthority.deterministicQaRef),
        sourceMediaAuthorityRef:
          structuredClone(firstAuthority.sourceMediaAuthorityRef),
        sourceMediaBindingRefs:
          structuredClone(firstAuthority.sourceMediaBindingRefs),
        inspectionArtifactSetRef: structuredClone(request.receiptRef),
        coverage: {
          renderedFrameCount: selected.renderedFrameCount,
          representedFrameCount: selected.renderedFrameCount,
          contactSheetCount: selected.contactSheetCount,
          originalResolutionSpotCheckCount:
            selected.originalResolutionSpotCheckCount,
          everyRenderedFrameRepresentedExactlyOnce: true,
          contactSheetCoverageComplete: true,
          originalResolutionTransitionAndTailChecksComplete: true,
          completeMotionPlaybackClaimed: false,
        },
        findings: {
          faceObstructionObserved: false,
          gestureObstructionObserved: false,
          captionClippingObserved: false,
          phraseOverflowObserved: false,
          inaccessibleReadingStateObserved: false,
          importantSourceTextCollisionObserved: false,
          unstablePlacementObserved: false,
          unusableCueTransitionObserved: false,
          tailTruncationObserved: false,
          unprofessionalVisualTreatmentObserved: false,
        },
        inspectionMethod:
          'every_rendered_frame_contact_sheets_plus_original_resolution_checks_v1',
        inspectorClass: 'codex_agent_direct_visual_inspection',
        disposition: 'passed_caption_owned_professional_appearance',
        realUploadedSourcePixelsInspected: true,
        syntheticEngineeringFixtureUsed: false,
        acceptedForCaptionOwnedProfessionalAppearance: true,
        exactApprovedRenderAndSourceAuthorityBound: true,
        deterministicTechnicalQaReplaced: false,
        sharedPostrenderModelReviewClaimed: false,
        independentFinalQaClaimed: false,
        browserLocalCompletionClaimed: false,
        mediaBytesSerialized: false,
        localPathsOrUrlsSerialized: false,
        rawChatOrCredentialsSerialized: false,
        providerCallMadeByCaption: false,
        operationDispatchAuthorityGranted: false,
        repairExecutionAuthorityGranted: false,
        assetMutationAuthorityGranted: false,
        finalQaApprovalGranted: false,
        billingAuthorityGranted: false,
        publicDeliveryGranted: false,
        productionAuthorityGranted: false,
      })
      await input.evidenceRepository.persistEvidenceCreateOnly({ evidence })
      const reread = await input.evidenceRepository.rereadEvidence({
        ownerUserId: firstAuthority.canonicalScope.ownerUserId,
        workspaceId: firstAuthority.canonicalScope.workspaceId,
        approvedSnapshotRef:
          firstAuthority.canonicalScope.approvedSnapshotRef,
        outputId: firstAuthority.canonicalScope.outputId,
        renderedArtifactRef: firstAuthority.renderedArtifactRef,
      })
      if (!reread || !sameCanonical(
        parseCanonicalCaptionDirectVisualInspectionEvidence(reread),
        evidence)) {
        throw new Error(
          'Canonical Caption direct-inspection evidence reread failed.')
      }
      return {
        disposition:
          'projected_canonical_direct_visual_inspection_evidence',
        request,
        evidence,
        captionReceiptRereadTwice: true,
        reviewSpecsRereadTwice: true,
        canonicalApprovedRunAuthorityRereadTwice: true,
        canonicalApprovedRunAuthorityRef: {
          id: firstAuthority.authorityId,
          version: firstAuthority.schemaVersion,
          contentHash: firstAuthority.authorityDigestSha256,
        },
        evidencePersistedCreateOnlyAndReread: true,
        canonicalQualificationReaderMustRevalidateAuthority: true,
        currentProductStatusChanged: false,
        publicOrProductionAuthorityGranted: false,
      }
    },
  })
}

export function createCanonicalCaptionRealSourceInspectionProjectionServiceV2(
  input: {
    readonly bundleReadPort:
      CanonicalCaptionRealSourceInspectionBundleReadPortV2
    readonly authorityReadPort:
      CanonicalCaptionRealSourceInspectionAuthorityReadPortV2
    readonly evidenceRepository:
      CanonicalCaptionDirectVisualInspectionRepository
  },
): CanonicalCaptionRealSourceInspectionProjectionServiceV2 {
  if (!isCanonicalCaptionRealSourceInspectionBundleReadPortV2(
    input.bundleReadPort)
    || !isCanonicalCaptionRealSourceInspectionAuthorityReadPortV2(
      input.authorityReadPort)
    || !isCanonicalCaptionDirectVisualInspectionRepository(
      input.evidenceRepository)) {
    throw new Error(
      'Canonical Caption real-source inspection V2 ports invalid.')
  }
  return Object.freeze({
    schemaVersion:
      CANONICAL_CAPTION_REAL_SOURCE_INSPECTION_PROJECTION_SERVICE_V2_VERSION,
    tenantScopedBundleRereadRequired: true as const,
    callerSuppliedReceiptAccepted: false as const,
    callerSuppliedAuthorityAccepted: false as const,
    canonicalApprovedRunAuthorityRereadRequired: true as const,
    canonicalQualificationReaderMustRevalidateAuthority: true as const,
    async project(untrusted: unknown) {
      const request =
        parseCanonicalCaptionRealSourceInspectionProjectionRequest(untrusted)
      const scopedBundlePort =
        createCanonicalCaptionRealSourceInspectionBundleReadPort(
          async ({ receiptRef }) => {
            if (!sameRef(receiptRef, request.receiptRef)) return null
            return input.bundleReadPort.readExact({
              canonicalScope: request.canonicalScope,
              receiptRef: request.receiptRef,
              variant: request.variant,
            })
          })
      const scopedAuthorityPort =
        createCanonicalCaptionRealSourceInspectionAuthorityReadPort(
          async (locator) => {
            if (!sameRef(locator.approvedSnapshotRef,
              request.canonicalScope.approvedSnapshotRef)
              || !sameRef(locator.executionPackageRef,
                request.canonicalScope.executionPackageRef)
              || locator.outputId !== request.canonicalScope.outputId
              || !sameRef(locator.renderedArtifactRef,
                request.renderedArtifactRef)) return null
            return input.authorityReadPort.readExact({
              canonicalScope: request.canonicalScope,
              confirmedOutputFrameRef: request.confirmedOutputFrameRef,
              renderedArtifactRef: request.renderedArtifactRef,
              deterministicQaRef: request.deterministicQaRef,
            })
          })
      const legacyCore =
        createCanonicalCaptionRealSourceInspectionProjectionService({
          bundleReadPort: scopedBundlePort,
          authorityReadPort: scopedAuthorityPort,
          evidenceRepository: input.evidenceRepository,
        })
      return legacyCore.project(request)
    },
  })
}

async function readBundle(
  port: CanonicalCaptionRealSourceInspectionBundleReadPort,
  receiptRef: CaptionDomainRef,
): Promise<CanonicalCaptionRealSourceInspectionBundle | null> {
  const value = await port.readExact({ receiptRef })
  if (!value) return null
  return parseBundleValue(value)
}

function parseBundleValue(
  value: unknown,
): CanonicalCaptionRealSourceInspectionBundle {
  assertClosedContractTree(value,
    'Canonical Caption real-source inspection bundle')
  return structuredClone(bundleSchema.parse(value))
}

function parseBundleLocator(
  value: unknown,
): CanonicalCaptionRealSourceInspectionBundleLocator {
  assertClosedContractTree(value,
    'Canonical Caption real-source inspection bundle locator')
  return structuredClone(bundleLocatorSchema.parse(value))
}

function assertBundleLocator(
  bundle: CanonicalCaptionRealSourceInspectionBundle,
  locator: CanonicalCaptionRealSourceInspectionBundleLocator,
): void {
  const expectedKind = locator.variant.startsWith('vertical_')
    ? 'vertical_complete_time_v1' : 'multi_output_complete_time_v1'
  if (bundle.receiptKind !== expectedKind) {
    throw new Error('Caption inspection bundle locator kind crossed.')
  }
  const selected = selectInspectionEvidence(bundle, {
    receiptKind: bundle.receiptKind,
    receiptRef: locator.receiptRef,
    variant: locator.variant,
  })
  const scope = selected.canonicalScope
  const expected = locator.canonicalScope
  if (scope.approvedSnapshotRef === null
    || scope.ownerUserId !== expected.ownerUserId
    || scope.workspaceId !== expected.workspaceId
    || scope.projectId !== expected.projectId
    || scope.editSessionId !== expected.editSessionId
    || scope.planVersionId !== expected.planVersionId
    || scope.outputId !== expected.outputId
    || !sameRef(scope.approvedSnapshotRef, expected.approvedSnapshotRef)) {
    throw new Error('Caption inspection bundle locator crossed tenant scope.')
  }
}

function bundlePath(
  prefix: string,
  locator: CanonicalCaptionRealSourceInspectionBundleLocator,
): string {
  const digest = createHash('sha256').update(
    JSON.stringify(locator), 'utf8').digest('hex')
  return `${prefix}/${locator.canonicalScope.ownerUserId}/${
    locator.canonicalScope.workspaceId}/${digest}.json`
}

function serializeBundle(
  bundle: CanonicalCaptionRealSourceInspectionBundle,
): Buffer {
  const body = Buffer.from(JSON.stringify(bundle), 'utf8')
  if (body.byteLength < 2 || body.byteLength > MAX_BUNDLE_BYTES) {
    throw new Error('Caption inspection bundle bytes invalid.')
  }
  return body
}

async function readPersistedBundle(
  port: CanonicalCreateOnlyJsonObjectPort,
  path: string,
  locator: CanonicalCaptionRealSourceInspectionBundleLocator,
): Promise<CanonicalCaptionRealSourceInspectionBundle | null> {
  const body = await port.readExact(path)
  if (!body) return null
  if (body.byteLength < 2 || body.byteLength > MAX_BUNDLE_BYTES) {
    throw new Error('Caption inspection bundle reread bytes invalid.')
  }
  try {
    const bundle = parseBundleValue(
      JSON.parse(body.toString('utf8')) as unknown)
    assertBundleLocator(bundle, locator)
    return bundle
  } catch (error) {
    throw new Error('Caption inspection bundle reread invalid.', {
      cause: error,
    })
  }
}

function assertObjectPort(port: CanonicalCreateOnlyJsonObjectPort): void {
  if (!port || typeof port.createOnly !== 'function'
    || typeof port.readExact !== 'function') {
    throw new Error('Caption inspection bundle object port invalid.')
  }
}

async function readAuthority(
  port: CanonicalCaptionRealSourceInspectionAuthorityReadPort,
  request: CanonicalCaptionRealSourceInspectionProjectionRequest,
): Promise<CanonicalCaptionRealSourceInspectionAuthority | null> {
  const value = await port.readExact({
    approvedSnapshotRef: request.canonicalScope.approvedSnapshotRef,
    executionPackageRef: request.canonicalScope.executionPackageRef,
    outputId: request.canonicalScope.outputId,
    renderedArtifactRef: request.renderedArtifactRef,
  })
  if (!value) return null
  return parseCanonicalCaptionRealSourceInspectionAuthority(value)
}

function selectInspectionEvidence(
  bundle: CanonicalCaptionRealSourceInspectionBundle,
  request: InspectionSelection,
): SelectedInspectionEvidence {
  if (bundle.receiptKind !== request.receiptKind) {
    throw new Error('Canonical Caption inspection receipt kind crossed.')
  }
  return request.receiptKind === 'vertical_complete_time_v1'
    ? selectVerticalEvidence(bundle, request)
    : selectMultiOutputEvidence(bundle, request)
}

function selectVerticalEvidence(
  bundle: CanonicalCaptionRealSourceInspectionBundle,
  request: InspectionSelection,
): SelectedInspectionEvidence {
  if (bundle.reviewSpecs.length !== 2) {
    throw new Error('Canonical Caption vertical inspection specs incomplete.')
  }
  const full = parseCaptionRemotionRealSourceReviewSpec(bundle.reviewSpecs[0])
  const reduced = parseCaptionRemotionRealSourceReviewSpec(
    bundle.reviewSpecs[1])
  const receipt = parseCaptionRealSourceCompleteTimeInspectionReceipt(
    bundle.receipt, {
      fullMotionReviewSpec: full,
      reducedMotionReviewSpec: reduced,
    })
  assertReceiptRef(request.receiptRef, receipt.inspectionId,
    receipt.schemaVersion, receipt.inspectionDigestSha256)
  const reducedMotion = request.variant === 'vertical_reduced_motion'
  if (!['vertical_full_motion', 'vertical_reduced_motion']
    .includes(request.variant)) {
    throw new Error('Canonical Caption vertical inspection variant invalid.')
  }
  const spec = reducedMotion ? reduced : full
  const variant = reducedMotion ? 'reduced_motion' : 'full_motion'
  const render = receipt.renderArtifacts.find((item) =>
    item.variant === variant)
  if (!render) {
    throw new Error('Canonical Caption vertical render evidence missing.')
  }
  return selectedEvidence({
    observedAt: receipt.observedAt,
    canonicalScope: receipt.canonicalScope,
    spec,
    renderedArtifactRef: render.artifactRef,
    originalSourceRef: spec.sourceEvidence.originalSourceRef,
    renderedFrameCount: render.frameCount,
    contactSheetCount: receipt.contactSheets.filter((item) =>
      item.variant === variant).length,
    originalResolutionSpotCheckCount:
      receipt.originalResolutionSpotChecks.filter((item) =>
        item.variant === variant).length,
  })
}

function selectMultiOutputEvidence(
  bundle: CanonicalCaptionRealSourceInspectionBundle,
  request: InspectionSelection,
): SelectedInspectionEvidence {
  if (bundle.reviewSpecs.length !== 4) {
    throw new Error(
      'Canonical Caption multi-output inspection specs incomplete.')
  }
  const specs = bundle.reviewSpecs.map((value) =>
    parseCaptionRemotionRealSourceMultiOutputReviewSpec(value))
  const receipt = parseCaptionRealSourceMultiOutputInspectionReceipt(
    bundle.receipt, {
      widescreenFullReviewSpec: specs[0],
      widescreenReducedReviewSpec: specs[1],
      squareFullReviewSpec: specs[2],
      squareReducedReviewSpec: specs[3],
    })
  assertReceiptRef(request.receiptRef, receipt.inspectionId,
    receipt.schemaVersion, receipt.inspectionDigestSha256)
  const receiptVariant = multiOutputVariant(request.variant)
  const specIndex = [
    'widescreen_full_motion',
    'widescreen_reduced_motion',
    'square_full_motion',
    'square_reduced_motion',
  ].indexOf(receiptVariant)
  const spec = specs[specIndex]
  const render = receipt.renderArtifacts.find((item) =>
    item.variant === receiptVariant)
  if (!spec || !render) {
    throw new Error('Canonical Caption multi-output render evidence missing.')
  }
  return selectedEvidence({
    observedAt: receipt.observedAt,
    canonicalScope: spec.canonicalScope,
    spec,
    renderedArtifactRef: render.artifactRef,
    originalSourceRef: spec.sourceEvidence.originalSourceRef,
    renderedFrameCount: render.frameCount,
    contactSheetCount: receipt.contactSheets.filter((item) =>
      item.variant === receiptVariant).length,
    originalResolutionSpotCheckCount:
      receipt.originalResolutionSpotChecks.filter((item) =>
        item.variant === receiptVariant).length,
  })
}

function selectedEvidence(input: {
  observedAt: string
  canonicalScope: CaptionDomainCanonicalScope
  spec: CaptionRemotionRealSourceReviewSpec |
    CaptionRemotionRealSourceMultiOutputReviewSpec
  renderedArtifactRef: CaptionDomainRef
  originalSourceRef: CaptionDomainRef
  renderedFrameCount: number
  contactSheetCount: number
  originalResolutionSpotCheckCount: number
}): SelectedInspectionEvidence {
  return {
    observedAt: input.observedAt,
    canonicalScope: structuredClone(input.canonicalScope),
    confirmedOutputFrameRef:
      structuredClone(input.spec.confirmedOutputFrame.frameRef),
    renderedArtifactRef: structuredClone(input.renderedArtifactRef),
    originalSourceRef: structuredClone(input.originalSourceRef),
    renderedFrameCount: input.renderedFrameCount,
    contactSheetCount: input.contactSheetCount,
    originalResolutionSpotCheckCount:
      input.originalResolutionSpotCheckCount,
  }
}

function assertSelectedAuthority(
  selected: SelectedInspectionEvidence,
  request: CanonicalCaptionRealSourceInspectionProjectionRequest,
  authority: CanonicalCaptionRealSourceInspectionAuthority,
): void {
  const selectedScope = selected.canonicalScope
  const requestScope = request.canonicalScope
  const authorityScope = authority.canonicalScope
  if (selectedScope.approvedSnapshotRef === null
    || selectedScope.ownerUserId !== requestScope.ownerUserId
    || selectedScope.workspaceId !== requestScope.workspaceId
    || selectedScope.projectId !== requestScope.projectId
    || selectedScope.editSessionId !== requestScope.editSessionId
    || selectedScope.planVersionId !== requestScope.planVersionId
    || selectedScope.outputId !== requestScope.outputId
    || !sameRef(selectedScope.approvedSnapshotRef,
      requestScope.approvedSnapshotRef)
    || !sameRef(selected.confirmedOutputFrameRef,
      request.confirmedOutputFrameRef)
    || !sameRef(selected.renderedArtifactRef, request.renderedArtifactRef)
    || !sameRef(selected.originalSourceRef,
      request.expectedOriginalSourceRef)
    || !sameCanonical(authorityScope, requestScope)
    || !sameRef(authority.confirmedOutputFrameRef,
      request.confirmedOutputFrameRef)
    || !sameRef(authority.renderedArtifactRef,
      request.renderedArtifactRef)
    || !sameRef(authority.deterministicQaRef,
      request.deterministicQaRef)
    || !sameRef(authority.originalSourceRef,
      request.expectedOriginalSourceRef)) {
    throw new Error(
      'Canonical Caption real-source inspection crossed approved authority.')
  }
}

function multiOutputVariant(
  variant: CanonicalCaptionRealSourceInspectionVariant,
): CaptionRealSourceMultiOutputInspectionVariant {
  if (![
    'widescreen_full_motion',
    'widescreen_reduced_motion',
    'square_full_motion',
    'square_reduced_motion',
  ].includes(variant)) {
    throw new Error('Canonical Caption multi-output variant invalid.')
  }
  return variant as CaptionRealSourceMultiOutputInspectionVariant
}

function variantMatchesKind(
  variant: CanonicalCaptionRealSourceInspectionVariant,
  kind: CanonicalCaptionRealSourceInspectionProjectionRequest['receiptKind'],
): boolean {
  return kind === 'vertical_complete_time_v1'
    ? variant.startsWith('vertical_')
    : !variant.startsWith('vertical_')
}

function assertReceiptRef(
  receiptRef: CaptionDomainRef,
  id: string,
  version: string,
  contentHash: string,
): void {
  if (!sameRef(receiptRef, { id, version, contentHash })) {
    throw new Error('Canonical Caption inspection receipt ref crossed.')
  }
}

function refKey(ref: CaptionDomainRef): string {
  return `${ref.id}|${ref.version}|${ref.contentHash}`
}

function sameRef(left: CaptionDomainRef, right: CaptionDomainRef): boolean {
  return refKey(left) === refKey(right)
}

function compareUtf16(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}

function sameCanonical(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

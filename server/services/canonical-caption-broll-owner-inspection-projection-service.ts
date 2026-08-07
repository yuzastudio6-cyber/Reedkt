import { createHash } from 'node:crypto'

import { z } from 'zod'

import type { CaptionDomainRef } from
  '../../src/types/caption-domain-contracts'
import {
  CANONICAL_CAPTION_BROLL_OWNER_EVIDENCE_READ_PORT_VERSION,
  CANONICAL_CAPTION_BROLL_OWNER_INSPECTION_AUTHORITY_READ_PORT_VERSION,
  CANONICAL_CAPTION_BROLL_OWNER_INSPECTION_AUTHORITY_VERSION,
  CANONICAL_CAPTION_BROLL_OWNER_INSPECTION_BUNDLE_READ_PORT_VERSION,
  CANONICAL_CAPTION_BROLL_OWNER_INSPECTION_BUNDLE_REPOSITORY_VERSION,
  CANONICAL_CAPTION_BROLL_OWNER_INSPECTION_REQUEST_VERSION,
  CANONICAL_CAPTION_BROLL_OWNER_INSPECTION_SERVICE_VERSION,
  type CanonicalCaptionBrollOwnerEvidenceReadPort,
  type CanonicalCaptionBrollOwnerEvidenceSnapshot,
  type CanonicalCaptionBrollOwnerInspectionAuthority,
  type CanonicalCaptionBrollOwnerInspectionAuthorityReadPort,
  type CanonicalCaptionBrollOwnerInspectionBundle,
  type CanonicalCaptionBrollOwnerInspectionBundleLocator,
  type CanonicalCaptionBrollOwnerInspectionBundleReadPort,
  type CanonicalCaptionBrollOwnerInspectionBundleRepository,
  type CanonicalCaptionBrollOwnerInspectionProjectionOutcome,
  type CanonicalCaptionBrollOwnerInspectionProjectionRequest,
  type CanonicalCaptionBrollOwnerInspectionProjectionService,
  type CanonicalCaptionBrollOwnerInspectionScope,
} from '../../src/types/canonical-caption-broll-owner-inspection-projection'
import type {
  CanonicalCaptionBrollAuthenticatedEvidenceRecord,
} from '../../src/types/canonical-caption-broll-support'
import type { CanonicalCaptionDirectVisualInspectionRepository } from
  '../../src/types/canonical-caption-direct-visual-inspection-evidence'
import type { CaptionBrollOwnerProfessionalInspectionReceipt } from
  '../../src/types/caption-broll-owner-professional-inspection'
import type { BrollCaptionOwnerReadResult } from
  '../../src/types/caption-broll-owner-read-adapter'
import type { SkillContractRef } from
  '../../src/types/orchestra-skill-contracts'
import { assertClosedContractTree } from
  '../../src/lib/closed-contract-validation'
import {
  parseCaptionBrollOwnerProfessionalInspectionReceipt,
} from '../captions-specialist/caption-broll-owner-professional-inspection'
import {
  assertCaptionRemotionBrollOwnerReviewSpecForOwnerResult,
} from '../captions-specialist/caption-remotion-broll-owner-review'
import { parseBrollCaptionOwnerReadResult } from
  '../captions-specialist/caption-broll-owner-read-adapter'
import { calculateSkillContractDigest } from
  '../orchestra/orchestra-skill-contracts'
import {
  CANONICAL_CAPTION_BROLL_EVIDENCE_REPOSITORY_VERSION,
  parseCanonicalCaptionBrollAuthenticatedEvidenceRecord,
  type CanonicalCaptionBrollEvidenceRepository,
} from './canonical-caption-broll-support-service'
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
const skillRefSchema = refSchema
const rangeSchema = z.object({
  startFrame: z.number().int().nonnegative(),
  endFrameExclusive: z.number().int().positive(),
  fps: z.number().int().positive().max(240),
}).strict().refine((range) =>
  range.endFrameExclusive > range.startFrame)
const scopeSchema = z.object({
  ownerUserId: safeKey,
  workspaceId: safeKey,
  projectId: safeKey,
  editSessionId: safeKey,
  planVersionId: safeKey,
  approvedSnapshotRef: refSchema,
  executionPackageRef: refSchema,
  outputId: safeKey,
  sceneId: safeKey,
  authorizedFrameRange: rangeSchema,
  masterTimingRef: refSchema,
  masterTimingHash: sha256,
}).strict()
const requestSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_CAPTION_BROLL_OWNER_INSPECTION_REQUEST_VERSION),
  requestId: safeKey,
  requestDigestSha256: sha256,
  variant: z.enum(['full_motion', 'reduced_motion']),
  receiptRef: refSchema,
  acceptedReviewSpecRef: refSchema,
  canonicalScope: scopeSchema,
  confirmedOutputFrameRef: refSchema,
  renderedArtifactRef: refSchema,
  deterministicQaRef: refSchema,
  supportRequestRef: skillRefSchema,
  expectedBrollEvidenceRecordRef: refSchema,
  expectedOwnerResultRef: refSchema,
  expectedSelectedNormalizedArtifactRef: refSchema,
  exactCaptionReceiptAndReviewSpecsRereadRequired: z.literal(true),
  exactBrollOwnerEvidenceRereadRequired: z.literal(true),
  canonicalApprovedRunAuthorityRereadRequired: z.literal(true),
  canonicalQualificationReaderMustRevalidateAuthority: z.literal(true),
  callerSuppliedReceiptAccepted: z.literal(false),
  callerSuppliedOwnerEvidenceAccepted: z.literal(false),
  callerSuppliedAuthorityAccepted: z.literal(false),
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
const authoritySchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_CAPTION_BROLL_OWNER_INSPECTION_AUTHORITY_VERSION),
  authorityId: safeKey,
  authorityDigestSha256: sha256,
  canonicalScope: scopeSchema,
  confirmedOutputFrameRef: refSchema,
  renderedArtifactRef: refSchema,
  deterministicQaRef: refSchema,
  supportRequestRef: skillRefSchema,
  brollEvidenceRecordRef: refSchema,
  ownerResultRef: refSchema,
  selectedNormalizedArtifactRef: refSchema,
  sourceMediaAuthorityRef: refSchema,
  sourceMediaBindingRefs: z.array(refSchema).min(1).max(1_000),
  exactApprovedSnapshotExecutionPackageOutputAndBrollWorkReread:
    z.literal(true),
  exactBrollOwnerEvidenceAndSelectedArtifactReread: z.literal(true),
  exactMasterTimingFrameAndSceneReread: z.literal(true),
  exactApprovedSourceManifestReread: z.literal(true),
}).strict()
const projectionOutcomeSchema = z.object({
  disposition: z.literal(
    'projected_canonical_direct_visual_inspection_evidence'),
  request: z.unknown(),
  evidence: z.unknown(),
  captionReceiptAndReviewSpecsRereadTwice: z.literal(true),
  brollOwnerEvidenceRereadTwice: z.literal(true),
  canonicalApprovedRunAuthorityRereadTwice: z.literal(true),
  canonicalApprovedRunAuthorityRef: refSchema,
  evidencePersistedCreateOnlyAndReread: z.literal(true),
  canonicalQualificationReaderMustRevalidateAuthority: z.literal(true),
  currentProductStatusChanged: z.literal(false),
  publicOrProductionAuthorityGranted: z.literal(false),
}).strict()
const bundleSchema = z.object({
  receipt: z.unknown(),
  acceptedFullMotionSpec: z.unknown(),
  acceptedReducedMotionSpec: z.unknown(),
  rejectedFullMotionSpec: z.unknown(),
  rejectedReducedMotionSpec: z.unknown(),
}).strict()
const locatorSchema = z.object({
  canonicalScope: scopeSchema,
  receiptRef: refSchema,
  variant: z.enum(['full_motion', 'reduced_motion']),
}).strict()
const prefixSchema = z.string().trim().min(1).max(1_024)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u)
  .refine((value) =>
    !value.includes('..') && !value.includes('//') && !value.endsWith('/'))

const DEFAULT_BUNDLE_PREFIX =
  'private-internal/captions-specialist/v1/broll-owner-inspection-bundles'
const MAX_BUNDLE_BYTES = 32 * 1024 * 1024
const admittedBundleReadPorts = new WeakSet<object>()
const admittedBundleRepositories = new WeakSet<object>()
const admittedOwnerEvidenceReadPorts = new WeakSet<object>()
const admittedAuthorityReadPorts = new WeakSet<object>()
const admittedProjectionServices = new WeakSet<object>()

type RequestInput = Omit<
  CanonicalCaptionBrollOwnerInspectionProjectionRequest,
  'schemaVersion' | 'requestDigestSha256'
>
type AuthorityInput = Omit<
  CanonicalCaptionBrollOwnerInspectionAuthority,
  'schemaVersion' | 'authorityDigestSha256'
>

export function createCanonicalCaptionBrollOwnerInspectionProjectionRequest(
  input: RequestInput,
): CanonicalCaptionBrollOwnerInspectionProjectionRequest {
  assertClosedContractTree(input,
    'Canonical Caption B-roll inspection request input')
  const withoutDigest = {
    schemaVersion:
      CANONICAL_CAPTION_BROLL_OWNER_INSPECTION_REQUEST_VERSION,
    ...structuredClone(input),
  }
  return parseCanonicalCaptionBrollOwnerInspectionProjectionRequest({
    ...withoutDigest,
    requestDigestSha256: calculateSkillContractDigest({
      ...withoutDigest,
      requestDigestSha256: '',
    }, 'requestDigestSha256'),
  })
}

export function parseCanonicalCaptionBrollOwnerInspectionProjectionRequest(
  value: unknown,
): CanonicalCaptionBrollOwnerInspectionProjectionRequest {
  assertClosedContractTree(value,
    'Canonical Caption B-roll inspection projection request')
  rejectUnsafeText(value)
  const request = requestSchema.parse(value) as
    CanonicalCaptionBrollOwnerInspectionProjectionRequest
  if (request.requestDigestSha256 !== calculateSkillContractDigest(
    request as unknown as Record<string, unknown>, 'requestDigestSha256')
    || request.canonicalScope.masterTimingRef.contentHash
      !== request.canonicalScope.masterTimingHash
    || request.expectedSelectedNormalizedArtifactRef.version
      !== 'b_roll_selected_normalized_media_v1') {
    throw new Error(
      'Canonical Caption B-roll inspection projection request invalid.')
  }
  return structuredClone(request)
}

export function createCanonicalCaptionBrollOwnerInspectionAuthority(
  input: AuthorityInput,
): CanonicalCaptionBrollOwnerInspectionAuthority {
  assertClosedContractTree(input,
    'Canonical Caption B-roll inspection authority input')
  const withoutDigest = {
    schemaVersion:
      CANONICAL_CAPTION_BROLL_OWNER_INSPECTION_AUTHORITY_VERSION,
    ...structuredClone(input),
  }
  return parseCanonicalCaptionBrollOwnerInspectionAuthority({
    ...withoutDigest,
    authorityDigestSha256: calculateSkillContractDigest({
      ...withoutDigest,
      authorityDigestSha256: '',
    }, 'authorityDigestSha256'),
  })
}

export function parseCanonicalCaptionBrollOwnerInspectionAuthority(
  value: unknown,
): CanonicalCaptionBrollOwnerInspectionAuthority {
  assertClosedContractTree(value,
    'Canonical Caption B-roll inspection authority')
  rejectUnsafeText(value)
  const authority = authoritySchema.parse(value) as
    CanonicalCaptionBrollOwnerInspectionAuthority
  const bindingKeys = authority.sourceMediaBindingRefs.map(refKey)
  if (authority.authorityDigestSha256 !== calculateSkillContractDigest(
    authority as unknown as Record<string, unknown>,
    'authorityDigestSha256')
    || authority.canonicalScope.masterTimingRef.contentHash
      !== authority.canonicalScope.masterTimingHash
    || authority.selectedNormalizedArtifactRef.version
      !== 'b_roll_selected_normalized_media_v1'
    || new Set(bindingKeys).size !== bindingKeys.length
    || bindingKeys.join('|') !== [...bindingKeys].sort(compareUtf16).join('|')) {
    throw new Error('Canonical Caption B-roll inspection authority invalid.')
  }
  return structuredClone(authority)
}

export function parseCanonicalCaptionBrollOwnerInspectionProjectionOutcome(
  value: unknown,
): CanonicalCaptionBrollOwnerInspectionProjectionOutcome {
  assertClosedContractTree(value,
    'Canonical Caption B-roll inspection projection outcome')
  rejectUnsafeText(value)
  const envelope = projectionOutcomeSchema.parse(value)
  const request =
    parseCanonicalCaptionBrollOwnerInspectionProjectionRequest(
      envelope.request)
  const evidence = parseCanonicalCaptionDirectVisualInspectionEvidence(
    envelope.evidence)
  const scope = evidence.canonicalScope
  const requestScope = request.canonicalScope
  if (scope.ownerUserId !== requestScope.ownerUserId
    || scope.workspaceId !== requestScope.workspaceId
    || scope.projectId !== requestScope.projectId
    || scope.editSessionId !== requestScope.editSessionId
    || scope.planVersionId !== requestScope.planVersionId
    || !sameRef(scope.approvedSnapshotRef,
      requestScope.approvedSnapshotRef)
    || !sameRef(scope.executionPackageRef,
      requestScope.executionPackageRef)
    || scope.outputId !== requestScope.outputId
    || !sameRef(evidence.confirmedOutputFrameRef,
      request.confirmedOutputFrameRef)
    || !sameRef(evidence.renderedArtifactRef,
      request.renderedArtifactRef)
    || !sameRef(evidence.deterministicQaRef,
      request.deterministicQaRef)
    || !sameRef(evidence.inspectionArtifactSetRef, request.receiptRef)) {
    throw new Error(
      'Canonical Caption B-roll inspection outcome crossed request lineage.')
  }
  return structuredClone({ ...envelope, request, evidence }) as
    CanonicalCaptionBrollOwnerInspectionProjectionOutcome
}

export function createCanonicalCaptionBrollOwnerInspectionBundleReadPort(
  readExact:
    CanonicalCaptionBrollOwnerInspectionBundleReadPort['readExact'],
): CanonicalCaptionBrollOwnerInspectionBundleReadPort {
  if (typeof readExact !== 'function') {
    throw new Error('Caption B-roll inspection bundle reader required.')
  }
  const port = Object.freeze({
    schemaVersion:
      CANONICAL_CAPTION_BROLL_OWNER_INSPECTION_BUNDLE_READ_PORT_VERSION,
    sourceAuthority: (
      'caption_owned_tenant_scoped_persisted_broll_inspection_bundle'
    ) as const,
    callerSuppliedReceiptAccepted: false as const,
    async readExact(input: CanonicalCaptionBrollOwnerInspectionBundleLocator) {
      return readExact(parseBundleLocator(input))
    },
  })
  admittedBundleReadPorts.add(port)
  return port
}

export function isCanonicalCaptionBrollOwnerInspectionBundleReadPort(
  value: unknown,
): value is CanonicalCaptionBrollOwnerInspectionBundleReadPort {
  return Boolean(value && typeof value === 'object'
    && admittedBundleReadPorts.has(value as object))
}

export function createCanonicalCaptionBrollOwnerInspectionBundleRepository(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly prefix?: string
  },
): CanonicalCaptionBrollOwnerInspectionBundleRepository {
  assertObjectPort(input.objectPort)
  const prefix = prefixSchema.parse(input.prefix ?? DEFAULT_BUNDLE_PREFIX)
  const repository = Object.freeze({
    schemaVersion:
      CANONICAL_CAPTION_BROLL_OWNER_INSPECTION_BUNDLE_READ_PORT_VERSION,
    repositoryVersion:
      CANONICAL_CAPTION_BROLL_OWNER_INSPECTION_BUNDLE_REPOSITORY_VERSION,
    sourceAuthority: (
      'caption_owned_tenant_scoped_persisted_broll_inspection_bundle'
    ) as const,
    callerSuppliedReceiptAccepted: false as const,
    async persistBundleCreateOnly(untrusted: unknown) {
      assertClosedContractTree(untrusted,
        'Canonical Caption B-roll inspection bundle write')
      const write = z.object({
        locator: z.unknown(),
        bundle: z.unknown(),
      }).strict().parse(untrusted)
      const locator = parseBundleLocator(write.locator)
      const bundle = parseBundle(write.bundle)
      assertBundleHeaderMatchesLocator(bundle, locator)
      const body = serializeBundle(bundle)
      const path = bundlePath(prefix, locator)
      const disposition = await input.objectPort.createOnly({
        objectPath: path,
        body,
        contentSha256: createHash('sha256').update(body).digest('hex'),
      })
      const reread = await readPersistedBundle(input.objectPort, path)
      if (!reread || !sameCanonical(reread, bundle)) {
        throw new Error(
          'Canonical Caption B-roll inspection bundle persistence conflict.')
      }
      return disposition === 'created' ? 'created' : 'identical_replay'
    },
    async readExact(untrusted: unknown) {
      const locator = parseBundleLocator(untrusted)
      const bundle = await readPersistedBundle(input.objectPort,
        bundlePath(prefix, locator))
      if (!bundle) return null
      assertBundleHeaderMatchesLocator(bundle, locator)
      return bundle
    },
  })
  admittedBundleReadPorts.add(repository)
  admittedBundleRepositories.add(repository)
  return repository
}

export function isCanonicalCaptionBrollOwnerInspectionBundleRepository(
  value: unknown,
): value is CanonicalCaptionBrollOwnerInspectionBundleRepository {
  return Boolean(value && typeof value === 'object'
    && admittedBundleRepositories.has(value as object))
}

export function createCanonicalCaptionBrollOwnerEvidenceReadPort(
  readExact: CanonicalCaptionBrollOwnerEvidenceReadPort['readExact'],
): CanonicalCaptionBrollOwnerEvidenceReadPort {
  if (typeof readExact !== 'function') {
    throw new Error('Canonical Caption B-roll evidence reader required.')
  }
  const port = Object.freeze({
    schemaVersion: CANONICAL_CAPTION_BROLL_OWNER_EVIDENCE_READ_PORT_VERSION,
    sourceAuthority: 'canonical_caption_broll_evidence_repository' as const,
    callerSuppliedOwnerEvidenceAccepted: false as const,
    async readExact(input: { readonly supportRequestRef: SkillContractRef }) {
      return readExact({
        supportRequestRef: structuredClone(
          skillRefSchema.parse(input.supportRequestRef)),
      })
    },
  })
  admittedOwnerEvidenceReadPorts.add(port)
  return port
}

export function createCanonicalCaptionBrollOwnerEvidenceReadPortFromRepository(
  repository: CanonicalCaptionBrollEvidenceRepository,
): CanonicalCaptionBrollOwnerEvidenceReadPort {
  if (!repository
    || repository.schemaVersion
      !== CANONICAL_CAPTION_BROLL_EVIDENCE_REPOSITORY_VERSION
    || typeof repository.rereadOwnerResult !== 'function'
    || typeof repository.rereadEvidenceRecord !== 'function') {
    throw new Error('Canonical Caption B-roll evidence repository invalid.')
  }
  return createCanonicalCaptionBrollOwnerEvidenceReadPort(async (input) => {
    const ownerResult = await repository.rereadOwnerResult(input)
    const evidenceRecord = await repository.rereadEvidenceRecord(input)
    if (!ownerResult && !evidenceRecord) return null
    if (!ownerResult || !evidenceRecord) {
      throw new Error('Canonical Caption B-roll evidence pair incomplete.')
    }
    return { ownerResult, evidenceRecord }
  })
}

export function isCanonicalCaptionBrollOwnerEvidenceReadPort(
  value: unknown,
): value is CanonicalCaptionBrollOwnerEvidenceReadPort {
  return Boolean(value && typeof value === 'object'
    && admittedOwnerEvidenceReadPorts.has(value as object))
}

export function createCanonicalCaptionBrollOwnerInspectionAuthorityReadPort(
  readExact:
    CanonicalCaptionBrollOwnerInspectionAuthorityReadPort['readExact'],
): CanonicalCaptionBrollOwnerInspectionAuthorityReadPort {
  if (typeof readExact !== 'function') {
    throw new Error('Canonical Caption B-roll run authority reader required.')
  }
  const port = Object.freeze({
    schemaVersion:
      CANONICAL_CAPTION_BROLL_OWNER_INSPECTION_AUTHORITY_READ_PORT_VERSION,
    sourceAuthority: (
      'canonical_backend_approved_caption_broll_run_authority'
    ) as const,
    callerSuppliedAuthorityAccepted: false as const,
    async readExact(input: {
      readonly request:
        CanonicalCaptionBrollOwnerInspectionProjectionRequest
    }) {
      return readExact({
        request: parseCanonicalCaptionBrollOwnerInspectionProjectionRequest(
          input.request),
      })
    },
  })
  admittedAuthorityReadPorts.add(port)
  return port
}

export function isCanonicalCaptionBrollOwnerInspectionAuthorityReadPort(
  value: unknown,
): value is CanonicalCaptionBrollOwnerInspectionAuthorityReadPort {
  return Boolean(value && typeof value === 'object'
    && admittedAuthorityReadPorts.has(value as object))
}

export function createCanonicalCaptionBrollOwnerInspectionProjectionService(
  input: {
    readonly bundleReadPort:
      CanonicalCaptionBrollOwnerInspectionBundleReadPort
    readonly ownerEvidenceReadPort:
      CanonicalCaptionBrollOwnerEvidenceReadPort
    readonly authorityReadPort:
      CanonicalCaptionBrollOwnerInspectionAuthorityReadPort
    readonly evidenceRepository:
      CanonicalCaptionDirectVisualInspectionRepository
  },
): CanonicalCaptionBrollOwnerInspectionProjectionService {
  if (!isCanonicalCaptionBrollOwnerInspectionBundleReadPort(
    input.bundleReadPort)
    || !isCanonicalCaptionBrollOwnerEvidenceReadPort(
      input.ownerEvidenceReadPort)
    || !isCanonicalCaptionBrollOwnerInspectionAuthorityReadPort(
      input.authorityReadPort)
    || !isCanonicalCaptionDirectVisualInspectionRepository(
      input.evidenceRepository)) {
    throw new Error(
      'Canonical Caption B-roll inspection projection ports invalid.')
  }
  const service = Object.freeze({
    schemaVersion:
      CANONICAL_CAPTION_BROLL_OWNER_INSPECTION_SERVICE_VERSION,
    tenantScopedBundleRereadRequired: true as const,
    brollOwnerEvidenceRereadRequired: true as const,
    canonicalApprovedRunAuthorityRereadRequired: true as const,
    canonicalQualificationReaderMustRevalidateAuthority: true as const,
    callerSuppliedReceiptAccepted: false as const,
    callerSuppliedOwnerEvidenceAccepted: false as const,
    callerSuppliedAuthorityAccepted: false as const,
    async project(untrusted: unknown): Promise<
      CanonicalCaptionBrollOwnerInspectionProjectionOutcome> {
      const request =
        parseCanonicalCaptionBrollOwnerInspectionProjectionRequest(untrusted)
      const locator = locatorFromRequest(request)
      const firstBundle = await readBundle(input.bundleReadPort, locator)
      const secondBundle = await readBundle(input.bundleReadPort, locator)
      if (!firstBundle || !secondBundle
        || !sameCanonical(firstBundle, secondBundle)) {
        throw new Error(
          'Canonical Caption B-roll inspection bundle missing or changed.')
      }
      const firstOwnerEvidence = await readOwnerEvidence(
        input.ownerEvidenceReadPort, request.supportRequestRef)
      const secondOwnerEvidence = await readOwnerEvidence(
        input.ownerEvidenceReadPort, request.supportRequestRef)
      if (!firstOwnerEvidence || !secondOwnerEvidence
        || !sameCanonical(firstOwnerEvidence, secondOwnerEvidence)) {
        throw new Error(
          'Canonical Caption B-roll owner evidence missing or changed.')
      }
      const firstAuthority = await readAuthority(
        input.authorityReadPort, request)
      const secondAuthority = await readAuthority(
        input.authorityReadPort, request)
      if (!firstAuthority || !secondAuthority
        || !sameCanonical(firstAuthority, secondAuthority)) {
        throw new Error(
          'Canonical Caption approved B-roll run authority missing or changed.')
      }
      const selected = selectInspectionEvidence({
        request,
        bundle: firstBundle,
        ownerEvidence: firstOwnerEvidence,
      })
      assertApprovedLineage({
        request,
        selected,
        ownerEvidence: firstOwnerEvidence,
        authority: firstAuthority,
      })
      const evidence = createCanonicalCaptionDirectVisualInspectionEvidence({
        evidenceId: `caption.direct-inspection.broll.${
          request.receiptRef.contentHash.slice(0, 20)}.${request.variant}.${
          firstAuthority.authorityDigestSha256.slice(0, 20)}`,
        observedAt: selected.receipt.observedAt,
        canonicalScope: {
          ownerUserId: request.canonicalScope.ownerUserId,
          workspaceId: request.canonicalScope.workspaceId,
          projectId: request.canonicalScope.projectId,
          editSessionId: request.canonicalScope.editSessionId,
          planVersionId: request.canonicalScope.planVersionId,
          approvedSnapshotRef: structuredClone(
            request.canonicalScope.approvedSnapshotRef),
          executionPackageRef: structuredClone(
            request.canonicalScope.executionPackageRef),
          outputId: request.canonicalScope.outputId,
        },
        confirmedOutputFrameRef:
          structuredClone(request.confirmedOutputFrameRef),
        renderedArtifactRef: structuredClone(request.renderedArtifactRef),
        deterministicQaRef: structuredClone(request.deterministicQaRef),
        sourceMediaAuthorityRef:
          structuredClone(firstAuthority.sourceMediaAuthorityRef),
        sourceMediaBindingRefs:
          structuredClone(firstAuthority.sourceMediaBindingRefs),
        inspectionArtifactSetRef: structuredClone(request.receiptRef),
        coverage: {
          renderedFrameCount: selected.render.frameCount,
          representedFrameCount: selected.render.frameCount,
          contactSheetCount: 1,
          originalResolutionSpotCheckCount: 7,
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
        ownerUserId: request.canonicalScope.ownerUserId,
        workspaceId: request.canonicalScope.workspaceId,
        approvedSnapshotRef: request.canonicalScope.approvedSnapshotRef,
        outputId: request.canonicalScope.outputId,
        renderedArtifactRef: request.renderedArtifactRef,
      })
      if (!reread || !sameCanonical(
        parseCanonicalCaptionDirectVisualInspectionEvidence(reread),
        evidence)) {
        throw new Error(
          'Canonical Caption B-roll direct-inspection evidence reread failed.')
      }
      return parseCanonicalCaptionBrollOwnerInspectionProjectionOutcome({
        disposition:
          'projected_canonical_direct_visual_inspection_evidence',
        request,
        evidence,
        captionReceiptAndReviewSpecsRereadTwice: true,
        brollOwnerEvidenceRereadTwice: true,
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
      })
    },
  })
  admittedProjectionServices.add(service)
  return service
}

export function isCanonicalCaptionBrollOwnerInspectionProjectionService(
  value: unknown,
): value is CanonicalCaptionBrollOwnerInspectionProjectionService {
  return Boolean(value && typeof value === 'object'
    && admittedProjectionServices.has(value as object))
}

interface SelectedInspectionEvidence {
  receipt: CaptionBrollOwnerProfessionalInspectionReceipt
  ownerResult: BrollCaptionOwnerReadResult
  evidenceRecord: CanonicalCaptionBrollAuthenticatedEvidenceRecord
  reviewSpec: ReturnType<
    typeof assertCaptionRemotionBrollOwnerReviewSpecForOwnerResult>
  render: CaptionBrollOwnerProfessionalInspectionReceipt[
    'acceptedRenderArtifacts'][number]
  selectedNormalizedArtifactRef: CaptionDomainRef
}

function selectInspectionEvidence(input: {
  request: CanonicalCaptionBrollOwnerInspectionProjectionRequest
  bundle: CanonicalCaptionBrollOwnerInspectionBundle
  ownerEvidence: CanonicalCaptionBrollOwnerEvidenceSnapshot
}): SelectedInspectionEvidence {
  const ownerResult = parseBrollCaptionOwnerReadResult(
    input.ownerEvidence.ownerResult)
  const evidenceRecord =
    parseCanonicalCaptionBrollAuthenticatedEvidenceRecord(
      input.ownerEvidence.evidenceRecord)
  const context = {
    ownerResult,
    acceptedFullMotionSpec: input.bundle.acceptedFullMotionSpec,
    acceptedReducedMotionSpec: input.bundle.acceptedReducedMotionSpec,
    rejectedFullMotionSpec: input.bundle.rejectedFullMotionSpec,
    rejectedReducedMotionSpec: input.bundle.rejectedReducedMotionSpec,
  }
  const receipt = parseCaptionBrollOwnerProfessionalInspectionReceipt(
    input.bundle.receipt, context)
  assertReceiptRef(input.request.receiptRef, receipt)
  const selectedSpecValue = input.request.variant === 'full_motion'
    ? input.bundle.acceptedFullMotionSpec
    : input.bundle.acceptedReducedMotionSpec
  const reviewSpec =
    assertCaptionRemotionBrollOwnerReviewSpecForOwnerResult({
      spec: selectedSpecValue,
      ownerResult,
    })
  const render = receipt.acceptedRenderArtifacts.find((item) =>
    item.variant === input.request.variant)
  if (!render) {
    throw new Error('Caption B-roll accepted render evidence missing.')
  }
  return {
    receipt,
    ownerResult,
    evidenceRecord,
    reviewSpec,
    render,
    selectedNormalizedArtifactRef: structuredClone(
      reviewSpec.sourceEvidence.selectedNormalizedArtifactRef),
  }
}

function assertApprovedLineage(input: {
  request: CanonicalCaptionBrollOwnerInspectionProjectionRequest
  selected: SelectedInspectionEvidence
  ownerEvidence: CanonicalCaptionBrollOwnerEvidenceSnapshot
  authority: CanonicalCaptionBrollOwnerInspectionAuthority
}): void {
  const { request, selected, authority } = input
  const scope = request.canonicalScope
  const ownerScope = selected.ownerResult.canonicalScope
  const receiptScope = selected.receipt.canonicalScope
  const authorityScope = authority.canonicalScope
  const expectedRecordRef = recordRef(selected.evidenceRecord)
  const expectedOwnerResultRef = ownerResultRef(selected.ownerResult)
  const expectedReviewSpecRef = reviewSpecRef(selected.reviewSpec)
  const range = receiptScope.authorizedFrameRanges[0]
  if (!range
    || receiptScope.approvedSnapshotRef === null
    || !sameCanonical(input.ownerEvidence.ownerResult,
      selected.evidenceRecord.ownerResult)
    || !sameRef(selected.evidenceRecord.supportRequestRef,
      request.supportRequestRef)
    || !sameRef(expectedRecordRef, request.expectedBrollEvidenceRecordRef)
    || !sameRef(expectedOwnerResultRef, request.expectedOwnerResultRef)
    || !sameRef(expectedReviewSpecRef, request.acceptedReviewSpecRef)
    || !sameRef(selected.render.reviewSpecRef,
      request.acceptedReviewSpecRef)
    || !sameRef(selected.render.artifactRef, request.renderedArtifactRef)
    || !sameRef(selected.selectedNormalizedArtifactRef,
      request.expectedSelectedNormalizedArtifactRef)
    || !sameScope(scope, authorityScope)
    || !sameRef(authority.confirmedOutputFrameRef,
      request.confirmedOutputFrameRef)
    || !sameRef(authority.renderedArtifactRef, request.renderedArtifactRef)
    || !sameRef(authority.deterministicQaRef, request.deterministicQaRef)
    || !sameRef(authority.supportRequestRef, request.supportRequestRef)
    || !sameRef(authority.brollEvidenceRecordRef, expectedRecordRef)
    || !sameRef(authority.ownerResultRef, expectedOwnerResultRef)
    || !sameRef(authority.selectedNormalizedArtifactRef,
      selected.selectedNormalizedArtifactRef)
    || !sameRef(selected.reviewSpec.confirmedOutputFrame.frameRef,
      request.confirmedOutputFrameRef)
    || selected.reviewSpec.masterTimingHash !== scope.masterTimingHash
    || !sameRef(selected.reviewSpec.masterTimingRef, scope.masterTimingRef)
    || ownerScope.ownerUserId !== scope.ownerUserId
    || ownerScope.workspaceId !== scope.workspaceId
    || ownerScope.projectId !== scope.projectId
    || ownerScope.editSessionId !== scope.editSessionId
    || ownerScope.planVersionId !== scope.planVersionId
    || !sameRef(ownerScope.approvedSnapshotRef, scope.approvedSnapshotRef)
    || ownerScope.outputId !== scope.outputId
    || ownerScope.sceneId !== scope.sceneId
    || ownerScope.authorizedFrameRange.startFrameInclusive
      !== scope.authorizedFrameRange.startFrame
    || ownerScope.authorizedFrameRange.endFrameExclusive
      !== scope.authorizedFrameRange.endFrameExclusive
    || ownerScope.authorizedFrameRange.fps !== scope.authorizedFrameRange.fps
    || !sameRef(ownerScope.masterTimingRef, scope.masterTimingRef)
    || ownerScope.masterTimingHash !== scope.masterTimingHash
    || receiptScope.ownerUserId !== scope.ownerUserId
    || receiptScope.workspaceId !== scope.workspaceId
    || receiptScope.projectId !== scope.projectId
    || receiptScope.editSessionId !== scope.editSessionId
    || receiptScope.planVersionId !== scope.planVersionId
    || !sameRef(receiptScope.approvedSnapshotRef, scope.approvedSnapshotRef)
    || receiptScope.outputId !== scope.outputId
    || receiptScope.sceneId !== scope.sceneId
    || range.startFrame !== scope.authorizedFrameRange.startFrame
    || range.endFrameExclusive !== scope.authorizedFrameRange.endFrameExclusive
    || selected.receipt.ownerResultRef.contentHash
      !== selected.ownerResult.resultDigestSha256) {
    throw new Error(
      'Canonical Caption B-roll inspection crossed approved owner lineage.')
  }
}

async function readBundle(
  port: CanonicalCaptionBrollOwnerInspectionBundleReadPort,
  locator: CanonicalCaptionBrollOwnerInspectionBundleLocator,
): Promise<CanonicalCaptionBrollOwnerInspectionBundle | null> {
  const value = await port.readExact(locator)
  return value === null ? null : parseBundle(value)
}

async function readOwnerEvidence(
  port: CanonicalCaptionBrollOwnerEvidenceReadPort,
  supportRequestRef: SkillContractRef,
): Promise<CanonicalCaptionBrollOwnerEvidenceSnapshot | null> {
  const value = await port.readExact({ supportRequestRef })
  if (!value) return null
  const ownerResult = parseBrollCaptionOwnerReadResult(value.ownerResult)
  const evidenceRecord =
    parseCanonicalCaptionBrollAuthenticatedEvidenceRecord(
      value.evidenceRecord)
  if (!sameCanonical(ownerResult, evidenceRecord.ownerResult)
    || !sameRef(evidenceRecord.supportRequestRef, supportRequestRef)) {
    throw new Error('Canonical Caption B-roll owner evidence pair crossed.')
  }
  return { ownerResult, evidenceRecord }
}

async function readAuthority(
  port: CanonicalCaptionBrollOwnerInspectionAuthorityReadPort,
  request: CanonicalCaptionBrollOwnerInspectionProjectionRequest,
): Promise<CanonicalCaptionBrollOwnerInspectionAuthority | null> {
  const value = await port.readExact({ request })
  return value === null ? null
    : parseCanonicalCaptionBrollOwnerInspectionAuthority(value)
}

function parseBundle(
  value: unknown,
): CanonicalCaptionBrollOwnerInspectionBundle {
  assertClosedContractTree(value,
    'Canonical Caption B-roll inspection bundle')
  rejectUnsafeText(value)
  return structuredClone(bundleSchema.parse(value))
}

function parseBundleLocator(
  value: unknown,
): CanonicalCaptionBrollOwnerInspectionBundleLocator {
  assertClosedContractTree(value,
    'Canonical Caption B-roll inspection bundle locator')
  rejectUnsafeText(value)
  const locator = locatorSchema.parse(value) as
    CanonicalCaptionBrollOwnerInspectionBundleLocator
  if (locator.canonicalScope.masterTimingRef.contentHash
    !== locator.canonicalScope.masterTimingHash) {
    throw new Error('Caption B-roll inspection locator timing invalid.')
  }
  return structuredClone(locator)
}

function assertBundleHeaderMatchesLocator(
  bundle: CanonicalCaptionBrollOwnerInspectionBundle,
  locator: CanonicalCaptionBrollOwnerInspectionBundleLocator,
): void {
  const header = z.object({
    schemaVersion: safeKey,
    inspectionId: safeKey,
    inspectionDigestSha256: sha256,
    canonicalScope: z.object({
      ownerUserId: safeKey,
      workspaceId: safeKey,
      projectId: safeKey,
      editSessionId: safeKey,
      planVersionId: safeKey,
      approvedSnapshotRef: refSchema,
      outputId: safeKey,
      sceneId: safeKey,
      authorizedFrameRanges: z.array(z.object({
        startFrame: z.number().int().nonnegative(),
        endFrameExclusive: z.number().int().positive(),
      }).strict()).length(1),
    }).passthrough(),
  }).passthrough().parse(bundle.receipt)
  const range = header.canonicalScope.authorizedFrameRanges[0]!
  const scope = locator.canonicalScope
  if (!sameRef(locator.receiptRef, {
    id: header.inspectionId,
    version: header.schemaVersion,
    contentHash: header.inspectionDigestSha256,
  })
    || header.canonicalScope.ownerUserId !== scope.ownerUserId
    || header.canonicalScope.workspaceId !== scope.workspaceId
    || header.canonicalScope.projectId !== scope.projectId
    || header.canonicalScope.editSessionId !== scope.editSessionId
    || header.canonicalScope.planVersionId !== scope.planVersionId
    || !sameRef(header.canonicalScope.approvedSnapshotRef,
      scope.approvedSnapshotRef)
    || header.canonicalScope.outputId !== scope.outputId
    || header.canonicalScope.sceneId !== scope.sceneId
    || range.startFrame !== scope.authorizedFrameRange.startFrame
    || range.endFrameExclusive !==
      scope.authorizedFrameRange.endFrameExclusive) {
    throw new Error('Caption B-roll inspection bundle crossed locator scope.')
  }
}

function locatorFromRequest(
  request: CanonicalCaptionBrollOwnerInspectionProjectionRequest,
): CanonicalCaptionBrollOwnerInspectionBundleLocator {
  return {
    canonicalScope: structuredClone(request.canonicalScope),
    receiptRef: structuredClone(request.receiptRef),
    variant: request.variant,
  }
}

function serializeBundle(
  bundle: CanonicalCaptionBrollOwnerInspectionBundle,
): Buffer {
  const body = Buffer.from(JSON.stringify(bundle), 'utf8')
  if (body.byteLength < 2 || body.byteLength > MAX_BUNDLE_BYTES) {
    throw new Error('Caption B-roll inspection bundle size invalid.')
  }
  return body
}

async function readPersistedBundle(
  port: CanonicalCreateOnlyJsonObjectPort,
  objectPath: string,
): Promise<CanonicalCaptionBrollOwnerInspectionBundle | null> {
  const body = await port.readExact(objectPath)
  if (!body) return null
  if (body.byteLength < 2 || body.byteLength > MAX_BUNDLE_BYTES) {
    throw new Error('Caption B-roll inspection bundle bytes invalid.')
  }
  try {
    return parseBundle(JSON.parse(body.toString('utf8')) as unknown)
  } catch (error) {
    throw new Error('Caption B-roll inspection bundle reread invalid.', {
      cause: error,
    })
  }
}

function bundlePath(
  prefix: string,
  locator: CanonicalCaptionBrollOwnerInspectionBundleLocator,
): string {
  const digest = createHash('sha256').update(JSON.stringify(locator), 'utf8')
    .digest('hex')
  return `${prefix}/${digest}.json`
}

function assertObjectPort(port: CanonicalCreateOnlyJsonObjectPort): void {
  if (!port || typeof port.createOnly !== 'function'
    || typeof port.readExact !== 'function') {
    throw new Error('Caption B-roll inspection object port invalid.')
  }
}

function assertReceiptRef(
  expected: CaptionDomainRef,
  receipt: CaptionBrollOwnerProfessionalInspectionReceipt,
): void {
  if (!sameRef(expected, {
    id: receipt.inspectionId,
    version: receipt.schemaVersion,
    contentHash: receipt.inspectionDigestSha256,
  })) {
    throw new Error('Caption B-roll inspection receipt reference crossed.')
  }
}

function ownerResultRef(result: BrollCaptionOwnerReadResult): CaptionDomainRef {
  return {
    id: result.resultId,
    version: result.schemaVersion,
    contentHash: result.resultDigestSha256,
  }
}

function recordRef(
  record: CanonicalCaptionBrollAuthenticatedEvidenceRecord,
): CaptionDomainRef {
  return {
    id: record.recordId,
    version: record.schemaVersion,
    contentHash: record.recordDigestSha256,
  }
}

function reviewSpecRef(input: {
  reviewSpecId: string
  schemaVersion: string
  reviewSpecDigestSha256: string
}): CaptionDomainRef {
  return {
    id: input.reviewSpecId,
    version: input.schemaVersion,
    contentHash: input.reviewSpecDigestSha256,
  }
}

function sameScope(
  left: CanonicalCaptionBrollOwnerInspectionScope,
  right: CanonicalCaptionBrollOwnerInspectionScope,
): boolean {
  return sameCanonical(left, right)
}

function sameRef(
  left: { id: string; version: string; contentHash: string },
  right: { id: string; version: string; contentHash: string },
): boolean {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}

function refKey(value: CaptionDomainRef): string {
  return `${value.id}|${value.version}|${value.contentHash}`
}

function compareUtf16(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}

function sameCanonical(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

function rejectUnsafeText(value: unknown): void {
  const stack: unknown[] = [value]
  while (stack.length > 0) {
    const current = stack.pop()
    if (typeof current === 'string') {
      if (/https?:\/\/|file:\/\/|data:|blob:|javascript:|\/(?:Users|Volumes|home|tmp)\/|(?:secret|token|password|credential)=/iu
        .test(current)) {
        throw new Error('Caption B-roll inspection contains unsafe text.')
      }
    } else if (Array.isArray(current)) {
      stack.push(...current)
    } else if (current && typeof current === 'object') {
      stack.push(...Object.values(current))
    }
  }
}

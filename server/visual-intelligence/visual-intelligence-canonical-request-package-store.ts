import { createHash } from 'node:crypto'

import type {
  VisualInspectionRequirement,
  VisualIntelligenceEvidenceRef,
  VisualIntelligencePreparedEvidence,
  VisualIntelligenceRequest,
} from '../../src/types/visual-intelligence'
import { ApiError } from '../errors/api-error'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createVisualIntelligenceEvidenceRef,
  parseVisualInspectionRequirement,
  parseVisualIntelligenceRequest,
  visualIntelligenceCanonicalJson,
  visualIntelligenceDigest,
} from './visual-intelligence-contract'
import type {
  VisualIntelligenceInspectionRequestOwner,
} from './visual-intelligence-inspection-coordinator'
import {
  assertVisualIntelligencePreparedEvidenceForRequest,
  type VisualIntelligenceAdmissionVerificationPort,
  type VisualIntelligenceEvidencePreparationPort,
} from './visual-intelligence-lifecycle-service'
import {
  assertAdmittedVisualIntelligenceRuntimeRelease,
  visualIntelligenceRuntimeReleaseRef,
  type VisualIntelligenceRuntimeRelease,
} from './visual-intelligence-runtime-release'

export const VISUAL_INTELLIGENCE_CANONICAL_REQUEST_PACKAGE_STORE_VERSION =
  'visual-intelligence-canonical-request-package-store-v1' as const

const DEFAULT_PREFIX = 'private/visual-intelligence/v1/request-packages'
const MAX_RECORD_BYTES = 24 * 1024 * 1024
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const PREFIXED_SHA256 = /^sha256:[a-f0-9]{64}$/u

export type VisualIntelligenceCanonicalRequestPackageOwnerClass =
  | 'canonical_source_or_reference_owner'
  | 'canonical_approved_edit_inspection_owner'

export interface VisualIntelligenceCanonicalRequestPackageStore
extends VisualIntelligenceAdmissionVerificationPort,
  VisualIntelligenceEvidencePreparationPort,
  VisualIntelligenceInspectionRequestOwner {
  readonly schemaVersion:
    typeof VISUAL_INTELLIGENCE_CANONICAL_REQUEST_PACKAGE_STORE_VERSION
  persistCreateOnly(input: {
    readonly ownerClass:
      VisualIntelligenceCanonicalRequestPackageOwnerClass
    readonly ownerAuthorityRef: VisualIntelligenceEvidenceRef
    readonly request: VisualIntelligenceRequest
    readonly preparedEvidence: VisualIntelligencePreparedEvidence
    readonly inspectionRequirement: VisualInspectionRequirement | null
  }): Promise<{
    readonly packageRef: VisualIntelligenceEvidenceRef
    readonly admissionRef: VisualIntelligenceEvidenceRef
    readonly disposition: 'created' | 'identical_replay'
  }>
}

interface CanonicalRequestPackageRecord {
  readonly schemaVersion:
    'visual-intelligence-canonical-request-package-record-v1'
  readonly storeVersion:
    typeof VISUAL_INTELLIGENCE_CANONICAL_REQUEST_PACKAGE_STORE_VERSION
  readonly ownerClass: VisualIntelligenceCanonicalRequestPackageOwnerClass
  readonly ownerAuthorityRef: VisualIntelligenceEvidenceRef
  readonly request: VisualIntelligenceRequest
  readonly preparedEvidence: VisualIntelligencePreparedEvidence
  readonly inspectionRequirement: VisualInspectionRequirement | null
  readonly admissionRef: VisualIntelligenceEvidenceRef
  readonly exactOwnerScopeRereadRequired: true
  readonly exactArtifactGenerationRereadRequired: true
  readonly exactCostPreflightRereadRequired: true
  readonly killSwitchesMustRemainClosed: true
  readonly retentionAndPrivacyRereadRequired: true
  readonly browserOrCallerPackageAccepted: false
  readonly callerMediaLocatorAccepted: false
  readonly callerProviderCredentialAccepted: false
  readonly directTimelineMutationAllowed: false
  readonly recordDigestSha256: string
}

export function createVisualIntelligenceCanonicalRequestPackageStore(input: {
  readonly objectPort: CanonicalCreateOnlyJsonObjectPort
  readonly runtimeRelease: VisualIntelligenceRuntimeRelease
  readonly prefix?: string
}): VisualIntelligenceCanonicalRequestPackageStore {
  assertObjectPort(input.objectPort)
  const release = assertAdmittedVisualIntelligenceRuntimeRelease(
    input.runtimeRelease,
  )
  const releaseRef = visualIntelligenceRuntimeReleaseRef(release)
  const prefix = normalizePrefix(input.prefix ?? DEFAULT_PREFIX)

  const readByRequestId = async (
    requestId: string,
  ): Promise<CanonicalRequestPackageRecord | null> => {
    const body = await input.objectPort.readExact(recordPath(prefix, requestId))
    if (!body) return null
    return parseRecord(parseJson(body), releaseRef)
  }

  const store: VisualIntelligenceCanonicalRequestPackageStore = {
    schemaVersion:
      VISUAL_INTELLIGENCE_CANONICAL_REQUEST_PACKAGE_STORE_VERSION,

    async persistCreateOnly(value) {
      const ownerAuthorityRef = requireRef(value.ownerAuthorityRef)
      const request = parseVisualIntelligenceRequest(value.request)
      const preparedEvidence =
        assertVisualIntelligencePreparedEvidenceForRequest(
          request,
          value.preparedEvidence,
        )
      const inspectionRequirement = value.inspectionRequirement === null
        ? null
        : parseVisualInspectionRequirement(value.inspectionRequirement)
      assertOwnerSemantics({
        ownerClass: value.ownerClass,
        request,
        inspectionRequirement,
        releaseRef,
      })
      const admissionRef = packageAdmissionRef({
        ownerClass: value.ownerClass,
        ownerAuthorityRef,
        request,
        preparedEvidence,
        inspectionRequirement,
      })
      const withoutDigest = {
        schemaVersion:
          'visual-intelligence-canonical-request-package-record-v1' as const,
        storeVersion:
          VISUAL_INTELLIGENCE_CANONICAL_REQUEST_PACKAGE_STORE_VERSION,
        ownerClass: value.ownerClass,
        ownerAuthorityRef,
        request,
        preparedEvidence,
        inspectionRequirement,
        admissionRef,
        exactOwnerScopeRereadRequired: true as const,
        exactArtifactGenerationRereadRequired: true as const,
        exactCostPreflightRereadRequired: true as const,
        killSwitchesMustRemainClosed: true as const,
        retentionAndPrivacyRereadRequired: true as const,
        browserOrCallerPackageAccepted: false as const,
        callerMediaLocatorAccepted: false as const,
        callerProviderCredentialAccepted: false as const,
        directTimelineMutationAllowed: false as const,
      }
      const record: CanonicalRequestPackageRecord = {
        ...withoutDigest,
        recordDigestSha256: visualIntelligenceDigest(withoutDigest),
      }
      const body = recordBody(record)
      const created = await input.objectPort.createOnly({
        objectPath: recordPath(prefix, request.requestId),
        body,
        contentSha256: rawDigest(body),
      })
      const reread = await readByRequestId(request.requestId)
      if (!reread || !same(record, reread)) {
        throw conflict('visual_intelligence_request_package_reread_mismatch')
      }
      return Object.freeze({
        packageRef: packageRef(reread),
        admissionRef: reread.admissionRef,
        disposition: created === 'created'
          ? 'created' as const
          : 'identical_replay' as const,
      })
    },

    async verifyAndRereadExact(untrustedRequest) {
      const request = parseVisualIntelligenceRequest(untrustedRequest)
      const record = await readByRequestId(request.requestId)
      if (!record) return {
        status: 'blocked' as const,
        blockerCode: 'visual_intelligence_request_package_missing',
      }
      if (!same(record.request, request)) return {
        status: 'blocked' as const,
        blockerCode: 'visual_intelligence_request_package_mismatch',
      }
      return {
        status: 'admitted' as const,
        admissionRef: record.admissionRef,
        providerReleaseRef: releaseRef,
        exactScopeRereadVerified: true as const,
        exactArtifactAuthorityRereadVerified: true as const,
        exactCostPreflightRereadVerified: true as const,
        killSwitchesVerifiedClosed: true as const,
        retentionPrivacyVerified: true as const,
      }
    },

    async prepare({ request: untrustedRequest, admissionRef }) {
      const request = parseVisualIntelligenceRequest(untrustedRequest)
      const record = await readByRequestId(request.requestId)
      if (
        !record
        || !same(record.request, request)
        || refKey(record.admissionRef) !== refKey(requireRef(admissionRef))
      ) throw notReady('visual_intelligence_request_package_not_current')
      return assertVisualIntelligencePreparedEvidenceForRequest(
        request,
        record.preparedEvidence,
      )
    },

    async prepareApprovedEditInspectionRequest({ requirement: untrusted }) {
      const requirement = parseVisualInspectionRequirement(untrusted)
      const requestId = approvedInspectionRequestId(requirement)
      const record = await readByRequestId(requestId)
      if (
        !record
        || record.ownerClass !==
          'canonical_approved_edit_inspection_owner'
        || !record.inspectionRequirement
        || !same(record.inspectionRequirement, requirement)
      ) throw notReady(
        'visual_intelligence_approved_inspection_package_missing',
      )
      return record.request
    },
  }
  return Object.freeze(store)
}

export function approvedVisualIntelligenceInspectionRequestId(
  untrustedRequirement: unknown,
): string {
  return approvedInspectionRequestId(
    parseVisualInspectionRequirement(untrustedRequirement),
  )
}

function approvedInspectionRequestId(
  requirement: VisualInspectionRequirement,
): string {
  return `vi-inspection-request-${
    requirement.inspectionDigestSha256.slice(7, 55)}`
}

function assertOwnerSemantics(input: {
  ownerClass: VisualIntelligenceCanonicalRequestPackageOwnerClass
  request: VisualIntelligenceRequest
  inspectionRequirement: VisualInspectionRequirement | null
  releaseRef: VisualIntelligenceEvidenceRef
}): void {
  if (
    refKey(input.request.admission.providerReleaseRef)
      !== refKey(input.releaseRef)
    || input.request.admission.globalKillSwitchOpen
    || input.request.admission.providerKillSwitchOpen
  ) throw notReady('visual_intelligence_request_package_release_mismatch')
  if (input.ownerClass === 'canonical_source_or_reference_owner') {
    if (
      input.inspectionRequirement !== null
      || input.request.operation !== 'analyze_media'
      || (
        input.request.profile !== 'source_edit_planning'
        && input.request.profile !== 'reference_preference_dna'
      )
      || input.request.admission.mode !== 'planning_evidence'
      || input.request.scope.approvedSnapshotId !== null
    ) throw notReady('visual_intelligence_planning_package_owner_mismatch')
    return
  }
  const requirement = input.inspectionRequirement
  const admission = input.request.admission
  if (
    !requirement
    || input.request.requestId !== approvedInspectionRequestId(requirement)
    || input.request.operation !== 'inspect_edit'
    || input.request.profile !== requirement.profile
    || admission.mode !== 'approved_edit_inspection'
    || input.request.scope.approvedSnapshotId === null
    || admission.approvedPlanSnapshotRef.id
      !== input.request.scope.approvedSnapshotId
    || input.request.sourceArtifacts.length !== 1
    || input.request.comparisonArtifacts.length !== 0
    || input.request.outputFrame === null
    || !same(input.request.requestedRanges, requirement.requestedRanges)
    || !same(input.request.expectedOutcomeRefs,
      requirement.expectedOutcomeRefs)
    || !same(admission.expectedOutcomeRefs, requirement.expectedOutcomeRefs)
    || !admission.workNodeRefs.some(
      (reference) => reference.id === requirement.owningWorkNodeId,
    )
  ) throw notReady('visual_intelligence_inspection_package_owner_mismatch')
}

function parseRecord(
  value: unknown,
  releaseRef: VisualIntelligenceEvidenceRef,
): CanonicalRequestPackageRecord {
  if (!isPlainRecord(value)) {
    throw conflict('visual_intelligence_request_package_invalid')
  }
  const keys = [
    'schemaVersion', 'storeVersion', 'ownerClass', 'ownerAuthorityRef',
    'request', 'preparedEvidence', 'inspectionRequirement', 'admissionRef',
    'exactOwnerScopeRereadRequired',
    'exactArtifactGenerationRereadRequired',
    'exactCostPreflightRereadRequired', 'killSwitchesMustRemainClosed',
    'retentionAndPrivacyRereadRequired', 'browserOrCallerPackageAccepted',
    'callerMediaLocatorAccepted', 'callerProviderCredentialAccepted',
    'directTimelineMutationAllowed', 'recordDigestSha256',
  ]
  if (
    Reflect.ownKeys(value).length !== keys.length
    || keys.some((key) => !Object.hasOwn(value, key))
    || value.schemaVersion !==
      'visual-intelligence-canonical-request-package-record-v1'
    || value.storeVersion !==
      VISUAL_INTELLIGENCE_CANONICAL_REQUEST_PACKAGE_STORE_VERSION
    || (value.ownerClass !== 'canonical_source_or_reference_owner'
      && value.ownerClass !==
        'canonical_approved_edit_inspection_owner')
    || value.exactOwnerScopeRereadRequired !== true
    || value.exactArtifactGenerationRereadRequired !== true
    || value.exactCostPreflightRereadRequired !== true
    || value.killSwitchesMustRemainClosed !== true
    || value.retentionAndPrivacyRereadRequired !== true
    || value.browserOrCallerPackageAccepted !== false
    || value.callerMediaLocatorAccepted !== false
    || value.callerProviderCredentialAccepted !== false
    || value.directTimelineMutationAllowed !== false
    || typeof value.recordDigestSha256 !== 'string'
    || !PREFIXED_SHA256.test(value.recordDigestSha256)
    || value.recordDigestSha256 !== visualIntelligenceDigest(
      omit(value, 'recordDigestSha256'),
    )
  ) throw conflict('visual_intelligence_request_package_invalid')
  const request = parseVisualIntelligenceRequest(value.request)
  const preparedEvidence =
    assertVisualIntelligencePreparedEvidenceForRequest(
      request,
      value.preparedEvidence,
    )
  const ownerAuthorityRef = requireRef(value.ownerAuthorityRef)
  const inspectionRequirement = value.inspectionRequirement === null
    ? null
    : parseVisualInspectionRequirement(value.inspectionRequirement)
  assertOwnerSemantics({
    ownerClass: value.ownerClass,
    request,
    inspectionRequirement,
    releaseRef,
  })
  const expectedAdmissionRef = packageAdmissionRef({
    ownerClass: value.ownerClass,
    ownerAuthorityRef,
    request,
    preparedEvidence,
    inspectionRequirement,
  })
  if (refKey(requireRef(value.admissionRef)) !== refKey(expectedAdmissionRef)) {
    throw conflict('visual_intelligence_request_package_admission_invalid')
  }
  return Object.freeze({
    ...value,
    ownerClass: value.ownerClass,
    ownerAuthorityRef,
    request,
    preparedEvidence,
    inspectionRequirement,
    admissionRef: expectedAdmissionRef,
  }) as unknown as CanonicalRequestPackageRecord
}

function packageAdmissionRef(input: {
  ownerClass: VisualIntelligenceCanonicalRequestPackageOwnerClass
  ownerAuthorityRef: VisualIntelligenceEvidenceRef
  request: VisualIntelligenceRequest
  preparedEvidence: VisualIntelligencePreparedEvidence
  inspectionRequirement: VisualInspectionRequirement | null
}): VisualIntelligenceEvidenceRef {
  const identity = {
    storeVersion:
      VISUAL_INTELLIGENCE_CANONICAL_REQUEST_PACKAGE_STORE_VERSION,
    ownerClass: input.ownerClass,
    ownerAuthorityRef: input.ownerAuthorityRef,
    requestDigestSha256: input.request.requestDigestSha256,
    preparedEvidenceRef: input.preparedEvidence.preparedEvidenceRef,
    inspectionDigestSha256:
      input.inspectionRequirement?.inspectionDigestSha256 ?? null,
  }
  return createVisualIntelligenceEvidenceRef(
    `vi-package-admission-${visualIntelligenceDigest(identity).slice(7, 39)}`,
    identity,
  )
}

function packageRef(
  record: CanonicalRequestPackageRecord,
): VisualIntelligenceEvidenceRef {
  return Object.freeze({
    id: `vi-request-package-${record.request.requestDigestSha256.slice(7, 39)}`,
    version: 1,
    contentHash: record.recordDigestSha256,
  })
}

function requireRef(value: unknown): VisualIntelligenceEvidenceRef {
  if (
    !isPlainRecord(value)
    || Reflect.ownKeys(value).length !== 3
    || typeof value.id !== 'string'
    || !SAFE_ID.test(value.id)
    || !Number.isSafeInteger(value.version)
    || Number(value.version) < 1
    || typeof value.contentHash !== 'string'
    || !PREFIXED_SHA256.test(value.contentHash)
  ) throw conflict('visual_intelligence_request_package_ref_invalid')
  return Object.freeze({
    id: value.id,
    version: Number(value.version),
    contentHash: value.contentHash,
  })
}

function recordBody(value: CanonicalRequestPackageRecord): Buffer {
  const body = Buffer.from(visualIntelligenceCanonicalJson(value), 'utf8')
  if (body.byteLength < 2 || body.byteLength > MAX_RECORD_BYTES) {
    throw conflict('visual_intelligence_request_package_size_invalid')
  }
  return body
}

function recordPath(prefix: string, requestId: string): string {
  if (!SAFE_ID.test(requestId) || requestId.includes('..')) {
    throw conflict('visual_intelligence_request_package_id_invalid')
  }
  return `${prefix}/${visualIntelligenceDigest(requestId).slice(7)}.json`
}

function normalizePrefix(value: string): string {
  const normalized = value.trim().replace(/^\/+|\/+$/gu, '')
  if (
    !normalized
    || normalized.length > 400
    || normalized.includes('..')
    || normalized.includes('\\')
    || normalized.split('/').some((part) => !SAFE_ID.test(part))
  ) throw notReady('visual_intelligence_request_package_prefix_invalid')
  return normalized
}

function parseJson(body: Buffer): unknown {
  if (body.byteLength < 2 || body.byteLength > MAX_RECORD_BYTES) {
    throw conflict('visual_intelligence_request_package_size_invalid')
  }
  try {
    return JSON.parse(body.toString('utf8')) as unknown
  } catch {
    throw conflict('visual_intelligence_request_package_json_invalid')
  }
}

function assertObjectPort(port: CanonicalCreateOnlyJsonObjectPort): void {
  if (
    !port
    || typeof port.createOnly !== 'function'
    || typeof port.readExact !== 'function'
  ) throw notReady('visual_intelligence_request_package_store_invalid')
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function omit(
  value: Record<string, unknown>,
  key: string,
): Record<string, unknown> {
  const result = { ...value }
  Reflect.deleteProperty(result, key)
  return result
}

function rawDigest(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function same(left: unknown, right: unknown): boolean {
  return visualIntelligenceCanonicalJson(left)
    === visualIntelligenceCanonicalJson(right)
}

function refKey(value: VisualIntelligenceEvidenceRef): string {
  return `${value.id}:${value.version}:${value.contentHash}`
}

function notReady(requiredGate: string): ApiError {
  return new ApiError(
    'TOOL_NOT_READY',
    'The canonical Visual Intelligence request package is not ready.',
    503,
    { requiredGate },
  )
}

function conflict(requiredGate: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_CONFLICT',
    'The canonical Visual Intelligence request package changed or is invalid.',
    409,
    { requiredGate },
  )
}

import { createHash } from 'node:crypto'
import { detectEditReferenceCopyRisks } from './edit-reference-copy-safety'

export const EDIT_REFERENCE_PREVIOUS_APPROVED_EDIT_STUDY_REQUEST_VERSION =
  'edit-reference-previous-approved-edit-study-request-v1' as const
export const EDIT_REFERENCE_PREVIOUS_APPROVED_EDIT_STUDY_RESULT_VERSION =
  'edit-reference-previous-approved-edit-study-result-v2' as const

export const EDIT_REFERENCE_PREVIOUS_APPROVED_EDIT_STUDY_LAYERS = [
  'media_structure',
  'visual_language',
  'story_and_pacing',
  'captions',
  'color',
  'b_roll',
  'audio_and_sfx',
  'graphics',
] as const

export type EditReferencePreviousApprovedEditStudyLayer =
  typeof EDIT_REFERENCE_PREVIOUS_APPROVED_EDIT_STUDY_LAYERS[number]

export const EDIT_REFERENCE_PREVIOUS_APPROVED_EDIT_BLOCKED_TRANSFERS = [
  'source_footage',
  'exact_caption_wording',
  'exact_timing_or_sequence',
  'creator_person_brand_identity',
  'copyrighted_music_or_sfx',
  'original_graphics_or_layout',
] as const

export type EditReferencePreviousApprovedEditBlockedTransfer =
  typeof EDIT_REFERENCE_PREVIOUS_APPROVED_EDIT_BLOCKED_TRANSFERS[number]

export interface EditReferencePreviousApprovedEditStudyRequest {
  readonly schemaVersion: typeof EDIT_REFERENCE_PREVIOUS_APPROVED_EDIT_STUDY_REQUEST_VERSION
  readonly workspaceId: string
  readonly actorUserId: string
  readonly sourceEvidenceId: string
  readonly projectId: string
  readonly editSessionId: string
  readonly approvedSnapshotId: string
  readonly requestedLayers: readonly EditReferencePreviousApprovedEditStudyLayer[]
  readonly maxEvidenceItems: number
}

export interface EditReferencePreviousApprovedEditAuthorityProof {
  readonly workspaceId: string
  readonly authorizedActorUserId: string
  readonly projectId: string
  readonly editSessionId: string
  readonly approvedSnapshotId: string
  readonly approvalRecordId: string
  readonly approvedByUserId: string
  readonly approvedAt: string
  readonly approvedPlanId: string
  readonly approvedPlanVersion: number
  readonly snapshotVersion: number
  readonly snapshotStatus: 'approved'
  readonly planDigestSha256: string
  readonly snapshotDigestSha256: string
  readonly workspaceMembershipVerified: true
  readonly projectMembershipVerified: true
  readonly approvalAuthorityVerified: true
  readonly immutableSnapshotVerified: true
}

export interface EditReferencePreviousApprovedEditPrivateArtifactProof {
  readonly privatePreviewArtifactId: string
  readonly checksumSha256: string
  readonly ownership: 'target_owned'
  readonly rightsBasis: 'workspace_approved_edit'
  readonly privacyClassification: 'private_project'
  readonly retentionStatus: 'active'
}

export interface EditReferencePreviousApprovedEditEvidenceSummary {
  readonly layer: EditReferencePreviousApprovedEditStudyLayer
  readonly summary: string
  readonly confidence: number
  readonly sourceDecisionIds: readonly string[]
  readonly sourceEvidenceIds: readonly string[]
  readonly transferablePrinciples: readonly string[]
  readonly nonTransferableElements: readonly string[]
}

export interface EditReferenceVerifiedPreviousApprovedEditStudyResult {
  readonly schemaVersion: typeof EDIT_REFERENCE_PREVIOUS_APPROVED_EDIT_STUDY_RESULT_VERSION
  readonly requestDigestSha256: string
  readonly status: 'verified'
  readonly runtimeSource: 'verified_local' | 'verified_live'
  readonly authority: EditReferencePreviousApprovedEditAuthorityProof
  readonly approvedPlanEvidenceIds: readonly string[]
  readonly privatePreviewArtifactIds: readonly string[]
  readonly privatePreviewArtifactProofs: readonly EditReferencePreviousApprovedEditPrivateArtifactProof[]
  readonly evidence: readonly EditReferencePreviousApprovedEditEvidenceSummary[]
  readonly blockedTransfers: readonly EditReferencePreviousApprovedEditBlockedTransfer[]
  readonly execution: {
    readonly approvedSnapshotOpened: true
    readonly approvedPlanOpened: true
    readonly privatePreviewOpened: true
    readonly decisionLineageRead: true
    readonly projectHistoryOpened: false
    readonly chatHistoryOpened: false
    readonly privateMediaOpened: false
    readonly fileBytesRead: false
    readonly externalUrlFetched: false
    readonly providerCallMade: false
    readonly modelCallMade: false
    readonly mediaProcessingStarted: false
    readonly workerJobCreated: false
    readonly remoteMutationMade: false
  }
  readonly provenance: {
    readonly adapterId: string
    readonly adapterVersion: string
    readonly executionId: string
    readonly startedAt: string
    readonly completedAt: string
    readonly internalCostStatus: 'not_incurred' | 'metered'
    readonly meteredInternalCostMicros: string
    readonly usageEventIds: readonly string[]
    readonly internalCostRecordIds: readonly string[]
    readonly customerPriceCalculated: false
    readonly customerCreditsMutated: false
    readonly serviceFeeIncluded: false
  }
  readonly privacy: {
    readonly rawSnapshotPersisted: false
    readonly rawPlanPersisted: false
    readonly rawMediaPersisted: false
    readonly rawChatPersisted: false
    readonly signedUrlPersisted: false
    readonly rawProviderPayloadPersisted: false
    readonly unapprovedHistoryOpened: false
  }
}

export type EditReferencePreviousApprovedEditStudyBlockerCode =
  | 'adapter_unavailable'
  | 'authority_unverified'
  | 'cross_workspace_denied'
  | 'snapshot_not_approved'
  | 'snapshot_identity_mismatch'
  | 'private_artifact_unavailable'

export interface EditReferenceBlockedPreviousApprovedEditStudyResult {
  readonly schemaVersion: typeof EDIT_REFERENCE_PREVIOUS_APPROVED_EDIT_STUDY_RESULT_VERSION
  readonly requestDigestSha256: string
  readonly status: 'blocked'
  readonly blockerCode: EditReferencePreviousApprovedEditStudyBlockerCode
  readonly blockerMessage: string
  readonly retryAvailable: boolean
  readonly retryReason?: string
  readonly evidence: readonly []
  readonly approvedPlanEvidenceIds: readonly []
  readonly privatePreviewArtifactIds: readonly []
  readonly providerCallMade: false
  readonly remoteMutationMade: false
}

export type EditReferencePreviousApprovedEditStudyResult =
  | EditReferenceVerifiedPreviousApprovedEditStudyResult
  | EditReferenceBlockedPreviousApprovedEditStudyResult

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/
const SHA256_PATTERN = /^[a-f0-9]{64}$/
const MONEY_MICROS_PATTERN = /^(?:0|[1-9][0-9]{0,15})$/
const UNSAFE_TEXT_PATTERN = /https?:\/\/|signed[_ -]?url|authorization|bearer\s+|service[_ -]?role|api[_ -]?key|private[_ -]?key|password|credential|raw[_ -]?(?:snapshot|plan|media|chat|provider)/i
const BLOCKER_CODES = new Set<EditReferencePreviousApprovedEditStudyBlockerCode>([
  'adapter_unavailable',
  'authority_unverified',
  'cross_workspace_denied',
  'snapshot_not_approved',
  'snapshot_identity_mismatch',
  'private_artifact_unavailable',
])
const RUNTIME_SOURCES = new Set<EditReferenceVerifiedPreviousApprovedEditStudyResult['runtimeSource']>([
  'verified_local',
  'verified_live',
])

function stableRequestPayload(request: EditReferencePreviousApprovedEditStudyRequest): string {
  return JSON.stringify({
    schemaVersion: request.schemaVersion,
    workspaceId: request.workspaceId,
    actorUserId: request.actorUserId,
    sourceEvidenceId: request.sourceEvidenceId,
    projectId: request.projectId,
    editSessionId: request.editSessionId,
    approvedSnapshotId: request.approvedSnapshotId,
    requestedLayers: [...request.requestedLayers],
    maxEvidenceItems: request.maxEvidenceItems,
  })
}

export function hashEditReferencePreviousApprovedEditStudyRequest(
  request: EditReferencePreviousApprovedEditStudyRequest,
): string {
  validateEditReferencePreviousApprovedEditStudyRequest(request)
  return createHash('sha256').update(stableRequestPayload(request)).digest('hex')
}

export function validateEditReferencePreviousApprovedEditStudyRequest(
  request: EditReferencePreviousApprovedEditStudyRequest,
): void {
  assertExactKeys(request, [
    'schemaVersion',
    'workspaceId',
    'actorUserId',
    'sourceEvidenceId',
    'projectId',
    'editSessionId',
    'approvedSnapshotId',
    'requestedLayers',
    'maxEvidenceItems',
  ], 'request')
  if (request.schemaVersion !== EDIT_REFERENCE_PREVIOUS_APPROVED_EDIT_STUDY_REQUEST_VERSION) {
    throw new Error('Previous approved-edit study request version is unsupported.')
  }
  for (const [name, value] of [
    ['workspaceId', request.workspaceId],
    ['actorUserId', request.actorUserId],
    ['sourceEvidenceId', request.sourceEvidenceId],
    ['projectId', request.projectId],
    ['editSessionId', request.editSessionId],
    ['approvedSnapshotId', request.approvedSnapshotId],
  ] as const) {
    if (!ID_PATTERN.test(value)) throw new Error(`Previous approved-edit study ${name} is invalid.`)
  }
  if (request.requestedLayers.length < 1 || request.requestedLayers.length > EDIT_REFERENCE_PREVIOUS_APPROVED_EDIT_STUDY_LAYERS.length) {
    throw new Error('Previous approved-edit study requestedLayers must be bounded and non-empty.')
  }
  if (new Set(request.requestedLayers).size !== request.requestedLayers.length) {
    throw new Error('Previous approved-edit study requestedLayers must not contain duplicates.')
  }
  if (request.requestedLayers.some((layer) => !EDIT_REFERENCE_PREVIOUS_APPROVED_EDIT_STUDY_LAYERS.includes(layer))) {
    throw new Error('Previous approved-edit study requestedLayers contains an unsupported layer.')
  }
  if (!Number.isSafeInteger(request.maxEvidenceItems) || request.maxEvidenceItems < 1 || request.maxEvidenceItems > 64) {
    throw new Error('Previous approved-edit study maxEvidenceItems must be between 1 and 64.')
  }
}

export function validateEditReferencePreviousApprovedEditStudyResult(
  request: EditReferencePreviousApprovedEditStudyRequest,
  result: EditReferencePreviousApprovedEditStudyResult,
): void {
  validateEditReferencePreviousApprovedEditStudyRequest(request)
  if (result.status !== 'blocked' && result.status !== 'verified') {
    throw new Error('Previous approved-edit study result status is unsupported.')
  }
  if (result.schemaVersion !== EDIT_REFERENCE_PREVIOUS_APPROVED_EDIT_STUDY_RESULT_VERSION) {
    throw new Error('Previous approved-edit study result version is unsupported.')
  }
  const requestDigest = hashEditReferencePreviousApprovedEditStudyRequest(request)
  if (result.requestDigestSha256 !== requestDigest) {
    throw new Error('Previous approved-edit study result does not match the exact request.')
  }
  if (result.status === 'blocked') {
    validateBlockedResult(result)
    return
  }
  validateVerifiedResult(request, result)
}

function validateBlockedResult(result: EditReferenceBlockedPreviousApprovedEditStudyResult): void {
  assertExactKeys(result, [
    'schemaVersion',
    'requestDigestSha256',
    'status',
    'blockerCode',
    'blockerMessage',
    'retryAvailable',
    'retryReason',
    'evidence',
    'approvedPlanEvidenceIds',
    'privatePreviewArtifactIds',
    'providerCallMade',
    'remoteMutationMade',
  ], 'blocked result')
  if (!BLOCKER_CODES.has(result.blockerCode)) {
    throw new Error('Previous approved-edit study blocker code is invalid.')
  }
  if (!boundedSafeText(result.blockerMessage, 500)) {
    throw new Error('Previous approved-edit study blocker message is invalid.')
  }
  if (result.retryAvailable && !boundedSafeText(result.retryReason, 500)) {
    throw new Error('Retryable previous approved-edit study blockers require a safe retry reason.')
  }
  if (!result.retryAvailable && result.retryReason !== undefined) {
    throw new Error('Non-retryable previous approved-edit study blockers cannot include a retry reason.')
  }
  if (
    result.evidence.length !== 0
    || result.approvedPlanEvidenceIds.length !== 0
    || result.privatePreviewArtifactIds.length !== 0
    || result.providerCallMade !== false
    || result.remoteMutationMade !== false
  ) {
    throw new Error('Blocked previous approved-edit study results cannot contain evidence or side effects.')
  }
}

function validateVerifiedResult(
  request: EditReferencePreviousApprovedEditStudyRequest,
  result: EditReferenceVerifiedPreviousApprovedEditStudyResult,
): void {
  assertExactKeys(result, [
    'schemaVersion',
    'requestDigestSha256',
    'status',
    'runtimeSource',
    'authority',
    'approvedPlanEvidenceIds',
    'privatePreviewArtifactIds',
    'privatePreviewArtifactProofs',
    'evidence',
    'blockedTransfers',
    'execution',
    'provenance',
    'privacy',
  ], 'verified result')
  if (!RUNTIME_SOURCES.has(result.runtimeSource)) {
    throw new Error('Previous approved-edit study runtime source is invalid.')
  }
  const authority = result.authority
  assertExactKeys(authority, [
    'workspaceId',
    'authorizedActorUserId',
    'projectId',
    'editSessionId',
    'approvedSnapshotId',
    'approvalRecordId',
    'approvedByUserId',
    'approvedAt',
    'approvedPlanId',
    'approvedPlanVersion',
    'snapshotVersion',
    'snapshotStatus',
    'planDigestSha256',
    'snapshotDigestSha256',
    'workspaceMembershipVerified',
    'projectMembershipVerified',
    'approvalAuthorityVerified',
    'immutableSnapshotVerified',
  ], 'authority proof')
  if (
    authority.workspaceId !== request.workspaceId
    || authority.authorizedActorUserId !== request.actorUserId
    || authority.projectId !== request.projectId
    || authority.editSessionId !== request.editSessionId
    || authority.approvedSnapshotId !== request.approvedSnapshotId
  ) {
    throw new Error('Previous approved-edit study authority does not match the exact requested identity.')
  }
  for (const [name, value] of [
    ['authorizedActorUserId', authority.authorizedActorUserId],
    ['approvalRecordId', authority.approvalRecordId],
    ['approvedByUserId', authority.approvedByUserId],
    ['approvedPlanId', authority.approvedPlanId],
  ] as const) {
    if (!ID_PATTERN.test(value)) throw new Error(`Previous approved-edit study ${name} is invalid.`)
  }
  if (
    authority.snapshotStatus !== 'approved'
    || authority.workspaceMembershipVerified !== true
    || authority.projectMembershipVerified !== true
    || authority.approvalAuthorityVerified !== true
    || authority.immutableSnapshotVerified !== true
    || !Number.isSafeInteger(authority.approvedPlanVersion)
    || authority.approvedPlanVersion < 1
    || !Number.isSafeInteger(authority.snapshotVersion)
    || authority.snapshotVersion < 1
    || !isIsoDate(authority.approvedAt)
    || !SHA256_PATTERN.test(authority.planDigestSha256)
    || !SHA256_PATTERN.test(authority.snapshotDigestSha256)
  ) {
    throw new Error('Previous approved-edit study immutable approval proof is incomplete.')
  }
  if (result.approvedPlanEvidenceIds.length < 1 || result.privatePreviewArtifactIds.length < 1) {
    throw new Error('Previous approved-edit study requires approved plan evidence and private preview lineage.')
  }
  assertBoundedIds(result.approvedPlanEvidenceIds, 64, 'approvedPlanEvidenceIds')
  assertBoundedIds(result.privatePreviewArtifactIds, 32, 'privatePreviewArtifactIds')
  if (
    result.privatePreviewArtifactProofs.length !== result.privatePreviewArtifactIds.length
    || result.privatePreviewArtifactProofs.length > 32
  ) {
    throw new Error('Previous approved-edit study private preview proofs do not match the approved artifact identities.')
  }
  const privateArtifactProofIds = new Set<string>()
  for (const proof of result.privatePreviewArtifactProofs) {
    assertExactKeys(proof, [
      'privatePreviewArtifactId',
      'checksumSha256',
      'ownership',
      'rightsBasis',
      'privacyClassification',
      'retentionStatus',
    ], 'private preview artifact proof')
    if (
      !ID_PATTERN.test(proof.privatePreviewArtifactId)
      || !SHA256_PATTERN.test(proof.checksumSha256)
      || proof.ownership !== 'target_owned'
      || proof.rightsBasis !== 'workspace_approved_edit'
      || proof.privacyClassification !== 'private_project'
      || proof.retentionStatus !== 'active'
      || !result.privatePreviewArtifactIds.includes(proof.privatePreviewArtifactId)
      || privateArtifactProofIds.has(proof.privatePreviewArtifactId)
    ) {
      throw new Error('Previous approved-edit study private preview proof is invalid or not target-owned.')
    }
    privateArtifactProofIds.add(proof.privatePreviewArtifactId)
  }
  if (result.evidence.length < 1 || result.evidence.length > request.maxEvidenceItems) {
    throw new Error('Previous approved-edit study evidence count is outside the approved bound.')
  }
  const requestedLayers = new Set(request.requestedLayers)
  for (const evidence of result.evidence) {
    assertExactKeys(evidence, [
      'layer',
      'summary',
      'confidence',
      'sourceDecisionIds',
      'sourceEvidenceIds',
      'transferablePrinciples',
      'nonTransferableElements',
    ], 'evidence summary')
    if (!requestedLayers.has(evidence.layer)) {
      throw new Error('Previous approved-edit study returned an unrequested evidence layer.')
    }
    if (
      !boundedSafeText(evidence.summary, 1_200)
      || !Number.isFinite(evidence.confidence)
      || evidence.confidence < 0
      || evidence.confidence > 1
    ) {
      throw new Error('Previous approved-edit study evidence summary or confidence is invalid.')
    }
    assertBoundedIds(evidence.sourceDecisionIds, 32, 'sourceDecisionIds')
    assertBoundedIds(evidence.sourceEvidenceIds, 32, 'sourceEvidenceIds')
    if (evidence.sourceEvidenceIds.some((evidenceId) => !result.approvedPlanEvidenceIds.includes(evidenceId))) {
      throw new Error('Previous approved-edit study evidence lineage is outside the exact approved plan evidence package.')
    }
    assertBoundedTextArray(evidence.transferablePrinciples, 4, 300, 'transferablePrinciples')
    assertBoundedTextArray(evidence.nonTransferableElements, 4, 300, 'nonTransferableElements')
    if (evidence.sourceDecisionIds.length < 1 || evidence.sourceEvidenceIds.length < 1) {
      throw new Error('Previous approved-edit study evidence requires decision and evidence lineage.')
    }
    if (detectEditReferenceCopyRisks([
      evidence.summary,
      ...evidence.transferablePrinciples,
      ...evidence.nonTransferableElements,
    ]).length > 0) {
      throw new Error('Previous approved-edit study evidence contains an unsafe exact-copy instruction.')
    }
  }
  if (
    result.blockedTransfers.length !== EDIT_REFERENCE_PREVIOUS_APPROVED_EDIT_BLOCKED_TRANSFERS.length
    || !EDIT_REFERENCE_PREVIOUS_APPROVED_EDIT_BLOCKED_TRANSFERS.every((item) => result.blockedTransfers.includes(item))
  ) {
    throw new Error('Previous approved-edit study result is missing universal copy-safety boundaries.')
  }
  assertExactKeys(result.execution, [
    'approvedSnapshotOpened',
    'approvedPlanOpened',
    'privatePreviewOpened',
    'decisionLineageRead',
    'projectHistoryOpened',
    'chatHistoryOpened',
    'privateMediaOpened',
    'fileBytesRead',
    'externalUrlFetched',
    'providerCallMade',
    'modelCallMade',
    'mediaProcessingStarted',
    'workerJobCreated',
    'remoteMutationMade',
  ], 'execution proof')
  if (
    result.execution.approvedSnapshotOpened !== true
    || result.execution.approvedPlanOpened !== true
    || result.execution.privatePreviewOpened !== true
    || result.execution.decisionLineageRead !== true
    || result.execution.projectHistoryOpened !== false
    || result.execution.chatHistoryOpened !== false
    || result.execution.privateMediaOpened !== false
    || result.execution.fileBytesRead !== false
    || result.execution.externalUrlFetched !== false
    || result.execution.providerCallMade !== false
    || result.execution.modelCallMade !== false
    || result.execution.mediaProcessingStarted !== false
    || result.execution.workerJobCreated !== false
    || result.execution.remoteMutationMade !== false
  ) {
    throw new Error('Previous approved-edit study execution exceeded the approved-history boundary.')
  }
  assertExactKeys(result.provenance, [
    'adapterId',
    'adapterVersion',
    'executionId',
    'startedAt',
    'completedAt',
    'internalCostStatus',
    'meteredInternalCostMicros',
    'usageEventIds',
    'internalCostRecordIds',
    'customerPriceCalculated',
    'customerCreditsMutated',
    'serviceFeeIncluded',
  ], 'execution provenance')
  if (
    !ID_PATTERN.test(result.provenance.adapterId)
    || !ID_PATTERN.test(result.provenance.adapterVersion)
    || !ID_PATTERN.test(result.provenance.executionId)
    || !isIsoDate(result.provenance.startedAt)
    || !isIsoDate(result.provenance.completedAt)
    || Date.parse(result.provenance.completedAt) < Date.parse(result.provenance.startedAt)
    || !MONEY_MICROS_PATTERN.test(result.provenance.meteredInternalCostMicros)
    || result.provenance.customerPriceCalculated !== false
    || result.provenance.customerCreditsMutated !== false
    || result.provenance.serviceFeeIncluded !== false
  ) {
    throw new Error('Previous approved-edit study execution provenance is invalid.')
  }
  assertBoundedIds(result.provenance.usageEventIds, 64, 'usageEventIds', true)
  assertBoundedIds(result.provenance.internalCostRecordIds, 64, 'internalCostRecordIds', true)
  if (result.runtimeSource === 'verified_local') {
    if (
      result.provenance.internalCostStatus !== 'not_incurred'
      || result.provenance.meteredInternalCostMicros !== '0'
      || result.provenance.usageEventIds.length !== 0
      || result.provenance.internalCostRecordIds.length !== 0
    ) {
      throw new Error('Controlled-local approved history must not claim production cost or usage.')
    }
  } else if (
    result.provenance.internalCostStatus !== 'metered'
    || BigInt(result.provenance.meteredInternalCostMicros) <= 0n
    || result.provenance.usageEventIds.length < 1
    || result.provenance.internalCostRecordIds.length < 1
  ) {
    throw new Error('Live approved history requires metered internal-cost evidence.')
  }
  assertExactKeys(result.privacy, [
    'rawSnapshotPersisted',
    'rawPlanPersisted',
    'rawMediaPersisted',
    'rawChatPersisted',
    'signedUrlPersisted',
    'rawProviderPayloadPersisted',
    'unapprovedHistoryOpened',
  ], 'privacy proof')
  if (Object.values(result.privacy).some((value) => value !== false)) {
    throw new Error('Previous approved-edit study result violates the private approved-history boundary.')
  }
}

export function createBlockedEditReferencePreviousApprovedEditStudyResult(input: {
  request: EditReferencePreviousApprovedEditStudyRequest
  blockerCode: EditReferencePreviousApprovedEditStudyBlockerCode
  blockerMessage: string
  retryAvailable: boolean
  retryReason?: string
}): EditReferenceBlockedPreviousApprovedEditStudyResult {
  const result: EditReferenceBlockedPreviousApprovedEditStudyResult = {
    schemaVersion: EDIT_REFERENCE_PREVIOUS_APPROVED_EDIT_STUDY_RESULT_VERSION,
    requestDigestSha256: hashEditReferencePreviousApprovedEditStudyRequest(input.request),
    status: 'blocked',
    blockerCode: input.blockerCode,
    blockerMessage: input.blockerMessage,
    retryAvailable: input.retryAvailable,
    ...(input.retryReason ? { retryReason: input.retryReason } : {}),
    evidence: [],
    approvedPlanEvidenceIds: [],
    privatePreviewArtifactIds: [],
    providerCallMade: false,
    remoteMutationMade: false,
  }
  validateEditReferencePreviousApprovedEditStudyResult(input.request, result)
  return result
}

function assertBoundedIds(values: readonly string[], maxItems: number, name: string, allowEmpty = false): void {
  if ((!allowEmpty && values.length < 1) || values.length > maxItems || new Set(values).size !== values.length) {
    throw new Error(`Previous approved-edit study ${name} is not bounded or unique.`)
  }
  if (values.some((value) => !ID_PATTERN.test(value))) {
    throw new Error(`Previous approved-edit study ${name} contains an invalid private identity.`)
  }
}

function assertBoundedTextArray(values: readonly string[], maxItems: number, maxLength: number, name: string): void {
  if (values.length < 1 || values.length > maxItems || values.some((value) => !boundedSafeText(value, maxLength))) {
    throw new Error(`Previous approved-edit study ${name} is invalid.`)
  }
}

function boundedSafeText(value: unknown, maxLength: number): value is string {
  return typeof value === 'string'
    && value.trim().length > 0
    && value.length <= maxLength
    && !UNSAFE_TEXT_PATTERN.test(value)
}

function assertExactKeys(value: unknown, allowedKeys: readonly string[], name: string): asserts value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`Previous approved-edit study ${name} must be an object.`)
  }
  const allowed = new Set(allowedKeys)
  const unexpectedKey = Object.keys(value).find((key) => !allowed.has(key))
  if (unexpectedKey) {
    throw new Error(`Previous approved-edit study ${name} contains an unsupported field.`)
  }
}

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string'
    && Number.isFinite(Date.parse(value))
    && new Date(value).toISOString() === value
}

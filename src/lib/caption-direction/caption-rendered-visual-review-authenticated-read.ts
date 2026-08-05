import {
  CAPTION_RENDERED_VISUAL_REVIEW_AUTHENTICATED_READ_PROJECTION_VERSION,
  CAPTION_RENDERED_VISUAL_REVIEW_AUTHENTICATED_READ_REQUEST_VERSION,
  CAPTION_RENDERED_VISUAL_REVIEW_AUTHENTICATED_READ_RESULT_VERSION,
  type CaptionRenderedVisualReviewAuthenticatedOutputScope,
  type CaptionRenderedVisualReviewAuthenticatedReadRequest,
  type CaptionRenderedVisualReviewAuthenticatedReadResult,
  type CaptionRenderedVisualReviewAuthenticatedReadScope,
  type CaptionRenderedVisualReviewConfirmedOutputFrameRef,
} from '../../types/caption-direction-visual-review-authenticated-read'
import {
  CAPTION_RENDERED_VISUAL_REVIEW_OUTPUT_SET_PRODUCT_STATUS_VERSION,
  CAPTION_RENDERED_VISUAL_REVIEW_PRODUCT_STATUS_VERSION,
  type CaptionRenderedVisualReviewOutputSetProductStatus,
  type CaptionRenderedVisualReviewProductAuthorityBoundary,
  type CaptionRenderedVisualReviewProductStatus,
} from '../../types/caption-direction-visual-review-product-status'
import type { PlatformAspectRatio } from '../../types/workflow-common'
import { validateClosedContractTree } from '../closed-contract-validation'
import { sha256HexUtf8 } from '../sha256'

export const CAPTION_RENDERED_VISUAL_REVIEW_AUTHENTICATED_READ_CLOSED_AUTHORITY =
  Object.freeze({
    owner: 'authenticated_caption_visual_review_read_route',
    canonicalPersistenceOwnerRemainsExternal: true,
    authenticationAuthorityRemainsCanonicalBackend: true,
    browserLocalCompletionAccepted: false,
    approvedSnapshotMutated: false,
    operationDispatched: false,
    providerCallMade: false,
    qaApprovalGranted: false,
    repairExecuted: false,
    assetMutated: false,
    creditOrBillingMutated: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  } as const)

const PRODUCT_CLOSED_AUTHORITY:
CaptionRenderedVisualReviewProductAuthorityBoundary = Object.freeze({
  operationDispatchAuthority: false,
  providerRuntimeAuthority: false,
  qaApprovalAuthority: false,
  repairExecutionAuthority: false,
  assetMutationAuthority: false,
  creditOrBillingAuthority: false,
  publicDeliveryAuthority: false,
  productionAuthority: false,
})

const ASPECT_RATIOS = new Set<PlatformAspectRatio>([
  '9:16', '16:9', '1:1', '4:5', 'original', 'custom',
])
const PRODUCT_STATES = new Set([
  'waiting_for_render', 'waiting_for_qualified_ai',
  'blocked_evidence_reconciliation', 'repair_required',
  'needs_human_review', 'passed',
])
const UNSAFE_TEXT = /(?:https?:\/\/|file:\/\/|[A-Za-z]:\\|\/(?:Users|home|tmp|var|Volumes)\/|-----BEGIN|(?:api|secret|token|password|credential)[_-]?key\s*[:=])/iu
const MAX_OUTPUTS = 8

export function buildCaptionRenderedVisualReviewAuthenticatedReadRequest(input: {
  scope: CaptionRenderedVisualReviewAuthenticatedReadScope
  confirmedOutputFrameRefs: CaptionRenderedVisualReviewConfirmedOutputFrameRef[]
}): CaptionRenderedVisualReviewAuthenticatedReadRequest {
  const request: CaptionRenderedVisualReviewAuthenticatedReadRequest = {
    schemaVersion:
      CAPTION_RENDERED_VISUAL_REVIEW_AUTHENTICATED_READ_REQUEST_VERSION,
    scope: structuredClone(input.scope),
    requiredOutputs: input.confirmedOutputFrameRefs.map((frame) => ({
      outputId: frame.outputId,
      aspectRatio: frame.aspectRatio,
      confirmedOutputFrameRef: structuredClone(frame),
    })),
    byteFreeRequest: true,
    browserLocalCompletionAccepted: false,
  }
  if (!validateCaptionRenderedVisualReviewAuthenticatedReadRequest(request).ok) {
    throw new Error('Caption visual-review read request requires exact confirmed output authority.')
  }
  return request
}

export function digestCaptionRenderedVisualReviewAuthenticatedReadResult(
  value: CaptionRenderedVisualReviewAuthenticatedReadResult,
): string {
  try {
    if (!validateClosedContractTree(value).ok) return 'sha256:invalid'
    const projectionRef = { ...value.projectionRef }
    delete (projectionRef as { contentHash?: string }).contentHash
    return `sha256:${sha256HexUtf8(JSON.stringify(canonicalize({
      ...value,
      projectionRef,
    })))}`
  } catch {
    return 'sha256:invalid'
  }
}

export function validateCaptionRenderedVisualReviewAuthenticatedReadRequest(
  value: unknown,
): { ok: boolean; errors: string[] } {
  try {
    if (!validateClosedContractTree(value).ok || !record(value)
      || !exactKeys(value, [
        'schemaVersion', 'scope', 'requiredOutputs', 'byteFreeRequest',
        'browserLocalCompletionAccepted',
      ])
      || value.schemaVersion !==
        CAPTION_RENDERED_VISUAL_REVIEW_AUTHENTICATED_READ_REQUEST_VERSION
      || !readScope(value.scope)
      || !Array.isArray(value.requiredOutputs)
      || value.requiredOutputs.length < 1
      || value.requiredOutputs.length > MAX_OUTPUTS
      || value.requiredOutputs.some((output) => !outputScope(output))
      || !uniqueOutputs(value.requiredOutputs as
        CaptionRenderedVisualReviewAuthenticatedOutputScope[])
      || value.byteFreeRequest !== true
      || value.browserLocalCompletionAccepted !== false) {
      return { ok: false, errors: ['Caption visual-review read request is invalid.'] }
    }
    return { ok: true, errors: [] }
  } catch {
    return { ok: false, errors: ['Caption visual-review read request is malformed.'] }
  }
}

export function validateCaptionRenderedVisualReviewOutputSetProductStatus(
  value: unknown,
): { ok: boolean; errors: string[] } {
  try {
    if (!validateClosedContractTree(value).ok || !record(value)
      || !exactKeys(value, [
        'schemaVersion', 'scope', 'requiredOutputIds', 'requiredAspectRatios',
        'outputs', 'state', 'userFacingLabel', 'userFacingSummary',
        'allRequiredOutputsCovered', 'everyOutputDeterministicQaPassed',
        'everyOutputQualifiedVisualReviewPassed', 'unresolvedOutputIds',
        'outputEvidenceCannotBeReusedAcrossCanvases',
        'serverDerivedFromAuthenticatedCanonicalReads', 'visualQaGateSatisfied',
        'visualQaBlocksDelivery', 'rawModelTextIncluded', 'mediaBytesIncluded',
        'pathsOrUrlsIncluded', 'authorityBoundary',
      ])
      || value.schemaVersion !==
        CAPTION_RENDERED_VISUAL_REVIEW_OUTPUT_SET_PRODUCT_STATUS_VERSION
      || !readScope(value.scope)
      || !safeText(value.userFacingLabel, 120)
      || !safeText(value.userFacingSummary, 1000)
      || !PRODUCT_STATES.has(String(value.state))
      || !stringList(value.requiredOutputIds, 1, MAX_OUTPUTS)
      || new Set(value.requiredOutputIds).size !== value.requiredOutputIds.length
      || !Array.isArray(value.requiredAspectRatios)
      || value.requiredAspectRatios.length < 1
      || value.requiredAspectRatios.some((ratio) => !ASPECT_RATIOS.has(
        ratio as PlatformAspectRatio))
      || new Set(value.requiredAspectRatios).size !==
        value.requiredAspectRatios.length
      || !Array.isArray(value.outputs)
      || value.outputs.length !== value.requiredOutputIds.length
      || value.outputs.some((output) => !outputProductStatus(output, value.scope))
      || !stringList(value.unresolvedOutputIds, 0, MAX_OUTPUTS)
      || value.unresolvedOutputIds.some((outputId) =>
        !(value.requiredOutputIds as string[]).includes(outputId))
      || value.outputEvidenceCannotBeReusedAcrossCanvases !== true
      || value.serverDerivedFromAuthenticatedCanonicalReads !== true
      || value.rawModelTextIncluded !== false
      || value.mediaBytesIncluded !== false
      || value.pathsOrUrlsIncluded !== false
      || !productAuthority(value.authorityBoundary)) {
      return { ok: false, errors: ['Caption visual-review product status is invalid.'] }
    }
    const outputs = value.outputs as Array<{
      outputId: string
      aspectRatio: PlatformAspectRatio
      status: CaptionRenderedVisualReviewProductStatus
    }>
    const allCovered = outputs.length === value.requiredOutputIds.length
      && value.requiredOutputIds.every((id) => outputs.some((output) =>
        output.outputId === id))
    const allDeterministic = outputs.every((output) =>
      output.status.deterministicQaStatus === 'passed')
    const allQualified = outputs.every((output) =>
      output.status.aiVisualInspectionStatus === 'passed'
      && output.status.actualModelInferenceVerified
      && output.status.canonicalEvidenceReconciled)
    const unresolved = outputs.filter((output) =>
      !output.status.visualQaGateSatisfied).map((output) => output.outputId)
    const evidenceOwners = new Map<string, string>()
    for (const output of outputs) {
      const evidence = output.status.canonicalEvidenceRefs
      if (!evidence) continue
      for (const evidenceRef of Object.values(evidence)) {
        const key = `${evidenceRef.id}\u0000${evidenceRef.version}\u0000${evidenceRef.contentHash}`
        const existingOwner = evidenceOwners.get(key)
        if (existingOwner && existingOwner !== output.outputId) {
          return { ok: false, errors: ['Caption visual-review evidence crosses output canvases.'] }
        }
        evidenceOwners.set(key, output.outputId)
      }
    }
    const expectedState = outputs.some((output) =>
      output.status.state === 'repair_required')
      ? 'repair_required'
      : outputs.some((output) => output.status.state === 'needs_human_review')
        ? 'needs_human_review'
        : outputs.some((output) =>
          output.status.state === 'blocked_evidence_reconciliation')
          ? 'blocked_evidence_reconciliation'
          : outputs.some((output) => output.status.state === 'waiting_for_render')
            ? 'waiting_for_render'
            : outputs.some((output) =>
              output.status.state === 'waiting_for_qualified_ai')
              ? 'waiting_for_qualified_ai'
              : 'passed'
    if (value.allRequiredOutputsCovered !== allCovered
      || value.everyOutputDeterministicQaPassed !== allDeterministic
      || value.everyOutputQualifiedVisualReviewPassed !== allQualified
      || !sameSet(value.unresolvedOutputIds, unresolved)
      || value.state !== expectedState
      || value.visualQaGateSatisfied !== (allCovered && allDeterministic && allQualified)
      || value.visualQaBlocksDelivery !== !value.visualQaGateSatisfied
      || (value.state === 'passed') !== value.visualQaGateSatisfied) {
      return { ok: false, errors: ['Caption visual-review product status overclaims completion.'] }
    }
    return { ok: true, errors: [] }
  } catch {
    return { ok: false, errors: ['Caption visual-review product status is malformed.'] }
  }
}

export function validateCaptionRenderedVisualReviewAuthenticatedReadResult(
  value: unknown,
): { ok: boolean; errors: string[] } {
  try {
    if (!validateClosedContractTree(value).ok || !record(value)
      || !exactKeys(value, [
        'schemaVersion', 'disposition', 'scope', 'confirmedOutputs',
        'projectionRef', 'outputSetStatus', 'userFacingSummary',
        'authenticatedPrincipalVerified', 'exactCanonicalScopeReread',
        'requestedOutputFramesReread', 'approvedSnapshotImmutable',
        'browserLocalStateUsed', 'rawModelTextIncluded', 'mediaBytesIncluded',
        'pathsOrUrlsIncluded', 'authorityBoundary',
      ])
      || value.schemaVersion !==
        CAPTION_RENDERED_VISUAL_REVIEW_AUTHENTICATED_READ_RESULT_VERSION
      || !['not_found', 'pending', 'completed'].includes(String(value.disposition))
      || !readScope(value.scope)
      || !Array.isArray(value.confirmedOutputs)
      || value.confirmedOutputs.length < 1
      || value.confirmedOutputs.length > MAX_OUTPUTS
      || value.confirmedOutputs.some((output) => !outputScope(output))
      || !uniqueOutputs(value.confirmedOutputs as
        CaptionRenderedVisualReviewAuthenticatedOutputScope[])
      || !projectionRef(value.projectionRef)
      || !safeText(value.userFacingSummary, 1000)
      || value.authenticatedPrincipalVerified !== true
      || value.exactCanonicalScopeReread !== true
      || value.requestedOutputFramesReread !== true
      || value.approvedSnapshotImmutable !== true
      || value.browserLocalStateUsed !== false
      || value.rawModelTextIncluded !== false
      || value.mediaBytesIncluded !== false
      || value.pathsOrUrlsIncluded !== false
      || !readAuthority(value.authorityBoundary)
      || (value.projectionRef as { contentHash: string }).contentHash !==
        digestCaptionRenderedVisualReviewAuthenticatedReadResult(value as unknown as
          CaptionRenderedVisualReviewAuthenticatedReadResult)) {
      return { ok: false, errors: ['Caption visual-review read result is invalid.'] }
    }
    if (value.disposition === 'not_found') {
      return value.outputSetStatus === null
        ? { ok: true, errors: [] }
        : { ok: false, errors: ['Not-found result cannot include completed evidence.'] }
    }
    if (!validateCaptionRenderedVisualReviewOutputSetProductStatus(
      value.outputSetStatus).ok) {
      return { ok: false, errors: ['Caption visual-review output status is invalid.'] }
    }
    const status = value.outputSetStatus as
      CaptionRenderedVisualReviewOutputSetProductStatus
    const outputs = value.confirmedOutputs as
      CaptionRenderedVisualReviewAuthenticatedOutputScope[]
    const waiting = status.state === 'waiting_for_render'
      || status.state === 'waiting_for_qualified_ai'
    if (!sameScope(status.scope, value.scope)
      || !sameSet(status.requiredOutputIds, outputs.map((output) => output.outputId))
      || status.outputs.some((item) => {
        const output = outputs.find((candidate) =>
          candidate.outputId === item.outputId)
        return !output || item.aspectRatio !== output.aspectRatio
          || item.width !== output.confirmedOutputFrameRef.width
          || item.height !== output.confirmedOutputFrameRef.height
          || item.fps !== output.confirmedOutputFrameRef.fps
      })
      || (value.disposition === 'pending') !== waiting) {
      return { ok: false, errors: ['Caption visual-review result lineage is inconsistent.'] }
    }
    return { ok: true, errors: [] }
  } catch {
    return { ok: false, errors: ['Caption visual-review read result is malformed.'] }
  }
}

export function acceptCaptionRenderedVisualReviewAuthenticatedReadResult(
  request: unknown,
  result: unknown,
): CaptionRenderedVisualReviewAuthenticatedReadResult | null {
  if (!validateCaptionRenderedVisualReviewAuthenticatedReadRequest(request).ok
    || !validateCaptionRenderedVisualReviewAuthenticatedReadResult(result).ok) {
    return null
  }
  const typedRequest = request as CaptionRenderedVisualReviewAuthenticatedReadRequest
  const typedResult = result as CaptionRenderedVisualReviewAuthenticatedReadResult
  return sameScope(typedRequest.scope, typedResult.scope)
    && sameOutputScopes(typedRequest.requiredOutputs, typedResult.confirmedOutputs)
    ? structuredClone(typedResult) : null
}

function outputProductStatus(value: unknown, scope: unknown): boolean {
  if (!record(value) || !exactKeys(value, [
    'outputId', 'aspectRatio', 'width', 'height', 'fps', 'status',
  ]) || !safeId(value.outputId) || !ASPECT_RATIOS.has(value.aspectRatio as
    PlatformAspectRatio) || !positiveInteger(value.width)
    || !positiveInteger(value.height) || !positiveNumber(value.fps)
    || !productStatus(value.status, scope)) return false
  const status = value.status as CaptionRenderedVisualReviewProductStatus
  return dimensionsMatchAspectRatio(value.aspectRatio as PlatformAspectRatio,
    value.width as number, value.height as number)
    && sameScope(status.scope, scope as CaptionRenderedVisualReviewAuthenticatedReadScope)
}

function productStatus(value: unknown, scope: unknown): boolean {
  if (!record(value) || !exactKeys(value, [
    'schemaVersion', 'scope', 'state', 'userFacingLabel', 'userFacingSummary',
    'deterministicQaStatus', 'aiVisualInspectionStatus',
    'exactApprovedRenderBound', 'actualModelInferenceVerified',
    'deterministicAndModelEvidenceAgree', 'canonicalEvidenceReconciled',
    'serverDerivedFromCanonicalEvidence', 'visualQaGateSatisfied',
    'visualQaBlocksDelivery', 'smallestScopeRepairRequired',
    'privateHumanReviewRequired', 'rawModelTextIncluded', 'mediaBytesIncluded',
    'pathsOrUrlsIncluded', 'authorityBoundary',
    ...(Object.hasOwn(value, 'modelInspectionCoverage')
      ? ['modelInspectionCoverage'] : []),
    ...(Object.hasOwn(value, 'canonicalEvidenceRefs')
      ? ['canonicalEvidenceRefs'] : []),
  ]) || value.schemaVersion !== CAPTION_RENDERED_VISUAL_REVIEW_PRODUCT_STATUS_VERSION
    || !sameScope(value.scope as CaptionRenderedVisualReviewAuthenticatedReadScope,
      scope as CaptionRenderedVisualReviewAuthenticatedReadScope)
    || !PRODUCT_STATES.has(String(value.state))
    || !safeText(value.userFacingLabel, 120)
    || !safeText(value.userFacingSummary, 1000)
    || !['waiting', 'passed', 'failed'].includes(String(value.deterministicQaStatus))
    || !['waiting', 'passed', 'repair_required', 'needs_human_review', 'blocked']
      .includes(String(value.aiVisualInspectionStatus))
    || !productAuthority(value.authorityBoundary)
    || value.rawModelTextIncluded !== false
    || value.mediaBytesIncluded !== false
    || value.pathsOrUrlsIncluded !== false) return false
  const gateSatisfied = value.deterministicQaStatus === 'passed'
    && value.aiVisualInspectionStatus === 'passed'
    && value.exactApprovedRenderBound === true
    && value.actualModelInferenceVerified === true
    && value.deterministicAndModelEvidenceAgree === true
    && value.canonicalEvidenceReconciled === true
    && value.serverDerivedFromCanonicalEvidence === true
  const waiting = value.state === 'waiting_for_render'
    || value.state === 'waiting_for_qualified_ai'
  if (waiting) {
    if (value.serverDerivedFromCanonicalEvidence !== false
      || value.actualModelInferenceVerified !== false
      || value.canonicalEvidenceRefs !== undefined
      || value.modelInspectionCoverage !== undefined) return false
  } else if (value.serverDerivedFromCanonicalEvidence !== true
    || !canonicalEvidenceRefs(value.canonicalEvidenceRefs)
    || !modelInspectionCoverage(value.modelInspectionCoverage)) return false
  return value.visualQaGateSatisfied === gateSatisfied
    && value.visualQaBlocksDelivery === !gateSatisfied
    && (value.state === 'passed') === gateSatisfied
    && (value.aiVisualInspectionStatus === 'repair_required') ===
      (value.smallestScopeRepairRequired === true)
    && (value.state === 'needs_human_review') ===
      (value.privateHumanReviewRequired === true)
}

function outputScope(value: unknown): boolean {
  return record(value) && exactKeys(value, [
    'outputId', 'aspectRatio', 'confirmedOutputFrameRef',
  ]) && safeId(value.outputId) && ASPECT_RATIOS.has(value.aspectRatio as
    PlatformAspectRatio) && frameRef(value.confirmedOutputFrameRef)
    && value.outputId === (value.confirmedOutputFrameRef as
      CaptionRenderedVisualReviewConfirmedOutputFrameRef).outputId
    && value.aspectRatio === (value.confirmedOutputFrameRef as
      CaptionRenderedVisualReviewConfirmedOutputFrameRef).aspectRatio
}

function frameRef(value: unknown): boolean {
  if (!record(value) || !exactKeys(value, [
    'id', 'version', 'contentHash', 'outputId', 'aspectRatio', 'width',
    'height', 'fps', 'confirmedByUser', 'confirmationRecordId',
  ])) return false
  return safeId(value.id) && positiveInteger(value.version)
    && digest(value.contentHash) && safeId(value.outputId)
    && ASPECT_RATIOS.has(value.aspectRatio as PlatformAspectRatio)
    && positiveInteger(value.width) && positiveInteger(value.height)
    && positiveNumber(value.fps) && value.confirmedByUser === true
    && safeId(value.confirmationRecordId)
    && dimensionsMatchAspectRatio(value.aspectRatio as PlatformAspectRatio,
      value.width as number, value.height as number)
}

function readScope(value: unknown): value is
CaptionRenderedVisualReviewAuthenticatedReadScope {
  return record(value) && exactKeys(value, [
    'workspaceId', 'projectId', 'editSessionId', 'approvedSnapshotId',
  ]) && Object.values(value).every(safeId)
}

function projectionRef(value: unknown): boolean {
  return record(value) && exactKeys(value, [
    'id', 'version', 'schemaVersion', 'contentHash',
  ]) && safeId(value.id) && positiveInteger(value.version)
    && value.schemaVersion ===
      CAPTION_RENDERED_VISUAL_REVIEW_AUTHENTICATED_READ_PROJECTION_VERSION
    && digest(value.contentHash)
}

function readAuthority(value: unknown): boolean {
  return record(value)
    && exactKeys(value, Object.keys(
      CAPTION_RENDERED_VISUAL_REVIEW_AUTHENTICATED_READ_CLOSED_AUTHORITY))
    && Object.entries(CAPTION_RENDERED_VISUAL_REVIEW_AUTHENTICATED_READ_CLOSED_AUTHORITY)
      .every(([key, expected]) => value[key] === expected)
}

function productAuthority(value: unknown): boolean {
  return record(value) && exactKeys(value, Object.keys(PRODUCT_CLOSED_AUTHORITY))
    && Object.entries(PRODUCT_CLOSED_AUTHORITY)
      .every(([key, expected]) => value[key] === expected)
}

function canonicalEvidenceRefs(value: unknown): boolean {
  if (!record(value) || !exactKeys(value, [
    'decisionRef', 'providerExecutionReceiptRef',
    'persistedEvidenceArtifactRef', 'independentArtifactQaRef',
    'assetManifestReconciliationRef',
  ])) return false
  return Object.values(value).every((item) => evidenceRef(item))
}

function evidenceRef(value: unknown): boolean {
  return record(value) && exactKeys(value, ['id', 'version', 'contentHash'])
    && safeId(value.id) && positiveInteger(value.version)
    && digest(value.contentHash)
}

function modelInspectionCoverage(value: unknown): boolean {
  if (!record(value) || !exactKeys(value, [
    'scope', 'sampledSegmentCount', 'unsampledSegmentCount',
    'modelInspectedOnlyPlannedSamples',
    'unsampledSegmentsNeverImpliedInspected',
  ]) || !positiveInteger(value.sampledSegmentCount)
    || !Number.isSafeInteger(value.unsampledSegmentCount)
    || Number(value.unsampledSegmentCount) < 0
    || value.modelInspectedOnlyPlannedSamples !== true
    || value.unsampledSegmentsNeverImpliedInspected !== true) return false
  return value.scope === (value.unsampledSegmentCount === 0
    ? 'complete_segment_coverage'
    : 'bounded_representative_segment_coverage')
}

function sameScope(left: CaptionRenderedVisualReviewAuthenticatedReadScope,
  right: CaptionRenderedVisualReviewAuthenticatedReadScope): boolean {
  return left.workspaceId === right.workspaceId && left.projectId === right.projectId
    && left.editSessionId === right.editSessionId
    && left.approvedSnapshotId === right.approvedSnapshotId
}

function sameOutputScopes(
  left: CaptionRenderedVisualReviewAuthenticatedOutputScope[],
  right: CaptionRenderedVisualReviewAuthenticatedOutputScope[],
): boolean {
  return left.length === right.length && left.every((output) => {
    const candidate = right.find((item) => item.outputId === output.outputId)
    return candidate !== undefined
      && JSON.stringify(canonicalize(output)) === JSON.stringify(canonicalize(candidate))
  })
}

function uniqueOutputs(outputs: CaptionRenderedVisualReviewAuthenticatedOutputScope[]): boolean {
  return new Set(outputs.map((output) => output.outputId)).size === outputs.length
    && new Set(outputs.map((output) => output.confirmedOutputFrameRef.contentHash)).size
      === outputs.length
}

function dimensionsMatchAspectRatio(ratio: PlatformAspectRatio, width: number,
  height: number): boolean {
  if (ratio === '9:16') return width * 16 === height * 9
  if (ratio === '16:9') return width * 9 === height * 16
  if (ratio === '1:1') return width === height
  if (ratio === '4:5') return width * 5 === height * 4
  return ratio === 'original' || ratio === 'custom'
}

function record(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
    && (Object.getPrototypeOf(value) === Object.prototype
      || Object.getPrototypeOf(value) === null)
}
function exactKeys(value: Record<string, unknown>, keys: string[]): boolean {
  return Object.keys(value).length === keys.length
    && keys.every((key) => Object.hasOwn(value, key))
}
function safeId(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 256
    && value.trim() === value && !UNSAFE_TEXT.test(value)
}
function safeText(value: unknown, maximum: number): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= maximum
    && value.trim() === value && !UNSAFE_TEXT.test(value)
}
function digest(value: unknown): value is string {
  return typeof value === 'string' && /^sha256:[a-f0-9]{64}$/u.test(value)
}
function positiveInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) > 0
}
function positiveNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}
function stringList(value: unknown, minimum: number, maximum: number): value is string[] {
  return Array.isArray(value) && value.length >= minimum && value.length <= maximum
    && value.every(safeId) && new Set(value).size === value.length
}
function sameSet<T>(left: T[], right: T[]): boolean {
  return left.length === right.length && new Set(left).size === left.length
    && left.every((value) => right.includes(value))
}
function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (!record(value)) return value
  return Object.fromEntries(Object.entries(value)
    .filter(([, item]) => item !== undefined)
    .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
    .map(([key, item]) => [key, canonicalize(item)]))
}

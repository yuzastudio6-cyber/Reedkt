import {
  CAPTION_SPECIALIST_OBSERVABILITY_RECEIPT_VERSION,
  CAPTION_SPECIALIST_PERSISTENCE_RECEIPT_VERSION,
  CAPTION_SPECIALIST_PRESENTATION_VERSION,
  CAPTION_SPECIALIST_REVISION_INTENT_VERSION,
  CAPTION_SPECIALIST_SNAPSHOT_EXTENSION_VERSION,
  type CaptionNaturalLanguageRevisionChange,
  type CaptionSpecialistApprovedSnapshotExtension,
  type CaptionSpecialistChatPresentation,
  type CaptionSpecialistComponentPersistenceReceipt,
  type CaptionSpecialistMilestoneComponentKey,
  type CaptionSpecialistNaturalLanguageRevisionIntent,
  type CaptionSpecialistObservabilityReceipt,
} from '../../types/caption-specialist-integration'
import type { CaptionDomainCanonicalScope, CaptionDomainRef } from
  '../../types/caption-domain-contracts'
import type { CaptionRenderedVisualReviewAuthenticatedReadResult } from
  '../../types/caption-direction-visual-review-authenticated-read'
import type { ProfessionalSkillPlan } from '../../types/professional-skills'
import { assertClosedContractTree } from '../closed-contract-validation'
import { sha256HexUtf8 } from '../sha256'
import {
  parseProfessionalSkillCompositionTrace,
} from '../professional-skills/professional-skill-composition-trace'
import {
  validateCaptionRenderedVisualReviewAuthenticatedReadResult,
} from './caption-rendered-visual-review-authenticated-read'

export const CAPTION_SPECIALIST_REQUIRED_COMPONENT_KEYS:
readonly CaptionSpecialistMilestoneComponentKey[] = Object.freeze([
  'CAP-02.composite',
  'CAP-03.domain_contracts',
  'CAP-04.transcript_lineage',
  'CAP-05.font_shaping',
  'CAP-06.early_planning',
  'CAP-07.finish_readiness',
  'CAP-08.visual_intelligence_support',
  'CAP-09.track_all_support',
  'CAP-10.semantic_style',
  'CAP-11.scene_graph',
  'CAP-12.storytiming_motion_handoffs',
  'CAP-13.sound_support',
  'CAP-14.remotion_render',
  'CAP-15.accessibility_export',
  'CAP-16.complete_qa_repair',
])

const UNSAFE_TEXT = /(?:https?:\/\/|file:\/\/|[A-Za-z]:\\|\/(?:Users|home|tmp|var|Volumes)\/|-----BEGIN|(?:api|secret|token|password|credential)[_-]?key\s*[:=])/iu
const ASPECT_RATIOS = new Set([
  '9:16', '16:9', '1:1', '4:5', 'original', 'custom',
])
const PRESENTATION_PHASES = new Set([
  'planning_selected', 'planning_restrained',
  'approved_waiting_for_picture_lock', 'finish_readiness_blocked',
  'ready_for_private_render', 'waiting_for_qualified_visual_review',
  'repair_required', 'ready_for_human_review', 'caption_scope_passed',
])
const REVISION_CHANGES = new Set<CaptionNaturalLanguageRevisionChange>([
  'increase_readability', 'decrease_caption_size', 'increase_caption_size',
  'reduce_motion', 'remove_decorative_emphasis', 'move_to_safer_region',
  'change_caption_style', 'correct_caption_wording', 'enable_captions',
  'disable_captions',
])

export function calculateCaptionSpecialistIntegrationDigest(
  value: Record<string, unknown>,
  digestField: string,
): string {
  const clone = { ...value, [digestField]: '' }
  assertClosedContractTree(clone, 'Caption specialist integration artifact')
  return sha256HexUtf8(JSON.stringify(canonicalize(clone)))
}

export function createCaptionSpecialistApprovedSnapshotExtension(
  input: Omit<CaptionSpecialistApprovedSnapshotExtension,
    'schemaVersion' | 'extensionDigestSha256'>,
): CaptionSpecialistApprovedSnapshotExtension {
  const withoutDigest = {
    ...structuredClone(input),
    schemaVersion: CAPTION_SPECIALIST_SNAPSHOT_EXTENSION_VERSION,
  }
  return parseCaptionSpecialistApprovedSnapshotExtension({
    ...withoutDigest,
    extensionDigestSha256: calculateCaptionSpecialistIntegrationDigest(
      withoutDigest as unknown as Record<string, unknown>,
      'extensionDigestSha256',
    ),
  })
}

export function parseCaptionSpecialistApprovedSnapshotExtension(
  value: unknown,
): CaptionSpecialistApprovedSnapshotExtension {
  assertClosedContractTree(value, 'Caption specialist snapshot extension')
  if (!record(value)) throw new Error('Caption specialist snapshot extension is malformed.')
  const extension = value as unknown as CaptionSpecialistApprovedSnapshotExtension
  const selected = extension.selectionDisposition === 'selected'
  const componentKeys = extension.componentRefs.map((item) => item.componentKey)
  const outputIds = extension.outputScopes.map((output) => output.outputId)
  const frameHashes = extension.outputScopes.map((output) =>
    output.confirmedOutputFrameRef.contentHash)
  const selectedRefs = [
    extension.executionBundleRef,
    extension.captionWorkBindingRef,
    extension.captionRenderQaWorkBindingRef,
    extension.estimateInputRef,
    extension.approvedEstimateRef,
    extension.creditReservationRef,
    extension.privateReviewDependencyRef,
    extension.postrenderVisualQaRequestRef,
  ]
  if (!exactKeys(value, [
    'schemaVersion', 'extensionId', 'extensionDigestSha256', 'ownerUserId',
    'workspaceId', 'projectId', 'editSessionId', 'approvedSnapshotId',
    'approvedPlanVersionId', 'selectionDisposition', 'compositionTraceRef',
    'ownerApprovedRestraintRef', 'outputScopes', 'componentRefs',
    'executionBundleRef', 'captionWorkBindingRef',
    'captionRenderQaWorkBindingRef', 'assetManifestRefs', 'estimateInputRef',
    'approvedEstimateRef', 'creditReservationRef',
    'privateReviewDependencyRef', 'postrenderVisualQaRequestRef',
    'brollOwnerReadRefs', 'exactScopeFrameMasterTimingBound',
    'componentCoverageComplete', 'workCoverageComplete',
    'manifestEstimateAndQaCoverageComplete', 'privateArtifactPolicy',
    'approvedSnapshotMutatedAfterApproval', 'separateCaptionApprovalCreated',
    'separateCaptionCreditReservationCreated', 'operationDispatchAuthority',
    'providerRuntimeAuthority', 'assetMutationAuthority',
    'qaApprovalAuthority', 'billingAuthority', 'publicDeliveryAuthority',
    'productionAuthority',
  ])
    || extension.schemaVersion !== CAPTION_SPECIALIST_SNAPSHOT_EXTENSION_VERSION
    || !safeId(extension.extensionId)
    || !digest(extension.extensionDigestSha256)
    || ![
      extension.ownerUserId, extension.workspaceId, extension.projectId,
      extension.editSessionId, extension.approvedSnapshotId,
      extension.approvedPlanVersionId,
    ].every(safeId)
    || !ref(extension.compositionTraceRef)
    || extension.outputScopes.length < 1 || extension.outputScopes.length > 8
    || new Set(outputIds).size !== outputIds.length
    || new Set(frameHashes).size !== frameHashes.length
    || extension.outputScopes.some((output) => !validOutputScope(output))
    || new Set(componentKeys).size !== componentKeys.length
    || extension.componentRefs.some((item) => !ref(item.componentRef))
    || new Set(extension.assetManifestRefs.map(refKey)).size
      !== extension.assetManifestRefs.length
    || extension.assetManifestRefs.some((item) => !ref(item))
    || extension.brollOwnerReadRefs.some((item) => !ref(item))
    || new Set(extension.brollOwnerReadRefs.map(refKey)).size
      !== extension.brollOwnerReadRefs.length
    || extension.exactScopeFrameMasterTimingBound !== true
    || extension.componentCoverageComplete !== true
    || extension.workCoverageComplete !== true
    || extension.manifestEstimateAndQaCoverageComplete !== true
    || !validPrivatePolicy(extension.privateArtifactPolicy)
    || !closedSnapshotAuthorities(extension)
    || (selected && (
      extension.ownerApprovedRestraintRef !== null
      || componentKeys.join('|') !== CAPTION_SPECIALIST_REQUIRED_COMPONENT_KEYS.join('|')
      || selectedRefs.some((item) => item === null)
      || extension.assetManifestRefs.length < 1
    ))
    || (!selected && (
      extension.selectionDisposition !== 'restrained'
      || !ref(extension.ownerApprovedRestraintRef)
      || extension.componentRefs.length !== 0
      || selectedRefs.some((item) => item !== null)
      || extension.assetManifestRefs.length !== 0
      || extension.brollOwnerReadRefs.length !== 0
    ))
    || calculateCaptionSpecialistIntegrationDigest(
      extension as unknown as Record<string, unknown>,
      'extensionDigestSha256',
    ) !== extension.extensionDigestSha256) {
    throw new Error('Caption specialist snapshot extension is invalid or incomplete.')
  }
  return structuredClone(extension)
}

export function createCaptionSpecialistPlanningPresentation(
  plan: Pick<ProfessionalSkillPlan, 'id' | 'compositionTrace'>,
): CaptionSpecialistChatPresentation {
  if (!plan.compositionTrace) {
    throw new Error('Current Caption presentation requires the exact professional composition trace.')
  }
  const trace = parseProfessionalSkillCompositionTrace(plan.compositionTrace)
  const entry = trace.entries[0]
  if (entry.disposition === 'unresolved') {
    throw new Error('Caption selection or explicit no-caption restraint is unresolved.')
  }
  const selected = entry.disposition === 'selected'
  const withoutDigest = {
    schemaVersion: CAPTION_SPECIALIST_PRESENTATION_VERSION,
    presentationId: `${plan.id}.caption-presentation`,
    source: 'professional_skill_plan' as const,
    phase: selected ? 'planning_selected' as const : 'planning_restrained' as const,
    title: selected ? 'Captions planned' : 'Captions intentionally off',
    summary: selected
      ? 'Readable captions are included in this plan. Placement is reserved now; exact timing and visual treatment resolve against the approved edit.'
      : 'This plan keeps captions off because the edit contains an explicit no-caption direction.',
    statusLabel: selected ? 'Included in this plan' : 'Not used by request',
    selectionDisposition: selected ? 'selected' as const : 'restrained' as const,
    opportunityCount: null,
    reservedSceneCount: null,
    readySceneCount: null,
    blockedSceneCount: null,
    visualReviewState: 'not_applicable' as const,
    details: selected ? [{
      label: 'Timing',
      value: 'Final frames follow the approved speech-first timing.',
    }, {
      label: 'Placement',
      value: 'Faces, products, labels, and important visuals stay protected.',
    }, {
      label: 'Review',
      value: 'The rendered captions require visual inspection before acceptance.',
    }] : [{
      label: 'Restraint',
      value: 'No caption work or caption cost may be added without a fresh plan.',
    }],
    authenticatedVisualReviewRead: null,
    revisionHint: selected
      ? 'During private review, describe any caption wording, size, motion, or placement change in plain language.'
      : 'Ask for captions in Chat to create a fresh plan and estimate.',
    onePlanApprovalAndEstimateOnly: true as const,
    browserLocalCompletionAccepted: false as const,
    rawTranscriptIncluded: false as const,
    mediaBytesIncluded: false as const,
    pathsOrUrlsIncluded: false as const,
    operationDispatchAuthority: false as const,
    providerRuntimeAuthority: false as const,
    qaApprovalAuthority: false as const,
    creditOrBillingAuthority: false as const,
    publicDeliveryAuthority: false as const,
    productionAuthority: false as const,
  }
  return parseCaptionSpecialistChatPresentation({
    ...withoutDigest,
    presentationDigestSha256: calculateCaptionSpecialistIntegrationDigest(
      withoutDigest as unknown as Record<string, unknown>,
      'presentationDigestSha256',
    ),
  })
}

export function createCaptionSpecialistAuthenticatedPresentation(input: {
  snapshotExtension: CaptionSpecialistApprovedSnapshotExtension
  authenticatedRead: CaptionRenderedVisualReviewAuthenticatedReadResult
}): CaptionSpecialistChatPresentation {
  const extension = parseCaptionSpecialistApprovedSnapshotExtension(
    input.snapshotExtension)
  if (extension.selectionDisposition !== 'selected'
    || !validateCaptionRenderedVisualReviewAuthenticatedReadResult(
      input.authenticatedRead).ok
    || input.authenticatedRead.scope.workspaceId !== extension.workspaceId
    || input.authenticatedRead.scope.projectId !== extension.projectId
    || input.authenticatedRead.scope.editSessionId !== extension.editSessionId
    || input.authenticatedRead.scope.approvedSnapshotId !== extension.approvedSnapshotId
    || input.authenticatedRead.confirmedOutputs.length !== extension.outputScopes.length
    || input.authenticatedRead.confirmedOutputs.some((output) => {
      const expected = extension.outputScopes.find((item) =>
        item.outputId === output.outputId)
      return !expected
        || expected.width !== output.confirmedOutputFrameRef.width
        || expected.height !== output.confirmedOutputFrameRef.height
        || expected.confirmedOutputFrameRef.contentHash !==
          output.confirmedOutputFrameRef.contentHash
    })) {
    throw new Error('Authenticated Caption presentation crosses snapshot or output authority.')
  }
  const status = input.authenticatedRead.outputSetStatus
  const phase = !status || input.authenticatedRead.disposition === 'not_found'
    ? 'waiting_for_qualified_visual_review' as const
    : status.state === 'repair_required'
      ? 'repair_required' as const
      : status.state === 'needs_human_review'
        ? 'ready_for_human_review' as const
        : status.state === 'passed'
          ? 'caption_scope_passed' as const
          : 'waiting_for_qualified_visual_review' as const
  const withoutDigest = {
    schemaVersion: CAPTION_SPECIALIST_PRESENTATION_VERSION,
    presentationId: `${extension.extensionId}.authenticated-presentation`,
    source: 'approved_snapshot_authenticated_read' as const,
    phase,
    title: phase === 'caption_scope_passed' ? 'Caption checks passed'
      : phase === 'repair_required' ? 'Caption repair needed'
        : phase === 'ready_for_human_review' ? 'Captions need your review'
          : 'Caption visual review in progress',
    summary: input.authenticatedRead.userFacingSummary,
    statusLabel: status?.userFacingLabel ?? 'Waiting for verified review',
    selectionDisposition: 'selected' as const,
    opportunityCount: null,
    reservedSceneCount: null,
    readySceneCount: status?.outputs.filter((output) =>
      output.status.visualQaGateSatisfied).length ?? 0,
    blockedSceneCount: status?.unresolvedOutputIds.length ?? extension.outputScopes.length,
    visualReviewState: phase === 'caption_scope_passed' ? 'passed' as const
      : phase === 'repair_required' ? 'repair_required' as const
        : phase === 'ready_for_human_review' ? 'needs_human_review' as const
          : 'waiting' as const,
    details: [{
      label: 'Outputs',
      value: `${extension.outputScopes.length} confirmed output${extension.outputScopes.length === 1 ? '' : 's'} checked independently.`,
    }, {
      label: 'Evidence',
      value: 'Status comes from the signed-in canonical review record, not this browser.',
    }],
    authenticatedVisualReviewRead: structuredClone(input.authenticatedRead),
    revisionHint: phase === 'caption_scope_passed'
      ? 'Review the edit and request any wording, size, motion, or placement change in plain language.'
      : 'Caption repair remains scoped to the affected output and must be reinspected.',
    onePlanApprovalAndEstimateOnly: true as const,
    browserLocalCompletionAccepted: false as const,
    rawTranscriptIncluded: false as const,
    mediaBytesIncluded: false as const,
    pathsOrUrlsIncluded: false as const,
    operationDispatchAuthority: false as const,
    providerRuntimeAuthority: false as const,
    qaApprovalAuthority: false as const,
    creditOrBillingAuthority: false as const,
    publicDeliveryAuthority: false as const,
    productionAuthority: false as const,
  }
  return parseCaptionSpecialistChatPresentation({
    ...withoutDigest,
    presentationDigestSha256: calculateCaptionSpecialistIntegrationDigest(
      withoutDigest as unknown as Record<string, unknown>,
      'presentationDigestSha256',
    ),
  })
}

export function parseCaptionSpecialistChatPresentation(
  value: unknown,
): CaptionSpecialistChatPresentation {
  assertClosedContractTree(value, 'Caption specialist chat presentation')
  if (!record(value)) throw new Error('Caption specialist chat presentation is malformed.')
  const presentation = value as unknown as CaptionSpecialistChatPresentation
  if (!exactKeys(value, [
    'schemaVersion', 'presentationId', 'presentationDigestSha256', 'source',
    'phase', 'title', 'summary', 'statusLabel', 'selectionDisposition',
    'opportunityCount', 'reservedSceneCount', 'readySceneCount',
    'blockedSceneCount', 'visualReviewState', 'details',
    'authenticatedVisualReviewRead', 'revisionHint',
    'onePlanApprovalAndEstimateOnly', 'browserLocalCompletionAccepted',
    'rawTranscriptIncluded', 'mediaBytesIncluded', 'pathsOrUrlsIncluded',
    'operationDispatchAuthority', 'providerRuntimeAuthority',
    'qaApprovalAuthority', 'creditOrBillingAuthority',
    'publicDeliveryAuthority', 'productionAuthority',
  ])
    || presentation.schemaVersion !== CAPTION_SPECIALIST_PRESENTATION_VERSION
    || !safeId(presentation.presentationId)
    || !digest(presentation.presentationDigestSha256)
    || !safeText(presentation.title, 120)
    || !safeText(presentation.summary, 1_000)
    || !safeText(presentation.statusLabel, 160)
    || !['professional_skill_plan', 'approved_snapshot_authenticated_read']
      .includes(presentation.source)
    || !PRESENTATION_PHASES.has(presentation.phase)
    || !['selected', 'restrained'].includes(presentation.selectionDisposition)
    || !['not_applicable', 'waiting', 'repair_required',
      'needs_human_review', 'passed'].includes(presentation.visualReviewState)
    || [presentation.opportunityCount, presentation.reservedSceneCount,
      presentation.readySceneCount, presentation.blockedSceneCount].some(
      (count) => count !== null
        && (!Number.isSafeInteger(count) || count < 0))
    || (presentation.revisionHint !== null
      && !safeText(presentation.revisionHint, 1_000))
    || presentation.details.length > 8
    || presentation.details.some((detail) =>
      !record(detail) || !exactKeys(detail, ['label', 'value'])
      || !safeText(detail.label, 80) || !safeText(detail.value, 500))
    || presentation.browserLocalCompletionAccepted !== false
    || presentation.onePlanApprovalAndEstimateOnly !== true
    || !closedPresentationAuthorities(presentation)
    || (presentation.source === 'professional_skill_plan'
      && presentation.authenticatedVisualReviewRead !== null)
    || (presentation.source === 'approved_snapshot_authenticated_read'
      && (presentation.authenticatedVisualReviewRead === null
        || !validateCaptionRenderedVisualReviewAuthenticatedReadResult(
          presentation.authenticatedVisualReviewRead).ok))
    || calculateCaptionSpecialistIntegrationDigest(
      presentation as unknown as Record<string, unknown>,
      'presentationDigestSha256') !== presentation.presentationDigestSha256) {
    throw new Error('Caption specialist chat presentation is invalid.')
  }
  return structuredClone(presentation)
}

export function compileCaptionSpecialistNaturalLanguageRevision(input: {
  requestText: string
  canonicalScope: CaptionDomainCanonicalScope
  priorSnapshotRef: CaptionDomainRef
  priorComponentRefs: CaptionDomainRef[]
  affectedSceneIds: string[]
  affectedOutputIds: string[]
}): CaptionSpecialistNaturalLanguageRevisionIntent {
  if (!safeText(input.requestText, 500) || !ref(input.priorSnapshotRef)
    || input.priorComponentRefs.length < 1
    || input.priorComponentRefs.some((item) => !ref(item))
    || !uniqueSafeIds(input.affectedSceneIds, 1, 512)
    || !uniqueSafeIds(input.affectedOutputIds, 1, 8)) {
    throw new Error('Caption revision request is unsafe or lacks exact prior scope.')
  }
  const normalized = input.requestText.toLowerCase()
  const requestedChanges: CaptionNaturalLanguageRevisionChange[] = []
  const match = (pattern: RegExp, change: CaptionNaturalLanguageRevisionChange) => {
    if (pattern.test(normalized)) requestedChanges.push(change)
  }
  match(/\b(?:readable|readability|clearer|contrast)\b/u, 'increase_readability')
  match(/\b(?:smaller|less big|reduce (?:the )?(?:caption|subtitle) size)\b/u, 'decrease_caption_size')
  match(/\b(?:larger|bigger|increase (?:the )?(?:caption|subtitle) size)\b/u, 'increase_caption_size')
  match(/\b(?:less motion|reduce motion|calmer|stop bouncing)\b/u, 'reduce_motion')
  match(/\b(?:less emphasis|remove (?:the )?highlight|fewer highlights)\b/u, 'remove_decorative_emphasis')
  match(/\b(?:move|reposition|covering|overlap|safer area|safe area)\b/u, 'move_to_safer_region')
  match(/\b(?:style|font|color|design)\b/u, 'change_caption_style')
  match(/\b(?:correct|wording|spelling|typo|text says)\b/u, 'correct_caption_wording')
  match(/\b(?:add|enable|turn on|include) (?:the )?(?:captions|subtitles)\b/u, 'enable_captions')
  match(/\b(?:no|remove|disable|turn off|without) (?:the )?(?:captions|subtitles)\b/u, 'disable_captions')
  const uniqueChanges = Array.from(new Set(requestedChanges))
  if (uniqueChanges.length === 0
    || uniqueChanges.includes('enable_captions')
      && uniqueChanges.includes('disable_captions')) {
    throw new Error('Caption revision request needs one clear, supported change.')
  }
  const sourceRequestDigestSha256 = sha256HexUtf8(input.requestText)
  const withoutDigest = {
    schemaVersion: CAPTION_SPECIALIST_REVISION_INTENT_VERSION,
    revisionIntentId: `caption.revision.${sourceRequestDigestSha256.slice(0, 24)}`,
    canonicalScope: structuredClone(input.canonicalScope),
    sourceRequestDigestSha256,
    requestedChanges: uniqueChanges,
    affectedSceneIds: [...input.affectedSceneIds],
    affectedOutputIds: [...input.affectedOutputIds],
    reasonCodes: uniqueChanges.map((change) => `caption_revision.${change}`),
    priorSnapshotRef: structuredClone(input.priorSnapshotRef),
    priorComponentRefs: structuredClone(input.priorComponentRefs),
    requiresFreshPlan: true as const,
    requiresFreshEstimateAndApproval: true as const,
    requiresFreshPrivateReview: true as const,
    priorSnapshotMutated: false as const,
    rawRequestPersistedToWorker: false as const,
    operationDispatchAuthority: false as const,
    repairExecutionAuthority: false as const,
    creditOrBillingAuthority: false as const,
    publicDeliveryAuthority: false as const,
    productionAuthority: false as const,
  }
  return parseCaptionSpecialistNaturalLanguageRevisionIntent({
    ...withoutDigest,
    revisionIntentDigestSha256: calculateCaptionSpecialistIntegrationDigest(
      withoutDigest as unknown as Record<string, unknown>,
      'revisionIntentDigestSha256'),
  })
}

export function parseCaptionSpecialistNaturalLanguageRevisionIntent(
  value: unknown,
): CaptionSpecialistNaturalLanguageRevisionIntent {
  assertClosedContractTree(value, 'Caption specialist revision intent')
  if (!record(value)) throw new Error('Caption specialist revision intent is malformed.')
  const intent = value as unknown as CaptionSpecialistNaturalLanguageRevisionIntent
  if (!exactKeys(value, [
    'schemaVersion', 'revisionIntentId', 'revisionIntentDigestSha256',
    'canonicalScope', 'sourceRequestDigestSha256', 'requestedChanges',
    'affectedSceneIds', 'affectedOutputIds', 'reasonCodes',
    'priorSnapshotRef', 'priorComponentRefs', 'requiresFreshPlan',
    'requiresFreshEstimateAndApproval', 'requiresFreshPrivateReview',
    'priorSnapshotMutated', 'rawRequestPersistedToWorker',
    'operationDispatchAuthority', 'repairExecutionAuthority',
    'creditOrBillingAuthority', 'publicDeliveryAuthority',
    'productionAuthority',
  ])
    || !canonicalScope(intent.canonicalScope)
    || intent.schemaVersion !== CAPTION_SPECIALIST_REVISION_INTENT_VERSION
    || !safeId(intent.revisionIntentId) || !digest(intent.revisionIntentDigestSha256)
    || !digest(intent.sourceRequestDigestSha256)
    || !uniqueSafeIds(intent.affectedSceneIds, 1, 512)
    || !uniqueSafeIds(intent.affectedOutputIds, 1, 8)
    || new Set(intent.requestedChanges).size !== intent.requestedChanges.length
    || intent.requestedChanges.length < 1
    || intent.requestedChanges.some((change) => !REVISION_CHANGES.has(change))
    || intent.reasonCodes.length !== intent.requestedChanges.length
    || intent.reasonCodes.some((code, index) =>
      code !== `caption_revision.${intent.requestedChanges[index]}`)
    || !ref(intent.priorSnapshotRef)
    || intent.priorComponentRefs.some((item) => !ref(item))
    || intent.priorComponentRefs.length < 1
    || intent.requiresFreshPlan !== true
    || intent.requiresFreshEstimateAndApproval !== true
    || intent.requiresFreshPrivateReview !== true
    || intent.priorSnapshotMutated !== false
    || intent.rawRequestPersistedToWorker !== false
    || intent.operationDispatchAuthority !== false
    || intent.repairExecutionAuthority !== false
    || intent.creditOrBillingAuthority !== false
    || intent.publicDeliveryAuthority !== false
    || intent.productionAuthority !== false
    || calculateCaptionSpecialistIntegrationDigest(
      intent as unknown as Record<string, unknown>,
      'revisionIntentDigestSha256') !== intent.revisionIntentDigestSha256) {
    throw new Error('Caption specialist revision intent is invalid.')
  }
  return structuredClone(intent)
}

export function createCaptionSpecialistComponentPersistenceReceipt(input: {
  receiptId: string
  approvedSnapshotRef: CaptionDomainRef
  persistedExtension: CaptionSpecialistApprovedSnapshotExtension
  rereadExtension: CaptionSpecialistApprovedSnapshotExtension
}): CaptionSpecialistComponentPersistenceReceipt {
  if (!safeId(input.receiptId) || !ref(input.approvedSnapshotRef)) {
    throw new Error('Caption component persistence receipt identity is invalid.')
  }
  const persisted = parseCaptionSpecialistApprovedSnapshotExtension(input.persistedExtension)
  const reread = parseCaptionSpecialistApprovedSnapshotExtension(input.rereadExtension)
  if (persisted.extensionDigestSha256 !== reread.extensionDigestSha256
    || persisted.ownerUserId !== reread.ownerUserId
    || persisted.workspaceId !== reread.workspaceId
    || persisted.projectId !== reread.projectId
    || persisted.editSessionId !== reread.editSessionId
    || persisted.approvedSnapshotId !== input.approvedSnapshotRef.id) {
    throw new Error('Caption component persistence reread does not match the immutable snapshot extension.')
  }
  const extensionRef = {
    id: persisted.extensionId,
    version: persisted.schemaVersion,
    contentHash: persisted.extensionDigestSha256,
  }
  const withoutDigest = {
    schemaVersion: CAPTION_SPECIALIST_PERSISTENCE_RECEIPT_VERSION,
    receiptId: input.receiptId,
    ownerUserId: persisted.ownerUserId,
    workspaceId: persisted.workspaceId,
    projectId: persisted.projectId,
    editSessionId: persisted.editSessionId,
    approvedSnapshotRef: structuredClone(input.approvedSnapshotRef),
    snapshotExtensionRef: extensionRef,
    exactApprovedSnapshotRereadVerified: true as const,
    exactExtensionDigestRereadVerified: true as const,
    tenantScopeVerified: true as const,
    immutableApprovedSnapshotPreserved: true as const,
    persistenceOwner: 'canonical_approved_plan_snapshot_service' as const,
    browserLocalCompletionAccepted: false as const,
    separateCaptionPersistenceOwnerCreated: false as const,
    operationDispatchAuthority: false as const,
    providerRuntimeAuthority: false as const,
    assetMutationAuthority: false as const,
    qaApprovalAuthority: false as const,
    billingAuthority: false as const,
    publicDeliveryAuthority: false as const,
    productionAuthority: false as const,
  }
  return {
    ...withoutDigest,
    receiptDigestSha256: calculateCaptionSpecialistIntegrationDigest(
      withoutDigest as unknown as Record<string, unknown>,
      'receiptDigestSha256'),
  }
}

export function createCaptionSpecialistObservabilityReceipt(input: Omit<
  CaptionSpecialistObservabilityReceipt,
  'schemaVersion' | 'receiptDigestSha256' | 'rawUserTextIncluded'
  | 'rawTranscriptIncluded' | 'rawModelTextIncluded' | 'mediaBytesIncluded'
  | 'pathsOrUrlsIncluded' | 'secretsIncluded' | 'productionMetricPublished'
  | 'alertCreated' | 'billingAuthority' | 'publicDeliveryAuthority'
  | 'productionAuthority'
>): CaptionSpecialistObservabilityReceipt {
  if (!safeId(input.receiptId) || !safeId(input.workspaceId)
    || !safeId(input.projectId) || !safeId(input.editSessionId)
    || (input.approvedSnapshotId !== null
      && !safeId(input.approvedSnapshotId))
    || !['selected', 'restrained'].includes(input.selectionDisposition)
    || !PRESENTATION_PHASES.has(input.phase)
    || input.lineageRefs.some((item) => !ref(item))
    || new Set(input.lineageRefs.map(refKey)).size !== input.lineageRefs.length
    || Object.values(input.counters).some((count) =>
      !Number.isSafeInteger(count) || count < 0)) {
    throw new Error('Caption observability receipt contains unsafe or invalid metrics.')
  }
  const withoutDigest = {
    ...structuredClone(input),
    schemaVersion: CAPTION_SPECIALIST_OBSERVABILITY_RECEIPT_VERSION,
    rawUserTextIncluded: false as const,
    rawTranscriptIncluded: false as const,
    rawModelTextIncluded: false as const,
    mediaBytesIncluded: false as const,
    pathsOrUrlsIncluded: false as const,
    secretsIncluded: false as const,
    productionMetricPublished: false as const,
    alertCreated: false as const,
    billingAuthority: false as const,
    publicDeliveryAuthority: false as const,
    productionAuthority: false as const,
  }
  return {
    ...withoutDigest,
    receiptDigestSha256: calculateCaptionSpecialistIntegrationDigest(
      withoutDigest as unknown as Record<string, unknown>,
      'receiptDigestSha256'),
  }
}

function validOutputScope(output: CaptionSpecialistApprovedSnapshotExtension['outputScopes'][number]): boolean {
  return record(output) && exactKeys(output, [
    'outputId', 'aspectRatio', 'width', 'height', 'fpsNumerator',
    'fpsDenominator', 'confirmedOutputFrameRef',
  ]) && safeId(output.outputId) && ASPECT_RATIOS.has(output.aspectRatio)
    && output.width > 0 && output.height > 0
    && Number.isSafeInteger(output.width) && Number.isSafeInteger(output.height)
    && Number.isSafeInteger(output.fpsNumerator) && output.fpsNumerator > 0
    && Number.isSafeInteger(output.fpsDenominator) && output.fpsDenominator > 0
    && output.confirmedOutputFrameRef.outputId === output.outputId
    && output.confirmedOutputFrameRef.aspectRatio === output.aspectRatio
    && output.confirmedOutputFrameRef.width === output.width
    && output.confirmedOutputFrameRef.height === output.height
    && output.confirmedOutputFrameRef.fps
      === output.fpsNumerator / output.fpsDenominator
    && authenticatedFrameRef(output.confirmedOutputFrameRef)
}
function validPrivatePolicy(value: CaptionSpecialistApprovedSnapshotExtension['privateArtifactPolicy']): boolean {
  return record(value) && exactKeys(value, [
    'tenantScoped', 'createOnly', 'byteFreeSerializedRecord',
    'rawTranscriptIncluded', 'mediaBytesIncluded', 'pathsOrUrlsIncluded',
  ]) && value.tenantScoped === true && value.createOnly === true
    && value.byteFreeSerializedRecord === true && value.rawTranscriptIncluded === false
    && value.mediaBytesIncluded === false && value.pathsOrUrlsIncluded === false
}
function closedSnapshotAuthorities(value: CaptionSpecialistApprovedSnapshotExtension): boolean {
  return value.approvedSnapshotMutatedAfterApproval === false
    && value.separateCaptionApprovalCreated === false
    && value.separateCaptionCreditReservationCreated === false
    && value.operationDispatchAuthority === false
    && value.providerRuntimeAuthority === false
    && value.assetMutationAuthority === false
    && value.qaApprovalAuthority === false && value.billingAuthority === false
    && value.publicDeliveryAuthority === false && value.productionAuthority === false
}
function closedPresentationAuthorities(value: CaptionSpecialistChatPresentation): boolean {
  return value.rawTranscriptIncluded === false && value.mediaBytesIncluded === false
    && value.pathsOrUrlsIncluded === false && value.operationDispatchAuthority === false
    && value.providerRuntimeAuthority === false && value.qaApprovalAuthority === false
    && value.creditOrBillingAuthority === false && value.publicDeliveryAuthority === false
    && value.productionAuthority === false
}
function record(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
    && (Object.getPrototypeOf(value) === Object.prototype
      || Object.getPrototypeOf(value) === null)
}
function safeId(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 240
    && value.trim() === value && !UNSAFE_TEXT.test(value)
}
function safeText(value: unknown, maximum: number): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= maximum
    && value.trim() === value && !UNSAFE_TEXT.test(value)
}
function digest(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f0-9]{64}$/u.test(value)
}
function ref(value: unknown): value is CaptionDomainRef {
  return record(value) && exactKeys(value, ['id', 'version', 'contentHash'])
    && safeId(value.id) && safeId(value.version)
    && digest(value.contentHash)
}
function authenticatedFrameRef(value: unknown): boolean {
  return record(value) && exactKeys(value, [
    'id', 'version', 'contentHash', 'outputId', 'aspectRatio', 'width',
    'height', 'fps', 'confirmedByUser', 'confirmationRecordId',
  ]) && safeId(value.id) && Number.isSafeInteger(value.version)
    && Number(value.version) > 0
    && typeof value.contentHash === 'string'
    && /^sha256:[a-f0-9]{64}$/u.test(value.contentHash)
    && safeId(value.outputId) && ASPECT_RATIOS.has(String(value.aspectRatio))
    && Number.isSafeInteger(value.width) && Number(value.width) > 0
    && Number.isSafeInteger(value.height) && Number(value.height) > 0
    && typeof value.fps === 'number' && Number.isFinite(value.fps)
    && value.fps > 0 && value.confirmedByUser === true
    && safeId(value.confirmationRecordId)
}
function canonicalScope(value: unknown): value is CaptionDomainCanonicalScope {
  return record(value) && exactKeys(value, [
    'ownerUserId', 'workspaceId', 'projectId', 'editSessionId',
    'planVersionId', 'approvedSnapshotRef', 'outputId', 'sceneId',
    'authorizedFrameRanges',
  ]) && [value.ownerUserId, value.workspaceId, value.projectId,
    value.editSessionId, value.planVersionId, value.outputId].every(safeId)
    && (value.sceneId === null || safeId(value.sceneId))
    && (value.approvedSnapshotRef === null || ref(value.approvedSnapshotRef))
    && Array.isArray(value.authorizedFrameRanges)
    && value.authorizedFrameRanges.length > 0
    && value.authorizedFrameRanges.every((range) => record(range)
      && exactKeys(range, ['startFrame', 'endFrameExclusive'])
      && Number.isSafeInteger(range.startFrame) && Number(range.startFrame) >= 0
      && Number.isSafeInteger(range.endFrameExclusive)
      && Number(range.endFrameExclusive) > Number(range.startFrame))
}
function exactKeys(value: Record<string, unknown>, keys: string[]): boolean {
  const actual = Object.getOwnPropertyNames(value)
  return actual.length === keys.length
    && keys.every((key) => Object.hasOwn(value, key))
}
function refKey(value: CaptionDomainRef): string {
  return `${value.id}\u0000${value.version}\u0000${value.contentHash}`
}
function uniqueSafeIds(values: unknown, minimum: number, maximum: number): values is string[] {
  return Array.isArray(values) && values.length >= minimum && values.length <= maximum
    && values.every(safeId) && new Set(values).size === values.length
}
function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (!record(value)) return value
  return Object.fromEntries(Object.entries(value)
    .filter(([, item]) => item !== undefined)
    .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
    .map(([key, item]) => [key, canonicalize(item)]))
}

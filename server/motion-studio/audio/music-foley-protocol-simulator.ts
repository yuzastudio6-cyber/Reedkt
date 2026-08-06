import type {
  MotionStudioMusicFoleyCapabilitySnapshotV1,
  MotionStudioMusicFoleyCandidateRequestV1,
  MotionStudioMusicFoleyProtocolBundleV1,
  MotionStudioMusicFoleyProtocolEnvelopeV1,
  MotionStudioMusicFoleyQaGate,
  MotionStudioMusicFoleyWorkspaceDto,
} from '../../../src/types/motion-studio'
import {
  motionStudioMusicFoleyCandidateRequestV1Schema,
  motionStudioMusicFoleyCapabilitySnapshotV1Schema,
  motionStudioMusicFoleyProtocolBundleV1Schema,
  motionStudioMusicFoleyWorkspaceDtoSchema,
} from '../../../src/lib/motion-studio/contracts'
import { ApiError } from '../../errors/api-error'
import { sha256CanonicalJson } from '../commands/canonical-json'
import {
  compileMotionStudioGeneratedMusicProtocolRequest,
  compileMotionStudioSynchronizedFoleyProtocolRequest,
} from './music-foley-protocol-compiler'

const QA_GATES: readonly MotionStudioMusicFoleyQaGate[] = [
  'request_integrity', 'approved_authority', 'provider_capability',
  'cue_or_event_grounding', 'instrumental_and_no_copy', 'source_video_binding',
  'forbidden_content', 'timing', 'private_ingest', 'media_integrity',
  'speech_safety', 'human_review', 'no_auto_selection',
]
const NEVER_EVALUATED = new Set<MotionStudioMusicFoleyQaGate>([
  'provider_capability', 'private_ingest', 'media_integrity',
  'speech_safety', 'human_review',
])

export function executeMotionStudioMusicFoleyProtocolSimulator(input: {
  request: MotionStudioMusicFoleyCandidateRequestV1
  capabilitySnapshot: MotionStudioMusicFoleyCapabilitySnapshotV1
  createdAt: string
}): MotionStudioMusicFoleyProtocolBundleV1 {
  const request = parse(
    input.request,
    motionStudioMusicFoleyCandidateRequestV1Schema,
    'Music/Foley protocol request',
  )
  const capabilitySnapshot = parse(
    input.capabilitySnapshot,
    motionStudioMusicFoleyCapabilitySnapshotV1Schema,
    'Music/Foley protocol capability snapshot',
  )
  if (request.intent !== capabilitySnapshot.intent) {
    throw blocked('Music/Foley request intent and capability snapshot intent must match exactly.')
  }
  if (!Number.isFinite(Date.parse(input.createdAt))) {
    throw new ApiError('VALIDATION_FAILED', 'Music/Foley protocol execution requires an exact timestamp.', 400)
  }

  const envelope = compileProtocolEnvelope(request, capabilitySnapshot)
  const createdAt = new Date(input.createdAt).toISOString()
  const requestId = envelope.requestId
  const id = (label: string) => deterministicUuid(envelope.requestDigest, label)
  const scope = ownership(request)
  const responseBase = {
    ...scope,
    schemaVersion: 'motion-studio.music-foley-protocol-response.v1' as const,
    intent: request.intent,
    requestId,
    requestDigest: envelope.requestDigest,
    state: 'protocol_fixture_created' as const,
    providerResponseReceived: false as const,
    providerRequestIdPersisted: false as const,
    outputBytesCreated: false as const,
    temporaryProviderUrlPersisted: false as const,
    rawProviderPayloadPersisted: false as const,
    immutable: true as const,
  }
  const response = {
    ...responseBase,
    responseDigest: sha256CanonicalJson(responseBase),
  }
  const attempt = {
    ...scope,
    schemaVersion: 'motion-studio.music-foley-protocol-attempt.v1' as const,
    intent: request.intent,
    requestId,
    requestDigest: envelope.requestDigest,
    approvedSnapshotId: request.approval.approvedSnapshotId,
    approvedWorkItemId: request.work.approvedWorkItemId,
    jobId: request.work.jobId,
    attemptId: request.work.attemptId,
    leaseId: request.work.leaseId,
    idempotencyKeyHash: request.work.idempotencyKeyHash,
    attemptNumber: 1 as const,
    state: 'protocol_completed' as const,
    providerSubmissionPerformed: false as const,
    providerOperationIdentityPresent: false as const,
    externalRequestCount: 0 as const,
    automaticRetry: false as const,
    fallbackPerformed: false as const,
    variantGenerated: false as const,
    outcomeUnknown: false as const,
    startedAt: createdAt,
    completedAt: createdAt,
    immutable: true as const,
  }
  const privateIngest = {
    ...scope,
    schemaVersion: 'motion-studio.music-foley-protocol-private-ingest.v1' as const,
    intent: request.intent,
    requestId,
    requestDigest: envelope.requestDigest,
    state: 'not_performed_protocol_fixture' as const,
    privateArtifactCreated: false as const,
    assetVersionCreated: false as const,
    mediaBytesPersisted: false as const,
    providerUrlPersisted: false as const,
    localPathProjected: false as const,
    contentDigest: sha256CanonicalJson({
      requestDigest: envelope.requestDigest,
      state: 'no_private_ingest_or_media_bytes',
    }),
    immutable: true as const,
  }
  const cost = {
    ...scope,
    schemaVersion: 'motion-studio.music-foley-protocol-cost.v1' as const,
    intent: request.intent,
    costRecordId: id('cost-record'),
    requestId,
    requestDigest: envelope.requestDigest,
    attemptId: request.work.attemptId,
    costBudgetId: request.cost.costBudgetId,
    rateCardVersionId: request.cost.rateCardVersionId,
    meteringClass: 'protocol_zero_cost' as const,
    providerUsageUnits: 0 as const,
    providerCostMicros: 0 as const,
    localComputeCostMicros: 0 as const,
    internalProductionCostMicros: 0 as const,
    customerPricingIncluded: false as const,
    customerCreditsIncluded: false as const,
    billingMutationPerformed: false as const,
    createdAt,
    immutable: true as const,
  }
  const candidate = {
    ...scope,
    schemaVersion: 'motion-studio.music-foley-protocol-candidate.v1' as const,
    intent: request.intent,
    candidateId: id('candidate'),
    requestId,
    requestDigest: envelope.requestDigest,
    attemptId: request.work.attemptId,
    privateIngestRecordId: id('private-ingest-record'),
    source: 'protocol_simulator_fixture' as const,
    state: 'protocol_fixture_only' as const,
    mediaAssetVersionCreated: false as const,
    providerExecutionPerformed: false as const,
    providerSubmissionCount: 0 as const,
    reviewStatus: 'not_reviewable_protocol' as const,
    selected: false as const,
    firstCandidateAutoAccepted: false as const,
    finalMixEligible: false as const,
    timelineEligible: false as const,
    renderEligible: false as const,
    productReady: false as const,
    createdAt,
    immutable: true as const,
  }
  const qa = {
    ...scope,
    schemaVersion: 'motion-studio.music-foley-protocol-qa-report.v1' as const,
    intent: request.intent,
    qaReportId: id('qa-report'),
    requestId,
    requestDigest: envelope.requestDigest,
    candidateId: candidate.candidateId,
    gateResults: QA_GATES.map((gate) => ({
      gate,
      result: gateResult(request.intent, gate),
      blocking: true as const,
      evidenceId: id(`qa:${gate}`),
      note: gateNote(request.intent, gate),
    })),
    automatedChecksComplete: true as const,
    humanReviewComplete: false as const,
    reviewEligible: false as const,
    selectionEligible: false as const,
    finalMixEligible: false as const,
    createdAt,
    immutable: true as const,
  }
  const review = {
    ...scope,
    schemaVersion: 'motion-studio.music-foley-protocol-review-state.v1' as const,
    intent: request.intent,
    reviewStateId: id('review-state'),
    requestId,
    candidateId: candidate.candidateId,
    qaReportId: qa.qaReportId,
    state: 'ineligible_protocol' as const,
    blockers: [
      'protocol_fixture', 'official_capability_not_verified', 'provider_output_absent',
      'private_ingest_not_performed', 'human_review_not_performed',
    ] as const,
    humanReviewRecorded: false as const,
    selectionDecisionCreated: false as const,
    selected: false as const,
    finalMixMutationPerformed: false as const,
    timelineMutationPerformed: false as const,
    createdAt,
    immutable: true as const,
  }
  const bundleBase = {
    ...scope,
    schemaVersion: 'motion-studio.music-foley-protocol-bundle.v1' as const,
    capabilitySnapshot,
    request,
    envelope,
    response,
    attempt,
    privateIngest,
    cost,
    candidate,
    qa,
    review,
    protocolOnly: true as const,
    externalRequestCount: 0 as const,
    providerCostMicros: 0 as const,
    mediaBytesCreated: false as const,
    selectionPerformed: false as const,
    finalMixMutationPerformed: false as const,
    timelineMutationPerformed: false as const,
  }
  const bundle = parse(
    { ...bundleBase, bundleDigest: sha256CanonicalJson(bundleBase) },
    motionStudioMusicFoleyProtocolBundleV1Schema,
    'Music/Foley protocol bundle',
  )
  assertMotionStudioMusicFoleyProtocolEvidence(bundle)
  return bundle
}

export function toMotionStudioMusicFoleyWorkspaceDto(
  bundle: MotionStudioMusicFoleyProtocolBundleV1,
): MotionStudioMusicFoleyWorkspaceDto {
  const parsed = parse(
    bundle,
    motionStudioMusicFoleyProtocolBundleV1Schema,
    'Music/Foley protocol authority',
  )
  assertMotionStudioMusicFoleyProtocolEvidence(parsed)
  return motionStudioMusicFoleyWorkspaceDtoSchema.parse({
    workspaceId: parsed.workspaceId,
    projectId: parsed.projectId,
    editSessionId: parsed.editSessionId,
    productionId: parsed.productionId,
    intent: parsed.request.intent,
    state: 'protocol_evidence_ready',
    capabilityState: 'official_discovery_required',
    candidate: {
      state: 'protocol_fixture_only',
      reviewStatus: 'not_reviewable_protocol',
      selected: false,
      finalMixEligible: false,
    },
    nextAction: 'verify_current_provider_capability',
    warning: 'Protocol evidence only. No provider output or media exists, so this candidate cannot be reviewed, selected, mixed, placed on a timeline, rendered, or exported.',
  })
}

export function assertMotionStudioMusicFoleyProtocolEvidence(
  bundle: MotionStudioMusicFoleyProtocolBundleV1,
): void {
  if (sha256CanonicalJson(bundle.request) !== bundle.envelope.requestDigest) {
    throw blocked('Music/Foley protocol request digest does not match the immutable request authority.')
  }
  const capabilityEvidence: Record<string, unknown> = { ...bundle.capabilitySnapshot }
  delete capabilityEvidence.evidenceDigest
  if (sha256CanonicalJson(capabilityEvidence) !== bundle.capabilitySnapshot.evidenceDigest) {
    throw blocked('Music/Foley capability digest does not match the immutable capability authority.')
  }
  const responseEvidence: Record<string, unknown> = { ...bundle.response }
  delete responseEvidence.responseDigest
  if (sha256CanonicalJson(responseEvidence) !== bundle.response.responseDigest) {
    throw blocked('Music/Foley protocol response digest does not match the immutable response authority.')
  }
  const bundleEvidence: Record<string, unknown> = { ...bundle }
  delete bundleEvidence.bundleDigest
  if (sha256CanonicalJson(bundleEvidence) !== bundle.bundleDigest) {
    throw blocked('Music/Foley protocol bundle digest does not match the immutable bundle authority.')
  }
  if (bundle.envelope.capabilitySnapshotId !== bundle.capabilitySnapshot.capabilitySnapshotId ||
      bundle.envelope.capabilitySnapshotDigest !== bundle.capabilitySnapshot.evidenceDigest) {
    throw blocked('Music/Foley envelope does not preserve exact capability evidence lineage.')
  }
  if (bundle.attempt.attemptId !== bundle.request.work.attemptId ||
      bundle.attempt.leaseId !== bundle.request.work.leaseId ||
      bundle.cost.attemptId !== bundle.request.work.attemptId ||
      bundle.cost.costBudgetId !== bundle.request.cost.costBudgetId) {
    throw blocked('Music/Foley attempt and cost records do not preserve exact work authority.')
  }
  if (bundle.privateIngest.contentDigest !== sha256CanonicalJson({
    requestDigest: bundle.envelope.requestDigest,
    state: 'no_private_ingest_or_media_bytes',
  })) {
    throw blocked('Music/Foley private-ingest absence digest does not match protocol evidence.')
  }
  if (bundle.qa.gateResults.find((entry) => entry.gate === 'no_auto_selection')?.result !== 'passed' ||
      bundle.qa.gateResults.find((entry) => entry.gate === 'human_review')?.result !== 'not_evaluated') {
    throw blocked('Music/Foley protocol QA must preserve no-auto-selection and missing human-review truth.')
  }
  if (bundle.externalRequestCount !== 0 || bundle.providerCostMicros !== 0 ||
      bundle.mediaBytesCreated || bundle.selectionPerformed ||
      bundle.finalMixMutationPerformed || bundle.timelineMutationPerformed ||
      bundle.candidate.productReady || bundle.review.selectionDecisionCreated) {
    throw blocked('Music/Foley protocol evidence crossed a closed execution, cost, selection, or product gate.')
  }
}

function compileProtocolEnvelope(
  request: MotionStudioMusicFoleyCandidateRequestV1,
  capabilitySnapshot: MotionStudioMusicFoleyCapabilitySnapshotV1,
): MotionStudioMusicFoleyProtocolEnvelopeV1 {
  if (request.intent === 'generated_music_candidate' && capabilitySnapshot.intent === 'generated_music_candidate') {
    return compileMotionStudioGeneratedMusicProtocolRequest({ request, capabilitySnapshot })
  }
  if (request.intent === 'synchronized_foley_candidate' && capabilitySnapshot.intent === 'synchronized_foley_candidate') {
    return compileMotionStudioSynchronizedFoleyProtocolRequest({ request, capabilitySnapshot })
  }
  throw blocked('Music/Foley compiler requires one exact matching request and capability intent.')
}

function gateResult(
  intent: MotionStudioMusicFoleyCandidateRequestV1['intent'],
  gate: MotionStudioMusicFoleyQaGate,
): 'passed' | 'not_evaluated' {
  if (NEVER_EVALUATED.has(gate)) return 'not_evaluated'
  if (intent === 'generated_music_candidate' && gate === 'source_video_binding') return 'not_evaluated'
  if (intent === 'synchronized_foley_candidate' && gate === 'instrumental_and_no_copy') return 'not_evaluated'
  return 'passed'
}

function gateNote(
  intent: MotionStudioMusicFoleyCandidateRequestV1['intent'],
  gate: MotionStudioMusicFoleyQaGate,
): string {
  const result = gateResult(intent, gate)
  if (result === 'passed') {
    return gate === 'no_auto_selection'
      ? 'Protocol candidate remains unselected and cannot enter a final mix.'
      : 'Structured protocol authority passed this non-media validation.'
  }
  if (gate === 'provider_capability') return 'Official provider capability evidence has not been collected.'
  if (gate === 'private_ingest') return 'No private media ingest was performed by this protocol simulator.'
  if (gate === 'media_integrity') return 'No provider media bytes exist for integrity validation.'
  if (gate === 'speech_safety') return 'Speech safety requires review of real private media and mix context.'
  if (gate === 'human_review') return 'Human listening review has not been performed.'
  return intent === 'generated_music_candidate'
    ? 'Source video binding does not apply to this generated music request.'
    : 'Instrumental and no-copy checks do not apply to synchronized Foley.'
}

function ownership(request: MotionStudioMusicFoleyCandidateRequestV1) {
  return {
    workspaceId: request.workspaceId,
    projectId: request.projectId,
    editSessionId: request.editSessionId,
    productionId: request.productionId,
  }
}

function deterministicUuid(inputDigest: string, label: string): string {
  const hex = sha256CanonicalJson({ inputDigest, label }).slice(0, 32).split('')
  hex[12] = '5'
  hex[16] = ((Number.parseInt(hex[16]!, 16) & 0x3) | 0x8).toString(16)
  const value = hex.join('')
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`
}

function parse<T>(
  value: unknown,
  schema: { safeParse(input: unknown): { success: true; data: T } | { success: false; error: { flatten(): unknown } } },
  label: string,
): T {
  const result = schema.safeParse(value)
  if (!result.success) throw new ApiError('VALIDATION_FAILED', `${label} is invalid.`, 400, result.error.flatten())
  return result.data
}

function blocked(message: string): ApiError {
  return new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', message, 409)
}

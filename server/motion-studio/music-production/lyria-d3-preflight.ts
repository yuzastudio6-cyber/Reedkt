import { Buffer } from 'node:buffer'

import { z } from 'zod'

import type { MotionStudioGeneratedMusicCandidateRequestV1 } from '../../../src/types/motion-studio'
import { motionStudioGeneratedMusicCandidateRequestV1Schema } from '../../../src/lib/motion-studio/contracts'
import { ApiError } from '../../errors/api-error'
import { sha256CanonicalJson } from '../commands/canonical-json'
import {
  assertMotionStudioMusicFoleyOfficialDiscoveryEvidence,
  type MotionStudioLyriaOfficialDiscoveryRecordV1,
  motionStudioMusicFoleyOfficialDiscoveryRecordV1Schema,
} from '../audio/music-foley-capability-discovery'

export const MOTION_STUDIO_LYRIA_D3_PREFLIGHT_SCHEMA_VERSION =
  'motion-studio.lyria-d3-preflight-plan.v1' as const
export const MOTION_STUDIO_LYRIA_D3_REQUEST_PREVIEW_SCHEMA_VERSION =
  'motion-studio.lyria-d3-request-preview.v1' as const

export const MOTION_STUDIO_LYRIA_D3_PREFLIGHT_GATE_CODES = [
  'official_capability_current',
  'exact_scope_and_capability_binding',
  'immutable_plan_credit_and_reservation_binding',
  'exact_cue_picture_and_timing_binding',
  'original_instrumental_rights_policy',
  'credential_free_request_preview',
  'one_submission_no_retry_design',
  'exact_transport_time_and_connection_budget',
  'project_model_data_policy',
  'server_owned_secret_binding',
  'credential_presence',
  'provider_account_access_and_funds',
  'exact_local_compute_rate_card',
  'private_ingest_normalization_and_qa',
  'active_lease_and_idempotency_runtime',
  'single_use_execution_authority',
] as const

export type MotionStudioLyriaD3PreflightGateCode =
  (typeof MOTION_STUDIO_LYRIA_D3_PREFLIGHT_GATE_CODES)[number]

const digest = z.string().regex(/^[a-f0-9]{64}$/)
const stableId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => !value.includes('..'))
const isoDate = z.string().datetime({ offset: true })
const safePrompt = z.string().trim().min(1).max(6_000).refine(
  (value) => !hasUnsafeControlCharacter(value) &&
    !/(?:https?:\/\/|file:\/\/|data:|javascript:)/i.test(value),
  { message: 'Lyria request preview cannot contain control characters, URLs, paths or executable URI schemes.' },
)

function hasUnsafeControlCharacter(value: string): boolean {
  return Array.from(value).some((character) => {
    const code = character.charCodeAt(0)
    return (code >= 0 && code <= 8) || code === 11 || code === 12 ||
      (code >= 14 && code <= 31) || code === 127
  })
}

const gateCodeSchema = z.enum(MOTION_STUDIO_LYRIA_D3_PREFLIGHT_GATE_CODES)
const gateSchema = z.object({
  gateCode: gateCodeSchema,
  state: z.enum(['passed_local', 'external_evidence_required']),
  evidenceId: stableId,
  evidenceDigest: digest,
  explanation: z.string().trim().min(1).max(500),
}).strict()

export const motionStudioLyriaD3ProviderRequestBodyV1Schema = z.object({
  model: z.literal('lyria-3-pro-preview'),
  input: safePrompt,
  response_format: z.object({ type: z.literal('audio') }).strict(),
  store: z.literal(false),
}).strict()

export const motionStudioLyriaD3RequestPreviewV1Schema = z.object({
  schemaVersion: z.literal(MOTION_STUDIO_LYRIA_D3_REQUEST_PREVIEW_SCHEMA_VERSION),
  requestPreviewId: stableId,
  sourceMusicRequestId: stableId,
  sourceMusicRequestDigest: digest,
  capabilitySnapshotId: stableId,
  capabilitySnapshotDigest: digest,
  providerOwnerCode: z.literal('google'),
  providerServiceCode: z.literal('gemini_developer_api'),
  endpoint: z.literal('https://generativelanguage.googleapis.com/v1beta/interactions'),
  method: z.literal('POST'),
  credentialHeaderName: z.literal('x-goog-api-key'),
  credentialValueIncluded: z.literal(false),
  contentType: z.literal('application/json'),
  body: motionStudioLyriaD3ProviderRequestBodyV1Schema,
  bodyByteLength: z.number().int().positive().max(16_384),
  expectedResponseContract: z.literal('inline_steps_model_output_audio_base64'),
  requestedAudioFormat: z.literal('wav'),
  providerOutputSampleRateAuthority: z.literal('conflicting_official_claims_probe_required'),
  requestedDurationMilliseconds: z.number().int().positive().max(600_000),
  durationControl: z.literal('prompt_influenced_not_exact'),
  backgroundExecutionAllowed: z.literal(false),
  previousInteractionAllowed: z.literal(false),
  maximumProviderSubmissions: z.literal(1),
  maximumStatusRequests: z.literal(0),
  maximumDownloadRequests: z.literal(0),
  automaticRetryAllowed: z.literal(false),
  automaticFallbackAllowed: z.literal(false),
  externalTransportAllowed: z.literal(false),
  requestPreviewDigest: digest,
  immutable: z.literal(true),
}).strict()

export const motionStudioLyriaD3PreflightPlanV1Schema = z.object({
  schemaVersion: z.literal(MOTION_STUDIO_LYRIA_D3_PREFLIGHT_SCHEMA_VERSION),
  workspaceId: stableId,
  projectId: stableId,
  editSessionId: stableId,
  productionId: stableId,
  preflightPlanId: stableId,
  createdAt: isoDate,
  expiresAt: isoDate,
  state: z.literal('local_preflight_complete_external_evidence_required'),
  sourceMusicRequestId: stableId,
  sourceMusicRequestDigest: digest,
  approvedSnapshotId: stableId,
  approvedSnapshotDigest: digest,
  approvedPlanReviewId: stableId,
  approvedCreditEstimateId: stableId,
  activeNoncommercialTestReservationId: stableId,
  capabilityDiscoveryId: stableId,
  capabilitySnapshotId: stableId,
  capabilitySnapshotDigest: digest,
  capabilityDiscoveryDigest: digest,
  requestPreview: motionStudioLyriaD3RequestPreviewV1Schema,
  timing: z.object({
    fps: z.number().int().positive().max(120),
    startFrame: z.number().int().nonnegative(),
    endFrame: z.number().int().positive(),
    durationFrames: z.number().int().positive(),
    requestedDurationMilliseconds: z.number().int().positive(),
  }).strict(),
  transportBudgetProposal: z.object({
    maximumSecretPayloadReads: z.literal(1),
    maximumProviderSubmissions: z.literal(1),
    maximumNetworkRequests: z.literal(1),
    maximumAddressConnectionAttemptsPerRequest: z.literal(1),
    addressFallbackAllowed: z.literal(false),
    proxyOrPacExecutionAllowed: z.literal(false),
    maximumStatusRequests: z.literal(0),
    maximumDownloadRequests: z.literal(0),
    maximumRedirects: z.literal(0),
    maximumRetries: z.literal(0),
    maximumFallbacks: z.literal(0),
    maximumRequestBodyBytes: z.literal(16_384),
    maximumCapturedResponseBytes: z.number().int().min(8_388_608).max(33_554_432),
    maximumElapsedMilliseconds: z.null(),
  }).strict(),
  costBudgetProposal: z.object({
    currency: z.literal('USD'),
    providerBillingUnit: z.literal('request'),
    maximumAuthorizedProviderCostMicros: z.literal(80_000),
    maximumAuthorizedLocalComputeCostMicros: z.null(),
    maximumAuthorizedTotalInternalCostMicros: z.null(),
    providerRateCardSource: z.literal('official_public_list_price'),
    failedAttemptBilling: z.literal('not_documented'),
    customerPricingIncluded: z.literal(false),
    customerCreditsIncluded: z.literal(false),
    customerBillingAllowed: z.literal(false),
  }).strict(),
  gates: z.array(gateSchema).length(MOTION_STUDIO_LYRIA_D3_PREFLIGHT_GATE_CODES.length).readonly(),
  blockingGateCodes: z.array(gateCodeSchema).min(1).readonly(),
  prohibitedSideEffects: z.object({
    credentialReadCount: z.literal(0),
    externalRequestCount: z.literal(0),
    providerSubmissionCount: z.literal(0),
    providerResponseReceived: z.literal(false),
    mediaBytesCreated: z.literal(0),
    privateArtifactCreated: z.literal(false),
    internalProductionCostMicros: z.literal(0),
    authorityIssued: z.literal(false),
    selectionPerformed: z.literal(false),
    finalMixMutationPerformed: z.literal(false),
    timelineMutationPerformed: z.literal(false),
    renderPerformed: z.literal(false),
    exportPerformed: z.literal(false),
    remoteMutationPerformed: z.literal(false),
  }).strict(),
  privateReviewOnly: z.literal(true),
  providerExecutionAllowed: z.literal(false),
  automaticSelectionAllowed: z.literal(false),
  finalMixAllowed: z.literal(false),
  productReady: z.literal(false),
  immutable: z.literal(true),
  preflightDigest: digest,
}).strict().superRefine((value, context) => {
  if (new Set(value.gates.map((gate) => gate.gateCode)).size !== MOTION_STUDIO_LYRIA_D3_PREFLIGHT_GATE_CODES.length ||
      MOTION_STUDIO_LYRIA_D3_PREFLIGHT_GATE_CODES.some((gateCode) =>
        !value.gates.some((gate) => gate.gateCode === gateCode))) {
    context.addIssue({ code: 'custom', path: ['gates'], message: 'Lyria D3 preflight must classify every gate exactly once.' })
  }
  const expectedBlocking = value.gates.filter((gate) => gate.state === 'external_evidence_required')
    .map((gate) => gate.gateCode)
  if (!sameOrderedValues(expectedBlocking, value.blockingGateCodes)) {
    context.addIssue({ code: 'custom', path: ['blockingGateCodes'], message: 'Lyria D3 blockers must match the unresolved external gates.' })
  }
  if (value.timing.endFrame - value.timing.startFrame !== value.timing.durationFrames ||
      value.timing.requestedDurationMilliseconds !== value.requestPreview.requestedDurationMilliseconds) {
    context.addIssue({ code: 'custom', path: ['timing'], message: 'Lyria D3 timing must preserve the exact request preview duration.' })
  }
})

export type MotionStudioLyriaD3RequestPreviewV1 =
  z.infer<typeof motionStudioLyriaD3RequestPreviewV1Schema>
export type MotionStudioLyriaD3PreflightPlanV1 =
  z.infer<typeof motionStudioLyriaD3PreflightPlanV1Schema>

export function createMotionStudioLyriaD3PreflightPlan(input: {
  request: MotionStudioGeneratedMusicCandidateRequestV1
  discovery: MotionStudioLyriaOfficialDiscoveryRecordV1
  fps: number
  createdAt: string
}): MotionStudioLyriaD3PreflightPlanV1 {
  const request = motionStudioGeneratedMusicCandidateRequestV1Schema.parse(input.request) as
    MotionStudioGeneratedMusicCandidateRequestV1
  const discoveryResult = motionStudioMusicFoleyOfficialDiscoveryRecordV1Schema.parse(input.discovery)
  if (discoveryResult.intent !== 'generated_music_candidate') {
    blocked('Lyria D3 preflight requires the exact generated-music discovery record.')
  }
  const discovery = discoveryResult as MotionStudioLyriaOfficialDiscoveryRecordV1
  assertMotionStudioMusicFoleyOfficialDiscoveryEvidence(discovery)
  const createdAt = exactIso(input.createdAt, 'Lyria D3 preflight creation time')
  if (createdAt < discovery.capturedAt || createdAt >= discovery.expiresAt) {
    blocked('Lyria D3 capability evidence is not current for the requested preflight time.')
  }
  assertExactScope(request, discovery)
  if (request.capabilitySnapshotId !== discovery.capabilitySnapshot.capabilitySnapshotId ||
      request.capabilitySnapshotDigest !== discovery.capabilitySnapshot.evidenceDigest ||
      request.configuredRouteId !== discovery.configuredRouteId) {
    blocked('Lyria D3 request must bind the exact current official capability snapshot.')
  }
  assertProtocolOnlySourceRequest(request)
  if (!Number.isInteger(input.fps) || input.fps < 1 || input.fps > 120) {
    invalid('Lyria D3 timing fps must be an integer between 1 and 120.')
  }

  const durationFrames = request.range.endFrame - request.range.startFrame
  const requestedDurationMilliseconds = Math.round((durationFrames / input.fps) * 1_000)
  const requestDigest = sha256CanonicalJson(request)
  const prompt = compilePrompt(request, requestedDurationMilliseconds)
  const body = motionStudioLyriaD3ProviderRequestBodyV1Schema.parse({
    model: discovery.provider.modelId,
    input: prompt,
    response_format: { type: 'audio' },
    store: false,
  })
  const bodyByteLength = Buffer.byteLength(JSON.stringify(body), 'utf8')
  if (bodyByteLength > 16_384) blocked('Lyria D3 provider request preview exceeds the fixed body-byte ceiling.')
  const previewBase = {
    schemaVersion: MOTION_STUDIO_LYRIA_D3_REQUEST_PREVIEW_SCHEMA_VERSION,
    requestPreviewId: `ms012d3-lyria-preview-${requestDigest.slice(0, 16)}`,
    sourceMusicRequestId: request.musicRequestId,
    sourceMusicRequestDigest: requestDigest,
    capabilitySnapshotId: discovery.capabilitySnapshot.capabilitySnapshotId,
    capabilitySnapshotDigest: discovery.capabilitySnapshot.evidenceDigest,
    providerOwnerCode: discovery.provider.ownerCode,
    providerServiceCode: discovery.provider.serviceCode,
    endpoint: discovery.provider.endpoint,
    method: discovery.provider.method,
    credentialHeaderName: 'x-goog-api-key' as const,
    credentialValueIncluded: false as const,
    contentType: 'application/json' as const,
    body,
    bodyByteLength,
    expectedResponseContract: 'inline_steps_model_output_audio_base64' as const,
    requestedAudioFormat: 'wav' as const,
    providerOutputSampleRateAuthority: 'conflicting_official_claims_probe_required' as const,
    requestedDurationMilliseconds,
    durationControl: 'prompt_influenced_not_exact' as const,
    backgroundExecutionAllowed: false as const,
    previousInteractionAllowed: false as const,
    maximumProviderSubmissions: 1 as const,
    maximumStatusRequests: 0 as const,
    maximumDownloadRequests: 0 as const,
    automaticRetryAllowed: false as const,
    automaticFallbackAllowed: false as const,
    externalTransportAllowed: false as const,
    immutable: true as const,
  }
  const requestPreview = parseAndFreeze({
    ...previewBase,
    requestPreviewDigest: sha256CanonicalJson(previewBase),
  }, motionStudioLyriaD3RequestPreviewV1Schema)
  const gates = createGates({ request, discovery, requestPreview, createdAt })
  const blockingGateCodes = gates.filter((gate) => gate.state === 'external_evidence_required')
    .map((gate) => gate.gateCode)
  const maximumCapturedResponseBytes = responseByteCeiling(requestedDurationMilliseconds)
  const expiresAt = discovery.expiresAt
  const base = {
    schemaVersion: MOTION_STUDIO_LYRIA_D3_PREFLIGHT_SCHEMA_VERSION,
    workspaceId: request.workspaceId,
    projectId: request.projectId,
    editSessionId: request.editSessionId,
    productionId: request.productionId,
    preflightPlanId: `ms012d3-lyria-preflight-${requestDigest.slice(0, 16)}`,
    createdAt,
    expiresAt,
    state: 'local_preflight_complete_external_evidence_required' as const,
    sourceMusicRequestId: request.musicRequestId,
    sourceMusicRequestDigest: requestDigest,
    approvedSnapshotId: request.approval.approvedSnapshotId,
    approvedSnapshotDigest: request.approval.approvedSnapshotDigest,
    approvedPlanReviewId: request.approval.approvedPlanReviewId,
    approvedCreditEstimateId: request.approval.approvedCreditEstimateId,
    activeNoncommercialTestReservationId: request.approval.activeNoncommercialTestReservationId,
    capabilityDiscoveryId: discovery.discoveryId,
    capabilitySnapshotId: discovery.capabilitySnapshot.capabilitySnapshotId,
    capabilitySnapshotDigest: discovery.capabilitySnapshot.evidenceDigest,
    capabilityDiscoveryDigest: discovery.evidenceDigest,
    requestPreview,
    timing: {
      fps: input.fps,
      startFrame: request.range.startFrame,
      endFrame: request.range.endFrame,
      durationFrames,
      requestedDurationMilliseconds,
    },
    transportBudgetProposal: {
      maximumSecretPayloadReads: 1 as const,
      maximumProviderSubmissions: 1 as const,
      maximumNetworkRequests: 1 as const,
      maximumAddressConnectionAttemptsPerRequest: 1 as const,
      addressFallbackAllowed: false as const,
      proxyOrPacExecutionAllowed: false as const,
      maximumStatusRequests: 0 as const,
      maximumDownloadRequests: 0 as const,
      maximumRedirects: 0 as const,
      maximumRetries: 0 as const,
      maximumFallbacks: 0 as const,
      maximumRequestBodyBytes: 16_384 as const,
      maximumCapturedResponseBytes,
      maximumElapsedMilliseconds: null,
    },
    costBudgetProposal: {
      currency: 'USD' as const,
      providerBillingUnit: 'request' as const,
      maximumAuthorizedProviderCostMicros: discovery.pricing.listedProviderCostMicros,
      maximumAuthorizedLocalComputeCostMicros: null,
      maximumAuthorizedTotalInternalCostMicros: null,
      providerRateCardSource: 'official_public_list_price' as const,
      failedAttemptBilling: discovery.pricing.failedAttemptBilling,
      customerPricingIncluded: false as const,
      customerCreditsIncluded: false as const,
      customerBillingAllowed: false as const,
    },
    gates,
    blockingGateCodes,
    prohibitedSideEffects: {
      credentialReadCount: 0 as const,
      externalRequestCount: 0 as const,
      providerSubmissionCount: 0 as const,
      providerResponseReceived: false as const,
      mediaBytesCreated: 0 as const,
      privateArtifactCreated: false as const,
      internalProductionCostMicros: 0 as const,
      authorityIssued: false as const,
      selectionPerformed: false as const,
      finalMixMutationPerformed: false as const,
      timelineMutationPerformed: false as const,
      renderPerformed: false as const,
      exportPerformed: false as const,
      remoteMutationPerformed: false as const,
    },
    privateReviewOnly: true as const,
    providerExecutionAllowed: false as const,
    automaticSelectionAllowed: false as const,
    finalMixAllowed: false as const,
    productReady: false as const,
    immutable: true as const,
  }
  return parseAndFreeze({ ...base, preflightDigest: sha256CanonicalJson(base) },
    motionStudioLyriaD3PreflightPlanV1Schema)
}

export function assertMotionStudioLyriaD3PreflightPlan(
  input: MotionStudioLyriaD3PreflightPlanV1,
): void {
  const plan = motionStudioLyriaD3PreflightPlanV1Schema.parse(input)
  const previewBase = { ...plan.requestPreview } as Record<string, unknown>
  delete previewBase.requestPreviewDigest
  if (sha256CanonicalJson(previewBase) !== plan.requestPreview.requestPreviewDigest) {
    blocked('Lyria D3 request preview failed immutable digest verification.')
  }
  const base = { ...plan } as Record<string, unknown>
  delete base.preflightDigest
  if (sha256CanonicalJson(base) !== plan.preflightDigest) {
    blocked('Lyria D3 preflight plan failed immutable digest verification.')
  }
  if (plan.providerExecutionAllowed || plan.prohibitedSideEffects.authorityIssued ||
      plan.prohibitedSideEffects.credentialReadCount !== 0 ||
      plan.prohibitedSideEffects.externalRequestCount !== 0 ||
      plan.prohibitedSideEffects.providerSubmissionCount !== 0 ||
      plan.prohibitedSideEffects.mediaBytesCreated !== 0 ||
      plan.prohibitedSideEffects.internalProductionCostMicros !== 0) {
    blocked('Local Lyria D3 preflight crossed a credential, transport, media, cost or authority gate.')
  }
}

function createGates(input: {
  request: MotionStudioGeneratedMusicCandidateRequestV1
  discovery: MotionStudioLyriaOfficialDiscoveryRecordV1
  requestPreview: MotionStudioLyriaD3RequestPreviewV1
  createdAt: string
}): readonly z.infer<typeof gateSchema>[] {
  const passed: readonly [MotionStudioLyriaD3PreflightGateCode, string][] = [
    ['official_capability_current', input.discovery.evidenceDigest],
    ['exact_scope_and_capability_binding', input.discovery.capabilitySnapshot.evidenceDigest],
    ['immutable_plan_credit_and_reservation_binding', input.request.approval.approvedSnapshotDigest],
    ['exact_cue_picture_and_timing_binding', input.request.timingAuthorityDigest],
    ['original_instrumental_rights_policy', sha256CanonicalJson({
      rights: input.request.rightsEvidenceIds, direction: input.request.direction,
    })],
    ['credential_free_request_preview', input.requestPreview.requestPreviewDigest],
    ['one_submission_no_retry_design', sha256CanonicalJson({
      submissionMaximum: 1, statusMaximum: 0, downloadMaximum: 0, retry: false, fallback: false,
    })],
  ]
  const passedMap = new Map(passed)
  return deepFreeze(MOTION_STUDIO_LYRIA_D3_PREFLIGHT_GATE_CODES.map((gateCode) => {
    const passedDigest = passedMap.get(gateCode)
    const state = passedDigest ? 'passed_local' as const : 'external_evidence_required' as const
    const evidenceId = passedDigest
      ? `ms012d3-local-${gateCode}`
      : `ms012d3-pending-${gateCode}`
    return gateSchema.parse({
      gateCode,
      state,
      evidenceId,
      evidenceDigest: passedDigest ?? sha256CanonicalJson({ gateCode, state, createdAt: input.createdAt }),
      explanation: passedDigest
        ? localGateExplanation(gateCode)
        : `External preflight evidence is required for ${gateCode.replaceAll('_', ' ')}.`,
    })
  }))
}

function compilePrompt(
  request: MotionStudioGeneratedMusicCandidateRequestV1,
  requestedDurationMilliseconds: number,
): string {
  const seconds = (requestedDurationMilliseconds / 1_000).toFixed(3)
  return [
    'Create one original instrumental underscore for a professional Storytelling scene.',
    `Target duration: approximately ${seconds} seconds. Duration is a creative target, not permission to change picture timing.`,
    `Narrative purpose: ${request.direction.narrativePurpose}`,
    `Emotional direction: ${request.direction.emotionalDirection}`,
    `Mood: ${request.direction.mood.join(', ')}.`,
    `Instrumentation: ${request.direction.instrumentation.join(', ')}.`,
    `Energy arc: ${request.direction.energyArc.join(' -> ')}.`,
    `Ending: ${request.direction.endingBehavior.replaceAll('_', ' ')} with a clean editable tail.`,
    `Speech policy: ${request.direction.speechSafety.replaceAll('_', ' ')}; keep the midrange restrained for narration.`,
    'Instrumental only. No vocals, no spoken words, no lyrics and no lyric-like vocalizations.',
    'Compose new material. Do not imitate an artist, song, recording, melody, copyrighted theme or reference audio.',
    `Do-not-copy constraints: ${request.direction.doNotCopy.join('; ')}.`,
    'Return one coherent candidate suitable for private review. Do not add claims, dialogue or sound effects.',
  ].join('\n')
}

function responseByteCeiling(requestedDurationMilliseconds: number): number {
  const durationSeconds = requestedDurationMilliseconds / 1_000
  const estimatedPcmBytes = Math.ceil(durationSeconds * 48_000 * 2 * 2)
  const estimatedBase64Bytes = Math.ceil(estimatedPcmBytes / 3) * 4
  const doubledWithJsonHeadroom = (estimatedBase64Bytes * 2) + 1_048_576
  return Math.min(33_554_432, Math.max(8_388_608, Math.ceil(doubledWithJsonHeadroom)))
}

function assertExactScope(
  request: MotionStudioGeneratedMusicCandidateRequestV1,
  discovery: MotionStudioLyriaOfficialDiscoveryRecordV1,
): void {
  if (request.workspaceId !== discovery.capabilitySnapshot.workspaceId ||
      request.projectId !== discovery.capabilitySnapshot.projectId ||
      request.editSessionId !== discovery.capabilitySnapshot.editSessionId ||
      request.productionId !== discovery.capabilitySnapshot.productionId) {
    blocked('Lyria D3 request and official discovery must share exact tenant and production scope.')
  }
}

function assertProtocolOnlySourceRequest(request: MotionStudioGeneratedMusicCandidateRequestV1): void {
  const cost = request.cost
  const boundary = request.executionBoundary
  if (cost.maximumAuthorizedProviderCostMicros !== 0 ||
      cost.maximumAuthorizedLocalComputeCostMicros !== 0 ||
      cost.maximumAuthorizedTotalInternalCostMicros !== 0 ||
      !boundary.protocolSimulatorOnly || boundary.externalTransportAllowed ||
      boundary.providerExecutionAllowed || boundary.providerSubmissionMaximum !== 0 ||
      boundary.privateIngestExecutionAllowed || boundary.selectionAllowed ||
      boundary.finalMixAllowed || boundary.timelineMutationAllowed || boundary.renderAllowed ||
      boundary.exportAllowed || boundary.productReady) {
    blocked('Lyria D3 local preflight accepts a zero-authority source request only.')
  }
}

function localGateExplanation(gateCode: MotionStudioLyriaD3PreflightGateCode): string {
  const explanations: Partial<Record<MotionStudioLyriaD3PreflightGateCode, string>> = {
    official_capability_current: 'Official Lyria capability evidence is current and digest-valid.',
    exact_scope_and_capability_binding: 'The request binds the exact tenant, production and capability snapshot.',
    immutable_plan_credit_and_reservation_binding: 'The source request preserves the locked plan, estimate and noncommercial reservation references.',
    exact_cue_picture_and_timing_binding: 'The source request preserves exact cue, picture and frame authority.',
    original_instrumental_rights_policy: 'The request is instrumental-only, original-material-only and rights-evidence-bound.',
    credential_free_request_preview: 'The current Interactions request is compiled without a credential value.',
    one_submission_no_retry_design: 'The proposed route permits one synchronous submission and no status, download, retry or fallback request.',
  }
  return explanations[gateCode] ?? 'External evidence remains required.'
}

function exactIso(value: string, label: string): string {
  const parsed = new Date(value)
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== value) invalid(`${label} must be canonical ISO-8601.`)
  return value
}

function parseAndFreeze<T>(value: unknown, schema: z.ZodType<T>): T {
  return deepFreeze(schema.parse(value))
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child)
    Object.freeze(value)
  }
  return value
}

function sameOrderedValues(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index])
}

function invalid(message: string): never {
  throw new ApiError('VALIDATION_FAILED', message, 400)
}

function blocked(message: string): never {
  throw new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', message, 409)
}

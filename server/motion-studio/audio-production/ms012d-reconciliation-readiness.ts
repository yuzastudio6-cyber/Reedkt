import { z } from 'zod'

import { ApiError } from '../../errors/api-error'
import {
  readPrivateFileIfExistsWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
} from '../../security/private-local-persistence'
import { stableAuthorityStringify } from '../../services/private-edit-authority-store'
import { sha256CanonicalJson } from '../commands/canonical-json'
import {
  assertMotionStudioSynchronizedFoleyReviewReadiness,
  motionStudioSynchronizedFoleyReviewReadinessV1Schema,
  type MotionStudioSynchronizedFoleyReviewReadinessV1,
} from '../foley-production'
import {
  assertMotionStudioLyriaD3ReviewReadiness,
  motionStudioLyriaD3ReviewReadinessV1Schema,
  type MotionStudioLyriaD3ReviewReadinessV1,
} from '../music-production'

export const MOTION_STUDIO_MS012D_RECONCILIATION_READINESS_SCHEMA_VERSION =
  'motion-studio.ms012d-reconciliation-readiness.v1' as const

const digestSchema = z.string().regex(/^[a-f0-9]{64}$/u)
const stableIdSchema = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const isoDateSchema = z.string().datetime({ offset: true })

const reconciliationGateCodeSchema = z.enum([
  'exact_scope_and_role_binding',
  'music_actual_candidate_and_reviews',
  'foley_provider_route_candidate_and_reviews',
  'attempt_cost_and_unknown_outcome_reconciliation',
  'private_asset_integrity_and_versioning',
  'ms012e_selection_and_mix_handoff',
])
const reconciliationGateStateSchema = z.enum([
  'passed_local',
  'actual_evidence_required',
  'future_child_required',
])

const RECONCILIATION_GATES = Object.freeze([
  {
    gateCode: 'exact_scope_and_role_binding',
    state: 'passed_local',
    blockingForMs012d: false,
    explanation: 'The exact tenant, production, music request/cue, Foley request/event, picture/timing lineage, and role separation are bound.',
  },
  {
    gateCode: 'music_actual_candidate_and_reviews',
    state: 'actual_evidence_required',
    blockingForMs012d: true,
    explanation: 'One authorized private music candidate plus all six exact actual-candidate review gates remain required.',
  },
  {
    gateCode: 'foley_provider_route_candidate_and_reviews',
    state: 'actual_evidence_required',
    blockingForMs012d: true,
    explanation: 'Exact synchronized-Foley provider facts, one authorized private candidate, and all five exact reviews remain required.',
  },
  {
    gateCode: 'attempt_cost_and_unknown_outcome_reconciliation',
    state: 'actual_evidence_required',
    blockingForMs012d: true,
    explanation: 'Every provider and worker attempt, failed or unknown outcome, provider usage, and internal infrastructure cost must reconcile immutably.',
  },
  {
    gateCode: 'private_asset_integrity_and_versioning',
    state: 'actual_evidence_required',
    blockingForMs012d: true,
    explanation: 'Actual original and normalized candidate versions, checksums, private readback, provenance, and replacement history remain required.',
  },
  {
    gateCode: 'ms012e_selection_and_mix_handoff',
    state: 'future_child_required',
    blockingForMs012d: false,
    explanation: 'Selection and integrated mixing belong only to MS-012E after an accepted MS-012D verdict.',
  },
] as const)

const gateSchema = z.object({
  gateCode: reconciliationGateCodeSchema,
  state: reconciliationGateStateSchema,
  blockingForMs012d: z.boolean(),
  explanation: z.string().trim().min(20).max(600),
  evidenceDigest: digestSchema,
}).strict()

const childReviewContractSchema = z.object({
  reviewReadinessId: stableIdSchema,
  reviewReadinessDigest: digestSchema,
  sourceRequestId: stableIdSchema,
  sourceRequestDigest: digestSchema,
  sourcePurposeId: stableIdSchema,
  sourcePictureOrVideoDigest: digestSchema,
  timingAuthorityDigest: digestSchema,
  expectedReviewGateCount: z.number().int().min(5).max(6),
  reviewGateDigests: z.array(digestSchema).min(5).max(6).readonly(),
  actualProviderCandidatePresent: z.literal(false),
  readyForHumanReview: z.literal(false),
  readyForSelectionDecision: z.literal(false),
}).strict()

export const motionStudioMs012dReconciliationReadinessV1Schema = z.object({
  schemaVersion: z.literal(MOTION_STUDIO_MS012D_RECONCILIATION_READINESS_SCHEMA_VERSION),
  reconciliationReadinessId: stableIdSchema,
  workspaceId: stableIdSchema,
  projectId: stableIdSchema,
  editSessionId: stableIdSchema,
  productionId: stableIdSchema,
  state: z.literal('reconciliation_framework_ready_actual_candidates_and_reviews_absent'),
  createdAt: isoDateSchema,
  music: childReviewContractSchema.extend({
    role: z.literal('generated_instrumental_score_candidate'),
    expectedReviewGateCount: z.literal(6),
    reviewGateDigests: z.array(digestSchema).length(6).readonly(),
  }).strict(),
  synchronizedFoley: childReviewContractSchema.extend({
    role: z.literal('synchronized_visible_action_or_environment_candidate'),
    expectedReviewGateCount: z.literal(5),
    reviewGateDigests: z.array(digestSchema).length(5).readonly(),
  }).strict(),
  sharedAuthority: z.object({
    pictureLockContentDigest: digestSchema,
    timingAuthorityDigest: digestSchema,
    exactPictureLockShared: z.literal(true),
    exactTimingAuthorityShared: z.literal(true),
  }).strict(),
  roleBoundary: z.object({
    narrationRemainsSeparate: z.literal(true),
    musicMayNotBecomeFoleyAmbienceDialogueOrNarration: z.literal(true),
    foleyMayNotBecomeMusicDialogueNarrationOrExactSfx: z.literal(true),
    exactSfxRole: z.literal('licensed_or_user_owned_only'),
    providerNativeAudioMasterEligible: z.literal(false),
    crossRoleSubstitutionAllowed: z.literal(false),
  }).strict(),
  gates: z.array(gateSchema).length(RECONCILIATION_GATES.length).readonly(),
  blockingGateCodes: z.array(reconciliationGateCodeSchema).length(4).readonly(),
  readiness: z.object({
    musicReviewContractReady: z.literal(true),
    synchronizedFoleyReviewContractReady: z.literal(true),
    actualCandidateSetComplete: z.literal(false),
    actualReviewSetComplete: z.literal(false),
    actualAttemptCostSetComplete: z.literal(false),
    unknownOutcomesReconciled: z.literal(false),
    privateCandidateAssetSetComplete: z.literal(false),
    ms012dAccepted: z.literal(false),
    eligibleForMs012e: z.literal(false),
    productReady: z.literal(false),
  }).strict(),
  selectionBoundary: z.object({
    selectionAllowedInMs012d: z.literal(false),
    musicSelected: z.literal(false),
    synchronizedFoleySelected: z.literal(false),
    automaticSelectionAllowed: z.literal(false),
    firstOrOnlyCandidateAutoAccepted: z.literal(false),
    finalMixEligible: z.literal(false),
    timelineEligible: z.literal(false),
  }).strict(),
  costBoundary: z.object({
    providerUsageEvidenceRequiredPerAttempt: z.literal(true),
    providerAndInfrastructureCostSeparated: z.literal(true),
    failedAndUnknownAttemptCostRetained: z.literal(true),
    customerPricingIncluded: z.literal(false),
    customerCreditsIncluded: z.literal(false),
    serviceFeeIncluded: z.literal(false),
    walletOrBillingMutationAllowed: z.literal(false),
  }).strict(),
  persistence: z.object({
    privateLocalOnly: z.literal(true),
    createOnly: z.literal(true),
    evidenceRecordPersisted: z.literal(true),
    localPathProjected: z.literal(false),
    evidenceObjectIdentityHash: digestSchema,
  }).strict(),
  sideEffects: z.object({
    externalRequestCount: z.literal(0),
    secretPayloadReadCount: z.literal(0),
    providerSubmissionCount: z.literal(0),
    providerCandidateCount: z.literal(0),
    reviewDecisionCount: z.literal(0),
    costMutationPerformed: z.literal(false),
    selectionPerformed: z.literal(false),
    finalMixMutationPerformed: z.literal(false),
    timelineMutationPerformed: z.literal(false),
    renderPerformed: z.literal(false),
    exportPerformed: z.literal(false),
    remoteMutationPerformed: z.literal(false),
  }).strict(),
  immutable: z.literal(true),
  recordDigest: digestSchema,
}).strict().superRefine((value, context) => {
  const gateCodes = value.gates.map((entry) => entry.gateCode)
  const expectedCodes = RECONCILIATION_GATES.map((entry) => entry.gateCode)
  if (gateCodes.join('|') !== expectedCodes.join('|') || new Set(gateCodes).size !== expectedCodes.length) {
    context.addIssue({
      code: 'custom',
      path: ['gates'],
      message: 'MS-012D reconciliation readiness must preserve every gate in canonical order.',
    })
  }
  for (const [index, expected] of RECONCILIATION_GATES.entries()) {
    const actual = value.gates[index]
    if (
      !actual || actual.gateCode !== expected.gateCode || actual.state !== expected.state ||
      actual.blockingForMs012d !== expected.blockingForMs012d ||
      actual.explanation !== expected.explanation ||
      actual.evidenceDigest !== sha256CanonicalJson({
        musicReviewReadinessDigest: value.music.reviewReadinessDigest,
        synchronizedFoleyReviewReadinessDigest: value.synchronizedFoley.reviewReadinessDigest,
        gateCode: expected.gateCode,
        state: expected.state,
        blockingForMs012d: expected.blockingForMs012d,
        explanation: expected.explanation,
      })
    ) {
      context.addIssue({
        code: 'custom',
        path: ['gates', index],
        message: 'MS-012D reconciliation gate does not match the frozen source evidence contract.',
      })
    }
  }
  const expectedBlocking = value.gates.filter((entry) => entry.blockingForMs012d)
    .map((entry) => entry.gateCode)
  if (value.blockingGateCodes.join('|') !== expectedBlocking.join('|')) {
    context.addIssue({
      code: 'custom',
      path: ['blockingGateCodes'],
      message: 'MS-012D reconciliation blockers must match the exact blocking gate set.',
    })
  }
  const gatesDigest = sha256CanonicalJson(value.gates)
  const expectedIdentity = sha256CanonicalJson({
    domain: 'motion_studio_ms012d_reconciliation_readiness_v1',
    musicReviewReadinessDigest: value.music.reviewReadinessDigest,
    synchronizedFoleyReviewReadinessDigest: value.synchronizedFoley.reviewReadinessDigest,
    sharedAuthorityDigest: sha256CanonicalJson(value.sharedAuthority),
    gatesDigest,
  })
  if (
    value.persistence.evidenceObjectIdentityHash !== expectedIdentity ||
    value.reconciliationReadinessId !== `ms012d-reconciliation-${expectedIdentity.slice(0, 32)}`
  ) {
    context.addIssue({
      code: 'custom',
      path: ['persistence', 'evidenceObjectIdentityHash'],
      message: 'MS-012D reconciliation identity must derive from both exact review contracts and the gate set.',
    })
  }
})

export type MotionStudioMs012dReconciliationReadinessV1 =
  z.infer<typeof motionStudioMs012dReconciliationReadinessV1Schema>

export async function proveMotionStudioMs012dReconciliationReadiness(input: {
  musicReviewReadiness: MotionStudioLyriaD3ReviewReadinessV1
  synchronizedFoleyReviewReadiness: MotionStudioSynchronizedFoleyReviewReadinessV1
  localStorageRoot: string
  createdAt: string
}): Promise<MotionStudioMs012dReconciliationReadinessV1> {
  assertMotionStudioLyriaD3ReviewReadiness(input.musicReviewReadiness)
  assertMotionStudioSynchronizedFoleyReviewReadiness(input.synchronizedFoleyReviewReadiness)
  const music = motionStudioLyriaD3ReviewReadinessV1Schema.parse(input.musicReviewReadiness)
  const foley = motionStudioSynchronizedFoleyReviewReadinessV1Schema.parse(
    input.synchronizedFoleyReviewReadiness,
  )
  if (!/^\/tmp\/reeditpro-motion-studio-ms012d-reconciliation-[A-Za-z0-9._-]+$/u.test(input.localStorageRoot)) {
    invalid('MS-012D reconciliation readiness requires its bounded private local root.')
  }
  const createdAt = exactIso(input.createdAt)
  if (Date.parse(createdAt) < Math.max(Date.parse(music.createdAt), Date.parse(foley.createdAt))) {
    invalid('MS-012D reconciliation readiness cannot predate either source review contract.')
  }
  assertSameScope(music, foley)
  if (
    music.readiness.actualProviderCandidatePresent || music.readiness.readyForHumanReview ||
    music.readiness.readyForSelectionDecision || music.selection.selected ||
    foley.readiness.actualProviderCandidatePresent || foley.readiness.readyForHumanReview ||
    foley.readiness.readyForSelectionDecision || foley.selection.selected
  ) blocked('MS-012D readiness requires the exact still-unresolved D3 and D4 review-intake records.')

  const musicReviewGateDigests = music.reviewRequirements.map((entry) => entry.evidenceDigest)
  const foleyReviewGateDigests = foley.reviewRequirements.map((entry) => entry.evidenceDigest)
  const musicSource = {
    role: 'generated_instrumental_score_candidate' as const,
    reviewReadinessId: music.reviewReadinessId,
    reviewReadinessDigest: music.recordDigest,
    sourceRequestId: music.sourceMusicRequestId,
    sourceRequestDigest: music.sourceMusicRequestDigest,
    sourcePurposeId: music.sourceCueId,
    sourcePictureOrVideoDigest: music.pictureLockContentDigest,
    timingAuthorityDigest: music.timingAuthorityDigest,
    expectedReviewGateCount: 6 as const,
    reviewGateDigests: musicReviewGateDigests,
    actualProviderCandidatePresent: false as const,
    readyForHumanReview: false as const,
    readyForSelectionDecision: false as const,
  }
  const foleySource = {
    role: 'synchronized_visible_action_or_environment_candidate' as const,
    reviewReadinessId: foley.reviewReadinessId,
    reviewReadinessDigest: foley.recordDigest,
    sourceRequestId: foley.sourceRequestId,
    sourceRequestDigest: foley.sourceRequestDigest,
    sourcePurposeId: foley.sourceSoundEventId,
    sourcePictureOrVideoDigest: foley.sourceVideoContentDigest,
    timingAuthorityDigest: foley.timingAuthorityDigest,
    expectedReviewGateCount: 5 as const,
    reviewGateDigests: foleyReviewGateDigests,
    actualProviderCandidatePresent: false as const,
    readyForHumanReview: false as const,
    readyForSelectionDecision: false as const,
  }
  const sharedAuthority = {
    pictureLockContentDigest: music.pictureLockContentDigest,
    timingAuthorityDigest: music.timingAuthorityDigest,
    exactPictureLockShared: true as const,
    exactTimingAuthorityShared: true as const,
  }
  const gates = RECONCILIATION_GATES.map((gate) => ({
    ...gate,
    evidenceDigest: sha256CanonicalJson({
      musicReviewReadinessDigest: music.recordDigest,
      synchronizedFoleyReviewReadinessDigest: foley.recordDigest,
      gateCode: gate.gateCode,
      state: gate.state,
      blockingForMs012d: gate.blockingForMs012d,
      explanation: gate.explanation,
    }),
  }))
  const blockingGateCodes = gates.filter((entry) => entry.blockingForMs012d)
    .map((entry) => entry.gateCode)
  const gatesDigest = sha256CanonicalJson(gates)
  const evidenceObjectIdentityHash = sha256CanonicalJson({
    domain: 'motion_studio_ms012d_reconciliation_readiness_v1',
    musicReviewReadinessDigest: music.recordDigest,
    synchronizedFoleyReviewReadinessDigest: foley.recordDigest,
    sharedAuthorityDigest: sha256CanonicalJson(sharedAuthority),
    gatesDigest,
  })
  const base = {
    schemaVersion: MOTION_STUDIO_MS012D_RECONCILIATION_READINESS_SCHEMA_VERSION,
    reconciliationReadinessId: `ms012d-reconciliation-${evidenceObjectIdentityHash.slice(0, 32)}`,
    workspaceId: music.workspaceId,
    projectId: music.projectId,
    editSessionId: music.editSessionId,
    productionId: music.productionId,
    state: 'reconciliation_framework_ready_actual_candidates_and_reviews_absent' as const,
    createdAt,
    music: musicSource,
    synchronizedFoley: foleySource,
    sharedAuthority,
    roleBoundary: {
      narrationRemainsSeparate: true as const,
      musicMayNotBecomeFoleyAmbienceDialogueOrNarration: true as const,
      foleyMayNotBecomeMusicDialogueNarrationOrExactSfx: true as const,
      exactSfxRole: 'licensed_or_user_owned_only' as const,
      providerNativeAudioMasterEligible: false as const,
      crossRoleSubstitutionAllowed: false as const,
    },
    gates,
    blockingGateCodes,
    readiness: {
      musicReviewContractReady: true as const,
      synchronizedFoleyReviewContractReady: true as const,
      actualCandidateSetComplete: false as const,
      actualReviewSetComplete: false as const,
      actualAttemptCostSetComplete: false as const,
      unknownOutcomesReconciled: false as const,
      privateCandidateAssetSetComplete: false as const,
      ms012dAccepted: false as const,
      eligibleForMs012e: false as const,
      productReady: false as const,
    },
    selectionBoundary: {
      selectionAllowedInMs012d: false as const,
      musicSelected: false as const,
      synchronizedFoleySelected: false as const,
      automaticSelectionAllowed: false as const,
      firstOrOnlyCandidateAutoAccepted: false as const,
      finalMixEligible: false as const,
      timelineEligible: false as const,
    },
    costBoundary: {
      providerUsageEvidenceRequiredPerAttempt: true as const,
      providerAndInfrastructureCostSeparated: true as const,
      failedAndUnknownAttemptCostRetained: true as const,
      customerPricingIncluded: false as const,
      customerCreditsIncluded: false as const,
      serviceFeeIncluded: false as const,
      walletOrBillingMutationAllowed: false as const,
    },
    persistence: {
      privateLocalOnly: true as const,
      createOnly: true as const,
      evidenceRecordPersisted: true as const,
      localPathProjected: false as const,
      evidenceObjectIdentityHash,
    },
    sideEffects: {
      externalRequestCount: 0 as const,
      secretPayloadReadCount: 0 as const,
      providerSubmissionCount: 0 as const,
      providerCandidateCount: 0 as const,
      reviewDecisionCount: 0 as const,
      costMutationPerformed: false as const,
      selectionPerformed: false as const,
      finalMixMutationPerformed: false as const,
      timelineMutationPerformed: false as const,
      renderPerformed: false as const,
      exportPerformed: false as const,
      remoteMutationPerformed: false as const,
    },
    immutable: true as const,
  }
  const record = deepFreeze(motionStudioMs012dReconciliationReadinessV1Schema.parse({
    ...base,
    recordDigest: sha256CanonicalJson(base),
  }))
  await persistReconciliationReadiness(input.localStorageRoot, record)
  return record
}

export function assertMotionStudioMs012dReconciliationReadiness(
  input: MotionStudioMs012dReconciliationReadinessV1,
): void {
  const parsed = motionStudioMs012dReconciliationReadinessV1Schema.parse(input)
  const base = { ...parsed } as Record<string, unknown>
  delete base.recordDigest
  if (
    sha256CanonicalJson(base) !== parsed.recordDigest || parsed.blockingGateCodes.length !== 4 ||
    parsed.readiness.actualCandidateSetComplete || parsed.readiness.actualReviewSetComplete ||
    parsed.readiness.actualAttemptCostSetComplete || parsed.readiness.unknownOutcomesReconciled ||
    parsed.readiness.privateCandidateAssetSetComplete || parsed.readiness.ms012dAccepted ||
    parsed.readiness.eligibleForMs012e || parsed.readiness.productReady ||
    parsed.selectionBoundary.selectionAllowedInMs012d || parsed.selectionBoundary.musicSelected ||
    parsed.selectionBoundary.synchronizedFoleySelected ||
    parsed.selectionBoundary.automaticSelectionAllowed ||
    parsed.selectionBoundary.firstOrOnlyCandidateAutoAccepted ||
    parsed.selectionBoundary.finalMixEligible || parsed.selectionBoundary.timelineEligible ||
    parsed.sideEffects.externalRequestCount !== 0 || parsed.sideEffects.secretPayloadReadCount !== 0 ||
    parsed.sideEffects.providerSubmissionCount !== 0 || parsed.sideEffects.providerCandidateCount !== 0 ||
    parsed.sideEffects.reviewDecisionCount !== 0 || parsed.sideEffects.costMutationPerformed ||
    parsed.sideEffects.selectionPerformed || parsed.sideEffects.finalMixMutationPerformed ||
    parsed.sideEffects.timelineMutationPerformed || parsed.sideEffects.renderPerformed ||
    parsed.sideEffects.exportPerformed || parsed.sideEffects.remoteMutationPerformed
  ) blocked('MS-012D reconciliation readiness crossed an immutable evidence, acceptance, selection, or execution boundary.')
}

function assertSameScope(
  music: MotionStudioLyriaD3ReviewReadinessV1,
  foley: MotionStudioSynchronizedFoleyReviewReadinessV1,
): void {
  if (
    music.workspaceId !== foley.workspaceId || music.projectId !== foley.projectId ||
    music.editSessionId !== foley.editSessionId || music.productionId !== foley.productionId
  ) blocked('MS-012D reconciliation requires exact shared tenant, project, edit, and production scope.')
  if (
    music.pictureLockContentDigest !== foley.pictureLockContentDigest ||
    music.timingAuthorityDigest !== foley.timingAuthorityDigest
  ) blocked('MS-012D reconciliation requires the exact shared picture lock and timing authority.')
}

async function persistReconciliationReadiness(
  localStorageRoot: string,
  record: MotionStudioMs012dReconciliationReadinessV1,
): Promise<void> {
  const identity = record.persistence.evidenceObjectIdentityHash
  const relativePath = `motion-studio/ms012d-reconciliation-readiness/${identity.slice(0, 2)}/${identity}.json`
  const bytes = Buffer.from(`${stableAuthorityStringify(record)}\n`, 'utf8')
  await writePrivateFileCreateOnlyWithinRoot({ rootPath: localStorageRoot, relativePath, content: bytes })
  const stored = await readPrivateFileIfExistsWithinRoot({ rootPath: localStorageRoot, relativePath })
  if (!stored || !stored.equals(bytes)) {
    blocked('MS-012D reconciliation readiness changed after private create-only persistence.')
  }
}

function exactIso(value: string): string {
  const parsed = new Date(value)
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== value) {
    invalid('MS-012D reconciliation readiness time must be canonical ISO-8601.')
  }
  return value
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child)
    Object.freeze(value)
  }
  return value
}

function invalid(message: string): never {
  throw new ApiError('VALIDATION_FAILED', message, 400)
}

function blocked(message: string): never {
  throw new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', message, 409, {
    requiredGate: 'motion_studio_ms012d_reconciliation_readiness',
  })
}

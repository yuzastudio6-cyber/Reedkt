import {
  readPrivateFileIfExistsWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
} from '../../security/private-local-persistence'
import { ApiError } from '../../errors/api-error'
import { sha256CanonicalJson } from '../commands/canonical-json'
import type {
  MotionStudioSpeechSyntheticAcceptanceReconciliationGate,
} from './synthetic-acceptance-reconciliation'
import {
  assertMotionStudioSpeechSyntheticListeningReviewForPreparation,
  type MotionStudioSpeechSyntheticListeningReviewPreparation,
  type MotionStudioSpeechSyntheticListeningReviewV1,
} from './synthetic-listening-review'

const SHA256 = /^[a-f0-9]{64}$/u
const STABLE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const MAXIMUM_RECORD_BYTES = 256 * 1024
const RECORD_FILENAME = 'synthetic-acceptance-c3-reconciliation.json' as const

const TECHNICAL_GATES = Object.freeze([
  'tracked_result_integrity',
  'private_storage_integrity',
  'single_use_authority_integrity',
  'provider_evidence_integrity',
  'source_audio_integrity',
  'source_decode_and_normalization',
  'normalized_format',
  'non_silent',
  'sample_clipping',
  'alignment_exact_text',
  'alignment_monotonic',
  'alignment_timing_fit',
  'provider_cost_evidence',
  'privacy_boundary',
  'replay_boundary',
] as const satisfies readonly MotionStudioSpeechSyntheticAcceptanceReconciliationGate[])

const EFFECTIVE_GATE_ORDER = Object.freeze([
  ...TECHNICAL_GATES,
  'independent_transcription',
  'meaning_fidelity',
  'pronunciation',
  'human_listening',
  'voice_continuity',
  'loudness',
  'production_zero_retention',
  'production_account_preflight',
  'local_compute_cost_reconciliation',
] as const satisfies readonly MotionStudioSpeechSyntheticC3EffectiveGate[])

export type MotionStudioSpeechSyntheticC3EffectiveGate =
  | MotionStudioSpeechSyntheticAcceptanceReconciliationGate
  | 'loudness'

export interface MotionStudioSpeechSyntheticC3ReconciliationV1 {
  schemaVersion: 'motion-studio.speech-synthetic-c3-reconciliation.v1'
  state:
    | 'human_review_passed_cost_and_production_gates_open_not_selection_eligible'
    | 'human_review_rejected_take'
  evidenceClass: 'owner_delegated_private_synthetic_review_reconciliation'
  authorizationId: string
  syntheticTechnicalReconciliationDigest: string
  independentTranscriptResultDigest: string
  listeningReviewRecordDigest: string
  normalizedAudio: {
    sha256: string
    byteLength: number
    durationMilliseconds: number
    privateOnly: true
    browserProjectionAllowed: false
  }
  effectiveQa: {
    results: readonly {
      gate: MotionStudioSpeechSyntheticC3EffectiveGate
      source:
        | 'synthetic_technical_reconciliation'
        | 'independent_transcript'
        | 'private_human_listening'
        | 'production_promotion_gate'
      result: 'passed' | 'failed' | 'not_evaluated'
      blocksTakeSelection: boolean
      blocksProductionReadiness: boolean
      evidenceDigest: string
    }[]
    passedCount: number
    failedCount: number
    notEvaluatedCount: number
    candidateHumanQaPassed: boolean
    productionMultiTakeContinuityProven: false
    effectiveQaDigest: string
  }
  cost: {
    currency: 'USD'
    providerCharacterCostCredits: number
    providerCharacterCostMicrocredits: number
    publicListProviderCostMicros: number
    providerUsagePreserved: true
    exactAccountInvoiceClaimed: false
    localComputeCostState: 'not_reconciled_no_infrastructure_cpu_meter'
    localComputeCostMicros: null
    totalInternalProductionCostReconciled: false
    customerPricingIncluded: false
    customerCreditsIncluded: false
    serviceFeeIncluded: false
    billingMutationPerformed: false
  }
  selection: {
    eligibleForExplicitSelection: false
    selectionDecisionCreated: false
    selected: false
    firstTakeAutoAccepted: false
    finalAssetEligible: false
    finalNarrationMutationPerformed: false
    timelineMutationPerformed: false
  }
  readiness: {
    privateTechnicalEvidenceReady: true
    independentSemanticEvidenceReady: true
    privateHumanReviewEvidenceReady: true
    pronunciationHumanReviewComplete: true
    performanceHumanReviewComplete: true
    costEvidenceComplete: false
    productionPromotionEvidenceComplete: false
    c3ProviderEvidenceComplete: false
    ms012cAccepted: false
    productReady: false
    externalBetaReady: false
    productionReady: false
    finalDeliveryReady: false
  }
  persistence: {
    privateLocalOnly: true
    createOnly: true
    filename: typeof RECORD_FILENAME
  }
  createdAt: string
  immutable: true
  recordDigest: string
}

export function compileMotionStudioSpeechSyntheticC3Reconciliation(input: {
  preparation: MotionStudioSpeechSyntheticListeningReviewPreparation
  listeningReview: MotionStudioSpeechSyntheticListeningReviewV1
}): MotionStudioSpeechSyntheticC3ReconciliationV1 {
  const review = assertMotionStudioSpeechSyntheticListeningReviewForPreparation({
    preparation: input.preparation,
    record: input.listeningReview,
  })
  const reconciliation = input.preparation.reconciliation
  const technicalByGate = new Map(reconciliation.qa.results.map((result) => [result.gate, result]))
  const results: MotionStudioSpeechSyntheticC3ReconciliationV1['effectiveQa']['results'][number][] = []

  for (const gate of TECHNICAL_GATES) {
    const source = technicalByGate.get(gate)
    if (!source || source.result !== 'passed') {
      blocked(`Synthetic C3 reconciliation lost accepted technical gate ${gate}.`)
    }
    results.push({
      gate,
      source: 'synthetic_technical_reconciliation',
      result: 'passed',
      blocksTakeSelection: false,
      blocksProductionReadiness: false,
      evidenceDigest: sha256CanonicalJson({
        reconciliationEvidenceDigest: reconciliation.evidenceDigest,
        gate,
        evidenceId: source.evidenceId,
        result: source.result,
      }),
    })
  }

  results.push({
    gate: 'independent_transcription',
    source: 'independent_transcript',
    result: 'passed',
    blocksTakeSelection: false,
    blocksProductionReadiness: false,
    evidenceDigest: input.preparation.independentTranscriptResultDigest,
  })

  const humanByGate = new Map(review.review.results.map((result) => [result.gate, result]))
  for (const gate of ['meaning_fidelity', 'pronunciation', 'voice_continuity', 'loudness'] as const) {
    const source = humanByGate.get(gate)
    if (!source) blocked(`Synthetic C3 reconciliation lost human listening gate ${gate}.`)
    results.push({
      gate,
      source: 'private_human_listening',
      result: source.result,
      blocksTakeSelection: source.result === 'failed',
      blocksProductionReadiness: source.result === 'failed',
      evidenceDigest: sha256CanonicalJson({
        listeningReviewRecordDigest: review.recordDigest,
        reviewDigest: review.review.reviewDigest,
        gate,
        result: source.result,
        note: source.note,
      }),
    })
    if (gate === 'pronunciation') {
      results.push({
        gate: 'human_listening',
        source: 'private_human_listening',
        result: 'passed',
        blocksTakeSelection: false,
        blocksProductionReadiness: false,
        evidenceDigest: sha256CanonicalJson({
          listeningReviewRecordDigest: review.recordDigest,
          playbackEvidenceDigest: review.playback.playbackEvidenceDigest,
          humanAttestationAccepted: true,
        }),
      })
    }
  }

  for (const gate of [
    'production_zero_retention',
    'production_account_preflight',
    'local_compute_cost_reconciliation',
  ] as const) {
    const source = technicalByGate.get(gate)
    if (!source || source.result !== 'not_evaluated') {
      blocked(`Synthetic C3 reconciliation cannot promote production gate ${gate}.`)
    }
    results.push({
      gate,
      source: 'production_promotion_gate',
      result: 'not_evaluated',
      blocksTakeSelection: gate === 'local_compute_cost_reconciliation',
      blocksProductionReadiness: true,
      evidenceDigest: sha256CanonicalJson({
        reconciliationEvidenceDigest: reconciliation.evidenceDigest,
        gate,
        evidenceId: source.evidenceId,
        result: source.result,
      }),
    })
  }

  const passedCount = results.filter((result) => result.result === 'passed').length
  const failedCount = results.filter((result) => result.result === 'failed').length
  const notEvaluatedCount = results.filter((result) => result.result === 'not_evaluated').length
  const candidateHumanQaPassed = review.review.decision === 'pass_for_selection_review' && failedCount === 0
  const effectiveQaBase = {
    results,
    passedCount,
    failedCount,
    notEvaluatedCount,
    candidateHumanQaPassed,
    productionMultiTakeContinuityProven: false as const,
  }
  const effectiveQaDigest = sha256CanonicalJson(effectiveQaBase)
  const base: Omit<MotionStudioSpeechSyntheticC3ReconciliationV1, 'recordDigest'> = {
    schemaVersion: 'motion-studio.speech-synthetic-c3-reconciliation.v1',
    state: candidateHumanQaPassed
      ? 'human_review_passed_cost_and_production_gates_open_not_selection_eligible'
      : 'human_review_rejected_take',
    evidenceClass: 'owner_delegated_private_synthetic_review_reconciliation',
    authorizationId: reconciliation.authorizationId,
    syntheticTechnicalReconciliationDigest: reconciliation.evidenceDigest,
    independentTranscriptResultDigest: input.preparation.independentTranscriptResultDigest,
    listeningReviewRecordDigest: review.recordDigest,
    normalizedAudio: {
      sha256: reconciliation.normalizedArtifact.sha256,
      byteLength: reconciliation.normalizedArtifact.byteLength,
      durationMilliseconds: reconciliation.normalizedArtifact.durationMilliseconds,
      privateOnly: true,
      browserProjectionAllowed: false,
    },
    effectiveQa: { ...effectiveQaBase, effectiveQaDigest },
    cost: {
      currency: 'USD',
      providerCharacterCostCredits: reconciliation.cost.providerCharacterCostCredits,
      providerCharacterCostMicrocredits: reconciliation.cost.providerCharacterCostMicrocredits,
      publicListProviderCostMicros: reconciliation.cost.publicListProviderCostMicros,
      providerUsagePreserved: true,
      exactAccountInvoiceClaimed: false,
      localComputeCostState: 'not_reconciled_no_infrastructure_cpu_meter',
      localComputeCostMicros: null,
      totalInternalProductionCostReconciled: false,
      customerPricingIncluded: false,
      customerCreditsIncluded: false,
      serviceFeeIncluded: false,
      billingMutationPerformed: false,
    },
    selection: {
      eligibleForExplicitSelection: false,
      selectionDecisionCreated: false,
      selected: false,
      firstTakeAutoAccepted: false,
      finalAssetEligible: false,
      finalNarrationMutationPerformed: false,
      timelineMutationPerformed: false,
    },
    readiness: {
      privateTechnicalEvidenceReady: true,
      independentSemanticEvidenceReady: true,
      privateHumanReviewEvidenceReady: true,
      pronunciationHumanReviewComplete: true,
      performanceHumanReviewComplete: true,
      costEvidenceComplete: false,
      productionPromotionEvidenceComplete: false,
      c3ProviderEvidenceComplete: false,
      ms012cAccepted: false,
      productReady: false,
      externalBetaReady: false,
      productionReady: false,
      finalDeliveryReady: false,
    },
    persistence: {
      privateLocalOnly: true,
      createOnly: true,
      filename: RECORD_FILENAME,
    },
    createdAt: review.review.reviewedAt,
    immutable: true,
  }
  return deepFreeze({ ...base, recordDigest: sha256CanonicalJson(base) })
}

export async function reconcileMotionStudioSpeechSyntheticC3(input: {
  preparation: MotionStudioSpeechSyntheticListeningReviewPreparation
}): Promise<MotionStudioSpeechSyntheticC3ReconciliationV1> {
  if (!input.preparation.existingReview) {
    blocked('Synthetic C3 reconciliation requires the persisted private human listening review.')
  }
  const expected = compileMotionStudioSpeechSyntheticC3Reconciliation({
    preparation: input.preparation,
    listeningReview: input.preparation.existingReview,
  })
  const existing = await readMotionStudioSpeechSyntheticC3Reconciliation({
    privateRunRoot: input.preparation.privateRunRoot,
  })
  if (existing) {
    if (existing.recordDigest !== expected.recordDigest) {
      blocked('Synthetic C3 reconciliation conflicts with immutable existing evidence.')
    }
    return existing
  }
  await writePrivateFileCreateOnlyWithinRoot({
    rootPath: input.preparation.privateRunRoot,
    relativePath: RECORD_FILENAME,
    content: Buffer.from(`${JSON.stringify(expected, null, 2)}\n`, 'utf8'),
  })
  const stored = await readMotionStudioSpeechSyntheticC3Reconciliation({
    privateRunRoot: input.preparation.privateRunRoot,
  })
  if (!stored || stored.recordDigest !== expected.recordDigest) {
    blocked('Synthetic C3 reconciliation changed during create-only private persistence.')
  }
  return stored
}

export async function readMotionStudioSpeechSyntheticC3Reconciliation(input: {
  privateRunRoot: string
}): Promise<MotionStudioSpeechSyntheticC3ReconciliationV1 | undefined> {
  const bytes = await readPrivateFileIfExistsWithinRoot({
    rootPath: input.privateRunRoot,
    relativePath: RECORD_FILENAME,
  })
  if (!bytes) return undefined
  if (bytes.byteLength < 256 || bytes.byteLength > MAXIMUM_RECORD_BYTES) {
    blocked('Synthetic C3 reconciliation is outside its private evidence byte bound.')
  }
  let parsed: unknown
  try { parsed = JSON.parse(bytes.toString('utf8')) as unknown } catch {
    blocked('Synthetic C3 reconciliation is not valid JSON.')
  }
  const record = validateRecord(parsed)
  return deepFreeze(record)
}

function validateRecord(value: unknown): MotionStudioSpeechSyntheticC3ReconciliationV1 {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    blocked('Synthetic C3 reconciliation shape is invalid.')
  }
  const record = value as MotionStudioSpeechSyntheticC3ReconciliationV1
  assertExactKeys(record as unknown as Record<string, unknown>, [
    'authorizationId', 'cost', 'createdAt', 'effectiveQa', 'evidenceClass', 'immutable',
    'independentTranscriptResultDigest', 'listeningReviewRecordDigest', 'normalizedAudio',
    'persistence', 'readiness', 'recordDigest', 'schemaVersion', 'selection', 'state',
    'syntheticTechnicalReconciliationDigest',
  ], 'Synthetic C3 reconciliation')
  for (const [label, nested] of [
    ['normalized audio', record.normalizedAudio], ['effective QA', record.effectiveQa],
    ['cost', record.cost], ['selection', record.selection], ['readiness', record.readiness],
    ['persistence', record.persistence],
  ] as const) {
    if (!nested || typeof nested !== 'object' || Array.isArray(nested)) {
      blocked(`Synthetic C3 reconciliation ${label} shape is invalid.`)
    }
  }
  assertExactKeys(record.normalizedAudio as unknown as Record<string, unknown>, [
    'browserProjectionAllowed', 'byteLength', 'durationMilliseconds', 'privateOnly', 'sha256',
  ], 'Synthetic C3 normalized audio')
  assertExactKeys(record.effectiveQa as unknown as Record<string, unknown>, [
    'candidateHumanQaPassed', 'effectiveQaDigest', 'failedCount', 'notEvaluatedCount',
    'passedCount', 'productionMultiTakeContinuityProven', 'results',
  ], 'Synthetic C3 effective QA')
  assertExactKeys(record.cost as unknown as Record<string, unknown>, [
    'billingMutationPerformed', 'currency', 'customerCreditsIncluded',
    'customerPricingIncluded', 'exactAccountInvoiceClaimed', 'localComputeCostMicros',
    'localComputeCostState', 'providerCharacterCostCredits',
    'providerCharacterCostMicrocredits', 'providerUsagePreserved', 'publicListProviderCostMicros',
    'serviceFeeIncluded', 'totalInternalProductionCostReconciled',
  ], 'Synthetic C3 cost')
  assertExactKeys(record.selection as unknown as Record<string, unknown>, [
    'eligibleForExplicitSelection', 'finalAssetEligible', 'finalNarrationMutationPerformed',
    'firstTakeAutoAccepted', 'selected', 'selectionDecisionCreated', 'timelineMutationPerformed',
  ], 'Synthetic C3 selection')
  assertExactKeys(record.readiness as unknown as Record<string, unknown>, [
    'c3ProviderEvidenceComplete', 'costEvidenceComplete', 'externalBetaReady',
    'finalDeliveryReady', 'independentSemanticEvidenceReady', 'ms012cAccepted',
    'performanceHumanReviewComplete', 'privateHumanReviewEvidenceReady',
    'privateTechnicalEvidenceReady', 'productReady', 'productionPromotionEvidenceComplete',
    'productionReady', 'pronunciationHumanReviewComplete',
  ], 'Synthetic C3 readiness')
  assertExactKeys(record.persistence as unknown as Record<string, unknown>, [
    'createOnly', 'filename', 'privateLocalOnly',
  ], 'Synthetic C3 persistence')
  const { recordDigest, ...base } = record
  if (
    record.schemaVersion !== 'motion-studio.speech-synthetic-c3-reconciliation.v1' ||
    ![
      'human_review_passed_cost_and_production_gates_open_not_selection_eligible',
      'human_review_rejected_take',
    ].includes(record.state) ||
    record.evidenceClass !== 'owner_delegated_private_synthetic_review_reconciliation' ||
    !STABLE_ID.test(record.authorizationId) ||
    !SHA256.test(recordDigest) || sha256CanonicalJson(base) !== recordDigest ||
    !SHA256.test(record.syntheticTechnicalReconciliationDigest) ||
    !SHA256.test(record.independentTranscriptResultDigest) ||
    !SHA256.test(record.listeningReviewRecordDigest) ||
    record.normalizedAudio?.privateOnly !== true ||
    record.normalizedAudio.browserProjectionAllowed !== false ||
    !SHA256.test(record.normalizedAudio.sha256) ||
    !Number.isSafeInteger(record.normalizedAudio.byteLength) || record.normalizedAudio.byteLength < 44 ||
    !Number.isSafeInteger(record.normalizedAudio.durationMilliseconds) ||
    record.normalizedAudio.durationMilliseconds < 100 || record.normalizedAudio.durationMilliseconds > 30_000 ||
    record.cost?.currency !== 'USD' ||
    !Number.isSafeInteger(record.cost.providerCharacterCostCredits) ||
    record.cost.providerCharacterCostCredits < 0 ||
    !Number.isSafeInteger(record.cost.providerCharacterCostMicrocredits) ||
    record.cost.providerCharacterCostMicrocredits !== record.cost.providerCharacterCostCredits * 1_000_000 ||
    !Number.isSafeInteger(record.cost.publicListProviderCostMicros) ||
    record.cost.publicListProviderCostMicros < 0 || record.cost.providerUsagePreserved !== true ||
    record.cost.exactAccountInvoiceClaimed !== false ||
    record.cost?.localComputeCostState !== 'not_reconciled_no_infrastructure_cpu_meter' ||
    record.cost.localComputeCostMicros !== null ||
    record.cost.totalInternalProductionCostReconciled !== false ||
    record.cost.customerPricingIncluded !== false || record.cost.customerCreditsIncluded !== false ||
    record.cost.serviceFeeIncluded !== false || record.cost.billingMutationPerformed !== false ||
    record.selection?.eligibleForExplicitSelection !== false ||
    Object.values(record.selection).some((item) => item !== false) ||
    record.readiness?.privateTechnicalEvidenceReady !== true ||
    record.readiness.independentSemanticEvidenceReady !== true ||
    record.readiness.privateHumanReviewEvidenceReady !== true ||
    record.readiness.pronunciationHumanReviewComplete !== true ||
    record.readiness.performanceHumanReviewComplete !== true ||
    record.readiness.costEvidenceComplete !== false ||
    record.readiness.productionPromotionEvidenceComplete !== false ||
    record.readiness.c3ProviderEvidenceComplete !== false ||
    record.readiness.ms012cAccepted !== false || record.readiness.productReady !== false ||
    record.readiness.externalBetaReady !== false || record.readiness.productionReady !== false ||
    record.readiness.finalDeliveryReady !== false ||
    record.persistence?.privateLocalOnly !== true || record.persistence.createOnly !== true ||
    record.persistence.filename !== RECORD_FILENAME || record.immutable !== true ||
    exactIso(record.createdAt) !== record.createdAt
  ) blocked('Synthetic C3 reconciliation contains invalid authority or readiness state.')
  if (!Array.isArray(record.effectiveQa?.results) ||
    record.effectiveQa.results.length !== EFFECTIVE_GATE_ORDER.length) {
    blocked('Synthetic C3 reconciliation effective QA matrix is incomplete.')
  }
  record.effectiveQa.results.forEach((result, index) => {
    if (!result || typeof result !== 'object' || Array.isArray(result)) {
      blocked('Synthetic C3 reconciliation effective QA result shape is invalid.')
    }
    assertExactKeys(result as unknown as Record<string, unknown>, [
      'blocksProductionReadiness', 'blocksTakeSelection', 'evidenceDigest',
      'gate', 'result', 'source',
    ], `Synthetic C3 effective QA result ${index}`)
    if (
      result.gate !== EFFECTIVE_GATE_ORDER[index] ||
      ![
        'synthetic_technical_reconciliation', 'independent_transcript',
        'private_human_listening', 'production_promotion_gate',
      ].includes(result.source) ||
      !['passed', 'failed', 'not_evaluated'].includes(result.result) ||
      typeof result.blocksTakeSelection !== 'boolean' ||
      typeof result.blocksProductionReadiness !== 'boolean' ||
      !SHA256.test(result.evidenceDigest)
    ) blocked('Synthetic C3 reconciliation effective QA result is invalid or out of order.')
    assertGateSemantics(result)
  })
  const passedCount = record.effectiveQa.results.filter((result) => result.result === 'passed').length
  const failedCount = record.effectiveQa.results.filter((result) => result.result === 'failed').length
  const notEvaluatedCount = record.effectiveQa.results.filter((result) => result.result === 'not_evaluated').length
  const { effectiveQaDigest, ...qaBase } = record.effectiveQa
  if (
    record.effectiveQa.passedCount !== passedCount || record.effectiveQa.failedCount !== failedCount ||
    record.effectiveQa.notEvaluatedCount !== notEvaluatedCount ||
    record.effectiveQa.candidateHumanQaPassed !== (failedCount === 0) ||
    notEvaluatedCount !== 3 ||
    record.effectiveQa.productionMultiTakeContinuityProven !== false ||
    effectiveQaDigest !== sha256CanonicalJson(qaBase) ||
    record.state !== (failedCount === 0
      ? 'human_review_passed_cost_and_production_gates_open_not_selection_eligible'
      : 'human_review_rejected_take')
  ) blocked('Synthetic C3 reconciliation state does not match its effective QA evidence.')
  return record
}

function assertGateSemantics(
  result: MotionStudioSpeechSyntheticC3ReconciliationV1['effectiveQa']['results'][number],
): void {
  if (TECHNICAL_GATES.some((gate) => gate === result.gate)) {
    if (
      result.source !== 'synthetic_technical_reconciliation' ||
      result.result !== 'passed' ||
      result.blocksTakeSelection ||
      result.blocksProductionReadiness
    ) blocked('Synthetic C3 reconciliation changed a fixed technical gate outcome.')
    return
  }
  if (result.gate === 'independent_transcription') {
    if (
      result.source !== 'independent_transcript' ||
      result.result !== 'passed' ||
      result.blocksTakeSelection ||
      result.blocksProductionReadiness
    ) blocked('Synthetic C3 reconciliation changed independent transcript evidence.')
    return
  }
  if (result.gate === 'human_listening') {
    if (
      result.source !== 'private_human_listening' ||
      result.result !== 'passed' ||
      result.blocksTakeSelection ||
      result.blocksProductionReadiness
    ) blocked('Synthetic C3 reconciliation changed completed playback attestation evidence.')
    return
  }
  if (
    ['meaning_fidelity', 'pronunciation', 'voice_continuity', 'loudness'].includes(result.gate)
  ) {
    if (
      result.source !== 'private_human_listening' ||
      !['passed', 'failed'].includes(result.result) ||
      result.blocksTakeSelection !== (result.result === 'failed') ||
      result.blocksProductionReadiness !== (result.result === 'failed')
    ) blocked('Synthetic C3 reconciliation changed a human listening gate outcome.')
    return
  }
  if (
    ['production_zero_retention', 'production_account_preflight',
      'local_compute_cost_reconciliation'].includes(result.gate)
  ) {
    if (
      result.source !== 'production_promotion_gate' ||
      result.result !== 'not_evaluated' ||
      result.blocksTakeSelection !== (result.gate === 'local_compute_cost_reconciliation') ||
      !result.blocksProductionReadiness
    ) blocked('Synthetic C3 reconciliation promoted an unevaluated production gate.')
    return
  }
  blocked('Synthetic C3 reconciliation contains an unknown effective gate.')
}

function exactIso(value: string): string {
  const milliseconds = Date.parse(value)
  if (!Number.isFinite(milliseconds) || new Date(milliseconds).toISOString() !== value) {
    blocked('Synthetic C3 reconciliation timestamp is invalid.')
  }
  return value
}

function assertExactKeys(value: Record<string, unknown>, expected: readonly string[], label: string): void {
  const actual = Object.keys(value).sort()
  const required = [...expected].sort()
  if (actual.length !== required.length || actual.some((key, index) => key !== required[index])) {
    blocked(`${label} contains missing or unknown fields.`)
  }
}

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value
  if (Array.isArray(value)) value.forEach(deepFreeze)
  else Object.values(value as Record<string, unknown>).forEach(deepFreeze)
  return Object.freeze(value)
}

function blocked(message: string): never {
  throw new ApiError('JOB_DEPENDENCY_NOT_READY', message, 409, {
    requiredGate: 'motion_studio_speech_synthetic_c3_reconciliation',
  })
}

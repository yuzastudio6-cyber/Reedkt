import type {
  PreferenceEvidenceCategory,
  PreferenceSkillRunRecord,
  PreferenceSkillRunResultState,
  PreferenceSkillRunRetryReasonCode,
} from '../../src/types/edit-reference'

export const EDIT_REFERENCE_SEMANTIC_STUDY_REQUEST_VERSION = 'edit-reference-semantic-study-request-v1' as const
export const EDIT_REFERENCE_SEMANTIC_STUDY_RESULT_VERSION = 'edit-reference-semantic-study-result-v1' as const
export const EDIT_REFERENCE_SKILL_RESULT_CONTRACT_VERSION = 'edit-reference-skill-result-v1' as const
export const EDIT_REFERENCE_VISUAL_INTELLIGENCE_SKILL_ID =
  'visual_intelligence.reference_preference_analysis' as const
export const EDIT_REFERENCE_VISUAL_INTELLIGENCE_BRIDGE_ID =
  'visual_intelligence_orchestra_report_bridge' as const

export const EDIT_REFERENCE_SEMANTIC_SPECIALISTS = [
  {
    specialistId: 'visual_language',
    skillId: EDIT_REFERENCE_VISUAL_INTELLIGENCE_SKILL_ID,
    evidenceCategory: 'visual_language',
    unavailableReason: 'Semantic reference understanding requires an exact Orchestra Visual Intelligence result using the reference_preference_dna profile.',
  },
  {
    specialistId: 'story_editorial',
    skillId: 'edit_reference.story_editorial.qwen_reasoning',
    evidenceCategory: 'story_and_pacing',
    unavailableReason: 'Story and editorial understanding requires approved transcript, semantic-scene, or bounded reasoning evidence; technical change-point candidates are not semantic scenes.',
  },
  {
    specialistId: 'speech_pacing',
    skillId: 'edit_reference.speech_pacing.evidence',
    evidenceCategory: 'story_and_pacing',
    unavailableReason: 'Speech and pause analysis requires an approved transcript or alignment result.',
  },
  {
    specialistId: 'caption_design',
    skillId: 'edit_reference.caption_design.evidence',
    evidenceCategory: 'captions',
    unavailableReason: 'Caption analysis requires OCR or transcript timing evidence; neither runtime ran.',
  },
  {
    specialistId: 'color_treatment',
    skillId: 'edit_reference.color_treatment.evidence',
    evidenceCategory: 'color',
    unavailableReason: 'Technical luma, saturation, and stream color metadata may be measured separately, but creative palette, skin tone, shot matching, LUT, and target-grade analysis require semantic color evidence that did not run.',
  },
  {
    specialistId: 'audio_sound_design',
    skillId: 'edit_reference.audio_sound_design.evidence',
    evidenceCategory: 'audio_and_sfx',
    unavailableReason: 'Technical loudness and bounded low-level amplitude intervals may be measured separately, but speech pauses, breathing room, music role, tempo, energy, SFX, ambience, speech meaning, and SoundSync analysis require semantic audio evidence that did not run.',
  },
  {
    specialistId: 'graphics_motion',
    skillId: 'edit_reference.graphics_motion.evidence',
    evidenceCategory: 'graphics',
    unavailableReason: 'Bounded adjacent-frame differences may be measured separately, but graphics and motion understanding requires semantic frame or scene evidence from an approved specialist runtime.',
  },
] as const satisfies ReadonlyArray<{
  specialistId: string
  skillId: string
  evidenceCategory: PreferenceEvidenceCategory
  unavailableReason: string
}>

export type EditReferenceSemanticSpecialistDefinition = typeof EDIT_REFERENCE_SEMANTIC_SPECIALISTS[number]
export type EditReferenceSemanticSpecialistId = EditReferenceSemanticSpecialistDefinition['specialistId']

export interface EditReferenceSemanticStudyRequest {
  requestVersion: typeof EDIT_REFERENCE_SEMANTIC_STUDY_REQUEST_VERSION
  workspaceId: string
  editReferenceId: string
  studySessionId: string
  orchestrationId: string
  specialistId: EditReferenceSemanticSpecialistId
  skillId: EditReferenceSemanticSpecialistDefinition['skillId']
  inputEvidenceIds: string[]
  analysisArtifactIds: string[]
  evidenceDigestSha256: string
}

export interface EditReferenceSemanticStudyExecutionEvidence {
  providerCallMade: boolean
  modelCallMade: boolean
  fileBytesRead: boolean
  externalUrlFetched: false
  mediaProcessingStarted: boolean
  workerJobCreated: boolean
}

export interface EditReferenceSemanticStudyResult {
  resultVersion: typeof EDIT_REFERENCE_SEMANTIC_STUDY_RESULT_VERSION
  specialistId: EditReferenceSemanticSpecialistId
  skillId: EditReferenceSemanticSpecialistDefinition['skillId']
  status: Extract<PreferenceSkillRunRecord['status'], 'completed' | 'failed' | 'blocked'>
  resultState: PreferenceSkillRunResultState
  runtimeSource: PreferenceSkillRunRecord['runtimeSource']
  readinessAtRun: PreferenceSkillRunRecord['readinessAtRun']
  fallbackUsed: boolean
  inputEvidenceIds: string[]
  analysisArtifactIds: string[]
  toolIds: string[]
  summary: string
  confidence: number
  warnings: string[]
  blockedReasons: string[]
  retryAvailable: boolean
  retryReasonCode?: PreferenceSkillRunRetryReasonCode
  providerId?: string
  modelId?: string
  usageEventIds?: string[]
  internalCostRecordIds?: string[]
  execution: EditReferenceSemanticStudyExecutionEvidence
}

export interface EditReferenceSemanticStudyAdapter {
  readonly adapterId: string
  readonly supportedSpecialists: readonly EditReferenceSemanticSpecialistId[]
  analyze(request: EditReferenceSemanticStudyRequest): Promise<EditReferenceSemanticStudyResult>
}

const SAFE_ID = /^[A-Za-z0-9._:-]{1,240}$/
const SHA256 = /^[a-f0-9]{64}$/
const RESULT_STATES = new Set<PreferenceSkillRunResultState>([
  'analyzed',
  'manual_evidence',
  'fallback',
  'blocked',
  'needs_more_evidence',
])
const RETRY_REASON_CODES = new Set<PreferenceSkillRunRetryReasonCode>([
  'rerun_same_inputs',
  'reconnect_source_then_retry',
  'add_evidence_then_retry',
  'runtime_recovery_then_retry',
])
const FORBIDDEN_RESULT_KEYS = new Set([
  'apiKey',
  'api_key',
  'authorization',
  'bytes',
  'filePath',
  'file_path',
  'localPath',
  'local_path',
  'password',
  'payload',
  'rawPayload',
  'rawProviderPayload',
  'secret',
  'signedUrl',
  'signed_url',
  'token',
  'url',
])

export class EditReferenceSemanticStudyContractError extends Error {
  readonly code: string

  constructor(code: string) {
    super(`Edit Reference semantic-study contract rejected: ${code}`)
    this.name = 'EditReferenceSemanticStudyContractError'
    this.code = code
  }
}

export function assertEditReferenceSemanticStudyRequest(
  value: unknown,
): asserts value is EditReferenceSemanticStudyRequest {
  assertNoForbiddenFields(value)
  if (!isRecord(value)) throw contractError('request_not_object')
  if (value.requestVersion !== EDIT_REFERENCE_SEMANTIC_STUDY_REQUEST_VERSION) throw contractError('request_version_invalid')
  assertSafeId(value.workspaceId, 'workspace_id_invalid')
  assertSafeId(value.editReferenceId, 'edit_reference_id_invalid')
  assertSafeId(value.studySessionId, 'study_session_id_invalid')
  assertSafeId(value.orchestrationId, 'orchestration_id_invalid')
  assertSpecialistPair(value.specialistId, value.skillId)
  assertSafeIdArray(value.inputEvidenceIds, 'input_evidence_ids_invalid')
  assertSafeIdArray(value.analysisArtifactIds, 'analysis_artifact_ids_invalid')
  if (typeof value.evidenceDigestSha256 !== 'string' || !SHA256.test(value.evidenceDigestSha256)) {
    throw contractError('evidence_digest_invalid')
  }
}

export function assertEditReferenceSemanticStudyResult(
  value: unknown,
): asserts value is EditReferenceSemanticStudyResult {
  assertNoForbiddenFields(value)
  if (!isRecord(value)) throw contractError('result_not_object')
  if (value.resultVersion !== EDIT_REFERENCE_SEMANTIC_STUDY_RESULT_VERSION) throw contractError('result_version_invalid')
  assertSpecialistPair(value.specialistId, value.skillId)
  if (!['completed', 'failed', 'blocked'].includes(asString(value.status))) throw contractError('status_invalid')
  if (!RESULT_STATES.has(value.resultState as PreferenceSkillRunResultState)) throw contractError('result_state_invalid')
  if (!['not_started', 'verified_mock', 'verified_local', 'verified_live', 'fallback'].includes(asString(value.runtimeSource))) {
    throw contractError('runtime_source_invalid')
  }
  if (!['verified_live', 'verified_local', 'verified_mock', 'degraded', 'blocked', 'not_implemented'].includes(asString(value.readinessAtRun))) {
    throw contractError('readiness_invalid')
  }
  if (typeof value.fallbackUsed !== 'boolean') throw contractError('fallback_flag_invalid')
  assertSafeIdArray(value.inputEvidenceIds, 'input_evidence_ids_invalid')
  assertSafeIdArray(value.analysisArtifactIds, 'analysis_artifact_ids_invalid')
  assertSafeIdArray(value.toolIds, 'tool_ids_invalid')
  assertBoundedText(value.summary, 4_000, 'summary_invalid')
  if (typeof value.confidence !== 'number' || !Number.isFinite(value.confidence) || value.confidence < 0 || value.confidence > 1) {
    throw contractError('confidence_invalid')
  }
  assertTextArray(value.warnings, 'warnings_invalid')
  assertTextArray(value.blockedReasons, 'blocked_reasons_invalid')
  if (typeof value.retryAvailable !== 'boolean') throw contractError('retry_flag_invalid')
  if (value.retryAvailable) {
    if (!RETRY_REASON_CODES.has(value.retryReasonCode as PreferenceSkillRunRetryReasonCode)) throw contractError('retry_reason_required')
  } else if (value.retryReasonCode !== undefined) {
    throw contractError('retry_reason_without_retry')
  }
  if (value.providerId !== undefined) assertSafeId(value.providerId, 'provider_id_invalid')
  if (value.modelId !== undefined) assertSafeId(value.modelId, 'model_id_invalid')
  if (value.usageEventIds !== undefined) assertSafeIdArray(value.usageEventIds, 'usage_event_ids_invalid')
  if (value.internalCostRecordIds !== undefined) assertSafeIdArray(value.internalCostRecordIds, 'cost_record_ids_invalid')
  assertExecution(value.execution)
  assertStateConsistency(value as unknown as EditReferenceSemanticStudyResult)
}

function assertStateConsistency(value: EditReferenceSemanticStudyResult): void {
  const executionMade = value.execution.providerCallMade
    || value.execution.modelCallMade
    || value.execution.fileBytesRead
    || value.execution.mediaProcessingStarted
    || value.execution.workerJobCreated
  if (value.resultState === 'analyzed') {
    if (value.status !== 'completed' || value.fallbackUsed || !['verified_local', 'verified_live'].includes(value.runtimeSource)) {
      throw contractError('analyzed_state_without_completed_runtime')
    }
    if (!executionMade || value.confidence <= 0) throw contractError('analyzed_state_without_execution_evidence')
  }
  if (value.runtimeSource === 'verified_live') {
    if (!value.execution.providerCallMade || !value.execution.modelCallMade || !value.providerId || !value.modelId) {
      throw contractError('live_runtime_without_provider_model_proof')
    }
  } else if (value.runtimeSource === 'verified_local') {
    if (value.execution.providerCallMade || value.providerId) {
      throw contractError('non_live_runtime_with_provider_model_claim')
    }
    if (value.execution.modelCallMade !== Boolean(value.modelId)) {
      throw contractError('local_runtime_model_proof_mismatch')
    }
  } else if (value.execution.providerCallMade || value.execution.modelCallMade || value.providerId || value.modelId) {
    throw contractError('non_live_runtime_with_provider_model_claim')
  }
  if (value.runtimeSource === 'verified_local' && !value.execution.fileBytesRead && !value.execution.mediaProcessingStarted) {
    throw contractError('local_runtime_without_file_or_media_execution')
  }
  if (value.resultState === 'manual_evidence' || value.resultState === 'fallback') {
    if (value.status !== 'completed' || value.runtimeSource !== 'fallback' || !value.fallbackUsed || executionMade) {
      throw contractError('fallback_state_with_execution_claim')
    }
  }
  if (value.resultState === 'blocked' || value.resultState === 'needs_more_evidence') {
    if (!['blocked', 'failed'].includes(value.status) || value.blockedReasons.length === 0) {
      throw contractError('blocked_state_without_reason')
    }
  } else if (value.blockedReasons.length > 0) {
    throw contractError('completed_state_with_blocked_reason')
  }
  if (value.retryAvailable && !['blocked', 'needs_more_evidence'].includes(value.resultState)) {
    throw contractError('retry_not_tied_to_unresolved_state')
  }
}

function assertExecution(value: unknown): asserts value is EditReferenceSemanticStudyExecutionEvidence {
  if (!isRecord(value)) throw contractError('execution_evidence_invalid')
  for (const key of ['providerCallMade', 'modelCallMade', 'fileBytesRead', 'mediaProcessingStarted', 'workerJobCreated'] as const) {
    if (typeof value[key] !== 'boolean') throw contractError('execution_evidence_invalid')
  }
  if (value.externalUrlFetched !== false) throw contractError('external_url_fetch_not_allowed')
}

function assertSpecialistPair(specialistId: unknown, skillId: unknown): void {
  const definition = EDIT_REFERENCE_SEMANTIC_SPECIALISTS.find((candidate) => candidate.specialistId === specialistId)
  if (!definition || definition.skillId !== skillId) throw contractError('specialist_skill_pair_invalid')
}

function assertSafeId(value: unknown, code: string): asserts value is string {
  if (typeof value !== 'string' || !SAFE_ID.test(value)) throw contractError(code)
}

function assertSafeIdArray(value: unknown, code: string): asserts value is string[] {
  if (!Array.isArray(value) || value.length > 128 || value.some((entry) => typeof entry !== 'string' || !SAFE_ID.test(entry))) {
    throw contractError(code)
  }
}

function assertBoundedText(value: unknown, maxLength: number, code: string): asserts value is string {
  if (typeof value !== 'string' || !value.trim() || value.length > maxLength || looksLikePrivateLocation(value)) throw contractError(code)
}

function assertTextArray(value: unknown, code: string): asserts value is string[] {
  if (!Array.isArray(value) || value.length > 64) throw contractError(code)
  for (const entry of value) assertBoundedText(entry, 1_000, code)
}

function assertNoForbiddenFields(value: unknown, depth = 0): void {
  if (depth > 8) throw contractError('result_nesting_too_deep')
  if (Array.isArray(value)) {
    for (const entry of value) assertNoForbiddenFields(entry, depth + 1)
    return
  }
  if (!isRecord(value)) return
  for (const [key, entry] of Object.entries(value)) {
    if (FORBIDDEN_RESULT_KEYS.has(key)) throw contractError('forbidden_private_or_provider_field')
    assertNoForbiddenFields(entry, depth + 1)
  }
}

function looksLikePrivateLocation(value: string): boolean {
  const trimmed = value.trim()
  return /^(?:https?:\/\/|file:\/\/|\/|[A-Za-z]:\\)/.test(trimmed)
    || trimmed.includes('../')
    || trimmed.includes('..\\')
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function contractError(code: string): EditReferenceSemanticStudyContractError {
  return new EditReferenceSemanticStudyContractError(code)
}

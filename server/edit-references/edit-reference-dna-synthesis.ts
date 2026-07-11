import { createHash, randomUUID } from 'node:crypto'
import { getPreferenceDNALayerDefinition } from '../../src/backend/preference-dna/preference-dna-layer-registry'
import { createDoNotCopyPreferenceRules } from '../../src/backend/preference-dna/preference-dna-transferability-service'
import { classifyPreferenceDNAConfidenceBand } from '../../src/backend/preference-dna/preference-dna-evidence-scoring-service'
import type { PreferenceDNALayerId } from '../../src/types/preference-dna-builder'
import type {
  EditReferenceRecord,
  PreferenceDNAConflictSnapshot,
  PreferenceDNALayerSnapshot,
  PreferenceDNARuleRecord,
  PreferenceDNAVersionRecord,
  PreferenceEvidenceCategory,
  PreferenceEvidenceRecord,
  PreferenceSkillRunRecord,
  PreferenceStudySessionRecord,
} from '../../src/types/edit-reference'
import { ApiError } from '../errors/api-error'

export const EDIT_REFERENCE_DNA_SYNTHESIS_VERSION = 'edit-reference-dna-synthesis-v1' as const

interface SynthesisInput {
  reference: EditReferenceRecord
  study: PreferenceStudySessionRecord
  evidence: PreferenceEvidenceRecord[]
  skillRuns: PreferenceSkillRunRecord[]
  existingVersions: PreferenceDNAVersionRecord[]
  now: string
}

const CATEGORY_LAYERS: Record<PreferenceEvidenceCategory, PreferenceDNALayerId[]> = {
  all_goals: ['transferable_rules', 'edit_quality_preference'],
  media_structure: ['content_type', 'qa_confidence'],
  visual_language: ['visual_scene_language', 'transferable_rules', 'edit_quality_preference'],
  story_and_pacing: ['structure_story_flow', 'pacing_timing', 'transferable_rules', 'edit_quality_preference'],
  captions: ['speech_caption_behavior', 'transferable_rules', 'edit_quality_preference'],
  color: ['color_tone_space', 'transferable_rules'],
  b_roll: ['broll_shot_language', 'visual_scene_language', 'transferable_rules'],
  audio_and_sfx: ['music_soundsync', 'sfx_sound_design', 'transferable_rules', 'edit_quality_preference'],
  graphics: ['graphic_design_visualexplain', 'ui_document_card_treatment', 'transferable_rules', 'edit_quality_preference'],
  copy_safety: ['do_not_copy_rules', 'qa_confidence'],
}

const TARGET_CONDITION = 'Adapt this rule to the target source, current user instruction, output frame, edit level, and approved constraints.'

export function synthesizeEditReferencePreferenceDNA(input: SynthesisInput): PreferenceDNAVersionRecord {
  if (input.study.status !== 'evidence_ready' || input.study.evidenceStatus !== 'evidence_ready') {
    throw new ApiError('VALIDATION_FAILED', 'Preference DNA requires evidence that is ready for review.', 409)
  }

  const activeSourceEvidence = selectActiveSourceEvidence(input.evidence)
  const latestOrchestrationId = input.skillRuns.at(-1)?.orchestrationId
  const latestSkillRuns = latestOrchestrationId
    ? input.skillRuns.filter((record) => record.orchestrationId === latestOrchestrationId)
    : []
  const latestDerivedEvidence = latestOrchestrationId
    ? input.evidence.filter((record) => record.sourceType === 'derived_skill_evidence' && record.orchestrationId === latestOrchestrationId)
    : []
  const copySafetyRun = latestSkillRuns.find((record) => record.skillId === 'edit_reference.transferability.copy_safety')
  const copySafetyEvidence = latestDerivedEvidence.find((record) => record.category === 'copy_safety')

  if (!copySafetyRun || copySafetyRun.status !== 'completed' || !copySafetyEvidence || copySafetyEvidence.transferability === 'do_not_copy') {
    throw new ApiError('VALIDATION_FAILED', 'Preference DNA cannot be synthesized until copy-safety review passes.', 409)
  }
  if (latestDerivedEvidence.length === 0 || activeSourceEvidence.length === 0) {
    throw new ApiError('PREFERENCE_EVIDENCE_REQUIRED', 'Preference DNA requires active, studied evidence.', 409)
  }

  const synthesisEvidence = [...activeSourceEvidence, ...latestDerivedEvidence]
  const evidenceRules = createEvidenceRules(latestDerivedEvidence)
  const safetyRules = createUniversalSafetyRules(copySafetyEvidence)
  if (!evidenceRules.some((rule) => rule.kind === 'must_follow')) {
    throw new ApiError('VALIDATION_FAILED', 'Preference DNA requires at least one transferable rule.', 409)
  }
  const rules = [...evidenceRules, ...safetyRules]

  const layers = createLayerSnapshots(rules, synthesisEvidence)
  const conflicts = createConflictSnapshots(activeSourceEvidence)
  const inputEvidenceRevisions = synthesisEvidence
    .map((record) => ({ evidenceId: record.id, revision: record.revision }))
    .sort((left, right) => left.evidenceId.localeCompare(right.evidenceId))
  const inputEvidenceDigest = sha256(stableStringify(inputEvidenceRevisions))
  const version = input.existingVersions.reduce((maximum, record) => Math.max(maximum, record.version), 0) + 1
  const overallConfidence = roundConfidence(evidenceRules.reduce((total, rule) => total + rule.confidence, 0) / evidenceRules.length)

  const immutableContent = {
    synthesisVersion: EDIT_REFERENCE_DNA_SYNTHESIS_VERSION,
    inputEvidenceRevisions,
    inputEvidenceDigest,
    layers,
    rules,
    conflicts,
    overallConfidence,
    overallConfidenceBand: classifyPreferenceDNAConfidenceBand(overallConfidence),
    adaptedNotCopied: true,
  }

  return {
    id: `preference-dna-version-${randomUUID()}`,
    workspaceId: input.reference.workspaceId,
    editReferenceId: input.reference.id,
    studySessionId: input.study.id,
    version,
    status: 'review_required',
    synthesisVersion: EDIT_REFERENCE_DNA_SYNTHESIS_VERSION,
    runtimeSource: 'verified_mock',
    inputEvidenceRevisions,
    inputEvidenceDigest,
    layers,
    rules,
    conflicts,
    overallConfidence,
    overallConfidenceBand: classifyPreferenceDNAConfidenceBand(overallConfidence),
    adaptedNotCopied: true,
    doNotCopyRuleCount: safetyRules.length,
    qaStatus: 'not_run',
    contentDigest: sha256(stableStringify(immutableContent)),
    providerCallMade: false,
    modelCallMade: false,
    mediaProcessingStarted: false,
    workerJobCreated: false,
    generationRequestCreated: false,
    renderJobCreated: false,
    creditReservedOrSpent: false,
    createdAt: input.now,
  }
}

function selectActiveSourceEvidence(evidence: PreferenceEvidenceRecord[]): PreferenceEvidenceRecord[] {
  const source = evidence.filter((record) => record.sourceType !== 'derived_skill_evidence')
  const supersededIds = new Set(source.map((record) => record.supersedesEvidenceId).filter((value): value is string => Boolean(value)))
  return source.filter((record) => !supersededIds.has(record.id))
}

function createEvidenceRules(evidence: PreferenceEvidenceRecord[]): PreferenceDNARuleRecord[] {
  const rules: PreferenceDNARuleRecord[] = []
  for (const record of evidence) {
    if (record.category === 'copy_safety') continue
    const evidenceIds = [...new Set([record.id, ...record.provenance.sourceEvidenceIds])]
    for (const layerId of CATEGORY_LAYERS[record.category]) {
      const kind = ruleKind(record, layerId)
      const statement = ruleStatement(record, kind)
      rules.push({
        id: stableId('preference-dna-rule', { layerId, kind, statement, evidenceIds: evidenceIds.slice().sort() }),
        layerId,
        kind,
        statement,
        evidenceIds,
        confidence: record.confidence,
        transferability: record.transferability,
        source: 'evidence_synthesis',
        targetConditions: [TARGET_CONDITION],
      })
    }
  }
  return deduplicateRules(rules)
}

function createUniversalSafetyRules(copyEvidence: PreferenceEvidenceRecord): PreferenceDNARuleRecord[] {
  const evidenceIds = [...new Set([copyEvidence.id, ...copyEvidence.provenance.sourceEvidenceIds])]
  return createDoNotCopyPreferenceRules().map((statement) => ({
    id: stableId('preference-dna-rule', { layerId: 'do_not_copy_rules', statement, evidenceIds: evidenceIds.slice().sort() }),
    layerId: 'do_not_copy_rules',
    kind: 'do_not_copy',
    statement,
    evidenceIds,
    confidence: 1,
    transferability: 'do_not_copy',
    source: 'deterministic_safety_rule',
    targetConditions: ['Always enforce this boundary before Preference DNA can be approved or applied.'],
  }))
}

function createLayerSnapshots(
  rules: PreferenceDNARuleRecord[],
  evidence: PreferenceEvidenceRecord[],
): PreferenceDNALayerSnapshot[] {
  const evidenceById = new Map(evidence.map((record) => [record.id, record]))
  const layerIds = [...new Set(rules.map((rule) => rule.layerId))]
  return layerIds.map((layerId) => {
    const layerRules = rules.filter((rule) => rule.layerId === layerId)
    const evidenceIds = [...new Set(layerRules.flatMap((rule) => rule.evidenceIds))]
    const confidence = roundConfidence(layerRules.reduce((total, rule) => total + rule.confidence, 0) / layerRules.length)
    const transferability = layerRules.some((rule) => rule.kind === 'do_not_copy')
      ? 'do_not_copy'
      : layerRules.some((rule) => rule.transferability === 'requires_user_review')
        ? 'requires_user_review'
        : layerRules.some((rule) => rule.transferability === 'non_transferable')
          ? 'non_transferable'
          : 'transferable'
    const definition = getPreferenceDNALayerDefinition(layerId)
    return {
      layerId,
      title: definition?.title ?? layerId.replaceAll('_', ' '),
      summary: layerRules.slice(0, 3).map((rule) => rule.statement).join(' '),
      evidenceIds,
      ruleIds: layerRules.map((rule) => rule.id),
      confidence,
      confidenceBand: classifyPreferenceDNAConfidenceBand(confidence),
      transferability,
      coverage: evidenceIds.every((id) => evidenceById.has(id))
        && transferability !== 'requires_user_review'
        && transferability !== 'non_transferable'
        ? 'covered'
        : 'review_required',
    }
  })
}

function createConflictSnapshots(evidence: PreferenceEvidenceRecord[]): PreferenceDNAConflictSnapshot[] {
  const conflicts: PreferenceDNAConflictSnapshot[] = []
  for (const record of evidence) {
    if (record.transferability === 'requires_user_review') {
      conflicts.push({
        id: stableId('preference-dna-conflict', { kind: 'review_required_evidence', evidenceId: record.id }),
        kind: 'review_required_evidence',
        title: `${record.title} needs review`,
        summary: 'This evidence was marked review-required and cannot become an approved rule without a later decision.',
        evidenceIds: [record.id],
        severity: 'high',
        requiresUserReview: true,
      })
    }
    if (record.transferability === 'non_transferable') {
      conflicts.push({
        id: stableId('preference-dna-conflict', { kind: 'non_transferable_evidence', evidenceId: record.id }),
        kind: 'non_transferable_evidence',
        title: `${record.title} is reference-specific`,
        summary: 'This evidence stays as context and must not become a reusable instruction.',
        evidenceIds: [record.id],
        severity: 'medium',
        requiresUserReview: true,
      })
    }
  }
  return conflicts
}

function ruleKind(record: PreferenceEvidenceRecord, layerId: PreferenceDNALayerId): PreferenceDNARuleRecord['kind'] {
  if (record.transferability === 'do_not_copy') return 'do_not_copy'
  if (record.transferability === 'non_transferable' || record.transferability === 'requires_user_review') return 'context_only'
  if (layerId === 'qa_confidence' || layerId === 'content_type') return 'context_only'
  return 'must_follow'
}

function ruleStatement(record: PreferenceEvidenceRecord, kind: PreferenceDNARuleRecord['kind']): string {
  const summary = record.summary.replace(/^User-described direction:\s*/i, '').trim()
  if (kind === 'do_not_copy') return `Do not copy: ${summary}`
  if (kind === 'context_only') return `Keep as review context: ${summary}`
  return `Adapt this preference to the target edit: ${summary}`
}

function deduplicateRules(rules: PreferenceDNARuleRecord[]): PreferenceDNARuleRecord[] {
  const seen = new Set<string>()
  return rules.filter((rule) => {
    const key = `${rule.layerId}\u0000${rule.kind}\u0000${rule.statement}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function roundConfidence(value: number): number {
  return Math.round(value * 100) / 100
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(',')}}`
  }
  return JSON.stringify(value)
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function stableId(prefix: string, value: unknown): string {
  return `${prefix}-${sha256(stableStringify(value)).slice(0, 32)}`
}

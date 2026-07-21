import { createHash, randomUUID } from 'node:crypto'
import { createDoNotCopyPreferenceRules } from '../../src/backend/preference-dna/preference-dna-transferability-service'
import type { PreferenceDNALayerId } from '../../src/types/preference-dna-builder'
import type {
  EditReferenceDNAQACheckRecord,
  EditReferenceDNAQACheckStatus,
  EditReferenceDNAQASeverity,
  EditReferenceRecord,
  EditReferenceStudyGoal,
  PreferenceDNAQAResultRecord,
  PreferenceDNAVersionRecord,
  PreferenceEvidenceRecord,
  PreferenceStudySessionRecord,
} from '../../src/types/edit-reference'
import { detectEditReferenceCopyRisks } from './edit-reference-copy-safety'
import {
  calculateEditReferenceDNAContentDigest,
  calculateEditReferenceDNAInputDigest,
} from './edit-reference-dna-synthesis'
import {
  hasValidEditReferenceDnaProviderProvenance,
  validateEditReferenceQwenDnaVersionAttemptBinding,
} from './edit-reference-preference-dna-candidate-materialization'
import type { EditReferencePreferenceDnaReasoningAttemptRecord } from './edit-reference-preference-dna-reasoning-attempt-contract'

export const EDIT_REFERENCE_DNA_QA_VERSION = 'edit-reference-dna-qa-v2' as const

interface QAInput {
  reference: EditReferenceRecord
  study: PreferenceStudySessionRecord
  dnaVersion: PreferenceDNAVersionRecord
  evidence: PreferenceEvidenceRecord[]
  reasoningAttempt?: EditReferencePreferenceDnaReasoningAttemptRecord
  now: string
}

const UNIVERSAL_REQUIRED_LAYERS: PreferenceDNALayerId[] = [
  'transferable_rules',
  'do_not_copy_rules',
]

const GOAL_REQUIRED_LAYERS: Record<EditReferenceStudyGoal, PreferenceDNALayerId[]> = {
  visual_language: ['visual_scene_language'],
  story_and_pacing: ['structure_story_flow', 'pacing_timing'],
  captions: ['speech_caption_behavior'],
  color: ['color_tone_space'],
  b_roll: ['broll_shot_language'],
  audio_and_sfx: ['music_soundsync', 'sfx_sound_design'],
  graphics: ['graphic_design_visualexplain', 'ui_document_card_treatment'],
}

export function runEditReferenceDNAQA(input: QAInput): PreferenceDNAQAResultRecord {
  const baseChecks = createQAChecks(input)
  const blockingChecks = baseChecks.filter((check) => check.blocksApproval)
  const reviewChecks = baseChecks.filter((check) => check.requiresUserReview && !check.blocksApproval)
  const status: PreferenceDNAQAResultRecord['status'] = blockingChecks.length
    ? 'blocked'
    : reviewChecks.length
      ? 'requires_user_review'
      : 'passed'
  const readinessCheck = createCheck({
    checkId: 'approval_readiness',
    status,
    severity: status === 'blocked' ? 'critical' : status === 'requires_user_review' ? 'medium' : 'info',
    title: 'Approval readiness',
    summary: status === 'blocked'
      ? `${blockingChecks.length} blocking quality check(s) must be corrected before approval.`
      : status === 'requires_user_review'
        ? `${reviewChecks.length} review item(s) require explicit acknowledgement before approval.`
        : 'All quality checks passed and the version is ready for explicit approval.',
    recommendation: status === 'blocked'
      ? 'Correct the source evidence, restudy it, and create a new immutable DNA version.'
      : status === 'requires_user_review'
        ? 'Review the flagged items and explicitly acknowledge them before approving this exact version.'
        : 'Review the version and confirm the adapt-not-copy boundary before approval.',
    blocksApproval: status === 'blocked',
    requiresUserReview: status !== 'passed',
  })
  const checks = [...baseChecks, readinessCheck]
  const blockingCheckIds = unique(checks.filter((check) => check.blocksApproval).map((check) => check.checkId))
  const reviewCheckIds = unique(checks.filter((check) => check.requiresUserReview && !check.blocksApproval).map((check) => check.checkId))
  const summary = status === 'blocked'
    ? `Preference DNA version ${input.dnaVersion.version} is blocked by ${blockingCheckIds.length} quality check(s).`
    : status === 'requires_user_review'
      ? `Preference DNA version ${input.dnaVersion.version} passed blocking safety checks and has ${reviewCheckIds.length} review item(s).`
      : `Preference DNA version ${input.dnaVersion.version} passed all deterministic quality checks.`
  const immutableContent = {
    qaVersion: EDIT_REFERENCE_DNA_QA_VERSION,
    dnaVersionId: input.dnaVersion.id,
    dnaVersionNumber: input.dnaVersion.version,
    dnaContentDigest: input.dnaVersion.contentDigest,
    inputEvidenceDigest: input.dnaVersion.inputEvidenceDigest,
    checks,
    blockingCheckIds,
    reviewCheckIds,
    status,
    summary,
  }

  return {
    id: `preference-dna-qa-${randomUUID()}`,
    workspaceId: input.reference.workspaceId,
    editReferenceId: input.reference.id,
    studySessionId: input.study.id,
    dnaVersionId: input.dnaVersion.id,
    dnaVersionNumber: input.dnaVersion.version,
    qaVersion: EDIT_REFERENCE_DNA_QA_VERSION,
    runtimeSource: 'verified_mock',
    status,
    dnaContentDigest: input.dnaVersion.contentDigest,
    inputEvidenceDigest: input.dnaVersion.inputEvidenceDigest,
    checks,
    blockingCheckIds,
    reviewCheckIds,
    summary,
    contentDigest: sha256(stableStringify(immutableContent)),
    providerCallMade: false,
    modelCallMade: false,
    fileBytesRead: false,
    externalUrlFetched: false,
    mediaProcessingStarted: false,
    workerJobCreated: false,
    generationRequestCreated: false,
    renderJobCreated: false,
    creditReservedOrSpent: false,
    createdAt: input.now,
  }
}

function createQAChecks(input: QAInput): EditReferenceDNAQACheckRecord[] {
  const version = input.dnaVersion
  const evidenceById = new Map(input.evidence.map((record) => [record.id, record]))
  const inputEvidenceIds = new Set(version.inputEvidenceRevisions.map((record) => record.evidenceId))
  const expectedInputDigest = calculateEditReferenceDNAInputDigest(version.inputEvidenceRevisions)
  const expectedContentDigest = calculateEditReferenceDNAContentDigest(version)
  const versionIntegrityPassed = version.inputEvidenceDigest === expectedInputDigest
    && version.contentDigest === expectedContentDigest
    && version.adaptedNotCopied === true
  const revisionFailures = version.inputEvidenceRevisions.filter((inputRevision) => {
    const evidence = evidenceById.get(inputRevision.evidenceId)
    return !evidence || evidence.revision !== inputRevision.revision
  })
  const linkedEvidenceIds = unique([
    ...version.rules.flatMap((rule) => rule.evidenceIds),
    ...version.layers.flatMap((layer) => layer.evidenceIds),
    ...version.conflicts.flatMap((conflict) => conflict.evidenceIds),
  ])
  const invalidLinks = linkedEvidenceIds.filter((id) => !inputEvidenceIds.has(id))
  const requiredLayers = unique([
    ...UNIVERSAL_REQUIRED_LAYERS,
    ...input.study.initialGoals.flatMap((goal) => GOAL_REQUIRED_LAYERS[goal]),
  ])
  const presentLayerIds = new Set(version.layers.map((layer) => layer.layerId))
  const missingLayers = requiredLayers.filter((layerId) => !presentLayerIds.has(layerId))
  const incompleteLayers = version.layers.filter((layer) => layer.evidenceIds.length === 0)
  const reviewLayers = version.layers.filter((layer) => layer.coverage === 'review_required')
  const lowConfidenceLayers = version.layers.filter((layer) => layer.confidence < 0.5)
  const transferabilityViolations = version.rules.filter((rule) => (
    (rule.kind === 'must_follow' && rule.transferability !== 'transferable')
    || (rule.kind === 'do_not_copy' && (rule.transferability !== 'do_not_copy' || rule.layerId !== 'do_not_copy_rules'))
    || (rule.source === 'deterministic_safety_rule' && rule.kind !== 'do_not_copy')
  ))
  const requiredSafetyRules = createDoNotCopyPreferenceRules().map(normalizeRule)
  const presentSafetyRules = new Set(version.rules.filter((rule) => rule.kind === 'do_not_copy').map((rule) => normalizeRule(rule.statement)))
  const missingSafetyRules = requiredSafetyRules.filter((rule) => !presentSafetyRules.has(rule))
  const transferableRules = version.rules.filter((rule) => rule.kind === 'must_follow')
  const contextRules = version.rules.filter((rule) => rule.kind === 'context_only')
  const transferableRisks = detectEditReferenceCopyRisks(transferableRules.map((rule) => rule.statement))
  const contextRisks = detectEditReferenceCopyRisks(contextRules.map((rule) => rule.statement))
  const identityRiskKinds = new Set(['creator_or_brand_identity', 'reference_as_project_footage'])
  const transferableIdentityRisks = transferableRisks.filter((risk) => identityRiskKinds.has(risk))
  const contextIdentityRisks = contextRisks.filter((risk) => identityRiskKinds.has(risk))
  const providerProvenanceSafe = providerProvenanceIsValid(input)
  const providerReviewRequired = Boolean(version.reasoningProvenance && (
    version.reasoningProvenance.candidateRequiresUserReview
    || version.reasoningProvenance.missingEvidenceKinds.length
    || version.reasoningProvenance.limitations.length
  ))
  const sideEffectsSafe = providerProvenanceSafe
    && version.mediaProcessingStarted === false
    && version.workerJobCreated === false
    && version.generationRequestCreated === false
    && version.renderJobCreated === false
    && version.creditReservedOrSpent === false

  return [
    createCheck({
      checkId: 'version_integrity',
      status: versionIntegrityPassed ? 'passed' : 'blocked',
      severity: versionIntegrityPassed ? 'info' : 'critical',
      title: 'Version integrity',
      summary: versionIntegrityPassed ? 'This immutable DNA version matches the content prepared for review.' : 'This immutable DNA version no longer matches its stored content.',
      recommendation: versionIntegrityPassed ? 'Keep this exact version tied to its quality review and approval.' : 'Block approval and recover from the last valid immutable version.',
      blocksApproval: !versionIntegrityPassed,
      requiresUserReview: !versionIntegrityPassed,
    }),
    createCheck({
      checkId: 'evidence_integrity',
      status: revisionFailures.length || invalidLinks.length ? 'blocked' : 'passed',
      severity: revisionFailures.length || invalidLinks.length ? 'critical' : 'info',
      title: 'Evidence integrity',
      summary: revisionFailures.length || invalidLinks.length
        ? `${revisionFailures.length} evidence revision(s) and ${invalidLinks.length} evidence link(s) are invalid.`
        : `${version.inputEvidenceRevisions.length} exact evidence record(s) support this version.`,
      recommendation: 'Every DNA rule, layer, and conflict must remain tied to its exact supporting evidence.',
      evidenceIds: unique([...revisionFailures.map((record) => record.evidenceId), ...invalidLinks]),
      blocksApproval: revisionFailures.length > 0 || invalidLinks.length > 0,
      requiresUserReview: revisionFailures.length > 0 || invalidLinks.length > 0,
    }),
    createCheck({
      checkId: 'goal_layer_coverage',
      status: missingLayers.length ? 'blocked' : 'passed',
      severity: missingLayers.length ? 'high' : 'info',
      title: 'Study-goal coverage',
      summary: missingLayers.length ? `${missingLayers.length} required layer(s) are missing.` : `All ${requiredLayers.length} layers required by this study are present.`,
      recommendation: missingLayers.length ? 'Correct or add evidence for the missing study goals, then create a new DNA version.' : 'Preserve this goal-to-layer coverage.',
      layerIds: missingLayers,
      blocksApproval: missingLayers.length > 0,
      requiresUserReview: missingLayers.length > 0,
    }),
    createCheck({
      checkId: 'layer_evidence_coverage',
      status: incompleteLayers.length ? 'blocked' : reviewLayers.length ? 'requires_user_review' : 'passed',
      severity: incompleteLayers.length ? 'high' : reviewLayers.length ? 'medium' : 'info',
      title: 'Layer evidence coverage',
      summary: incompleteLayers.length
        ? `${incompleteLayers.length} layer(s) have no evidence.`
        : reviewLayers.length
          ? `${reviewLayers.length} layer(s) require review.`
          : 'Every stored layer has covered evidence.',
      recommendation: incompleteLayers.length ? 'Add evidence before approval.' : reviewLayers.length ? 'Review the flagged layers before approval.' : 'Keep layer evidence links intact.',
      layerIds: unique([...incompleteLayers, ...reviewLayers].map((layer) => layer.layerId)),
      evidenceIds: unique([...incompleteLayers, ...reviewLayers].flatMap((layer) => layer.evidenceIds)),
      blocksApproval: incompleteLayers.length > 0,
      requiresUserReview: incompleteLayers.length > 0 || reviewLayers.length > 0,
    }),
    createCheck({
      checkId: 'confidence_threshold',
      status: version.overallConfidence < 0.45 ? 'blocked' : version.overallConfidence < 0.72 || lowConfidenceLayers.length ? 'requires_user_review' : 'passed',
      severity: version.overallConfidence < 0.45 ? 'high' : version.overallConfidence < 0.72 || lowConfidenceLayers.length ? 'medium' : 'info',
      title: 'Evidence confidence',
      summary: `${Math.round(version.overallConfidence * 100)}% overall confidence; ${lowConfidenceLayers.length} low-confidence layer(s).`,
      recommendation: version.overallConfidence < 0.45 ? 'Collect stronger evidence and create a new version.' : version.overallConfidence < 0.72 || lowConfidenceLayers.length ? 'Review and acknowledge the confidence limits before approval.' : 'Confidence is sufficient for approval review.',
      layerIds: lowConfidenceLayers.map((layer) => layer.layerId),
      blocksApproval: version.overallConfidence < 0.45,
      requiresUserReview: version.overallConfidence < 0.72 || lowConfidenceLayers.length > 0,
    }),
    createCheck({
      checkId: 'conflict_review',
      status: version.conflicts.length ? 'requires_user_review' : 'passed',
      severity: version.conflicts.some((conflict) => conflict.severity === 'high') ? 'high' : version.conflicts.length ? 'medium' : 'info',
      title: 'Conflict review',
      summary: version.conflicts.length ? `${version.conflicts.length} evidence conflict(s) require review.` : 'No unresolved evidence conflicts are stored in this version.',
      recommendation: version.conflicts.length ? 'Resolve conflicts through corrected evidence and a new DNA version, or explicitly acknowledge non-blocking context.' : 'No conflict action is required.',
      evidenceIds: unique(version.conflicts.flatMap((conflict) => conflict.evidenceIds)),
      blocksApproval: false,
      requiresUserReview: version.conflicts.length > 0,
    }),
    createCheck({
      checkId: 'transferability_consistency',
      status: transferabilityViolations.length ? 'blocked' : 'passed',
      severity: transferabilityViolations.length ? 'critical' : 'info',
      title: 'Transferability consistency',
      summary: transferabilityViolations.length ? `${transferabilityViolations.length} rule(s) have unsafe transferability labels.` : 'Transferable, contextual, and do-not-copy rules are separated.',
      recommendation: 'Never allow reference-specific or do-not-copy material into must-follow rules.',
      evidenceIds: unique(transferabilityViolations.flatMap((rule) => rule.evidenceIds)),
      layerIds: unique(transferabilityViolations.map((rule) => rule.layerId)),
      ruleIds: transferabilityViolations.map((rule) => rule.id),
      blocksApproval: transferabilityViolations.length > 0,
      requiresUserReview: transferabilityViolations.length > 0,
    }),
    createCheck({
      checkId: 'do_not_copy_coverage',
      status: missingSafetyRules.length ? 'blocked' : 'passed',
      severity: missingSafetyRules.length ? 'critical' : 'info',
      title: 'Do-not-copy coverage',
      summary: missingSafetyRules.length ? `${missingSafetyRules.length} mandatory copy boundary rule(s) are missing.` : `All ${requiredSafetyRules.length} mandatory copy boundary rules are present.`,
      recommendation: missingSafetyRules.length ? 'Rebuild the version with every mandatory adapt-not-copy boundary.' : 'Carry these boundaries into every future target application.',
      ruleIds: version.rules.filter((rule) => rule.kind === 'do_not_copy').map((rule) => rule.id),
      blocksApproval: missingSafetyRules.length > 0,
      requiresUserReview: missingSafetyRules.length > 0,
    }),
    createCheck({
      checkId: 'copy_risk',
      status: transferableRisks.length ? 'blocked' : contextRisks.length ? 'requires_user_review' : 'passed',
      severity: transferableRisks.length ? 'critical' : contextRisks.length ? 'high' : 'info',
      title: 'Direct-copy risk',
      summary: transferableRisks.length
        ? `Unsafe transferable rule(s) contain: ${transferableRisks.join(', ')}.`
        : contextRisks.length
          ? `Context-only rule(s) mention: ${contextRisks.join(', ')}.`
          : 'No unnegated direct-copy instruction was found outside safety rules.',
      recommendation: transferableRisks.length ? 'Correct the evidence and synthesize a new version.' : contextRisks.length ? 'Confirm the context remains non-transferable.' : 'Preserve the adapt-not-copy boundary.',
      evidenceIds: unique([...transferableRules, ...contextRules].flatMap((rule) => rule.evidenceIds)),
      ruleIds: [...transferableRules, ...contextRules].map((rule) => rule.id),
      blocksApproval: transferableRisks.length > 0,
      requiresUserReview: transferableRisks.length > 0 || contextRisks.length > 0,
    }),
    createCheck({
      checkId: 'identity_source_safety',
      status: transferableIdentityRisks.length ? 'blocked' : contextIdentityRisks.length ? 'requires_user_review' : 'passed',
      severity: transferableIdentityRisks.length ? 'critical' : contextIdentityRisks.length ? 'high' : 'info',
      title: 'Identity and source safety',
      summary: transferableIdentityRisks.length
        ? `Transferable identity/source risk found: ${transferableIdentityRisks.join(', ')}.`
        : contextIdentityRisks.length
          ? `Identity/source context requires review: ${contextIdentityRisks.join(', ')}.`
          : 'No creator/brand identity copying or reference-footage reuse instruction was found.',
      recommendation: 'Keep identity, marks, people, and reference footage out of reusable instructions.',
      blocksApproval: transferableIdentityRisks.length > 0,
      requiresUserReview: transferableIdentityRisks.length > 0 || contextIdentityRisks.length > 0,
    }),
    createCheck({
      checkId: 'provider_provenance',
      status: providerProvenanceSafe
        ? providerReviewRequired ? 'requires_user_review' : 'passed'
        : 'blocked',
      severity: providerProvenanceSafe
        ? providerReviewRequired ? 'medium' : 'info'
        : 'critical',
      title: 'Synthesis integrity',
      summary: providerProvenanceSafe
        ? version.reasoningProvenance
          ? `AI-assisted synthesis is bound to its exact reviewed source; ${version.reasoningProvenance.missingEvidenceKinds.length} missing-evidence kind(s) and ${version.reasoningProvenance.limitations.length} limitation(s) remain visible for review.`
          : 'This version records a deterministic synthesis source and no AI-assisted interpretation.'
        : 'The synthesis source or exact review binding is invalid.',
      recommendation: providerProvenanceSafe
        ? providerReviewRequired
          ? 'Review the candidate limitations and missing evidence before any later approval authority is considered.'
          : 'Keep this exact synthesis bound to the immutable version under review.'
        : 'Block approval and rebuild from the exact reviewed source.',
      blocksApproval: !providerProvenanceSafe,
      requiresUserReview: !providerProvenanceSafe || providerReviewRequired,
    }),
    createCheck({
      checkId: 'side_effect_safety',
      status: sideEffectsSafe ? 'passed' : 'blocked',
      severity: sideEffectsSafe ? 'info' : 'critical',
      title: 'Production boundary',
      summary: sideEffectsSafe ? 'No production work started during quality review.' : 'Quality review crossed a production boundary and cannot be approved.',
      recommendation: sideEffectsSafe ? 'Keep quality review and approval separate from production.' : 'Block approval and investigate the unexpected production activity.',
      blocksApproval: !sideEffectsSafe,
      requiresUserReview: !sideEffectsSafe,
    }),
  ]
}

function providerProvenanceIsValid(input: QAInput): boolean {
  if (input.dnaVersion.synthesisVersion === 'edit-reference-dna-synthesis-v1') {
    return hasValidEditReferenceDnaProviderProvenance(input.dnaVersion)
  }
  if (!input.reasoningAttempt) return false
  try {
    validateEditReferenceQwenDnaVersionAttemptBinding(input.dnaVersion, input.reasoningAttempt)
    return true
  } catch {
    return false
  }
}

function createCheck(input: {
  checkId: EditReferenceDNAQACheckRecord['checkId']
  status: EditReferenceDNAQACheckStatus
  severity: EditReferenceDNAQASeverity
  title: string
  summary: string
  recommendation: string
  evidenceIds?: string[]
  layerIds?: PreferenceDNALayerId[]
  ruleIds?: string[]
  blocksApproval: boolean
  requiresUserReview: boolean
}): EditReferenceDNAQACheckRecord {
  const content = {
    checkId: input.checkId,
    status: input.status,
    severity: input.severity,
    title: input.title,
    summary: input.summary,
    recommendation: input.recommendation,
    evidenceIds: unique(input.evidenceIds ?? []),
    layerIds: unique(input.layerIds ?? []),
    ruleIds: unique(input.ruleIds ?? []),
    blocksApproval: input.blocksApproval,
    requiresUserReview: input.requiresUserReview,
  }
  return { id: stableId('edit-reference-dna-qa-check', content), ...content }
}

function normalizeRule(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase()
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)]
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

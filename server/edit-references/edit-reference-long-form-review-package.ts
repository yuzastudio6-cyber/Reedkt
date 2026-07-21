import { createHash } from 'node:crypto'
import type {
  EditReferenceLongFormReviewCopyRiskKind,
  EditReferenceLongFormStudyReviewDecision,
  EditReferenceLongFormStudyReviewFinding,
  EditReferenceLongFormStudyReviewPackage,
  EditReferenceLongFormStudySelectionReceipt,
} from '../../src/types/edit-reference-long-form-review'
import {
  EDIT_REFERENCE_LONG_FORM_REVIEW_SPECIALIST_IDS,
  EDIT_REFERENCE_LONG_FORM_STUDY_REVIEW_PACKAGE_VERSION,
  EDIT_REFERENCE_LONG_FORM_STUDY_REVIEW_DECISION_VERSION,
  EDIT_REFERENCE_LONG_FORM_STUDY_SELECTION_RECEIPT_VERSION,
} from '../../src/types/edit-reference-long-form-review'
import type {
  PreferenceEvidenceRecord,
  PreferenceSkillRunRecord,
} from '../../src/types/edit-reference'
import {
  detectEditReferenceCopyRisks,
} from './edit-reference-copy-safety'
import {
  EDIT_REFERENCE_SEMANTIC_SPECIALISTS,
  EDIT_REFERENCE_SKILL_RESULT_CONTRACT_VERSION,
  type EditReferenceSemanticSpecialistId,
} from './edit-reference-semantic-study-contract'
import {
  aggregateEditReferenceLongFormSemanticWindowCheckpoints,
  type EditReferenceLongFormSemanticWindowCheckpoint,
} from './edit-reference-long-form-semantic-window-checkpoint'
import type { EditReferenceLongFormSemanticWindowPlan } from './edit-reference-long-form-semantic-window-contract'
import {
  validateRunAgainstPlan,
  type EditReferenceLongFormStudyPlan,
  type EditReferenceLongFormStudyRunRecord,
  type EditReferenceLongFormStudyWorkItem,
} from './edit-reference-long-form-study-contract'

export interface EditReferenceLongFormStudyReviewChunkInput {
  readonly workItemId: string
  readonly semanticWindowPlan: EditReferenceLongFormSemanticWindowPlan
  readonly checkpoints: readonly EditReferenceLongFormSemanticWindowCheckpoint[]
}

export interface CreateEditReferenceLongFormStudyReviewPackageInput {
  readonly plan: EditReferenceLongFormStudyPlan
  readonly run: EditReferenceLongFormStudyRunRecord
  readonly sourceEvidenceId: string
  readonly chunks: readonly EditReferenceLongFormStudyReviewChunkInput[]
  readonly createdAt: string
}

export interface MaterializeEditReferenceLongFormStudySelectionInput {
  readonly package: EditReferenceLongFormStudyReviewPackage
  readonly sourceEvidence: PreferenceEvidenceRecord
  readonly decisions: readonly EditReferenceLongFormStudyReviewDecision[]
  readonly acknowledgeAdaptNotCopy: boolean
  readonly acknowledgeFactSafetyReview: boolean
  readonly orchestrationId: string
  readonly now: string
}

export interface MaterializedEditReferenceLongFormStudySelection {
  readonly derivedEvidence: readonly PreferenceEvidenceRecord[]
  readonly skillRuns: readonly PreferenceSkillRunRecord[]
  readonly receipt: EditReferenceLongFormStudySelectionReceipt
  readonly notApplicableCategories: readonly PreferenceEvidenceRecord['category'][]
}

const SHA256_PATTERN = /^[a-f0-9]{64}$/
const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/
const MONEY_MICROS_PATTERN = /^(?:0|[1-9][0-9]{0,15})$/
const UNSAFE_PERSISTED_STRING_PATTERN = /https?:\/\/|file:\/\/|(?:^|[\s"'`])\/(?:Users|Volumes|home|private|tmp|var)\/|\.\.\/|\.\.\\|signed[_ -]?url|authorization|bearer\s+|service[_ -]?role|api[_ -]?key|private[_ -]?key|password|credential/i

export function createEditReferenceLongFormStudyReviewPackage(
  input: CreateEditReferenceLongFormStudyReviewPackageInput,
): EditReferenceLongFormStudyReviewPackage {
  validateRunAgainstPlan(input.run, input.plan)
  assertId(input.sourceEvidenceId, 'source evidence id')
  assertIso(input.createdAt, 'review package creation time')
  if (['cancelled', 'paused', 'needs_operator_review'].includes(input.run.state)) {
    throw new Error('Long-form review package cannot be created from a blocked study run.')
  }

  const semanticWorkItems = input.run.workItems
    .filter((item) => item.stageId === 'semantic_chunk_synthesis')
    .sort((left, right) => left.sourceCoverageStartSeconds - right.sourceCoverageStartSeconds)
  if (
    semanticWorkItems.length !== input.plan.chunks.length
    || input.chunks.length !== input.plan.chunks.length
  ) throw new Error('Long-form review package requires every planned semantic chunk.')

  const chunksByWorkItemId = new Map(input.chunks.map((chunk) => [chunk.workItemId, chunk]))
  if (chunksByWorkItemId.size !== input.chunks.length) {
    throw new Error('Long-form review package chunk identities are not unique.')
  }
  const executionScopes = new Set<string>()
  const specialistResults = new Map<EditReferenceSemanticSpecialistId, Array<{
    workItem: EditReferenceLongFormStudyWorkItem
    checkpoints: readonly EditReferenceLongFormSemanticWindowCheckpoint[]
    authority: ReturnType<typeof aggregateEditReferenceLongFormSemanticWindowCheckpoints>
  }>>()
  let semanticWindowCount = 0
  let checkpointCount = 0

  for (const workItem of semanticWorkItems) {
    const chunkInput = chunksByWorkItemId.get(workItem.workItemId)
    if (!chunkInput) throw new Error('Long-form review package is missing a semantic chunk.')
    if (
      workItem.status !== 'completed'
      || !workItem.outputDigestSha256
      || !workItem.outputRuntimeSource
      || !workItem.outputCompletionAuthority
    ) throw new Error('Long-form review package requires completed semantic work authority.')
    if (
      chunkInput.semanticWindowPlan.chunkId !== workItem.chunkId
      || chunkInput.semanticWindowPlan.planId !== input.plan.planId
      || chunkInput.semanticWindowPlan.planDigestSha256 !== input.plan.planDigestSha256
    ) throw new Error('Long-form review package semantic window plan is not bound to the exact chunk.')

    semanticWindowCount += chunkInput.semanticWindowPlan.windows.length
    checkpointCount += chunkInput.checkpoints.length
    for (const checkpoint of chunkInput.checkpoints) executionScopes.add(checkpoint.executionScope)
    for (const specialistId of EDIT_REFERENCE_LONG_FORM_REVIEW_SPECIALIST_IDS) {
      const specialistCheckpoints = chunkInput.checkpoints.filter((checkpoint) => (
        checkpoint.specialistId === specialistId
      ))
      const authority = aggregateEditReferenceLongFormSemanticWindowCheckpoints({
        plan: input.plan,
        workItem,
        semanticWindowPlan: chunkInput.semanticWindowPlan,
        specialistId,
        checkpoints: specialistCheckpoints,
      })
      const records = specialistResults.get(specialistId) ?? []
      records.push({ workItem, checkpoints: specialistCheckpoints, authority })
      specialistResults.set(specialistId, records)
    }
  }

  if (checkpointCount !== semanticWindowCount * EDIT_REFERENCE_LONG_FORM_REVIEW_SPECIALIST_IDS.length) {
    throw new Error('Long-form review package checkpoint coverage is incomplete.')
  }
  if (executionScopes.size !== 1) {
    throw new Error('Long-form review package cannot mix controlled and production checkpoints.')
  }
  const executionScope = [...executionScopes][0]
  const completedAuthoritative = (
    input.run.state === 'completed'
    && Boolean(input.run.completionAttestation)
    && executionScope === 'production'
    && semanticWorkItems.every((item) => item.outputCompletionAuthority === 'authoritative')
  )
  const controlledReviewOnly = (
    input.run.state !== 'completed'
    && executionScope === 'controlled_test'
    && semanticWorkItems.every((item) => item.outputCompletionAuthority === 'controlled_mock')
  )
  if (!completedAuthoritative && !controlledReviewOnly) {
    throw new Error('Long-form review package runtime authority is inconsistent with the study run.')
  }

  const findings = EDIT_REFERENCE_LONG_FORM_REVIEW_SPECIALIST_IDS.map((specialistId) => (
    createFinding(specialistId, specialistResults.get(specialistId) ?? [])
  ))
  const unsigned = {
    schemaVersion: EDIT_REFERENCE_LONG_FORM_STUDY_REVIEW_PACKAGE_VERSION,
    reviewAuthority: completedAuthoritative ? 'completed_authoritative' as const : 'controlled_review_only' as const,
    workspaceId: input.plan.workspaceId,
    editReferenceId: input.plan.editReferenceId,
    studySessionId: input.plan.studySessionId,
    sourceEvidenceId: input.sourceEvidenceId,
    privateMediaArtifactId: input.plan.source.privateMediaArtifactId,
    mediaChecksumSha256: input.plan.source.mediaChecksumSha256,
    runId: input.run.runId,
    runRevision: input.run.revision,
    planId: input.plan.planId,
    planDigestSha256: input.plan.planDigestSha256,
    sourceDurationSeconds: input.plan.source.durationSeconds,
    sourceHasAudio: input.plan.source.hasAudio,
    chunkCount: input.plan.chunks.length,
    semanticWindowCount,
    checkpointCount,
    findings,
    boundaries: reviewBoundaries(),
    createdAt: input.createdAt,
  }
  const packageDigestSha256 = sha256(stableJson(unsigned))
  const reviewPackage: EditReferenceLongFormStudyReviewPackage = {
    ...unsigned,
    packageId: `edit-reference-long-form-review-${packageDigestSha256.slice(0, 32)}`,
    packageDigestSha256,
  }
  validateEditReferenceLongFormStudyReviewPackage(reviewPackage)
  return reviewPackage
}

export function validateEditReferenceLongFormStudyReviewPackage(
  value: EditReferenceLongFormStudyReviewPackage,
): void {
  if (
    value?.schemaVersion !== EDIT_REFERENCE_LONG_FORM_STUDY_REVIEW_PACKAGE_VERSION
    || !ID_PATTERN.test(value.packageId)
    || !SHA256_PATTERN.test(value.packageDigestSha256)
    || !['controlled_review_only', 'completed_authoritative'].includes(value.reviewAuthority)
    || !ID_PATTERN.test(value.workspaceId)
    || !ID_PATTERN.test(value.editReferenceId)
    || !ID_PATTERN.test(value.studySessionId)
    || !ID_PATTERN.test(value.sourceEvidenceId)
    || !ID_PATTERN.test(value.privateMediaArtifactId)
    || !SHA256_PATTERN.test(value.mediaChecksumSha256)
    || !ID_PATTERN.test(value.runId)
    || !Number.isSafeInteger(value.runRevision)
    || value.runRevision < 1
    || !ID_PATTERN.test(value.planId)
    || !SHA256_PATTERN.test(value.planDigestSha256)
    || !Number.isFinite(value.sourceDurationSeconds)
    || value.sourceDurationSeconds <= 0
    || typeof value.sourceHasAudio !== 'boolean'
    || !Number.isSafeInteger(value.chunkCount)
    || value.chunkCount < 1
    || !Number.isSafeInteger(value.semanticWindowCount)
    || value.semanticWindowCount < 1
    || value.checkpointCount !== value.semanticWindowCount * EDIT_REFERENCE_LONG_FORM_REVIEW_SPECIALIST_IDS.length
    || !validIso(value.createdAt)
  ) throw new Error('Long-form study review package identity or coverage is invalid.')
  if (
    value.findings.length !== EDIT_REFERENCE_LONG_FORM_REVIEW_SPECIALIST_IDS.length
    || new Set(value.findings.map((finding) => finding.specialistId)).size !== value.findings.length
  ) throw new Error('Long-form study review package specialist coverage is invalid.')
  for (const specialistId of EDIT_REFERENCE_LONG_FORM_REVIEW_SPECIALIST_IDS) {
    const finding = value.findings.find((candidate) => candidate.specialistId === specialistId)
    if (!finding) throw new Error('Long-form study review package is missing a specialist finding.')
    validateFinding(finding, value.semanticWindowCount)
  }
  const expectedBoundaries = reviewBoundaries()
  if (stableJson(value.boundaries) !== stableJson(expectedBoundaries)) {
    throw new Error('Long-form study review package crossed an application, privacy, or cost boundary.')
  }
  const unsigned = { ...value } as Record<string, unknown>
  delete unsigned.packageId
  delete unsigned.packageDigestSha256
  const expectedDigest = sha256(stableJson(unsigned))
  if (
    value.packageDigestSha256 !== expectedDigest
    || value.packageId !== `edit-reference-long-form-review-${expectedDigest.slice(0, 32)}`
  ) throw new Error('Long-form study review package digest does not match its exact content.')
  assertNoUnsafePersistedStrings(value)
}

export function materializeEditReferenceLongFormStudySelection(
  input: MaterializeEditReferenceLongFormStudySelectionInput,
): MaterializedEditReferenceLongFormStudySelection {
  validateEditReferenceLongFormStudyReviewPackage(input.package)
  validateSourceEvidence(input.package, input.sourceEvidence)
  assertId(input.orchestrationId, 'review selection orchestration id')
  assertIso(input.now, 'review selection time')
  const analyzedFindings = input.package.findings.filter((finding) => finding.status === 'analyzed')
  if (
    input.decisions.length !== analyzedFindings.length
    || new Set(input.decisions.map((decision) => decision.findingId)).size !== input.decisions.length
  ) throw new Error('Every analyzed long-form finding requires one explicit user decision.')
  const decisionByFindingId = new Map(input.decisions.map((decision) => [decision.findingId, decision]))
  for (const decision of input.decisions) validateDecision(decision, analyzedFindings)
  const adapted = input.decisions.filter((decision) => decision.decision === 'adapt')
  if (adapted.length > 0 && input.acknowledgeAdaptNotCopy !== true) {
    throw new Error('Adapting long-form findings requires an explicit adapt-not-copy acknowledgement.')
  }
  if (
    adapted.some((decision) => analyzedFindings.find((finding) => finding.findingId === decision.findingId)?.specialistId === 'story_editorial')
    && input.acknowledgeFactSafetyReview !== true
  ) throw new Error('Adapting story findings requires an explicit fact-safety review acknowledgement.')

  const derivedEvidence: PreferenceEvidenceRecord[] = []
  const skillRuns: PreferenceSkillRunRecord[] = []
  for (const finding of analyzedFindings) {
    const decision = decisionByFindingId.get(finding.findingId)
    if (!decision) throw new Error('An analyzed long-form finding lacks a user decision.')
    if (decision.decision === 'adapt' && finding.copyRiskKinds.length > 0) {
      throw new Error('A direct-copy risk cannot be adapted into reusable Preference DNA evidence.')
    }
    const selectionDigest = sha256(stableJson({
      packageDigestSha256: input.package.packageDigestSha256,
      findingId: finding.findingId,
      decision: decision.decision,
      sourceEvidenceId: input.sourceEvidence.id,
      orchestrationId: input.orchestrationId,
    }))
    const evidenceId = `preference-evidence-long-form-${selectionDigest.slice(0, 32)}`
    const skillRunId = `preference-skill-run-long-form-${selectionDigest.slice(0, 32)}`
    const selectionSkillId = `edit_reference.long_form.review_selection.${finding.specialistId}`
    const transferability = decision.decision === 'adapt'
      ? 'transferable' as const
      : decision.decision === 'context_only'
        ? 'non_transferable' as const
        : 'do_not_copy' as const
    derivedEvidence.push({
      id: evidenceId,
      workspaceId: input.package.workspaceId,
      editReferenceId: input.package.editReferenceId,
      studySessionId: input.package.studySessionId,
      orchestrationId: input.orchestrationId,
      sourceType: 'derived_skill_evidence',
      category: finding.category,
      title: `${finding.title} — ${decisionLabel(decision.decision)}`,
      summary: finding.summary,
      revision: 1,
      confidence: finding.confidence,
      confidenceBasis: 'deterministic_derived',
      transferability,
      provenance: {
        runtimeSource: 'verified_mock',
        sourceEvidenceIds: [input.sourceEvidence.id],
        skillRunId,
        ...(input.sourceEvidence.provenance.privateAssetId
          ? { privateAssetId: input.sourceEvidence.provenance.privateAssetId }
          : {}),
        analysisArtifactIds: [input.package.packageId],
        mediaStudyStatus: 'media_studied_local_partial',
        toolIds: unique([...finding.toolIds, 'deterministic_long_form_review_selection']),
        skillIds: [finding.skillId, selectionSkillId],
        fallbackUsed: false,
        notes: [
          `The user explicitly selected “${decisionLabel(decision.decision)}” after reviewing the complete long-form study area.`,
          `This evidence is generalized from ${finding.semanticWindowCount} semantic windows; exact footage, wording, timing, sequence, identity, music, SFX, and layouts remain prohibited.`,
          'This selection did not create Preference DNA, apply a preference, mutate an approved snapshot, or change a plan or estimate.',
        ],
      },
      createdAt: input.now,
      updatedAt: input.now,
    })
    skillRuns.push({
      id: skillRunId,
      workspaceId: input.package.workspaceId,
      editReferenceId: input.package.editReferenceId,
      studySessionId: input.package.studySessionId,
      orchestrationId: input.orchestrationId,
      skillId: selectionSkillId,
      status: 'completed',
      runtimeSource: 'verified_mock',
      readinessAtRun: 'verified_mock',
      inputEvidenceIds: [input.sourceEvidence.id],
      outputEvidenceIds: [evidenceId],
      toolIds: ['deterministic_long_form_review_selection'],
      fallbackUsed: false,
      resultContractVersion: EDIT_REFERENCE_SKILL_RESULT_CONTRACT_VERSION,
      resultState: 'analyzed',
      retryAvailable: false,
      resultSummary: `Materialized the explicitly reviewed ${finding.title.toLowerCase()} decision from exact long-form checkpoint authority.`,
      warnings: decision.decision === 'adapt'
        ? ['Adapt the generalized principle to the target; do not reproduce reference-specific expression.']
        : ['This finding is not a reusable must-follow instruction.'],
      blockedReasons: [],
      providerCallMade: false,
      modelCallMade: false,
      fileBytesRead: false,
      externalUrlFetched: false,
      mediaProcessingStarted: false,
      workerJobCreated: false,
      createdAt: input.now,
      updatedAt: input.now,
    })
  }

  const receiptUnsigned = {
    schemaVersion: EDIT_REFERENCE_LONG_FORM_STUDY_SELECTION_RECEIPT_VERSION,
    packageId: input.package.packageId,
    packageDigestSha256: input.package.packageDigestSha256,
    workspaceId: input.package.workspaceId,
    editReferenceId: input.package.editReferenceId,
    studySessionId: input.package.studySessionId,
    sourceEvidenceId: input.sourceEvidence.id,
    decisionCount: input.decisions.length,
    adaptedFindingCount: input.decisions.filter((decision) => decision.decision === 'adapt').length,
    contextOnlyFindingCount: input.decisions.filter((decision) => decision.decision === 'context_only').length,
    avoidedFindingCount: input.decisions.filter((decision) => decision.decision === 'avoid').length,
    notApplicableFindingCount: input.package.findings.filter((finding) => finding.status === 'not_applicable').length,
    outputEvidenceIds: derivedEvidence.map((record) => record.id),
    outputSkillRunIds: skillRuns.map((record) => record.id),
    selectionWasExplicit: true as const,
    preferenceDnaCreated: false as const,
    preferenceApplied: false as const,
    approvedSnapshotMutated: false as const,
    planOrEstimateMutated: false as const,
    providerCallMade: false as const,
    modelCallMade: false as const,
    workerJobCreated: false as const,
    customerPriceCalculated: false as const,
    customerCreditsMutated: false as const,
    serviceFeeIncluded: false as const,
    productionReady: false as const,
    createdAt: input.now,
  }
  const receiptDigestSha256 = sha256(stableJson(receiptUnsigned))
  return {
    derivedEvidence,
    skillRuns,
    receipt: {
      ...receiptUnsigned,
      receiptId: `edit-reference-long-form-selection-${receiptDigestSha256.slice(0, 32)}`,
      receiptDigestSha256,
    },
    notApplicableCategories: unique(input.package.findings
      .filter((finding) => finding.status === 'not_applicable')
      .map((finding) => finding.category)),
  }
}

function createFinding(
  specialistId: EditReferenceSemanticSpecialistId,
  records: readonly {
    workItem: EditReferenceLongFormStudyWorkItem
    checkpoints: readonly EditReferenceLongFormSemanticWindowCheckpoint[]
    authority: ReturnType<typeof aggregateEditReferenceLongFormSemanticWindowCheckpoints>
  }[],
): EditReferenceLongFormStudyReviewFinding {
  if (records.length < 1) throw new Error('Long-form review finding has no chunk authority.')
  const definition = EDIT_REFERENCE_SEMANTIC_SPECIALISTS.find((entry) => entry.specialistId === specialistId)
  if (!definition) throw new Error('Long-form review specialist is unavailable.')
  const statuses = new Set(records.map((record) => record.authority.status))
  if (statuses.size !== 1) throw new Error('Long-form review specialist cannot mix analyzed and not-applicable chunks.')
  const checkpoints = records.flatMap((record) => record.checkpoints)
  const status = records[0]!.authority.status
  if (status === 'not_applicable') {
    const content = {
      specialistId,
      skillId: definition.skillId,
      status,
      checkpointDigestsSha256: checkpoints.map((checkpoint) => checkpoint.checkpointDigestSha256),
    }
    return {
      findingId: `edit-reference-long-form-finding-${sha256(stableJson(content)).slice(0, 32)}`,
      specialistId,
      skillId: definition.skillId,
      category: definition.evidenceCategory,
      title: specialistTitle(specialistId),
      status,
      summary: records[0]!.authority.status === 'not_applicable'
        ? records[0]!.authority.rationale
        : 'This study area was not applicable.',
      confidence: 1,
      semanticWindowCount: checkpoints.length,
      checkpointDigestsSha256: checkpoints.map((checkpoint) => checkpoint.checkpointDigestSha256),
      evidenceOutputDigestsSha256: [],
      runtimeSource: null,
      toolIds: [],
      providerCallMade: false,
      modelCallMade: false,
      workerJobCreated: false,
      meteredInternalCostMicros: '0',
      usageEventIds: [],
      internalCostRecordIds: [],
      copyRiskKinds: [],
      requiresUserSelection: false,
      targetAdaptationRequired: true,
      exactCopyInstructionCreated: false,
    }
  }

  const authorities = records.map((record) => {
    if (record.authority.status !== 'analyzed') throw new Error('Long-form review analyzed authority is unavailable.')
    return record.authority
  })
  const runtimeSources = unique(authorities.map((authority) => authority.result.runtimeSource))
  const providerIds = unique(authorities.flatMap((authority) => authority.result.providerId ? [authority.result.providerId] : []))
  const modelIds = unique(authorities.flatMap((authority) => authority.result.modelId ? [authority.result.modelId] : []))
  if (runtimeSources.length !== 1 || providerIds.length > 1 || modelIds.length > 1) {
    throw new Error('Long-form review finding cannot hide mixed runtime authority.')
  }
  const summary = boundedText(authorities.map((authority, index) => (
    `Section ${index + 1}: ${authority.result.summary}`
  )).join(' '), 3_900)
  const copyRiskKinds = detectEditReferenceCopyRisks([summary]) as EditReferenceLongFormReviewCopyRiskKind[]
  const evidenceOutputDigestsSha256 = unique(authorities.flatMap((authority) => authority.evidenceOutputDigestsSha256))
  const usageEventIds = unique(authorities.flatMap((authority) => authority.result.usageEventIds ?? []))
  const internalCostRecordIds = unique(authorities.flatMap((authority) => authority.result.internalCostRecordIds ?? []))
  const meteredInternalCostMicros = checkpoints.reduce((total, checkpoint) => (
    total + BigInt(checkpoint.attempt?.meteredInternalCostMicros ?? '0')
  ), 0n).toString()
  const content = {
    specialistId,
    skillId: definition.skillId,
    summary,
    checkpointDigestsSha256: checkpoints.map((checkpoint) => checkpoint.checkpointDigestSha256),
    evidenceOutputDigestsSha256,
  }
  return {
    findingId: `edit-reference-long-form-finding-${sha256(stableJson(content)).slice(0, 32)}`,
    specialistId,
    skillId: definition.skillId,
    category: definition.evidenceCategory,
    title: specialistTitle(specialistId),
    status: 'analyzed',
    summary,
    confidence: rounded(authorities.reduce((sum, authority) => sum + authority.result.confidence, 0) / authorities.length),
    semanticWindowCount: checkpoints.length,
    checkpointDigestsSha256: checkpoints.map((checkpoint) => checkpoint.checkpointDigestSha256),
    evidenceOutputDigestsSha256,
    runtimeSource: runtimeSources[0] as 'verified_local' | 'verified_live',
    toolIds: unique(authorities.flatMap((authority) => authority.result.toolIds)),
    providerCallMade: authorities.some((authority) => authority.result.execution.providerCallMade),
    modelCallMade: authorities.some((authority) => authority.result.execution.modelCallMade),
    workerJobCreated: authorities.some((authority) => authority.result.execution.workerJobCreated),
    meteredInternalCostMicros,
    usageEventIds,
    internalCostRecordIds,
    copyRiskKinds,
    requiresUserSelection: true,
    targetAdaptationRequired: true,
    exactCopyInstructionCreated: false,
  }
}

function validateFinding(finding: EditReferenceLongFormStudyReviewFinding, totalWindowCount: number): void {
  if (
    !ID_PATTERN.test(finding.findingId)
    || !EDIT_REFERENCE_LONG_FORM_REVIEW_SPECIALIST_IDS.includes(finding.specialistId)
    || !ID_PATTERN.test(finding.skillId)
    || !finding.title.trim()
    || finding.title.length > 120
    || !['analyzed', 'not_applicable'].includes(finding.status)
    || !finding.summary.trim()
    || finding.summary.length > 3_900
    || !Number.isFinite(finding.confidence)
    || finding.confidence < 0
    || finding.confidence > 1
    || finding.semanticWindowCount !== totalWindowCount
    || finding.checkpointDigestsSha256.length !== totalWindowCount
    || finding.checkpointDigestsSha256.some((digest) => !SHA256_PATTERN.test(digest))
    || new Set(finding.checkpointDigestsSha256).size !== finding.checkpointDigestsSha256.length
    || finding.evidenceOutputDigestsSha256.some((digest) => !SHA256_PATTERN.test(digest))
    || !MONEY_MICROS_PATTERN.test(finding.meteredInternalCostMicros)
    || finding.targetAdaptationRequired !== true
    || finding.exactCopyInstructionCreated !== false
  ) throw new Error('Long-form study review finding is invalid.')
  if (finding.status === 'not_applicable') {
    if (
      !['speech_pacing', 'audio_sound_design'].includes(finding.specialistId)
      || finding.runtimeSource !== null
      || finding.requiresUserSelection
      || finding.toolIds.length > 0
      || finding.providerCallMade
      || finding.modelCallMade
      || finding.workerJobCreated
      || finding.meteredInternalCostMicros !== '0'
      || finding.usageEventIds.length > 0
      || finding.internalCostRecordIds.length > 0
      || finding.copyRiskKinds.length > 0
    ) throw new Error('Long-form not-applicable review finding is invalid.')
  } else if (
    !['verified_local', 'verified_live'].includes(finding.runtimeSource ?? '')
    || !finding.requiresUserSelection
    || finding.toolIds.length < 1
  ) throw new Error('Long-form analyzed review finding lacks runtime authority.')
}

function validateDecision(
  decision: EditReferenceLongFormStudyReviewDecision,
  findings: readonly EditReferenceLongFormStudyReviewFinding[],
): void {
  if (
    decision?.schemaVersion !== EDIT_REFERENCE_LONG_FORM_STUDY_REVIEW_DECISION_VERSION
    || !ID_PATTERN.test(decision.findingId)
    || !['adapt', 'context_only', 'avoid'].includes(decision.decision)
    || !findings.some((finding) => finding.findingId === decision.findingId)
  ) throw new Error('Long-form study review decision is invalid.')
}

function validateSourceEvidence(
  reviewPackage: EditReferenceLongFormStudyReviewPackage,
  sourceEvidence: PreferenceEvidenceRecord,
): void {
  if (
    sourceEvidence.id !== reviewPackage.sourceEvidenceId
    || sourceEvidence.workspaceId !== reviewPackage.workspaceId
    || sourceEvidence.editReferenceId !== reviewPackage.editReferenceId
    || sourceEvidence.studySessionId !== reviewPackage.studySessionId
    || sourceEvidence.sourceType !== 'reference_video_metadata'
    || sourceEvidence.provenance.privateAssetId !== reviewPackage.privateMediaArtifactId
  ) throw new Error('Long-form review selection is not bound to the exact saved reference evidence.')
}

function reviewBoundaries(): EditReferenceLongFormStudyReviewPackage['boundaries'] {
  return {
    originalRemainsImmutable: true,
    rawMediaPersisted: false,
    rawProviderPayloadPersisted: false,
    rawTranscriptPersisted: false,
    recognizedOcrTextPersisted: false,
    localFilePathPersisted: false,
    signedUrlPersisted: false,
    userSelectionRequired: true,
    automaticPreferenceDnaCreationAllowed: false,
    automaticPreferenceApplicationAllowed: false,
    approvedSnapshotMutationAllowed: false,
    planOrEstimateMutationAllowed: false,
    customerPriceCalculated: false,
    customerCreditsMutated: false,
    serviceFeeIncluded: false,
    productionReady: false,
  }
}

function specialistTitle(specialistId: EditReferenceSemanticSpecialistId): string {
  return ({
    visual_language: 'Visual language',
    story_editorial: 'Story and editorial rhythm',
    speech_pacing: 'Speech and pacing',
    caption_design: 'Caption design',
    color_treatment: 'Color treatment',
    audio_sound_design: 'Music and sound design',
    graphics_motion: 'Graphics and motion',
  } as const)[specialistId]
}

function decisionLabel(decision: EditReferenceLongFormStudyReviewDecision['decision']): string {
  if (decision === 'adapt') return 'Adapt to future edits'
  if (decision === 'context_only') return 'Keep as context only'
  return 'Avoid this direction'
}

function assertNoUnsafePersistedStrings(value: unknown): void {
  const queue: unknown[] = [value]
  while (queue.length > 0) {
    const next = queue.pop()
    if (typeof next === 'string') {
      if (UNSAFE_PERSISTED_STRING_PATTERN.test(next)) {
        throw new Error('Long-form review package contains a private location, credential, or URL.')
      }
    } else if (Array.isArray(next)) queue.push(...next)
    else if (next && typeof next === 'object') queue.push(...Object.values(next as Record<string, unknown>))
  }
}

function assertId(value: string, label: string): void {
  if (!ID_PATTERN.test(value)) throw new Error(`Long-form review ${label} is invalid.`)
}

function assertIso(value: string, label: string): void {
  if (!validIso(value)) throw new Error(`Long-form review ${label} is invalid.`)
}

function validIso(value: string): boolean {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString() === value
}

function boundedText(value: string, maxLength: number): string {
  const normalized = value.replace(/\s+/g, ' ').trim()
  return normalized.length <= maxLength ? normalized : `${normalized.slice(0, maxLength - 1).trimEnd()}…`
}

function rounded(value: number): number {
  return Number(value.toFixed(4))
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)]
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableJson(entry)}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}

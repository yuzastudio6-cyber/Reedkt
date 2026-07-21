import { createHash } from 'node:crypto'
import {
  assertEditReferenceSemanticStudyResult,
  type EditReferenceSemanticSpecialistId,
  type EditReferenceSemanticStudyResult,
} from './edit-reference-semantic-study-contract'
import type { ExecuteEditReferenceLongFormChunkMediaStageInput } from './edit-reference-long-form-chunk-media-executor'
import {
  createEditReferenceLongFormStudyWorkOutput,
  type EditReferenceLongFormStudyWorkOutput,
} from './edit-reference-long-form-study-work-output'
import {
  createUnmeteredEditReferenceLongFormStudyUsage,
  validateEditReferenceLongFormStudyUsage,
  type EditReferenceLongFormStudyUsageEvidence,
} from './edit-reference-long-form-study-usage-contract'
import {
  EDIT_REFERENCE_LONG_FORM_SEMANTIC_SPECIALIST_IDS,
  type EditReferenceLongFormSemanticSpecialistCoverage,
} from './edit-reference-long-form-specialist-stage-contract'
import {
  createEditReferenceLongFormSemanticWindowPlan,
  validateEditReferenceLongFormSemanticWindowPlan,
  type EditReferenceLongFormSemanticWindowPlan,
} from './edit-reference-long-form-semantic-window-contract'
import {
  aggregateEditReferenceLongFormSemanticWindowCheckpoints,
  type EditReferenceLongFormSemanticWindowCheckpoint,
} from './edit-reference-long-form-semantic-window-checkpoint'
import {
  QWEN_LONG_FORM_SEMANTIC_CHUNK_ADAPTER_ID,
  QWEN_LONG_FORM_SEMANTIC_CHUNK_ADAPTER_VERSION,
  QWEN_LONG_FORM_SEMANTIC_CHUNK_MODEL_ROUTING_POLICY_VERSION,
  QWEN_LONG_FORM_SEMANTIC_CHUNK_PROVIDER_ID,
  QWEN_LONG_FORM_SEMANTIC_CHUNK_CONTEXT_VERSION,
  categoryForLongFormSemanticSpecialist,
  type QwenLongFormSemanticChunkContext,
  type QwenLongFormSemanticChunkProvider,
} from '../services/qwen-long-form-semantic-chunk-provider'

export type EditReferenceLongFormSemanticSpecialistAuthority =
  | {
      readonly status: 'analyzed'
      readonly result: EditReferenceSemanticStudyResult
      readonly evidenceOutputDigestsSha256: readonly string[]
    }
  | {
      readonly status: 'not_applicable'
      readonly specialistId: 'speech_pacing' | 'audio_sound_design'
      readonly rationale: string
    }

export type EditReferenceLongFormSemanticChunkStageAuthority =
  | {
      readonly executionScope: 'controlled_test'
    }
  | {
      readonly executionScope: 'production'
      readonly usage: EditReferenceLongFormStudyUsageEvidence
      readonly approvedAdapterId: typeof QWEN_LONG_FORM_SEMANTIC_CHUNK_ADAPTER_ID
      readonly approvedAdapterVersion: typeof QWEN_LONG_FORM_SEMANTIC_CHUNK_ADAPTER_VERSION
      readonly approvedProviderId: typeof QWEN_LONG_FORM_SEMANTIC_CHUNK_PROVIDER_ID
      readonly approvedModelRoutingPolicyVersion:
        typeof QWEN_LONG_FORM_SEMANTIC_CHUNK_MODEL_ROUTING_POLICY_VERSION
    }

export interface ExecuteEditReferenceLongFormSemanticChunkStageOptions {
  readonly specialistAuthorities: readonly EditReferenceLongFormSemanticSpecialistAuthority[]
  readonly semanticWindowPlan: EditReferenceLongFormSemanticWindowPlan
  readonly semanticWindowCheckpoints?: readonly EditReferenceLongFormSemanticWindowCheckpoint[]
  readonly provider?: QwenLongFormSemanticChunkProvider
  readonly authority: EditReferenceLongFormSemanticChunkStageAuthority
}

export async function executeEditReferenceLongFormSemanticChunkStage(
  input: ExecuteEditReferenceLongFormChunkMediaStageInput,
  options: ExecuteEditReferenceLongFormSemanticChunkStageOptions,
): Promise<EditReferenceLongFormStudyWorkOutput> {
  assertSemanticWorkItem(input)
  validateSemanticWindowAuthority(input, options.semanticWindowPlan)
  const dependencyDigests = input.dependencyOutputs.map((output) => output.outputDigestSha256)
  const checkpointEvidenceDigests = validateSemanticWindowCheckpointAuthority({
    input,
    semanticWindowPlan: options.semanticWindowPlan,
    checkpoints: options.semanticWindowCheckpoints,
    specialistAuthorities: options.specialistAuthorities,
  })
  const specialistAuthorities = validateSpecialistAuthorities({
    sourceHasAudio: input.plan.source.hasAudio,
    dependencyOutputs: input.dependencyOutputs,
    authorities: options.specialistAuthorities,
    checkpointEvidenceDigests,
    production: options.authority.executionScope === 'production',
  })
  const started = process.hrtime.bigint()
  const production = options.authority.executionScope === 'production'
  if (production) {
    validateStageUsage({
      usage: options.authority.usage,
      production: true,
      specialists: specialistAuthorities,
    })
  }
  const context = createProviderContext(
    input,
    dependencyDigests,
    specialistAuthorities,
    options.semanticWindowPlan,
  )
  const providerResult = production
    ? await runProductionProvider(context, options)
    : undefined
  const observedWallClockMs = Math.max(1, Number((process.hrtime.bigint() - started) / 1_000_000n))
  const usage = production
    ? options.authority.usage
    : createUnmeteredEditReferenceLongFormStudyUsage({
        mode: 'controlled_test_unmetered',
        observedWallClockMs,
        inputMediaSeconds: input.workItem.sourceCoverageEndSeconds - input.workItem.sourceCoverageStartSeconds,
        outputBytes: 0,
      })
  if (!production) validateStageUsage({ usage, production: false, specialists: specialistAuthorities })
  const specialistCoverage = createSpecialistCoverage(specialistAuthorities)
  const controlledAggregate = production ? undefined : createControlledAggregate(specialistAuthorities)
  const findings = providerResult?.findings.map((finding) => ({
    findingId: finding.findingId,
    category: finding.category,
    summary: finding.summary,
    confidence: finding.confidence,
    evidenceOutputDigestsSha256: finding.evidenceOutputDigestsSha256,
    transferable: finding.transferable,
    targetAdaptationRequired: true as const,
    exactCopyInstructionCreated: false as const,
  })) ?? controlledAggregate!.findings
  const synthesisRuntime = providerResult?.runtimeProvenance
    ? {
        runtimeSource: 'verified_live' as const,
        adapterId: providerResult.runtimeProvenance.adapterId,
        adapterVersion: providerResult.runtimeProvenance.adapterVersion,
        providerId: providerResult.runtimeProvenance.providerId,
        modelId: providerResult.runtimeProvenance.modelId,
        modelRevision: providerResult.runtimeProvenance.modelRevision,
        modelAggregateSha256: providerResult.runtimeProvenance.modelAggregateSha256,
        modelRoutingPolicyVersion: providerResult.runtimeProvenance.modelRoutingPolicyVersion,
        synthesisInstructionDigestSha256:
          providerResult.runtimeProvenance.synthesisInstructionDigestSha256,
        providerCallMade: true,
        modelCallMade: true,
      }
    : controlledAggregate!.runtime
  const result = {
    kind: 'semantic_chunk_synthesis' as const,
    inputOutputDigestsSha256: [...dependencyDigests],
    semanticWindowPlanDigestSha256: options.semanticWindowPlan.semanticWindowPlanDigestSha256,
    specialistCoverage,
    synthesisRuntime,
    findings,
    chunkSummary: providerResult?.chunkSummary ?? controlledAggregate!.chunkSummary,
    fullChunkEvidenceReconciled: true as const,
    rawProviderPayloadPersisted: false as const,
    rawTranscriptPersistedInWorkOutput: false as const,
    referenceMediaCopiedToTarget: false as const,
    executableTargetInstructionsCreated: false as const,
  }
  return createEditReferenceLongFormStudyWorkOutput({
    runId: input.runId,
    planId: input.plan.planId,
    planDigestSha256: input.plan.planDigestSha256,
    workItemId: input.workItem.workItemId,
    stageId: result.kind,
    chunkId: input.workItem.chunkId,
    privateMediaArtifactId: input.plan.source.privateMediaArtifactId,
    mediaChecksumSha256: input.plan.source.mediaChecksumSha256,
    sourceCoverageStartSeconds: input.workItem.sourceCoverageStartSeconds,
    sourceCoverageEndSeconds: input.workItem.sourceCoverageEndSeconds,
    toolIds: production ? ['qwen_3_7'] : ['controlled_specialist_fixture'],
    artifacts: [],
    result,
    runtimeSource: production ? 'verified_live' : 'verified_mock',
    completionAuthority: production ? 'authoritative' : 'controlled_mock',
    usage,
    originalRemainsImmutable: true,
    rawProcessOutputPersisted: false,
    signedUrlPersisted: false,
    localFilePathPersisted: false,
    providerCallMade: production,
    customerPriceCalculated: false,
    customerCreditsMutated: false,
    remoteMutationMade: false,
    createdAt: input.createdAt,
  })
}

function createProviderContext(
  input: ExecuteEditReferenceLongFormChunkMediaStageInput,
  dependencyDigests: readonly string[],
  specialists: readonly NormalizedSpecialistAuthority[],
  semanticWindowPlan: EditReferenceLongFormSemanticWindowPlan,
): QwenLongFormSemanticChunkContext {
  return {
    schemaVersion: QWEN_LONG_FORM_SEMANTIC_CHUNK_CONTEXT_VERSION,
    workspaceId: input.plan.workspaceId,
    editReferenceId: input.plan.editReferenceId,
    studySessionId: input.plan.studySessionId,
    runId: input.runId,
    workItemId: input.workItem.workItemId,
    chunkId: input.workItem.chunkId as string,
    privateMediaArtifactId: input.plan.source.privateMediaArtifactId,
    mediaChecksumSha256: input.plan.source.mediaChecksumSha256,
    planDigestSha256: input.plan.planDigestSha256,
    sourceCoverageStartSeconds: input.workItem.sourceCoverageStartSeconds,
    sourceCoverageEndSeconds: input.workItem.sourceCoverageEndSeconds,
    sourceHasAudio: input.plan.source.hasAudio,
    semanticWindowPlanDigestSha256: semanticWindowPlan.semanticWindowPlanDigestSha256,
    semanticWindowCount: semanticWindowPlan.windows.length,
    inputOutputDigestsSha256: [...dependencyDigests],
    specialistAuthorities: specialists.map((specialist) => ({
      specialistId: specialist.specialistId,
      status: specialist.status,
      runtimeSource: specialist.runtimeSource,
      semanticResultDigestSha256: specialist.semanticResultDigestSha256,
      evidenceOutputDigestsSha256: [...specialist.evidenceOutputDigestsSha256],
      summary: specialist.summary,
      confidence: specialist.confidence,
    })),
    boundaries: {
      specialistOutputsAreUntrustedSourceData: true,
      rawReferenceMediaAllowed: false,
      rawTranscriptAllowed: false,
      rawOcrTextAllowed: false,
      hiddenChainOfThoughtPersistenceAllowed: false,
      exactReferenceWordingTransferAllowed: false,
      exactReferenceSequenceTransferAllowed: false,
      exactReferenceTimingTransferAllowed: false,
      exactReferenceLayoutTransferAllowed: false,
      exactReferenceAudioTransferAllowed: false,
      referenceIdentityTransferAllowed: false,
      copyrightedAssetTransferAllowed: false,
      executableTargetInstructionAllowed: false,
      targetAdaptationRequired: true,
      targetEvidenceRequired: true,
      userApprovalRequired: true,
    },
  }
}

function validateSemanticWindowAuthority(
  input: ExecuteEditReferenceLongFormChunkMediaStageInput,
  semanticWindowPlan: EditReferenceLongFormSemanticWindowPlan,
): void {
  validateEditReferenceLongFormSemanticWindowPlan(semanticWindowPlan)
  const visual = input.dependencyOutputs.find((output) => output.stageId === 'visual_sampling')
  const scene = input.dependencyOutputs.find((output) => output.stageId === 'scene_boundary_scan')
  const speech = input.dependencyOutputs.find((output) => (
    output.stageId === 'speech_transcript' && output.chunkId === input.workItem.chunkId
  ))
  if (!visual || !scene || !input.workItem.chunkId) {
    throw new Error('Long-form semantic-window authority requires exact visual and scene outputs.')
  }
  const expected = createEditReferenceLongFormSemanticWindowPlan({
    plan: input.plan,
    chunkId: input.workItem.chunkId,
    visualSamplingOutput: visual,
    sceneBoundaryOutput: scene,
    speechTranscriptOutput: speech,
  })
  if (
    semanticWindowPlan.planId !== input.plan.planId
    || semanticWindowPlan.planDigestSha256 !== input.plan.planDigestSha256
    || semanticWindowPlan.chunkId !== input.workItem.chunkId
    || semanticWindowPlan.sourceCoverageStartSeconds !== input.workItem.sourceCoverageStartSeconds
    || semanticWindowPlan.sourceCoverageEndSeconds !== input.workItem.sourceCoverageEndSeconds
    || semanticWindowPlan.visualSamplingOutputDigestSha256 !== visual.outputDigestSha256
    || semanticWindowPlan.sceneBoundaryOutputDigestSha256 !== scene.outputDigestSha256
    || semanticWindowPlan.speechTranscriptOutputDigestSha256 !== expected.speechTranscriptOutputDigestSha256
    || semanticWindowPlan.semanticWindowPlanDigestSha256 !== expected.semanticWindowPlanDigestSha256
  ) throw new Error('Long-form semantic-window authority is not bound to the exact plan, section, and media evidence.')
}

async function runProductionProvider(
  context: QwenLongFormSemanticChunkContext,
  options: ExecuteEditReferenceLongFormSemanticChunkStageOptions,
) {
  if (options.authority.executionScope !== 'production' || !options.provider) {
    throw new Error('Production long-form semantic synthesis requires the reviewed Qwen provider.')
  }
  if (
    options.provider.executionMode !== 'live_provider'
    || options.authority.approvedAdapterId !== QWEN_LONG_FORM_SEMANTIC_CHUNK_ADAPTER_ID
    || options.authority.approvedAdapterVersion !== QWEN_LONG_FORM_SEMANTIC_CHUNK_ADAPTER_VERSION
    || options.authority.approvedProviderId !== QWEN_LONG_FORM_SEMANTIC_CHUNK_PROVIDER_ID
    || options.authority.approvedModelRoutingPolicyVersion
      !== QWEN_LONG_FORM_SEMANTIC_CHUNK_MODEL_ROUTING_POLICY_VERSION
  ) throw new Error('Production long-form semantic provider authority is invalid.')
  const result = await options.provider.analyze(context)
  if (
    result.status !== 'completed'
    || !result.chunkSummary
    || result.findings.length < 1
    || !result.runtimeProvenance
    || result.runtimeProvenance.adapterId !== options.authority.approvedAdapterId
    || result.runtimeProvenance.adapterVersion !== options.authority.approvedAdapterVersion
    || result.runtimeProvenance.providerId !== options.authority.approvedProviderId
    || result.runtimeProvenance.modelRoutingPolicyVersion
      !== options.authority.approvedModelRoutingPolicyVersion
    || result.execution.structuredEvidenceRead !== true
    || result.execution.providerCallMade !== true
    || result.execution.modelCallMade !== true
    || result.execution.remoteMutationMade !== false
    || result.blockers.length > 0
  ) throw new Error(`Production long-form semantic provider did not return authoritative synthesis: ${result.blockers.join(',') || 'invalid_authority'}.`)
  return result
}

interface NormalizedSpecialistAuthority {
  readonly specialistId: EditReferenceSemanticSpecialistId
  readonly status: 'analyzed' | 'not_applicable'
  readonly runtimeSource: 'verified_local' | 'verified_live' | 'not_applicable'
  readonly semanticResultDigestSha256: string | null
  readonly evidenceOutputDigestsSha256: readonly string[]
  readonly summary: string
  readonly confidence: number
  readonly usageEventIds: readonly string[]
  readonly internalCostRecordIds: readonly string[]
}

function validateSemanticWindowCheckpointAuthority(input: {
  readonly input: ExecuteEditReferenceLongFormChunkMediaStageInput
  readonly semanticWindowPlan: EditReferenceLongFormSemanticWindowPlan
  readonly checkpoints?: readonly EditReferenceLongFormSemanticWindowCheckpoint[]
  readonly specialistAuthorities: readonly EditReferenceLongFormSemanticSpecialistAuthority[]
}): readonly string[] {
  const checkpoints = input.checkpoints
  if (!checkpoints) return []
  const expectedCheckpointCount = input.semanticWindowPlan.windows.length
    * EDIT_REFERENCE_LONG_FORM_SEMANTIC_SPECIALIST_IDS.length
  if (checkpoints.length !== expectedCheckpointCount) {
    throw new Error('Long-form semantic synthesis lacks complete durable window checkpoints.')
  }
  const aggregated = EDIT_REFERENCE_LONG_FORM_SEMANTIC_SPECIALIST_IDS.map((specialistId) => (
    aggregateEditReferenceLongFormSemanticWindowCheckpoints({
      plan: input.input.plan,
      workItem: input.input.workItem,
      semanticWindowPlan: input.semanticWindowPlan,
      specialistId,
      checkpoints: checkpoints.filter((checkpoint) => checkpoint.specialistId === specialistId),
    })
  ))
  const aggregatedBySpecialist = new Map(aggregated.map((authority) => [
    authority.status === 'analyzed' ? authority.result.specialistId : authority.specialistId,
    authority,
  ]))
  if (
    input.specialistAuthorities.length !== aggregated.length
    || input.specialistAuthorities.some((authority) => {
      const specialistId = authority.status === 'analyzed'
        ? authority.result.specialistId
        : authority.specialistId
      return stableJson(authority) !== stableJson(aggregatedBySpecialist.get(specialistId))
    })
  ) {
    throw new Error('Long-form semantic specialist authority does not match its durable window checkpoints.')
  }
  return [...new Set(checkpoints.flatMap((checkpoint) => checkpoint.evidenceOutputDigestsSha256))]
}

function validateSpecialistAuthorities(input: {
  readonly sourceHasAudio: boolean
  readonly dependencyOutputs: readonly EditReferenceLongFormStudyWorkOutput[]
  readonly authorities: readonly EditReferenceLongFormSemanticSpecialistAuthority[]
  readonly checkpointEvidenceDigests: readonly string[]
  readonly production: boolean
}): readonly NormalizedSpecialistAuthority[] {
  const dependencyDigests = input.dependencyOutputs.map((output) => output.outputDigestSha256)
  const dependencyStageIds = input.dependencyOutputs.map((output) => output.stageId)
  const requiredDependencyStageIds: EditReferenceLongFormStudyWorkOutput['stageId'][] = [
    'analysis_proxy',
    'scene_boundary_scan',
    'visual_sampling',
    'color_motion_signals',
  ]
  if (input.sourceHasAudio) requiredDependencyStageIds.push('audio_extract', 'speech_transcript')
  const allowedDependencyStageIds = new Set([...requiredDependencyStageIds, 'caption_ocr'])
  if (
    new Set(dependencyDigests).size !== dependencyDigests.length
    || new Set(dependencyStageIds).size !== dependencyStageIds.length
    || requiredDependencyStageIds.some((stageId) => !dependencyStageIds.includes(stageId))
    || dependencyStageIds.some((stageId) => !allowedDependencyStageIds.has(stageId))
    || input.authorities.length !== EDIT_REFERENCE_LONG_FORM_SEMANTIC_SPECIALIST_IDS.length
  ) throw new Error('Long-form semantic synthesis lacks its exact dependency or specialist set.')
  const allowedDigests = new Set([...dependencyDigests, ...input.checkpointEvidenceDigests])
  const dependencyDigestByStage = new Map<string, string>(input.dependencyOutputs.map((output) => [
    output.stageId,
    output.outputDigestSha256,
  ]))
  const normalized = input.authorities.map((authority): NormalizedSpecialistAuthority => {
    if (authority.status === 'not_applicable') {
      if (input.sourceHasAudio || !['speech_pacing', 'audio_sound_design'].includes(authority.specialistId)) {
        throw new Error('Only speech/audio specialists for a source without audio may be not applicable.')
      }
      assertSafeText(authority.rationale, 600)
      return {
        specialistId: authority.specialistId,
        status: 'not_applicable',
        runtimeSource: 'not_applicable',
        semanticResultDigestSha256: null,
        evidenceOutputDigestsSha256: [],
        summary: authority.rationale,
        confidence: 0,
        usageEventIds: [],
        internalCostRecordIds: [],
      }
    }
    assertEditReferenceSemanticStudyResult(authority.result)
    if (
      authority.result.status !== 'completed'
      || authority.result.resultState !== 'analyzed'
      || !['verified_local', 'verified_live'].includes(authority.result.runtimeSource)
      || authority.result.fallbackUsed
      || authority.result.confidence <= 0
      || authority.evidenceOutputDigestsSha256.length < 1
      || new Set(authority.evidenceOutputDigestsSha256).size
        !== authority.evidenceOutputDigestsSha256.length
      || authority.evidenceOutputDigestsSha256.some((digest) => !allowedDigests.has(digest))
      || !requiredDependencyStages(authority.result.specialistId, input.sourceHasAudio, dependencyDigestByStage)
        .every((stageId) => authority.evidenceOutputDigestsSha256.includes(
          dependencyDigestByStage.get(stageId) as string,
        ))
    ) throw new Error('Long-form semantic specialist authority is not analyzed or evidence-bound.')
    if (input.production && (
      !authority.result.usageEventIds?.length
      || !authority.result.internalCostRecordIds?.length
    )) throw new Error('Production long-form semantic specialist lacks internal-cost lineage.')
    return {
      specialistId: authority.result.specialistId,
      status: 'analyzed',
      runtimeSource: authority.result.runtimeSource as 'verified_local' | 'verified_live',
      semanticResultDigestSha256: sha256(stableJson(authority.result)),
      evidenceOutputDigestsSha256: [...authority.evidenceOutputDigestsSha256],
      summary: authority.result.summary,
      confidence: authority.result.confidence,
      usageEventIds: authority.result.usageEventIds ?? [],
      internalCostRecordIds: authority.result.internalCostRecordIds ?? [],
    }
  })
  const expectedIds = EDIT_REFERENCE_LONG_FORM_SEMANTIC_SPECIALIST_IDS
  const actualIds = normalized.map((authority) => authority.specialistId)
  if (
    new Set(actualIds).size !== actualIds.length
    || expectedIds.some((id) => !actualIds.includes(id))
    || dependencyDigests.some((digest) => !normalized.some((specialist) => (
      specialist.evidenceOutputDigestsSha256.includes(digest)
    )))
  ) throw new Error('Long-form semantic specialist coverage is incomplete or leaves dependency evidence unused.')
  return expectedIds.map((id) => normalized.find((authority) => authority.specialistId === id) as NormalizedSpecialistAuthority)
}

function requiredDependencyStages(
  specialistId: EditReferenceSemanticSpecialistId,
  sourceHasAudio: boolean,
  available: ReadonlyMap<string, string>,
): readonly string[] {
  const optional = (stageId: string): string[] => available.has(stageId) ? [stageId] : []
  if (specialistId === 'visual_language') return ['visual_sampling', 'scene_boundary_scan']
  if (specialistId === 'story_editorial') {
    return ['visual_sampling', 'scene_boundary_scan', ...(sourceHasAudio ? ['speech_transcript'] : [])]
  }
  if (specialistId === 'speech_pacing') return sourceHasAudio ? ['speech_transcript'] : []
  if (specialistId === 'caption_design') {
    return ['visual_sampling', ...optional('caption_ocr'), ...(sourceHasAudio ? ['speech_transcript'] : [])]
  }
  if (specialistId === 'color_treatment') return ['visual_sampling', 'color_motion_signals']
  if (specialistId === 'audio_sound_design') {
    return sourceHasAudio ? ['audio_extract', 'speech_transcript'] : []
  }
  return ['visual_sampling', 'scene_boundary_scan', 'color_motion_signals']
}

function createSpecialistCoverage(
  specialists: readonly NormalizedSpecialistAuthority[],
): readonly EditReferenceLongFormSemanticSpecialistCoverage[] {
  return specialists.map((specialist) => ({
    specialistId: specialist.specialistId,
    status: specialist.status,
    confidence: specialist.confidence,
    runtimeSource: specialist.runtimeSource,
    semanticResultDigestSha256: specialist.semanticResultDigestSha256,
    evidenceOutputDigestsSha256: specialist.evidenceOutputDigestsSha256,
  }))
}

function createControlledAggregate(specialists: readonly NormalizedSpecialistAuthority[]) {
  const analyzed = specialists.filter((specialist) => specialist.status === 'analyzed')
  const aggregateDigest = sha256(stableJson(analyzed.map((specialist) => ({
    specialistId: specialist.specialistId,
    semanticResultDigestSha256: specialist.semanticResultDigestSha256,
    evidenceOutputDigestsSha256: specialist.evidenceOutputDigestsSha256,
  }))))
  return {
    findings: analyzed.map((specialist) => ({
      findingId: `controlled-${specialist.specialistId}-${aggregateDigest.slice(0, 20)}`,
      category: categoryForLongFormSemanticSpecialist(specialist.specialistId),
      summary: boundedFindingSummary(specialist.summary),
      confidence: specialist.confidence,
      evidenceOutputDigestsSha256: specialist.evidenceOutputDigestsSha256,
      transferable: false,
      targetAdaptationRequired: true as const,
      exactCopyInstructionCreated: false as const,
    })),
    chunkSummary: 'Controlled specialist reconciliation verifies exact evidence lineage, safety, and durable section authority only; it is not a live Qwen semantic result.',
    runtime: {
      runtimeSource: 'verified_mock' as const,
      adapterId: 'controlled_long_form_semantic_fixture',
      adapterVersion: 'v1',
      providerId: null,
      modelId: 'controlled_fixture',
      modelRevision: 'v1',
      modelAggregateSha256: sha256('controlled-long-form-semantic-fixture-v1'),
      modelRoutingPolicyVersion: 'controlled_test_only',
      synthesisInstructionDigestSha256: aggregateDigest,
      providerCallMade: false,
      modelCallMade: false,
    },
  }
}

function validateStageUsage(input: {
  readonly usage: EditReferenceLongFormStudyUsageEvidence
  readonly production: boolean
  readonly specialists: readonly NormalizedSpecialistAuthority[]
}): void {
  validateEditReferenceLongFormStudyUsage(input.usage)
  if (input.usage.outputBytes !== 0) {
    throw new Error('Long-form semantic synthesis cannot bill or retain output media bytes.')
  }
  if (!input.production) {
    if (input.usage.mode !== 'controlled_test_unmetered') {
      throw new Error('Controlled long-form semantic synthesis cannot claim production cost authority.')
    }
    return
  }
  const specialistUsageIds = new Set(input.specialists.flatMap((specialist) => specialist.usageEventIds))
  const specialistCostIds = new Set(input.specialists.flatMap((specialist) => specialist.internalCostRecordIds))
  if (
    input.usage.mode !== 'production_metered'
    || input.usage.productionCostAuthoritySatisfied !== true
    || BigInt(input.usage.meteredProviderCostMicros as string) <= 0n
    || [...specialistUsageIds].some((id) => !input.usage.usageEventIds.includes(id))
    || [...specialistCostIds].some((id) => !input.usage.internalCostRecordIds.includes(id))
    || input.usage.usageEventIds.length <= specialistUsageIds.size
    || input.usage.internalCostRecordIds.length <= specialistCostIds.size
  ) throw new Error('Production long-form semantic synthesis lacks complete specialist and Qwen cost lineage.')
}

function assertSemanticWorkItem(input: ExecuteEditReferenceLongFormChunkMediaStageInput): void {
  if (input.workItem.stageId !== 'semantic_chunk_synthesis' || !input.workItem.chunkId) {
    throw new Error('Long-form semantic executor received a non-semantic work item.')
  }
  const expectedDependencies = new Set(input.workItem.dependencyWorkItemIds)
  if (
    input.dependencyOutputs.length !== expectedDependencies.size
    || input.dependencyOutputs.some((output) => !expectedDependencies.has(output.workItemId))
    || input.dependencyOutputs.some((output) => output.chunkId !== input.workItem.chunkId)
    || input.dependencyOutputs.some((output) => (
      output.sourceCoverageStartSeconds !== input.workItem.sourceCoverageStartSeconds
      || output.sourceCoverageEndSeconds !== input.workItem.sourceCoverageEndSeconds
    ))
  ) throw new Error('Long-form semantic executor dependency authority is incomplete or cross-section.')
}

function assertSafeText(value: string, maximum: number): void {
  if (
    typeof value !== 'string'
    || !value.trim()
    || value.length > maximum
    || /https?:\/\/|file:\/\/|(?:^|[\s"'`])\/(?:Users|Volumes|home|private|tmp|var)\/|\.\.\/|\.\.\\|signed[_ -]?url|authorization|bearer\s+|service[_ -]?role|api[_ -]?key|private[_ -]?key|password|credential/i.test(value)
  ) throw new Error('Long-form semantic specialist summary contains unsafe private or provider data.')
}

function boundedFindingSummary(value: string): string {
  assertSafeText(value, 4_000)
  const normalized = value.replace(/\s+/g, ' ').trim()
  if (normalized.length <= 1_000) return normalized
  const prefix = normalized.slice(0, 996).trimEnd()
  const lastWordBoundary = prefix.lastIndexOf(' ')
  const bounded = lastWordBoundary >= 800 ? prefix.slice(0, lastWordBoundary) : prefix
  return `${bounded.trimEnd()}…`
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableJson(entry)}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

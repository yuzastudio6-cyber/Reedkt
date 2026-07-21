import { createHash } from 'node:crypto'
import type { ExecuteEditReferenceLongFormChunkMediaStageInput } from './edit-reference-long-form-chunk-media-executor'
import {
  deriveEditReferenceLongFormRequiredOutputManifest,
} from './edit-reference-long-form-study-executor'
import {
  createEditReferenceLongFormStudyWorkOutput,
  validateEditReferenceLongFormStudyWorkOutputAgainstPlan,
  type EditReferenceLongFormStudyWorkOutput,
} from './edit-reference-long-form-study-work-output'
import {
  createUnmeteredEditReferenceLongFormStudyUsage,
  validateEditReferenceLongFormStudyUsage,
  type EditReferenceLongFormStudyUsageEvidence,
} from './edit-reference-long-form-study-usage-contract'
import type {
  EditReferenceLongFormGlobalPattern,
  EditReferenceLongFormSemanticChunkSynthesisResult,
} from './edit-reference-long-form-specialist-stage-contract'

export const EDIT_REFERENCE_LONG_FORM_SPECIALIST_PIPELINE_STAGE_EXECUTOR_VERSION =
  'edit-reference-long-form-specialist-pipeline-stage-executor-v1' as const

export type EditReferenceLongFormSpecialistStageExecutor = (
  input: ExecuteEditReferenceLongFormChunkMediaStageInput,
) => Promise<EditReferenceLongFormStudyWorkOutput>

export type EditReferenceLongFormFinalStageAuthority =
  | {
      readonly executionScope: 'controlled_test'
    }
  | {
      readonly executionScope: 'production'
      readonly resolveUsage: (
        input: ExecuteEditReferenceLongFormChunkMediaStageInput,
      ) => Promise<EditReferenceLongFormStudyUsageEvidence>
    }

export interface CreateEditReferenceLongFormSpecialistPipelineStageExecutorInput {
  /**
   * Owns speech transcript, caption OCR, and semantic-chunk synthesis. The
   * caller composes the already-reviewed provider/tool adapters and their
   * exact cost authorities without leaking them into the durable scheduler.
   */
  readonly executeChunkSpecialistStage: EditReferenceLongFormSpecialistStageExecutor
  /**
   * Final reconciliation and coverage QA are deterministic and run here.
   * Production execution still requires explicit attempt-level usage
   * authority for each final stage.
   */
  readonly finalStageAuthority: EditReferenceLongFormFinalStageAuthority
}

/**
 * Provider-neutral stage router for the complete specialist half of a
 * long-form study. Technical work remains owned by the technical executor;
 * this router cannot activate providers by itself.
 */
export function createEditReferenceLongFormSpecialistPipelineStageExecutor(
  options: CreateEditReferenceLongFormSpecialistPipelineStageExecutorInput,
): EditReferenceLongFormSpecialistStageExecutor {
  return async (input) => {
    if (['speech_transcript', 'caption_ocr', 'semantic_chunk_synthesis'].includes(input.workItem.stageId)) {
      const output = await options.executeChunkSpecialistStage(input)
      if (output.stageId !== input.workItem.stageId || output.workItemId !== input.workItem.workItemId) {
        throw new Error('Long-form chunk specialist returned output for a different stage or work item.')
      }
      validateEditReferenceLongFormStudyWorkOutputAgainstPlan({
        output,
        plan: input.plan,
        workItem: input.workItem,
      })
      return output
    }
    if (input.workItem.stageId === 'global_reconciliation') {
      return executeEditReferenceLongFormGlobalReconciliationStage(input, options.finalStageAuthority)
    }
    if (input.workItem.stageId === 'coverage_qa') {
      return executeEditReferenceLongFormCoverageQaStage(input, options.finalStageAuthority)
    }
    throw new Error(`Long-form specialist pipeline does not own ${input.workItem.stageId}.`)
  }
}

export async function executeEditReferenceLongFormGlobalReconciliationStage(
  input: ExecuteEditReferenceLongFormChunkMediaStageInput,
  authority: EditReferenceLongFormFinalStageAuthority,
): Promise<EditReferenceLongFormStudyWorkOutput> {
  if (input.workItem.stageId !== 'global_reconciliation' || input.workItem.chunkId !== null) {
    throw new Error('Global reconciliation requires the exact final-stage work item.')
  }
  const semanticOutputs = input.plan.chunks.map((chunk) => {
    const candidates = input.dependencyOutputs.filter((output) => (
      output.stageId === 'semantic_chunk_synthesis' && output.chunkId === chunk.chunkId
    ))
    if (candidates.length !== 1 || candidates[0]?.result.kind !== 'semantic_chunk_synthesis') {
      throw new Error('Global reconciliation requires one exact semantic output for every planned section.')
    }
    return candidates[0]
  })
  if (semanticOutputs.length !== input.dependencyOutputs.length) {
    throw new Error('Global reconciliation received unknown or duplicate dependency outputs.')
  }
  const production = authority.executionScope === 'production'
  validateFinalStageDependencyAuthority({ outputs: semanticOutputs, production, semanticOnly: true })
  const started = process.hrtime.bigint()
  const result = {
    kind: 'global_reconciliation' as const,
    chunks: input.plan.chunks.map((chunk, index) => ({
      chunkId: chunk.chunkId,
      coreStartSeconds: chunk.coreStartSeconds,
      coreEndSeconds: chunk.coreEndSeconds,
      semanticOutputDigestSha256: semanticOutputs[index]?.outputDigestSha256 as string,
    })),
    sourceStorySummary: buildSourceStorySummary(semanticOutputs),
    globalPatterns: buildGlobalPatterns(semanticOutputs, input.plan.chunks.map((chunk) => chunk.chunkId)),
    unresolvedContradictions: findIdentityContradictions(semanticOutputs),
    allChunkSynthesisOutputsVerified: true as const,
    fullSourceCoverage: true as const,
    crossChunkContinuityReconciled: true as const,
    exactReferenceSequenceTransferAllowed: false as const,
    referenceIdentityTransferAllowed: false as const,
    copyrightedAssetTransferAllowed: false as const,
  }
  const observedWallClockMs = elapsedMs(started)
  const usage = await resolveFinalStageUsage({ input, authority, observedWallClockMs })
  return createEditReferenceLongFormStudyWorkOutput({
    ...baseOutput(input),
    stageId: result.kind,
    toolIds: ['deterministic_reconciler'],
    artifacts: [],
    result,
    runtimeSource: 'verified_local',
    completionAuthority: production ? 'authoritative' : 'controlled_mock',
    usage,
  })
}

export async function executeEditReferenceLongFormCoverageQaStage(
  input: ExecuteEditReferenceLongFormChunkMediaStageInput,
  authority: EditReferenceLongFormFinalStageAuthority,
): Promise<EditReferenceLongFormStudyWorkOutput> {
  if (input.workItem.stageId !== 'coverage_qa' || input.workItem.chunkId !== null) {
    throw new Error('Coverage QA requires the exact final-stage work item.')
  }
  const manifest = deriveEditReferenceLongFormRequiredOutputManifest({
    run: input.run,
    coverageQaWorkItemId: input.workItem.workItemId,
  })
  const expectedOutputItems = manifest.items.filter((item) => item.outputRecordVerified)
  const outputByWorkItemId = new Map(input.dependencyOutputs.map((output) => [output.workItemId, output]))
  if (
    outputByWorkItemId.size !== input.dependencyOutputs.length
    || input.dependencyOutputs.length !== expectedOutputItems.length
    || expectedOutputItems.some((item) => outputByWorkItemId.get(item.workItemId)?.outputDigestSha256 !== item.outputDigestSha256)
  ) throw new Error('Coverage QA did not receive the exact required output manifest.')
  for (const item of expectedOutputItems) {
    const workItem = input.run.workItems.find((candidate) => candidate.workItemId === item.workItemId)
    const output = outputByWorkItemId.get(item.workItemId)
    if (!workItem || !output) throw new Error('Coverage QA lost a required output record.')
    validateEditReferenceLongFormStudyWorkOutputAgainstPlan({ output, plan: input.plan, workItem })
  }
  const globalOutput = input.dependencyOutputs.find((output) => output.stageId === 'global_reconciliation')
  if (!globalOutput || globalOutput.result.kind !== 'global_reconciliation') {
    throw new Error('Coverage QA requires the exact global reconciliation output.')
  }
  const production = authority.executionScope === 'production'
  const everySemanticRuntimeAuthoritative = semanticRuntimeAuthoritySatisfied(input.dependencyOutputs)
  const everyRequiredOutputCostAuthoritySatisfied = input.dependencyOutputs.every((output) => (
    output.usage.mode === 'production_metered'
    && output.usage.productionCostAuthoritySatisfied
    && output.completionAuthority === 'authoritative'
  ))
  const blockers = [
    ...(!everySemanticRuntimeAuthoritative
      ? ['Semantic study outputs are controlled or lack authoritative live runtime evidence.']
      : []),
    ...(!everyRequiredOutputCostAuthoritySatisfied
      ? ['One or more required study outputs lack production internal-cost authority.']
      : []),
    ...(globalOutput.result.unresolvedContradictions.length > 0
      ? ['Whole-source reconciliation found conflicting semantic identities that require review.']
      : []),
  ]
  const shouldPass = production
    && everySemanticRuntimeAuthoritative
    && everyRequiredOutputCostAuthoritySatisfied
    && blockers.length === 0
  const started = process.hrtime.bigint()
  const result = {
    kind: 'coverage_qa' as const,
    requiredOutputManifestDigestSha256: manifest.digestSha256,
    expectedPriorRequiredWorkItemCount: manifest.priorRequiredWorkItemCount,
    verifiedPriorRequiredWorkItemCount: manifest.priorRequiredWorkItemCount,
    verifiedOutputRecordCount: manifest.expectedOutputRecordCount,
    temporalCoverageRatio: 1 as const,
    chunkStageCoverageRatio: 1 as const,
    continuousAudioCoverageRatio: input.plan.completionStandard.continuousAudioCoverageRatio,
    globalReconciliationVerified: true as const,
    everyRequiredOutputVerified: true as const,
    everySemanticRuntimeAuthoritative,
    everyRequiredOutputCostAuthoritySatisfied,
    qaPassed: shouldPass,
    fullyStudiedEligible: shouldPass,
    blockers,
    partialSamplingClaimedAsFullStudy: false as const,
  }
  const observedWallClockMs = elapsedMs(started)
  const usage = await resolveFinalStageUsage({ input, authority, observedWallClockMs })
  const completionAuthority = shouldPass && usage.productionCostAuthoritySatisfied
    ? 'authoritative' as const
    : 'controlled_mock' as const
  return createEditReferenceLongFormStudyWorkOutput({
    ...baseOutput(input),
    stageId: result.kind,
    toolIds: ['deterministic_coverage_qa'],
    artifacts: [],
    result,
    runtimeSource: 'verified_local',
    completionAuthority,
    usage,
  })
}

function buildSourceStorySummary(
  outputs: readonly EditReferenceLongFormStudyWorkOutput[],
): string {
  const sections = outputs.map((output, index) => {
    const result = output.result as EditReferenceLongFormSemanticChunkSynthesisResult
    return `Section ${index + 1}: ${result.chunkSummary.trim()}`
  })
  return boundedText(sections.join(' '), 8_000)
}

function buildGlobalPatterns(
  outputs: readonly EditReferenceLongFormStudyWorkOutput[],
  orderedChunkIds: readonly string[],
): readonly EditReferenceLongFormGlobalPattern[] {
  const findings = outputs.flatMap((output) => {
    const result = output.result as EditReferenceLongFormSemanticChunkSynthesisResult
    return result.findings.map((finding) => ({ finding, chunkId: output.chunkId as string }))
  })
  const categories = [...new Set(findings.map(({ finding }) => finding.category))]
  return categories.map((category) => {
    const matches = findings.filter(({ finding }) => finding.category === category)
    const summaries = [...new Set(matches.map(({ finding }) => finding.summary.trim()))]
    const evidenceChunkIds = orderedChunkIds.filter((chunkId) => matches.some((match) => match.chunkId === chunkId))
    const confidence = Number((matches.reduce((sum, match) => sum + match.finding.confidence, 0) / matches.length).toFixed(6))
    return {
      patternId: `global-${category}-${sha256(stableJson(matches.map((match) => ({
        chunkId: match.chunkId,
        findingId: match.finding.findingId,
        summary: match.finding.summary,
      })))).slice(0, 20)}`,
      category,
      summary: boundedText(summaries.join(' '), 1_500),
      confidence,
      evidenceChunkIds,
      targetAdaptationRequired: true,
      exactSequenceTransferAllowed: false,
    }
  })
}

function findIdentityContradictions(
  outputs: readonly EditReferenceLongFormStudyWorkOutput[],
): readonly string[] {
  const byId = new Map<string, Set<string>>()
  for (const output of outputs) {
    const result = output.result as EditReferenceLongFormSemanticChunkSynthesisResult
    for (const finding of result.findings) {
      const signatures = byId.get(finding.findingId) ?? new Set<string>()
      signatures.add(stableJson({ category: finding.category, summary: finding.summary }))
      byId.set(finding.findingId, signatures)
    }
  }
  return [...byId.entries()]
    .filter(([, signatures]) => signatures.size > 1)
    .map(([findingId]) => `Semantic finding identity ${findingId} has conflicting source-section evidence and requires review.`)
}

function semanticRuntimeAuthoritySatisfied(
  outputs: readonly EditReferenceLongFormStudyWorkOutput[],
): boolean {
  const semanticStages = outputs.filter((output) => [
    'speech_transcript',
    'caption_ocr',
    'semantic_chunk_synthesis',
    'global_reconciliation',
  ].includes(output.stageId))
  return semanticStages.length > 0 && semanticStages.every((output) => {
    if (output.completionAuthority !== 'authoritative') return false
    if (output.stageId === 'global_reconciliation') return output.runtimeSource === 'verified_local'
    if (output.runtimeSource !== 'verified_live') return false
    if (output.result.kind !== 'semantic_chunk_synthesis') return true
    return output.result.synthesisRuntime.runtimeSource === 'verified_live'
      && output.result.synthesisRuntime.providerCallMade
      && output.result.synthesisRuntime.modelCallMade
  })
}

function validateFinalStageDependencyAuthority(input: {
  readonly outputs: readonly EditReferenceLongFormStudyWorkOutput[]
  readonly production: boolean
  readonly semanticOnly: boolean
}): void {
  if (input.outputs.length < 1) throw new Error('Final long-form stage has no dependency outputs.')
  if (!input.production) return
  if (input.outputs.some((output) => (
    output.completionAuthority !== 'authoritative'
    || output.usage.mode !== 'production_metered'
    || !output.usage.productionCostAuthoritySatisfied
    || (input.semanticOnly && output.runtimeSource !== 'verified_live')
  ))) throw new Error('Production final-stage dependencies lack authoritative runtime or internal-cost evidence.')
}

async function resolveFinalStageUsage(input: {
  readonly input: ExecuteEditReferenceLongFormChunkMediaStageInput
  readonly authority: EditReferenceLongFormFinalStageAuthority
  readonly observedWallClockMs: number
}): Promise<EditReferenceLongFormStudyUsageEvidence> {
  if (input.authority.executionScope === 'controlled_test') {
    return createUnmeteredEditReferenceLongFormStudyUsage({
      mode: 'controlled_test_unmetered',
      observedWallClockMs: input.observedWallClockMs,
      inputMediaSeconds: input.input.workItem.sourceCoverageEndSeconds - input.input.workItem.sourceCoverageStartSeconds,
      outputBytes: 0,
    })
  }
  const usage = await input.authority.resolveUsage(input.input)
  validateEditReferenceLongFormStudyUsage(usage)
  if (
    usage.mode !== 'production_metered'
    || !usage.productionCostAuthoritySatisfied
    || usage.outputBytes !== 0
    || usage.inputMediaSeconds !== Number((
      input.input.workItem.sourceCoverageEndSeconds - input.input.workItem.sourceCoverageStartSeconds
    ).toFixed(3))
  ) throw new Error('Production deterministic final stage lacks exact attempt-level internal-cost authority.')
  return usage
}

function baseOutput(input: ExecuteEditReferenceLongFormChunkMediaStageInput) {
  return {
    runId: input.runId,
    planId: input.plan.planId,
    planDigestSha256: input.plan.planDigestSha256,
    workItemId: input.workItem.workItemId,
    chunkId: input.workItem.chunkId,
    privateMediaArtifactId: input.plan.source.privateMediaArtifactId,
    mediaChecksumSha256: input.plan.source.mediaChecksumSha256,
    sourceCoverageStartSeconds: input.workItem.sourceCoverageStartSeconds,
    sourceCoverageEndSeconds: input.workItem.sourceCoverageEndSeconds,
    originalRemainsImmutable: true as const,
    rawProcessOutputPersisted: false as const,
    signedUrlPersisted: false as const,
    localFilePathPersisted: false as const,
    providerCallMade: false as const,
    customerPriceCalculated: false as const,
    customerCreditsMutated: false as const,
    remoteMutationMade: false as const,
    createdAt: input.createdAt,
  }
}

function elapsedMs(started: bigint): number {
  return Math.max(1, Number((process.hrtime.bigint() - started) / 1_000_000n))
}

function boundedText(value: string, maximumLength: number): string {
  const normalized = value.replace(/\s+/g, ' ').trim()
  if (!normalized) throw new Error('Deterministic long-form reconciliation cannot emit empty semantic text.')
  return normalized.length <= maximumLength ? normalized : `${normalized.slice(0, maximumLength - 1).trimEnd()}…`
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function stableJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`
  const record = value as Record<string, unknown>
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`).join(',')}}`
}

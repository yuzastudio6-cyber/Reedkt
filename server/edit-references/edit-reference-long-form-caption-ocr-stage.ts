import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { lstat } from 'node:fs/promises'
import {
  EDIT_REFERENCE_CAPTION_OCR_STUDY_REQUEST_VERSION,
  validateEditReferenceCaptionOcrStudyRequest,
  validateEditReferenceCaptionOcrStudyResult,
  type EditReferenceAnalyzedCaptionOcrStudyResult,
  type EditReferenceCaptionOcrStudyAdapter,
  type EditReferenceCaptionOcrStudyRequest,
  type EditReferenceCaptionOcrToolId,
} from './edit-reference-caption-ocr-study-contract'
import {
  editReferenceLongFormDependencyArtifactKey,
  type ExecuteEditReferenceLongFormChunkMediaStageInput,
} from './edit-reference-long-form-chunk-media-executor'
import {
  createEditReferenceLongFormStudyWorkOutput,
  validateEditReferenceLongFormStudyWorkOutputAgainstPlan,
  type EditReferenceLongFormStudyOutputArtifact,
  type EditReferenceLongFormStudyWorkOutput,
} from './edit-reference-long-form-study-work-output'
import {
  createUnmeteredEditReferenceLongFormStudyUsage,
  validateEditReferenceLongFormStudyUsage,
  type EditReferenceLongFormStudyUsageEvidence,
} from './edit-reference-long-form-study-usage-contract'
import { createEditReferenceReviewedLocalPaddleOcrAdapter } from './edit-reference-reviewed-local-paddleocr-adapter'
import {
  resolveEditReferenceReviewedLocalPaddleOcrRuntimeReceipt,
  type EditReferenceReviewedLocalPaddleOcrRunValidationBinding,
} from './edit-reference-reviewed-local-paddleocr-runtime'
import type { EditReferenceLongFormSpecialistStageExecutor } from './edit-reference-long-form-specialist-pipeline-stage-executor'

export interface EditReferenceLongFormCaptionOcrFrameCostAuthority {
  readonly approvedUsageEstimateId: string
  readonly internalCostBudgetId: string
  readonly maximumAuthorizedInternalCostMicros: string
}

export type EditReferenceLongFormCaptionOcrStageAuthority =
  | {
      readonly executionScope: 'controlled_test'
    }
  | {
      readonly executionScope: 'reviewed_local'
      readonly approvedAdapterId: string
      readonly approvedAdapterVersion: string
      readonly approvedToolId: 'paddleocr'
    }
  | {
      readonly executionScope: 'production'
      readonly approvedAdapterId: string
      readonly approvedAdapterVersion: string
      readonly approvedToolId: EditReferenceCaptionOcrToolId
      readonly usage: EditReferenceLongFormStudyUsageEvidence
      readonly frameCostAuthorities: readonly EditReferenceLongFormCaptionOcrFrameCostAuthority[]
    }

export interface ExecuteEditReferenceLongFormCaptionOcrStageOptions {
  readonly adapter: EditReferenceCaptionOcrStudyAdapter
  readonly authority: EditReferenceLongFormCaptionOcrStageAuthority
  readonly permittedToolIds?: readonly EditReferenceCaptionOcrToolId[]
  readonly languageHints?: readonly string[]
  readonly maxRegionsPerFrame?: number
}

export interface ExecuteReviewedLocalEditReferenceLongFormCaptionOcrStageOptions {
  readonly manifestPath: string
  readonly detectionModelPath: string
  readonly recognitionModelPath: string
  readonly pythonCommand: string
  readonly runValidation?: EditReferenceReviewedLocalPaddleOcrRunValidationBinding
  readonly runnerScriptPath?: string
  readonly timeoutMs?: number
}

interface PreparedFrame {
  readonly artifact: EditReferenceLongFormStudyOutputArtifact
  readonly localPath: string
}

/**
 * Creates a deliberately single-purpose local OCR executor. Pair it with
 * `specialistStageIds: ['caption_ocr']`, or compose it with the reviewed local
 * transcript executor, so unavailable semantic stages keep zero attempts.
 */
export function createReviewedLocalEditReferenceLongFormCaptionOcrStageExecutor(
  options: ExecuteReviewedLocalEditReferenceLongFormCaptionOcrStageOptions,
): EditReferenceLongFormSpecialistStageExecutor {
  return async (input) => {
    if (input.workItem.stageId !== 'caption_ocr') {
      throw new Error('The reviewed local PaddleOCR executor owns only caption_ocr work.')
    }
    return executeReviewedLocalEditReferenceLongFormCaptionOcrStage(input, options)
  }
}

export async function executeReviewedLocalEditReferenceLongFormCaptionOcrStage(
  input: ExecuteEditReferenceLongFormChunkMediaStageInput,
  options: ExecuteReviewedLocalEditReferenceLongFormCaptionOcrStageOptions,
): Promise<EditReferenceLongFormStudyWorkOutput> {
  const runtime = await resolveEditReferenceReviewedLocalPaddleOcrRuntimeReceipt({
    manifestPath: options.manifestPath,
    detectionModelPath: options.detectionModelPath,
    recognitionModelPath: options.recognitionModelPath,
    pythonCommand: options.pythonCommand,
    ...(options.runValidation ? { runValidation: options.runValidation } : {}),
    ...(options.timeoutMs ? { timeoutMs: options.timeoutMs } : {}),
  })
  const visual = requireVisualSamplingDependency(input)
  const frames = await prepareAndVerifyFrames(input, visual)
  const privateFramePathByChecksum = new Map(
    frames.map((frame) => [frame.artifact.checksumSha256, frame.localPath] as const),
  )
  const adapter = createEditReferenceReviewedLocalPaddleOcrAdapter({
    runtime,
    pythonCommand: options.pythonCommand,
    detectionModelPath: options.detectionModelPath,
    recognitionModelPath: options.recognitionModelPath,
    privateFramePathByChecksum,
    runnerScriptPath: options.runnerScriptPath,
    timeoutMs: options.timeoutMs,
  })
  return executeEditReferenceLongFormCaptionOcrStage(input, {
    adapter,
    authority: {
      executionScope: 'reviewed_local',
      approvedAdapterId: adapter.adapterId,
      approvedAdapterVersion: adapter.adapterVersion,
      approvedToolId: 'paddleocr',
    },
    permittedToolIds: ['paddleocr'],
    languageHints: ['eng'],
  })
}

export async function executeEditReferenceLongFormCaptionOcrStage(
  input: ExecuteEditReferenceLongFormChunkMediaStageInput,
  options: ExecuteEditReferenceLongFormCaptionOcrStageOptions,
): Promise<EditReferenceLongFormStudyWorkOutput> {
  const visual = requireVisualSamplingDependency(input)
  const frames = await prepareAndVerifyFrames(input, visual)
  const permittedToolIds = options.permittedToolIds ?? options.adapter.supportedToolIds
  const languageHints = options.languageHints ?? ['eng']
  const maxRegionsPerFrame = options.maxRegionsPerFrame ?? 16
  if (frames.length < 1 || frames.length > 24) throw new Error('Long-form OCR frame batch is invalid.')
  validateAdapterAuthority({ adapter: options.adapter, authority: options.authority, permittedToolIds })
  if (options.authority.executionScope === 'production') {
    validateProductionAuthority(options.authority, frames.length)
  }
  const started = process.hrtime.bigint()
  const analyzed: EditReferenceAnalyzedCaptionOcrStudyResult[] = []
  for (const [index, frame] of frames.entries()) {
    const request = createFrameRequest({
      input,
      visual,
      frame,
      frameIndex: index,
      permittedToolIds,
      languageHints,
      maxRegionsPerFrame,
      authority: options.authority,
    })
    validateEditReferenceCaptionOcrStudyRequest(request)
    const result = await options.adapter.analyze(request)
    validateEditReferenceCaptionOcrStudyResult(request, result)
    if (result.status !== 'analyzed' || result.coverage.partial || result.coverage.failedFrameTimesSeconds.length > 0) {
      throw new Error('Long-form OCR frame analysis is unavailable or incomplete for this section.')
    }
    if (
      result.provenance.adapterId !== options.adapter.adapterId
      || result.provenance.adapterVersion !== options.adapter.adapterVersion
      || !options.adapter.supportedToolIds.includes(result.tool.toolId)
    ) throw new Error('Long-form OCR result does not match the exact approved adapter authority.')
    analyzed.push(result)
  }
  const observedWallClockMs = Math.max(1, Number((process.hrtime.bigint() - started) / 1_000_000n))
  const production = options.authority.executionScope === 'production'
  const reviewedLocal = options.authority.executionScope === 'reviewed_local'
  const usage = production
    ? options.authority.usage
    : createUnmeteredEditReferenceLongFormStudyUsage({
        mode: reviewedLocal ? 'backend_local_unmetered' : 'controlled_test_unmetered',
        observedWallClockMs,
        inputMediaSeconds: input.workItem.sourceCoverageEndSeconds - input.workItem.sourceCoverageStartSeconds,
        outputBytes: 0,
      })
  validateAggregatedUsage({ authority: options.authority, usage, analyzed })
  const sourceTimes = frames.map((frame) => frame.artifact.sourceTimeSeconds as number)
  const regionCounts = analyzed.map((result) => result.summary.totalTextRegionCount)
  const textRegionCount = regionCounts.reduce((sum, count) => sum + count, 0)
  const confidenceNumerator = analyzed.reduce((sum, result) => (
    sum + result.summary.averageRegionConfidence * result.summary.totalTextRegionCount
  ), 0)
  const observedToolId = requireOneProductionTool(analyzed)
  if (production && observedToolId !== options.authority.approvedToolId) {
    throw new Error('Long-form OCR result used a different tool than the approved production authority.')
  }
  if (reviewedLocal && observedToolId !== options.authority.approvedToolId) {
    throw new Error('Long-form OCR result used a different tool than the reviewed local authority.')
  }
  const result = {
    kind: 'caption_ocr' as const,
    framePlanDigestSha256: sha256(JSON.stringify(sourceTimes.map((sourceTimeSeconds, index) => ({
      sourceTimeSeconds,
      checksumSha256: frames[index]?.artifact.checksumSha256,
    })))),
    requestedFrameTimesSeconds: sourceTimes,
    analyzedFrameTimesSeconds: sourceTimes,
    failedFrameTimesSeconds: [] as readonly number[],
    framesWithVisibleText: analyzed.filter((record) => record.summary.framesWithVisibleText > 0).length,
    textRegionCount,
    averageRegionConfidence: textRegionCount === 0
      ? 0
      : Number((confidenceNumerator / textRegionCount).toFixed(6)),
    ocrToolId: production || reviewedLocal ? observedToolId : 'controlled_specialist_fixture' as const,
    ocrEngineExecuted: production || reviewedLocal,
    fullPlannedFrameCoverage: true as const,
    rawOcrOutputPersisted: false as const,
    recognizedTextPersisted: false as const,
    exactCaptionWordingRetained: false as const,
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
    toolIds: production || reviewedLocal ? [observedToolId] : ['controlled_specialist_fixture'],
    artifacts: [],
    result,
    runtimeSource: production ? 'verified_live' : reviewedLocal ? 'verified_local' : 'verified_mock',
    completionAuthority: production || reviewedLocal ? 'authoritative' : 'controlled_mock',
    usage,
    originalRemainsImmutable: true,
    rawProcessOutputPersisted: false,
    signedUrlPersisted: false,
    localFilePathPersisted: false,
    providerCallMade: false,
    customerPriceCalculated: false,
    customerCreditsMutated: false,
    remoteMutationMade: false,
    createdAt: input.createdAt,
  })
}

function createFrameRequest(input: {
  readonly input: ExecuteEditReferenceLongFormChunkMediaStageInput
  readonly visual: EditReferenceLongFormStudyWorkOutput
  readonly frame: PreparedFrame
  readonly frameIndex: number
  readonly permittedToolIds: readonly EditReferenceCaptionOcrToolId[]
  readonly languageHints: readonly string[]
  readonly maxRegionsPerFrame: number
  readonly authority: EditReferenceLongFormCaptionOcrStageAuthority
}): EditReferenceCaptionOcrStudyRequest {
  const cost = input.authority.executionScope === 'production'
    ? input.authority.frameCostAuthorities[input.frameIndex]
    : undefined
  if (input.authority.executionScope === 'production' && !cost) {
    throw new Error('Long-form OCR frame is missing its bounded internal-cost authority.')
  }
  const artifactIdentity = sha256([
    input.visual.workItemId,
    input.frame.artifact.storageObjectPath,
    input.frame.artifact.checksumSha256,
  ].join(':')).slice(0, 24)
  return {
    schemaVersion: EDIT_REFERENCE_CAPTION_OCR_STUDY_REQUEST_VERSION,
    workspaceId: input.input.plan.workspaceId,
    editReferenceId: input.input.plan.editReferenceId,
    studySessionId: input.input.plan.studySessionId,
    orchestrationId: `long-form-ocr-${sha256(`${input.input.runId}:${input.input.workItem.workItemId}:${input.frameIndex}`).slice(0, 24)}`,
    privateMediaArtifactId: `long-form-frame-${artifactIdentity}`,
    mediaChecksumSha256: input.frame.artifact.checksumSha256,
    framePlanDigestSha256: sha256(JSON.stringify({
      workItemId: input.input.workItem.workItemId,
      sourceTimeSeconds: input.frame.artifact.sourceTimeSeconds,
      frameChecksumSha256: input.frame.artifact.checksumSha256,
    })),
    privateArtifactAccessVerified: true,
    privateArtifactFinalized: true,
    mediaChecksumVerified: true,
    inputEvidenceIds: [`visual-output-${input.visual.outputDigestSha256.slice(0, 32)}`],
    frameTimesSeconds: [0],
    maxScanDurationSeconds: 1,
    maxRegionsPerFrame: input.maxRegionsPerFrame,
    permittedToolIds: input.permittedToolIds,
    languageHints: input.languageHints,
    executionScope: input.authority.executionScope,
    approvedUsageEstimateId: cost?.approvedUsageEstimateId ?? null,
    internalCostBudgetId: cost?.internalCostBudgetId ?? null,
    maximumAuthorizedInternalCostMicros: cost?.maximumAuthorizedInternalCostMicros ?? null,
    exactTextRetention: 'forbidden',
    externalUrlFetchAllowed: false,
    customerPriceCalculationAllowed: false,
    customerCreditMutationAllowed: false,
  }
}

function validateProductionAuthority(
  authority: Extract<EditReferenceLongFormCaptionOcrStageAuthority, { executionScope: 'production' }>,
  frameCount: number,
): void {
  validateEditReferenceLongFormStudyUsage(authority.usage)
  if (
    authority.usage.mode !== 'production_metered'
    || authority.usage.productionCostAuthoritySatisfied !== true
    || authority.usage.meteredProviderCostMicros !== '0'
    || authority.usage.outputBytes !== 0
    || authority.frameCostAuthorities.length !== frameCount
  ) throw new Error('Production long-form OCR lacks exact aggregate and per-frame cost authority.')
  const maximumFrameCost = authority.frameCostAuthorities.reduce((sum, frame) => {
    assertPositiveMoney(frame.maximumAuthorizedInternalCostMicros)
    return sum + BigInt(frame.maximumAuthorizedInternalCostMicros)
  }, 0n)
  if (maximumFrameCost > BigInt(authority.usage.maximumAuthorizedInternalCostMicros as string)) {
    throw new Error('Long-form OCR per-frame cost ceilings exceed the aggregate authorized amount.')
  }
}

function validateAdapterAuthority(input: {
  readonly adapter: EditReferenceCaptionOcrStudyAdapter
  readonly authority: EditReferenceLongFormCaptionOcrStageAuthority
  readonly permittedToolIds: readonly EditReferenceCaptionOcrToolId[]
}): void {
  if (
    !input.adapter.adapterId.trim()
    || !input.adapter.adapterVersion.trim()
    || input.adapter.supportedToolIds.length < 1
    || new Set(input.adapter.supportedToolIds).size !== input.adapter.supportedToolIds.length
    || input.permittedToolIds.length < 1
    || new Set(input.permittedToolIds).size !== input.permittedToolIds.length
    || input.permittedToolIds.some((toolId) => !input.adapter.supportedToolIds.includes(toolId))
  ) throw new Error('Long-form OCR adapter and permitted-tool authority are invalid.')
  if (input.authority.executionScope === 'controlled_test') return
  if (
    input.adapter.adapterId !== input.authority.approvedAdapterId
    || input.adapter.adapterVersion !== input.authority.approvedAdapterVersion
    || !input.adapter.supportedToolIds.includes(input.authority.approvedToolId)
    || input.permittedToolIds.length !== 1
    || input.permittedToolIds[0] !== input.authority.approvedToolId
  ) throw new Error('Authoritative long-form OCR requires one exact reviewed adapter and tool authority.')
}

function validateAggregatedUsage(input: {
  readonly authority: EditReferenceLongFormCaptionOcrStageAuthority
  readonly usage: EditReferenceLongFormStudyUsageEvidence
  readonly analyzed: readonly EditReferenceAnalyzedCaptionOcrStudyResult[]
}): void {
  validateEditReferenceLongFormStudyUsage(input.usage)
  if (input.authority.executionScope !== 'production') {
    const expectedUsageMode = input.authority.executionScope === 'reviewed_local'
      ? 'backend_local_unmetered'
      : 'controlled_test_unmetered'
    if (
      input.usage.mode !== expectedUsageMode
      || input.analyzed.some((result) => result.usage.mode !== expectedUsageMode)
    ) throw new Error('Unmetered long-form OCR cannot claim production cost evidence.')
    return
  }
  const resultUsageEventIds = input.analyzed.flatMap((result) => result.usage.usageEventIds)
  const resultCostRecordIds = input.analyzed.flatMap((result) => result.usage.internalCostRecordIds)
  const metered = input.analyzed.reduce(
    (sum, result) => sum + BigInt(result.usage.meteredInternalCostMicros),
    0n,
  )
  if (
    input.analyzed.some((result) => result.usage.mode !== 'production_metered')
    || stableJson(input.usage.usageEventIds) !== stableJson(resultUsageEventIds)
    || stableJson(input.usage.internalCostRecordIds) !== stableJson(resultCostRecordIds)
    || BigInt(input.usage.meteredInfrastructureCostMicros as string) !== metered
    || BigInt(input.usage.meteredInternalCostMicros as string) !== metered
  ) throw new Error('Long-form OCR aggregate internal-cost evidence does not reconcile to its frame attempts.')
}

function requireOneProductionTool(
  results: readonly EditReferenceAnalyzedCaptionOcrStudyResult[],
): EditReferenceCaptionOcrToolId {
  const toolIds = [...new Set(results.map((result) => result.tool.toolId))]
  if (toolIds.length !== 1 || !toolIds[0]) {
    throw new Error('Long-form OCR frames must use one reviewed OCR tool for consistent section evidence.')
  }
  return toolIds[0]
}

function requireVisualSamplingDependency(
  input: ExecuteEditReferenceLongFormChunkMediaStageInput,
): EditReferenceLongFormStudyWorkOutput {
  if (input.workItem.stageId !== 'caption_ocr' || !input.workItem.chunkId) {
    throw new Error('Long-form OCR executor received a non-OCR work item.')
  }
  const visual = input.dependencyOutputs.find((candidate) => (
    candidate.stageId === 'visual_sampling' && candidate.chunkId === input.workItem.chunkId
  ))
  if (!visual || visual.result.kind !== 'visual_sampling') {
    throw new Error('Long-form OCR requires the exact completed visual-sampling output.')
  }
  const dependencyItem = input.run.workItems.find((candidate) => candidate.workItemId === visual.workItemId)
  if (
    !dependencyItem
    || dependencyItem.status !== 'completed'
    || !input.workItem.dependencyWorkItemIds.includes(visual.workItemId)
  ) throw new Error('Long-form OCR visual dependency is not completed in the exact run checkpoint.')
  validateEditReferenceLongFormStudyWorkOutputAgainstPlan({ output: visual, plan: input.plan, workItem: dependencyItem })
  return visual
}

async function prepareAndVerifyFrames(
  input: ExecuteEditReferenceLongFormChunkMediaStageInput,
  visual: EditReferenceLongFormStudyWorkOutput,
): Promise<PreparedFrame[]> {
  if (visual.result.kind !== 'visual_sampling') throw new Error('Long-form OCR visual output is invalid.')
  const artifacts = [...visual.artifacts].sort((left, right) => (
    (left.sourceTimeSeconds as number) - (right.sourceTimeSeconds as number)
  ))
  if (
    artifacts.length !== visual.result.sampleTimesSeconds.length
    || stableJson(artifacts.map((artifact) => artifact.sourceTimeSeconds)) !== stableJson(visual.result.sampleTimesSeconds)
  ) throw new Error('Long-form OCR frame artifacts do not match the exact visual sample plan.')
  const frames: PreparedFrame[] = []
  for (const artifact of artifacts) {
    if (artifact.role !== 'visual_sample') throw new Error('Long-form OCR received a non-frame derivative.')
    const localPath = input.dependencyArtifactLocalPaths[editReferenceLongFormDependencyArtifactKey(
      visual.workItemId,
      artifact.storageObjectPath,
    )]
    if (!localPath) throw new Error('Long-form OCR private frame path is unavailable.')
    const stat = await lstat(localPath)
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size !== artifact.sizeBytes) {
      throw new Error('Long-form OCR private frame identity is invalid.')
    }
    if (await checksumFile(localPath) !== artifact.checksumSha256) {
      throw new Error('Long-form OCR private frame checksum is invalid.')
    }
    frames.push({ artifact, localPath })
  }
  return frames
}

async function checksumFile(file: string): Promise<string> {
  const hash = createHash('sha256')
  for await (const chunk of createReadStream(file)) hash.update(chunk as Buffer)
  return hash.digest('hex')
}

function assertPositiveMoney(value: string): void {
  if (!/^(?:0|[1-9][0-9]{0,23})$/.test(value) || BigInt(value) <= 0n) {
    throw new Error('Long-form OCR frame cost ceiling is invalid.')
  }
}

function stableJson(value: unknown): string {
  return JSON.stringify(value)
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

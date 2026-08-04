import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { lstat, realpath } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { z } from 'zod'
import {
  EDIT_REFERENCE_CAPTION_OCR_STUDY_RESULT_VERSION,
  hashEditReferenceCaptionOcrStudyRequest,
  validateEditReferenceCaptionOcrStudyRequest,
  type EditReferenceAnalyzedCaptionOcrStudyResult,
  type EditReferenceCaptionOcrStudyAdapter,
  type EditReferenceCaptionOcrStudyRequest,
} from './edit-reference-caption-ocr-study-contract'
import type { EditReferenceReviewedLocalPaddleOcrRuntimeReceipt } from './edit-reference-reviewed-local-paddleocr-runtime'

const execFileAsync = promisify(execFile)
const DEFAULT_RUNNER_SCRIPT_PATH = fileURLToPath(new URL('./runtime/paddleocr-analyze-frame.py', import.meta.url))

const frameResultSchema = z.object({
  schemaVersion: z.literal('reeditpro-reviewed-local-paddleocr-frame-batch-v1'),
  frames: z.array(z.object({
    frameIndex: z.number().int().min(0).max(23),
    frameWidth: z.number().int().min(1).max(16_384),
    frameHeight: z.number().int().min(1).max(16_384),
    regions: z.array(z.object({
      normalizedBounds: z.object({
        x: z.number().min(0).max(1),
        y: z.number().min(0).max(1),
        width: z.number().positive().max(1),
        height: z.number().positive().max(1),
      }).strict(),
      lineCount: z.number().int().min(1).max(8),
      estimatedCharacterCount: z.number().int().min(1).max(500),
      confidence: z.number().min(0).max(1),
      exactTextPersisted: z.literal(false),
    }).strict()).max(16),
  }).strict()).min(1).max(24),
  rawOcrOutputPersisted: z.literal(false),
  recognizedTextPersisted: z.literal(false),
  externalUrlFetched: z.literal(false),
  providerCallMade: z.literal(false),
}).strict()

export interface CreateEditReferenceReviewedLocalPaddleOcrAdapterInput {
  readonly runtime: EditReferenceReviewedLocalPaddleOcrRuntimeReceipt
  readonly pythonCommand: string
  readonly detectionModelPath: string
  readonly recognitionModelPath: string
  readonly privateFramePathByChecksum: ReadonlyMap<string, string>
  /**
   * Ordered multi-frame authority. Unlike a checksum-keyed map, this list
   * preserves repeated frames that occur at different source times. The
   * checksum map remains the compatibility path for existing one-frame and
   * unique-frame callers.
   */
  readonly privateFrames?: readonly {
    readonly sourceTimeSeconds: number
    readonly frameChecksumSha256: string
    readonly localFilePath: string
  }[]
  /**
   * Multi-frame study authority. When present, the request binds the original
   * private source checksum while the ordered entries bind each ephemeral frame.
   * Legacy one-frame callers continue to bind `mediaChecksumSha256` directly
   * to their sole frame checksum.
   */
  readonly sourceMediaChecksumSha256?: string
  readonly framePlanDigestSha256?: string
  readonly runnerScriptPath?: string
  readonly timeoutMs?: number
}

/**
 * Path-private adapter for the reviewed SD-local PaddleOCR runtime. Durable
 * requests contain only checksums; filesystem paths remain inside this
 * executor closure and recognized text is reduced to count/geometry in Python.
 */
export function createEditReferenceReviewedLocalPaddleOcrAdapter(
  input: CreateEditReferenceReviewedLocalPaddleOcrAdapterInput,
): EditReferenceCaptionOcrStudyAdapter {
  const adapterId = 'reeditpro_reviewed_local_paddleocr'
  const adapterVersion = input.runtime.adapterVersion
  const runnerScriptPath = input.runnerScriptPath ?? DEFAULT_RUNNER_SCRIPT_PATH
  const timeoutMs = Math.min(30 * 60 * 1_000, Math.max(10_000, input.timeoutMs ?? 10 * 60 * 1_000))
  const orderedPrivateFrames = input.privateFrames
  const frameEntries = orderedPrivateFrames
    ? orderedPrivateFrames.map((frame) => [frame.frameChecksumSha256, frame.localFilePath] as const)
    : [...input.privateFramePathByChecksum.entries()]
  if (frameEntries.length < 1 || frameEntries.length > 24) {
    throw new Error('Reviewed local PaddleOCR requires one to 24 private frame identities.')
  }
  let batchPromise: Promise<readonly z.infer<typeof frameResultSchema>['frames'][number][]> | undefined

  return {
    adapterId,
    adapterVersion,
    supportedToolIds: ['paddleocr'],
    async analyze(request): Promise<EditReferenceAnalyzedCaptionOcrStudyResult> {
      validateReviewedLocalRequest(request, input, frameEntries)
      const requestFrameEntries = frameEntriesForRequest(request, input, frameEntries)
      const requestDigestSha256 = hashEditReferenceCaptionOcrStudyRequest(request)
      const startedAt = new Date().toISOString()
      const executionId = `paddleocr-frame-${sha256(`${request.orchestrationId}:${input.runtime.runtimeId}`).slice(0, 24)}`
      batchPromise ??= prepareAndExecuteBatch({
        input,
        runnerScriptPath,
        frameEntries,
        maxRegionsPerFrame: request.maxRegionsPerFrame,
        timeoutMs,
      })
      const outputByOccurrence = await batchPromise
      const outputs = requestFrameEntries.map((_, index) => {
        const output = outputByOccurrence[index]
        if (!output) throw new Error('Reviewed local PaddleOCR batch lost an approved frame identity.')
        return {
          output,
          frameTimeSeconds: request.frameTimesSeconds[index] as number,
        }
      })
      const completedAt = new Date().toISOString()
      const observations = outputs.map(({ output, frameTimeSeconds }, frameIndex) => ({
        frameTimeSeconds,
        textRegions: output.regions.map((region, regionIndex) => ({
          regionId: `ocr-region-${sha256(`${requestDigestSha256}:${frameIndex}:${regionIndex}:${stableJson(region)}`).slice(0, 24)}`,
          ...region,
        })),
      }))
      const regions = observations.flatMap((observation) => observation.textRegions)
      const averageRegionConfidence = regions.length === 0
        ? 0
        : regions.reduce((sum, region) => sum + region.confidence, 0) / regions.length
      return {
        schemaVersion: EDIT_REFERENCE_CAPTION_OCR_STUDY_RESULT_VERSION,
        requestDigestSha256,
        status: 'analyzed',
        runtimeSource: 'verified_local',
        workspaceId: request.workspaceId,
        editReferenceId: request.editReferenceId,
        studySessionId: request.studySessionId,
        orchestrationId: request.orchestrationId,
        privateMediaArtifactId: request.privateMediaArtifactId,
        mediaChecksumSha256: request.mediaChecksumSha256,
        framePlanDigestSha256: request.framePlanDigestSha256,
        inputEvidenceIds: request.inputEvidenceIds,
        analysisArtifactIds: [`paddleocr-analysis-${sha256(`${requestDigestSha256}:${input.runtime.combinedModelDigestSha256}`).slice(0, 24)}`],
        tool: {
          toolId: 'paddleocr',
          toolVersion: input.runtime.adapterVersion,
          languagePackIds: input.runtime.languagePackIds,
          modelWeightOrCheckpointReviewVerified: true,
          languagePackReviewVerified: true,
        },
        coverage: {
          requestedFrameTimesSeconds: request.frameTimesSeconds,
          analyzedFrameTimesSeconds: request.frameTimesSeconds,
          failedFrameTimesSeconds: [],
          partial: false,
        },
        observations,
        summary: {
          analyzedFrameCount: observations.length,
          framesWithVisibleText: observations.filter((observation) => observation.textRegions.length > 0).length,
          totalTextRegionCount: regions.length,
          averageRegionConfidence,
        },
        execution: {
          fileBytesRead: true,
          mediaProcessingStarted: true,
          ocrEngineExecuted: true,
          externalUrlFetched: false,
          providerCallMade: false,
          remoteMutationMade: false,
          workerJobCreated: false,
        },
        provenance: {
          adapterId,
          adapterVersion,
          executionId,
          startedAt,
          completedAt,
        },
        usage: {
          mode: 'backend_local_unmetered',
          approvedUsageEstimateId: null,
          internalCostBudgetId: null,
          maximumAuthorizedInternalCostMicros: null,
          meteredInternalCostMicros: '0',
          usageEventIds: [],
          internalCostRecordIds: [],
          customerPriceCalculated: false,
          customerCreditsMutated: false,
          serviceFeeIncluded: false,
        },
        privacy: {
          rawFramesPersisted: false,
          rawOcrOutputPersisted: false,
          recognizedTextPersisted: false,
          signedUrlPersisted: false,
          rawProviderPayloadPersisted: false,
        },
        semanticBoundary: {
          captionDesignInterpreted: false,
          transcriptAlignmentRan: false,
          speechTimingRan: false,
        },
        copySafety: {
          exactCaptionWordingRetained: false,
          exactTimingCopyInstructionCreated: false,
          referenceLayoutCopyInstructionCreated: false,
        },
      }
    },
  }
}

function validateReviewedLocalRequest(
  request: EditReferenceCaptionOcrStudyRequest,
  input: CreateEditReferenceReviewedLocalPaddleOcrAdapterInput,
  frameEntries: readonly (readonly [string, string])[],
): void {
  validateEditReferenceCaptionOcrStudyRequest(request)
  const multiFrameAuthority = input.sourceMediaChecksumSha256 !== undefined
    || input.framePlanDigestSha256 !== undefined
  if (multiFrameAuthority) {
    const derivedFramePlanDigestSha256 = sha256(stableJson(request.frameTimesSeconds.map((sourceTimeSeconds, index) => ({
      sourceTimeSeconds,
      frameChecksumSha256: frameEntries[index]?.[0],
    }))))
    if (
      !input.sourceMediaChecksumSha256
      || !input.framePlanDigestSha256
      || !/^[a-f0-9]{64}$/.test(input.sourceMediaChecksumSha256)
      || !/^[a-f0-9]{64}$/.test(input.framePlanDigestSha256)
      || frameEntries.some(([checksumSha256]) => !/^[a-f0-9]{64}$/.test(checksumSha256))
      || request.mediaChecksumSha256 !== input.sourceMediaChecksumSha256
      || request.framePlanDigestSha256 !== input.framePlanDigestSha256
      || request.framePlanDigestSha256 !== derivedFramePlanDigestSha256
      || request.frameTimesSeconds.length !== frameEntries.length
      || (input.privateFrames !== undefined && input.privateFrames.some((frame, index) => (
        !Number.isFinite(frame.sourceTimeSeconds)
        || frame.sourceTimeSeconds < 0
        || frame.sourceTimeSeconds !== request.frameTimesSeconds[index]
      )))
    ) throw new Error('Reviewed local PaddleOCR multi-frame authority is incomplete or mismatched.')
  }
  if (
    request.executionScope !== 'reviewed_local'
    || stableJson(request.permittedToolIds) !== stableJson(['paddleocr'])
    || stableJson(request.languageHints) !== stableJson(['eng'])
    || (!multiFrameAuthority && (
      request.frameTimesSeconds.length !== 1
      || request.frameTimesSeconds[0] !== 0
      || !input.privateFramePathByChecksum.has(request.mediaChecksumSha256)
    ))
    || request.approvedUsageEstimateId !== null
    || request.internalCostBudgetId !== null
    || request.maximumAuthorizedInternalCostMicros !== null
  ) throw new Error('Reviewed local PaddleOCR request exceeds its exact language, tool, frame, or cost authority.')
}

function frameEntriesForRequest(
  request: EditReferenceCaptionOcrStudyRequest,
  input: CreateEditReferenceReviewedLocalPaddleOcrAdapterInput,
  frameEntries: readonly (readonly [string, string])[],
): readonly (readonly [string, string])[] {
  const multiFrameAuthority = input.sourceMediaChecksumSha256 !== undefined
    || input.framePlanDigestSha256 !== undefined
  if (multiFrameAuthority) return frameEntries
  const selected = frameEntries.filter(([checksumSha256]) => checksumSha256 === request.mediaChecksumSha256)
  if (selected.length !== 1) {
    throw new Error('Reviewed local PaddleOCR one-frame request does not resolve to one exact batch frame.')
  }
  return selected
}

async function prepareAndExecuteBatch(input: {
  readonly input: CreateEditReferenceReviewedLocalPaddleOcrAdapterInput
  readonly runnerScriptPath: string
  readonly frameEntries: readonly (readonly [string, string])[]
  readonly maxRegionsPerFrame: number
  readonly timeoutMs: number
}): Promise<readonly z.infer<typeof frameResultSchema>['frames'][number][]> {
  await validateRuntimePath(input.input.pythonCommand, 'PaddleOCR Python command', false, true)
  await validateRuntimePath(input.input.detectionModelPath, 'PaddleOCR detection model', true)
  await validateRuntimePath(input.input.recognitionModelPath, 'PaddleOCR recognition model', true)
  await validateRuntimePath(input.runnerScriptPath, 'PaddleOCR frame runner')
  for (const [checksumSha256, framePath] of input.frameEntries) {
    await validatePrivateFrame(framePath, checksumSha256)
  }
  const output = await executeFrameBatch({
    pythonCommand: input.input.pythonCommand,
    runnerScriptPath: input.runnerScriptPath,
    detectionModelPath: input.input.detectionModelPath,
    recognitionModelPath: input.input.recognitionModelPath,
    framePaths: input.frameEntries.map(([, framePath]) => framePath),
    maxRegionsPerFrame: input.maxRegionsPerFrame,
    timeoutMs: input.timeoutMs,
  })
  if (
    output.frames.length !== input.frameEntries.length
    || output.frames.some((frame, index) => frame.frameIndex !== index)
  ) throw new Error('Reviewed local PaddleOCR batch coverage does not match its exact private frame set.')
  return output.frames
}

async function executeFrameBatch(input: {
  readonly pythonCommand: string
  readonly runnerScriptPath: string
  readonly detectionModelPath: string
  readonly recognitionModelPath: string
  readonly framePaths: readonly string[]
  readonly maxRegionsPerFrame: number
  readonly timeoutMs: number
}): Promise<z.infer<typeof frameResultSchema>> {
  try {
    const result = await execFileAsync(input.pythonCommand, [
      input.runnerScriptPath,
      input.detectionModelPath,
      input.recognitionModelPath,
      String(input.maxRegionsPerFrame),
      ...input.framePaths,
    ], {
      timeout: input.timeoutMs,
      maxBuffer: 2 * 1024 * 1024,
      windowsHide: true,
      env: {
        ...process.env,
        HF_HUB_OFFLINE: '1',
        HF_HUB_DISABLE_TELEMETRY: '1',
        PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK: 'True',
      },
    })
    const parsed = frameResultSchema.safeParse(JSON.parse(result.stdout.trim()) as unknown)
    if (!parsed.success) throw new Error('invalid result')
    return parsed.data
  } catch {
    throw new Error('Reviewed local PaddleOCR frame execution failed closed.')
  }
}

async function validateRuntimePath(
  value: string,
  label: string,
  directory = false,
  allowExecutableAlias = false,
): Promise<void> {
  const resolved = await realpath(value)
  if (!path.isAbsolute(value) || (!allowExecutableAlias && resolved !== path.resolve(value))) {
    throw new Error(`${label} must be one absolute non-aliased path.`)
  }
  const fileStat = await lstat(value)
  const targetStat = await lstat(resolved)
  if (
    (!allowExecutableAlias && fileStat.isSymbolicLink())
    || (directory ? !fileStat.isDirectory() : !targetStat.isFile())
  ) {
    throw new Error(`${label} has an invalid filesystem identity.`)
  }
}

async function validatePrivateFrame(framePath: string, expectedChecksumSha256: string): Promise<void> {
  await validateRuntimePath(framePath, 'PaddleOCR private frame')
  const hash = createHash('sha256')
  for await (const chunk of createReadStream(framePath)) hash.update(chunk)
  if (hash.digest('hex') !== expectedChecksumSha256) {
    throw new Error('Reviewed local PaddleOCR private frame checksum changed before execution.')
  }
}

function stableJson(value: unknown): string {
  return JSON.stringify(value)
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

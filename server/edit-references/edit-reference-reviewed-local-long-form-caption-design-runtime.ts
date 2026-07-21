import { lstat, realpath } from 'node:fs/promises'
import path from 'node:path'
import {
  EDIT_REFERENCE_CAPTION_OCR_STUDY_REQUEST_VERSION,
  validateEditReferenceCaptionOcrStudyResult,
  type EditReferenceCaptionOcrStudyRequest,
} from './edit-reference-caption-ocr-study-contract'
import {
  createEditReferenceReviewedLocalCaptionTimingAuthority,
  type EditReferenceCaptionTimingAuthorityReceipt,
} from './edit-reference-caption-timing-authority'
import type {
  EditReferenceCaptionDesignOcrAuthorityResolverInput,
  EditReferenceCaptionDesignRuntimeInput,
  EditReferenceCaptionDesignTimingAuthorityResolverInput,
} from './edit-reference-media-study'
import {
  editReferenceLongFormDependencyArtifactKey,
  type ExecuteEditReferenceLongFormChunkMediaStageInput,
} from './edit-reference-long-form-chunk-media-executor'
import type { EditReferenceLongFormSemanticWindowEvidenceBundle } from './edit-reference-long-form-semantic-window-evidence'
import type { EditReferenceLongFormSemanticWindowSpecialistRequest } from './edit-reference-long-form-semantic-window-dispatcher'
import {
  validateEditReferenceLongFormStudyWorkOutputAgainstPlan,
  type EditReferenceLongFormStudyWorkOutput,
} from './edit-reference-long-form-study-work-output'
import { createEditReferenceReviewedLocalPaddleOcrAdapter } from './edit-reference-reviewed-local-paddleocr-adapter'
import {
  resolveEditReferenceReviewedLocalPaddleOcrRuntimeReceipt,
  type EditReferenceReviewedLocalPaddleOcrRunValidationBinding,
} from './edit-reference-reviewed-local-paddleocr-runtime'
import type { EditReferenceReviewedLocalQwen25VlMlxRunValidationBinding } from './edit-reference-reviewed-local-qwen25vl-mlx-runtime'

export const EDIT_REFERENCE_REVIEWED_LOCAL_LONG_FORM_CAPTION_DESIGN_RUNTIME_ID =
  'edit_reference_reviewed_local_long_form_caption_design_runtime' as const
export const EDIT_REFERENCE_REVIEWED_LOCAL_LONG_FORM_CAPTION_DESIGN_RUNTIME_VERSION =
  'v1' as const

const AUTHORIZED_EXTERNAL_SD_ROOT = '/Volumes/REeditproWork/' as const
const SHA256_PATTERN = /^[a-f0-9]{64}$/

export interface ResolveEditReferenceReviewedLocalLongFormCaptionDesignRuntimeInput {
  readonly stageInput: ExecuteEditReferenceLongFormChunkMediaStageInput
  readonly request: EditReferenceLongFormSemanticWindowSpecialistRequest
  readonly evidence: EditReferenceLongFormSemanticWindowEvidenceBundle
  readonly studyGoalEvidenceId: string
  readonly qwen: {
    readonly manifestPath: string
    readonly modelPath: string
    readonly pythonCommand: string
    readonly runValidation?: EditReferenceReviewedLocalQwen25VlMlxRunValidationBinding
    readonly runnerScriptPath?: string
    readonly timeoutMs?: number
  }
  readonly paddleOcr: {
    readonly manifestPath: string
    readonly detectionModelPath: string
    readonly recognitionModelPath: string
    readonly pythonCommand: string
    readonly runValidation?: EditReferenceReviewedLocalPaddleOcrRunValidationBinding
    readonly runnerScriptPath?: string
    readonly timeoutMs?: number
  }
}

/**
 * Binds the already-scheduled reviewed-local OCR and Faster Whisper lineage to
 * one exact semantic window, while rerunning only the no-text OCR geometry
 * needed by the bounded Caption Design specialist. Exact transcript wording
 * never enters the runtime request or a semantic checkpoint.
 */
export async function resolveEditReferenceReviewedLocalLongFormCaptionDesignRuntime(
  input: ResolveEditReferenceReviewedLocalLongFormCaptionDesignRuntimeInput,
): Promise<{ readonly specialistId: 'caption_design'; readonly runtime: EditReferenceCaptionDesignRuntimeInput }> {
  validateResolverBinding(input)
  requireCaptionOcrOutput(input.stageInput, input.request)
  const paddleRuntime = await resolveEditReferenceReviewedLocalPaddleOcrRuntimeReceipt({
    manifestPath: input.paddleOcr.manifestPath,
    detectionModelPath: input.paddleOcr.detectionModelPath,
    recognitionModelPath: input.paddleOcr.recognitionModelPath,
    pythonCommand: input.paddleOcr.pythonCommand,
    ...(input.paddleOcr.runValidation ? { runValidation: input.paddleOcr.runValidation } : {}),
    ...(input.paddleOcr.timeoutMs ? { timeoutMs: input.paddleOcr.timeoutMs } : {}),
  })
  const timingAuthority = await resolveWindowTimingAuthority(input)
  const orchestrationId = `long-form-caption:${input.request.runId}:${input.request.semanticWindowOrdinal}`

  return {
    specialistId: 'caption_design',
    runtime: {
      runtimeKind: 'reviewed_local_qwen25vl_mlx',
      orchestrationId,
      studySessionId: input.stageInput.plan.studySessionId,
      studyGoalEvidenceId: input.studyGoalEvidenceId,
      manifestPath: input.qwen.manifestPath,
      modelPath: input.qwen.modelPath,
      pythonCommand: input.qwen.pythonCommand,
      ...(input.qwen.runValidation ? { runValidation: input.qwen.runValidation } : {}),
      ...(input.qwen.runnerScriptPath ? { runnerScriptPath: input.qwen.runnerScriptPath } : {}),
      ...(input.qwen.timeoutMs ? { timeoutMs: input.qwen.timeoutMs } : {}),
      captionOcrAuthorityResolver: async (resolverInput) => {
        validateOcrResolverInput(input, resolverInput, orchestrationId)
        const framePathByChecksum = new Map(
          resolverInput.frames.map((frame) => [frame.frameChecksumSha256, frame.localFilePath] as const),
        )
        const request = createCaptionOcrRequest(resolverInput)
        const adapter = createEditReferenceReviewedLocalPaddleOcrAdapter({
          runtime: paddleRuntime,
          pythonCommand: input.paddleOcr.pythonCommand,
          detectionModelPath: input.paddleOcr.detectionModelPath,
          recognitionModelPath: input.paddleOcr.recognitionModelPath,
          privateFramePathByChecksum: framePathByChecksum,
          privateFrames: resolverInput.frames.map((frame) => ({
            sourceTimeSeconds: frame.sourceTimeSeconds,
            frameChecksumSha256: frame.frameChecksumSha256,
            localFilePath: frame.localFilePath,
          })),
          sourceMediaChecksumSha256: resolverInput.mediaChecksumSha256,
          framePlanDigestSha256: resolverInput.framePlanDigestSha256,
          ...(input.paddleOcr.runnerScriptPath ? { runnerScriptPath: input.paddleOcr.runnerScriptPath } : {}),
          ...(input.paddleOcr.timeoutMs ? { timeoutMs: input.paddleOcr.timeoutMs } : {}),
        })
        const result = await adapter.analyze(request)
        validateEditReferenceCaptionOcrStudyResult(request, result)
        if (result.status !== 'analyzed') {
          throw new Error('Reviewed local long-form Caption Design OCR did not produce exact analyzed authority.')
        }
        return { request, result }
      },
      ...(timingAuthority
        ? {
            captionTimingAuthorityResolver: async (resolverInput: EditReferenceCaptionDesignTimingAuthorityResolverInput) => {
              validateTimingResolverInput(input, resolverInput, orchestrationId, timingAuthority)
              return timingAuthority
            },
          }
        : {}),
    },
  }
}

function validateResolverBinding(
  input: ResolveEditReferenceReviewedLocalLongFormCaptionDesignRuntimeInput,
): void {
  const { request, evidence, stageInput } = input
  if (
    request.specialistId !== 'caption_design'
    || request.executionScope !== 'controlled_test'
    || request.runId !== stageInput.runId
    || request.planId !== stageInput.plan.planId
    || request.planDigestSha256 !== stageInput.plan.planDigestSha256
    || request.workItemId !== stageInput.workItem.workItemId
    || request.chunkId !== stageInput.workItem.chunkId
    || request.privateMediaArtifactId !== stageInput.plan.source.privateMediaArtifactId
    || request.mediaChecksumSha256 !== stageInput.plan.source.mediaChecksumSha256
    || request.semanticWindowId !== evidence.semanticWindowId
    || request.sourceStartSeconds !== evidence.sourceStartSeconds
    || request.sourceEndSeconds !== evidence.sourceEndSeconds
    || request.sourceTimeOffsetSeconds !== evidence.sourceTimeOffsetSeconds
    || request.providerLocalEndSeconds !== evidence.durationSeconds
    || evidence.exactProviderLocalEvidencePrepared !== true
    || !input.studyGoalEvidenceId.trim()
    || input.studyGoalEvidenceId.length > 200
  ) throw new Error('Reviewed local Caption Design runtime binding is incomplete or exceeds controlled authority.')
}

function requireCaptionOcrOutput(
  stageInput: ExecuteEditReferenceLongFormChunkMediaStageInput,
  request: EditReferenceLongFormSemanticWindowSpecialistRequest,
): EditReferenceLongFormStudyWorkOutput {
  const output = stageInput.dependencyOutputs.find((candidate) => (
    candidate.stageId === 'caption_ocr' && candidate.chunkId === request.chunkId
  ))
  const workItem = output && stageInput.run.workItems.find((candidate) => (
    candidate.workItemId === output.workItemId
  ))
  if (
    !output
    || !workItem
    || workItem.status !== 'completed'
    || !stageInput.workItem.dependencyWorkItemIds.includes(output.workItemId)
    || output.result.kind !== 'caption_ocr'
    || output.runtimeSource !== 'verified_local'
    || output.completionAuthority !== 'authoritative'
    || output.toolIds.length !== 1
    || output.toolIds[0] !== 'paddleocr'
    || !output.result.ocrEngineExecuted
    || !output.result.fullPlannedFrameCoverage
    || output.result.failedFrameTimesSeconds.length > 0
    || output.result.rawOcrOutputPersisted
    || output.result.recognizedTextPersisted
    || output.providerCallMade
    || output.remoteMutationMade
  ) throw new Error('Reviewed local Caption Design requires one completed authoritative PaddleOCR section output.')
  validateEditReferenceLongFormStudyWorkOutputAgainstPlan({ output, plan: stageInput.plan, workItem })
  return output
}

async function resolveWindowTimingAuthority(
  input: ResolveEditReferenceReviewedLocalLongFormCaptionDesignRuntimeInput,
): Promise<EditReferenceCaptionTimingAuthorityReceipt | undefined> {
  if (!input.stageInput.plan.source.hasAudio) return undefined
  const output = input.stageInput.dependencyOutputs.find((candidate) => (
    candidate.stageId === 'speech_transcript' && candidate.chunkId === input.request.chunkId
  ))
  const workItem = output && input.stageInput.run.workItems.find((candidate) => (
    candidate.workItemId === output.workItemId
  ))
  if (!output || !workItem || output.result.kind !== 'speech_transcript') {
    throw new Error('Reviewed local timed Caption Design lacks the planned speech transcript output.')
  }
  if (!output.result.speechPresent) return undefined
  const ranges = output.result.segmentTimingRanges.filter((range) => (
    range.sourceStartSeconds >= input.request.sourceStartSeconds - 0.001
    && range.sourceEndSeconds <= input.request.sourceEndSeconds + 0.001
  ))
  const crossing = output.result.segmentTimingRanges.some((range) => (
    range.sourceStartSeconds < input.request.sourceEndSeconds - 0.001
    && range.sourceEndSeconds > input.request.sourceStartSeconds + 0.001
    && (
      range.sourceStartSeconds < input.request.sourceStartSeconds - 0.001
      || range.sourceEndSeconds > input.request.sourceEndSeconds + 0.001
    )
  ))
  if (crossing) throw new Error('Reviewed local Caption Design semantic window clips exact transcript timing.')
  if (ranges.length < 1) return undefined
  const artifact = output.artifacts.find((candidate) => candidate.role === 'private_transcript')
  if (
    !artifact
    || workItem.status !== 'completed'
    || !input.stageInput.workItem.dependencyWorkItemIds.includes(output.workItemId)
    || output.runtimeSource !== 'verified_local'
    || output.completionAuthority !== 'authoritative'
    || output.result.wordTimingMode !== 'exact'
    || output.result.interpolatedWordTimingUsed
    || output.result.transcriptTextPersistedInWorkOutput
    || output.providerCallMade
    || output.remoteMutationMade
  ) throw new Error('Reviewed local timed Caption Design transcript authority is incomplete.')
  validateEditReferenceLongFormStudyWorkOutputAgainstPlan({
    output,
    plan: input.stageInput.plan,
    workItem,
  })
  const localFilePath = input.stageInput.dependencyArtifactLocalPaths[
    editReferenceLongFormDependencyArtifactKey(output.workItemId, artifact.storageObjectPath)
  ]
  if (!localFilePath) throw new Error('Reviewed local timed Caption Design transcript path is unavailable.')
  await assertExternalPrivateFile(localFilePath)
  return createEditReferenceReviewedLocalCaptionTimingAuthority({
    plan: input.stageInput.plan,
    workItem,
    transcriptOutput: output,
    privateTranscriptRoot: path.dirname(localFilePath),
    privateTranscriptLocalPath: localFilePath,
    outputRoot: input.evidence.outputRoot,
    sourceWindow: {
      startSeconds: input.request.sourceStartSeconds,
      endSeconds: input.request.sourceEndSeconds,
      rebaseToZero: true,
    },
  })
}

function validateOcrResolverInput(
  input: ResolveEditReferenceReviewedLocalLongFormCaptionDesignRuntimeInput,
  resolverInput: EditReferenceCaptionDesignOcrAuthorityResolverInput,
  orchestrationId: string,
): void {
  if (
    resolverInput.workspaceId !== input.stageInput.plan.workspaceId
    || resolverInput.editReferenceId !== input.stageInput.plan.editReferenceId
    || resolverInput.studySessionId !== input.stageInput.plan.studySessionId
    || resolverInput.orchestrationId !== orchestrationId
    || resolverInput.privateMediaArtifactId !== input.request.privateMediaArtifactId
    || resolverInput.mediaChecksumSha256 !== input.request.mediaChecksumSha256
    || resolverInput.sourceDurationSeconds !== input.evidence.durationSeconds
    || resolverInput.frames.length < 1
    || resolverInput.frames.length > 8
    || resolverInput.frames.some((frame) => (
      !SHA256_PATTERN.test(frame.frameChecksumSha256)
      || frame.sourceTimeSeconds < 0
      || frame.sourceTimeSeconds > input.evidence.durationSeconds
      || !path.resolve(frame.localFilePath).startsWith(`${path.resolve(input.evidence.outputRoot)}${path.sep}`)
    ))
  ) throw new Error('Reviewed local Caption Design OCR resolver input changed after semantic-window binding.')
}

function createCaptionOcrRequest(
  input: EditReferenceCaptionDesignOcrAuthorityResolverInput,
): EditReferenceCaptionOcrStudyRequest {
  return {
    schemaVersion: EDIT_REFERENCE_CAPTION_OCR_STUDY_REQUEST_VERSION,
    workspaceId: input.workspaceId,
    editReferenceId: input.editReferenceId,
    studySessionId: input.studySessionId,
    orchestrationId: input.orchestrationId,
    privateMediaArtifactId: input.privateMediaArtifactId,
    mediaChecksumSha256: input.mediaChecksumSha256,
    framePlanDigestSha256: input.framePlanDigestSha256,
    privateArtifactAccessVerified: true,
    privateArtifactFinalized: true,
    mediaChecksumVerified: true,
    inputEvidenceIds: [...input.inputEvidenceIds],
    frameTimesSeconds: input.frames.map((frame) => frame.sourceTimeSeconds),
    maxScanDurationSeconds: Math.min(120, input.sourceDurationSeconds),
    maxRegionsPerFrame: 16,
    permittedToolIds: ['paddleocr'],
    languageHints: ['eng'],
    executionScope: 'reviewed_local',
    approvedUsageEstimateId: null,
    internalCostBudgetId: null,
    maximumAuthorizedInternalCostMicros: null,
    exactTextRetention: 'forbidden',
    externalUrlFetchAllowed: false,
    customerPriceCalculationAllowed: false,
    customerCreditMutationAllowed: false,
  }
}

function validateTimingResolverInput(
  input: ResolveEditReferenceReviewedLocalLongFormCaptionDesignRuntimeInput,
  resolverInput: EditReferenceCaptionDesignTimingAuthorityResolverInput,
  orchestrationId: string,
  timingAuthority: EditReferenceCaptionTimingAuthorityReceipt,
): void {
  if (
    resolverInput.workspaceId !== input.stageInput.plan.workspaceId
    || resolverInput.editReferenceId !== input.stageInput.plan.editReferenceId
    || resolverInput.studySessionId !== input.stageInput.plan.studySessionId
    || resolverInput.orchestrationId !== orchestrationId
    || resolverInput.privateMediaArtifactId !== input.request.privateMediaArtifactId
    || resolverInput.mediaChecksumSha256 !== input.request.mediaChecksumSha256
    || resolverInput.sourceDurationSeconds !== input.evidence.durationSeconds
    || resolverInput.analysisWindowStartSeconds !== 0
    || resolverInput.analysisWindowEndSeconds !== input.evidence.durationSeconds
    || !SHA256_PATTERN.test(timingAuthority.wordTimingChecksumSha256)
  ) throw new Error('Reviewed local Caption Design timing resolver input changed after semantic-window binding.')
}

async function assertExternalPrivateFile(value: string): Promise<void> {
  const configured = path.resolve(value)
  const stat = await lstat(configured)
  if (!stat.isFile() || stat.isSymbolicLink()) {
    throw new Error('Reviewed local Caption Design private transcript is not one regular file.')
  }
  const resolved = await realpath(configured)
  if (!resolved.startsWith(AUTHORIZED_EXTERNAL_SD_ROOT)) {
    throw new Error('Reviewed local Caption Design private transcript escaped the authorized external SD volume.')
  }
}

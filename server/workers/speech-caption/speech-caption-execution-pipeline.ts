import { runCaptionExecution } from '../captions/caption-execution-runner'
import { runSpeechExecution } from '../speech/speech-execution-runner'
import { assertNoForbiddenSpeechExecutionFields } from '../speech/faster-whisper-execution-policy'
import { buildSpeechCaptionExecutionPipelineResult } from './speech-caption-execution-result-builder'
import type {
  CaptionExecutionResult,
  SpeechCaptionExecutionPipelineInput,
  SpeechCaptionExecutionPipelineResult,
  SpeechExecutionResult,
} from './speech-caption-pipeline-types'

export async function runSpeechCaptionExecutionPipeline(
  input: SpeechCaptionExecutionPipelineInput,
): Promise<SpeechCaptionExecutionPipelineResult> {
  assertNoForbiddenSpeechExecutionFields(input)

  if (input.mode === 'production_blocked') {
    return buildSpeechCaptionExecutionPipelineResult({
      request: input,
      speech: {
        mode: input.mode,
        status: 'blocked',
        artifacts: [],
        qaResults: [],
        modelWeightStatus: 'blocked',
        skippedReasons: [{
          code: 'production_speech_caption_blocked',
          message: 'production_blocked mode refuses real speech/caption execution.',
          tool: 'faster_whisper',
        }],
        warnings: [],
      },
    })
  }

  const shouldRunSpeech = input.buildSpeech !== false
  const shouldRunCaptions = input.buildCaptions !== false
  let speech: SpeechExecutionResult | undefined
  let captions: CaptionExecutionResult | undefined

  if (shouldRunSpeech) {
    speech = await runSpeechExecution({
      mode: input.mode,
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      mediaAssetId: input.mediaAssetId,
      approvedSnapshotId: input.approvedSnapshotId,
      toolExecutionPlanId: input.toolExecutionPlanId,
      idempotencyKey: input.idempotencyKey,
      sourceAudioArtifactId: input.sourceAudioArtifactId,
      sourceAudioLocalPath: input.sourceAudioLocalPath,
      outputDirectory: input.outputDirectory,
      modelWeightManifestId: input.modelWeightManifestId,
      modelName: input.modelName,
      localModelPath: input.localModelPath,
      language: input.language,
      device: input.device ?? 'auto',
      computeType: input.computeType,
      wordTimestamps: input.wordTimestamps ?? true,
      vadFilter: input.vadFilter ?? true,
      beamSize: input.beamSize,
      timeoutMs: input.timeoutMs ?? 60_000,
      enableRealTranscription: input.enableRealTranscription ?? false,
      allowModelDownload: input.allowModelDownload ?? false,
      workerPayload: input.workerPayload,
      mockSegments: input.mockSegments,
    })
  }

  if (shouldRunCaptions) {
    captions = await runCaptionExecution({
      mode: input.mode,
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      mediaAssetId: input.mediaAssetId,
      approvedSnapshotId: input.approvedSnapshotId,
      toolExecutionPlanId: input.toolExecutionPlanId,
      idempotencyKey: input.idempotencyKey,
      transcript: speech?.transcript,
      wordTimestamps: speech?.wordTimestamps,
      transcriptSegments: speech?.transcript?.segments ?? input.mockSegments,
      captionStyle: input.captionStyle,
      outputDirectory: input.outputDirectory,
      buildSrt: input.captionFormats ? input.captionFormats.includes('srt') : true,
      buildWebVtt: input.captionFormats ? input.captionFormats.includes('webvtt') : true,
      buildAss: input.captionFormats ? input.captionFormats.includes('ass') : true,
      buildPreview: input.enableCaptionPreview === true,
      sourceVideoLocalPath: input.sourceVideoLocalPath,
      timeoutMs: input.timeoutMs,
      enableCaptionPreview: input.enableCaptionPreview ?? false,
      workerPayload: input.workerPayload,
    })
  }

  return buildSpeechCaptionExecutionPipelineResult({
    request: input,
    speech,
    captions,
  })
}

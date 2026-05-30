import { buildDeepFilterNetCommand, runDeepFilterNetCleanup } from './deepfilternet-adapter'
import { buildDemucsCommand, runDemucsSeparation } from './demucs-adapter'
import { buildAudioExecutionArtifactRecord } from './audio-execution-artifact-writer'
import type { AudioCleanupExecutionResult, AudioExecutionInput, AudioExecutionPlan } from './audio-execution-types'
import type { AudioFoundationRunMode, AudioToolSkipReason } from './audio-foundation-types'

export async function runAudioCleanupExecution(input: {
  executionInput: AudioExecutionInput
  executionPlan: AudioExecutionPlan
}): Promise<AudioCleanupExecutionResult> {
  const skipReasons: AudioToolSkipReason[] = []
  const warnings: string[] = []
  const selectedTool = input.executionPlan.cleanupOperationPlan.selectedPrimaryTool

  if (selectedTool === 'ffmpeg') {
    return {
      status: 'planned',
      cleanedAudioArtifact: buildAudioExecutionArtifactRecord({
        workspaceId: input.executionInput.workspaceId,
        projectId: input.executionInput.projectId,
        mediaAssetId: input.executionInput.mediaAssetId,
        artifactType: 'cleaned_audio',
        fileName: 'ffmpeg-basic-cleaned-audio.wav',
        contentType: 'audio/wav',
        sourceOfTruth: true,
        metadata: { cleanupTool: 'ffmpeg', executionPlanId: input.executionPlan.executionPlanId },
      }),
      separatedStemArtifacts: [],
      skipReasons,
      warnings: ['FFmpeg basic cleanup is represented by loudness/normalization planning in M15A.'],
    }
  }

  if (selectedTool === 'deepfilternet') {
    const result = await runDeepFilterNetCleanup({
      sourceAudioLocalPath: input.executionInput.sourceAudioLocalPath,
      outputAudioLocalPath: input.executionInput.outputDirectory ? `${input.executionInput.outputDirectory}/deepfilternet-cleaned.wav` : undefined,
      timeoutMs: input.executionInput.timeoutMs ?? 20_000,
      runMode: toAudioFoundationMode(input.executionInput.mode),
      localDevToolExecution: input.executionInput.enableModelAudioExecution,
      modelWeightManifestId: input.executionInput.modelWeightManifestIds?.find((id) => id === 'deepfilternet_model'),
      allowModelDownload: input.executionInput.allowModelDownload,
    })
    skipReasons.push(result.skipReason)
    try {
      buildDeepFilterNetCommand({
        sourceAudioLocalPath: input.executionInput.sourceAudioLocalPath,
        outputAudioLocalPath: input.executionInput.outputDirectory ? `${input.executionInput.outputDirectory}/deepfilternet-cleaned.wav` : undefined,
        timeoutMs: input.executionInput.timeoutMs ?? 20_000,
        runMode: toAudioFoundationMode(input.executionInput.mode),
        localDevToolExecution: input.executionInput.enableModelAudioExecution,
        modelWeightManifestId: input.executionInput.modelWeightManifestIds?.find((id) => id === 'deepfilternet_model'),
        allowModelDownload: input.executionInput.allowModelDownload,
      })
    } catch (error) {
      warnings.push(error instanceof Error ? error.message : 'DeepFilterNet command planning failed.')
    }
  }

  if (input.executionPlan.selectedOperations.includes('separate_music_speech_demucs')) {
    const result = await runDemucsSeparation({
      sourceAudioLocalPath: input.executionInput.sourceAudioLocalPath,
      outputDirectory: input.executionInput.outputDirectory,
      timeoutMs: input.executionInput.timeoutMs ?? 30_000,
      runMode: toAudioFoundationMode(input.executionInput.mode),
      localDevToolExecution: input.executionInput.enableModelAudioExecution,
      modelWeightManifestId: input.executionInput.modelWeightManifestIds?.find((id) => id === 'demucs_model'),
      allowModelDownload: input.executionInput.allowModelDownload,
    })
    skipReasons.push(result.skipReason)
    try {
      buildDemucsCommand({
        sourceAudioLocalPath: input.executionInput.sourceAudioLocalPath,
        outputDirectory: input.executionInput.outputDirectory,
        timeoutMs: input.executionInput.timeoutMs ?? 30_000,
        runMode: toAudioFoundationMode(input.executionInput.mode),
        localDevToolExecution: input.executionInput.enableModelAudioExecution,
        modelWeightManifestId: input.executionInput.modelWeightManifestIds?.find((id) => id === 'demucs_model'),
        allowModelDownload: input.executionInput.allowModelDownload,
      })
    } catch (error) {
      warnings.push(error instanceof Error ? error.message : 'Demucs command planning failed.')
    }
  }

  return {
    status: skipReasons.length > 0 ? 'skipped' : 'planned',
    separatedStemArtifacts: [],
    skipReasons,
    warnings,
  }
}

function toAudioFoundationMode(mode: AudioExecutionInput['mode']): AudioFoundationRunMode {
  if (mode === 'local_dev') return 'local_dev'
  if (mode === 'production_blocked' || mode === 'production_ready') return 'production_blocked'
  return 'dry_run'
}

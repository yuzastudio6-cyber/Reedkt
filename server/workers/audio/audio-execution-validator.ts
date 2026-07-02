import path from 'node:path'
import { assertNoPathTraversal, assertNoSignedUrlOrRawUrl, assertOutputPathInsideRoot, assertSourceNotOverwritten } from '../media/media-path-safety'
import type { AudioExecutionInput, AudioExecutionPlan, AudioExecutionValidationResult } from './audio-execution-types'

export function validateAudioExecutionInput(input: AudioExecutionInput): AudioExecutionValidationResult {
  const issues: AudioExecutionValidationResult['issues'] = []

  if (input.allowFinalMux === true) issues.push(blocking('final_mux_blocked', 'Final mux/export is out of scope for M15A.'))
  if (input.allowModelDownload === true) issues.push(blocking('model_download_blocked', 'Model downloads are blocked.'))
  if ((input.arbitraryFfmpegArgs?.length ?? 0) > 0) issues.push(blocking('arbitrary_ffmpeg_args', 'Arbitrary FFmpeg args are blocked.'))

  for (const [label, value] of [
    ['sourceAudioStorageObjectPath', input.sourceAudioStorageObjectPath],
    ['sourceAudioLocalPath', input.sourceAudioLocalPath],
    ['outputDirectory', input.outputDirectory],
  ] as const) {
    if (!value) continue
    try {
      assertNoSignedUrlOrRawUrl(value, label)
      assertNoPathTraversal(value, label)
    } catch (error) {
      issues.push(blocking('unsafe_audio_reference', error instanceof Error ? error.message : `${label} is unsafe.`))
    }
  }

  if (input.sourceAudioLocalPath && input.outputDirectory) {
    try {
      const outputPath = assertOutputPathInsideRoot(path.join(input.outputDirectory, 'normalized-audio.wav'), input.outputDirectory)
      assertSourceNotOverwritten(input.sourceAudioLocalPath, outputPath)
    } catch {
      issues.push(blocking('source_overwrite_risk', 'Audio output must not overwrite source audio.'))
    }
  }

  const loudness = input.loudnessPlan
  if (loudness && (loudness.targetLufs < -24 || loudness.targetLufs > -10)) {
    issues.push(blocking('unsafe_loudness_target', 'Loudness target must stay within -24 to -10 LUFS for M15A.'))
  }
  if (loudness && (loudness.truePeakDb > -0.1 || loudness.truePeakDb < -6)) {
    issues.push(blocking('unsafe_true_peak_target', 'True peak target must stay between -6 and -0.1 dBTP.'))
  }

  const selectedTool = input.audioCleanupPlan?.selectedPrimaryTool
  if (selectedTool === 'deepfilternet' || selectedTool === 'rnnoise') {
    const speechPresent = input.audioAnalysis?.speechPresence === 'present'
    const noiseKnown = typeof input.audioAnalysis?.noiseLevel === 'number' && input.audioAnalysis.noiseLevel > 0.1
    if (!speechPresent && !noiseKnown) {
      issues.push(blocking('voice_cleanup_not_justified', `${selectedTool} requires speech/noise evidence.`))
    }
  }

  const demucsRequested = input.audioCleanupPlan?.fallbackTools.includes('demucs') === true ||
    input.audioCleanupPlan?.operations.some((operation) => operation.toolId === 'demucs') === true
  if (demucsRequested && input.audioAnalysis?.musicSpeechOverlap !== true && !input.approvedDemucsReason) {
    issues.push(blocking('demucs_not_justified', 'Demucs requires music/speech overlap or an approved explicit plan reason.'))
  }

  if (input.mode === 'production_ready') {
    const modelToolSelected = selectedTool === 'deepfilternet' || selectedTool === 'rnnoise' || demucsRequested
    if (modelToolSelected && (input.modelWeightManifestIds?.length ?? 0) === 0) {
      issues.push(blocking('model_weight_manifest_required', 'Production model audio tools require modelWeightManifestId.'))
    }
  }

  return {
    valid: !issues.some((issue) => issue.severity === 'blocking'),
    issues,
  }
}

export function validateAudioExecutionPlan(input: AudioExecutionPlan): AudioExecutionValidationResult {
  const issues: AudioExecutionValidationResult['issues'] = []
  if (input.finalMuxAllowed) issues.push(blocking('final_mux_allowed', 'Audio execution plan must keep finalMuxAllowed false.'))
  if (input.loudnessOperationPlan.targetLufs < -24 || input.loudnessOperationPlan.targetLufs > -10) {
    issues.push(blocking('unsafe_loudness_target', 'Execution plan loudness target is outside M15A policy.'))
  }
  if (input.loudnessOperationPlan.truePeakDb > -0.1 || input.loudnessOperationPlan.truePeakDb < -6) {
    issues.push(blocking('unsafe_true_peak_target', 'Execution plan true peak target is outside M15A policy.'))
  }
  return {
    valid: !issues.some((issue) => issue.severity === 'blocking'),
    issues,
  }
}

function blocking(code: string, message: string): AudioExecutionValidationResult['issues'][number] {
  return { code, message, severity: 'blocking' }
}

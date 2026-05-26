import { buildAudioExecutionArtifact } from './audio-execution-artifact-writer'
import type { SoundSyncCuePlan } from './audio-foundation-types'
import type { AudioExecutionMode } from './audio-execution-types'

export function buildSoundSyncCueArtifact(input: {
  workspaceId: string
  projectId: string
  mediaAssetId: string
  soundSyncCuePlan: SoundSyncCuePlan
  outputDirectory?: string
  mode: Exclude<AudioExecutionMode, 'production_blocked'>
}) {
  return buildAudioExecutionArtifact({
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    artifactType: 'audio_analysis_json',
    fileName: 'soundsync-cues.json',
    payload: {
      ...input.soundSyncCuePlan,
      noSfxGeneration: true,
      noBeatDetectionClaim: input.soundSyncCuePlan.beatDetectionRan === false,
    },
    outputDirectory: input.outputDirectory,
    mode: input.mode,
    contentType: 'application/json',
    sourceOfTruth: true,
    metadata: {
      artifactRole: 'soundsync_cue_metadata',
      cueCount: input.soundSyncCuePlan.cues.length,
      beatDetectionRan: false,
    },
  })
}

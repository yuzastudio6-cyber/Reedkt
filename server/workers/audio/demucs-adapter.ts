import { existsSync } from 'node:fs'
import { assertNoPathTraversal, assertNoSignedUrlOrRawUrl } from '../media/media-path-safety'
import type { AudioFoundationRunMode, AudioToolSkipReason } from './audio-foundation-types'

export interface DemucsInput {
  sourceAudioLocalPath?: string
  outputDirectory?: string
  demucsCommand?: string
  timeoutMs: number
  runMode: AudioFoundationRunMode
  localDevToolExecution?: boolean
  modelWeightManifestId?: string
  allowModelDownload?: boolean
}

export function validateDemucsInput(input: DemucsInput): void {
  if (input.allowModelDownload) throw new Error('Milestone 9 forbids Demucs model downloads.')
  for (const [label, value] of Object.entries({
    sourceAudioLocalPath: input.sourceAudioLocalPath,
    outputDirectory: input.outputDirectory,
  })) {
    if (value) {
      assertNoSignedUrlOrRawUrl(value, label)
      assertNoPathTraversal(value, label)
    }
  }
  if (input.runMode === 'production_blocked' && !input.modelWeightManifestId) {
    throw new Error('Production Demucs execution requires approved modelWeightManifestId.')
  }
}

export function buildDemucsCommand(input: DemucsInput): { command: string; args: string[] } {
  validateDemucsInput(input)
  return { command: input.demucsCommand ?? 'demucs', args: ['--two-stems', 'vocals', '-o', input.outputDirectory ?? '', input.sourceAudioLocalPath ?? ''] }
}

export async function runDemucsSeparation(input: DemucsInput): Promise<{ status: 'skipped'; skipReason: AudioToolSkipReason }> {
  validateDemucsInput(input)
  return { status: 'skipped', skipReason: buildDemucsSkipReason(input) ?? { code: 'demucs_unavailable', message: 'Demucs is unavailable in Milestone 9 scaffolding.', tool: 'demucs' } }
}

export function buildDemucsSkipReason(input: DemucsInput): AudioToolSkipReason | undefined {
  if (input.runMode === 'production_blocked') return { code: 'production_demucs_blocked', message: 'Production Demucs is blocked until model-weight and deployment approval.', tool: 'demucs' }
  if (!input.localDevToolExecution) return { code: 'demucs_not_enabled', message: 'Demucs local-dev execution was not explicitly enabled.', tool: 'demucs' }
  if (!input.sourceAudioLocalPath || !existsSync(input.sourceAudioLocalPath)) return { code: 'local_audio_missing', message: 'Demucs skipped because local audio is unavailable.', tool: 'demucs' }
  return { code: 'demucs_unavailable', message: 'Demucs execution is scaffolded only unless installed with existing model weights.', tool: 'demucs' }
}

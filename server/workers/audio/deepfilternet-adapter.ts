import { existsSync } from 'node:fs'
import { assertNoPathTraversal, assertNoSignedUrlOrRawUrl } from '../media/media-path-safety'
import type { AudioFoundationRunMode, AudioToolSkipReason } from './audio-foundation-types'

export interface DeepFilterNetInput {
  sourceAudioLocalPath?: string
  outputAudioLocalPath?: string
  deepFilterNetCommand?: string
  timeoutMs: number
  runMode: AudioFoundationRunMode
  localDevToolExecution?: boolean
  modelWeightManifestId?: string
  allowModelDownload?: boolean
}

export function validateDeepFilterNetInput(input: DeepFilterNetInput): void {
  if (input.allowModelDownload) throw new Error('Milestone 9 forbids DeepFilterNet model downloads.')
  for (const [label, value] of Object.entries({
    sourceAudioLocalPath: input.sourceAudioLocalPath,
    outputAudioLocalPath: input.outputAudioLocalPath,
  })) {
    if (value) {
      assertNoSignedUrlOrRawUrl(value, label)
      assertNoPathTraversal(value, label)
    }
  }
  if (input.runMode === 'production_blocked' && !input.modelWeightManifestId) {
    throw new Error('Production DeepFilterNet execution requires approved modelWeightManifestId.')
  }
}

export function buildDeepFilterNetCommand(input: DeepFilterNetInput): { command: string; args: string[] } {
  validateDeepFilterNetInput(input)
  return {
    command: input.deepFilterNetCommand ?? 'deepFilterNet',
    args: ['--no-model-download', '-i', input.sourceAudioLocalPath ?? '', '-o', input.outputAudioLocalPath ?? ''],
  }
}

export async function runDeepFilterNetCleanup(input: DeepFilterNetInput): Promise<{ status: 'skipped'; skipReason: AudioToolSkipReason }> {
  validateDeepFilterNetInput(input)
  return { status: 'skipped', skipReason: buildDeepFilterNetSkipReason(input) ?? unavailable('deepfilternet') }
}

export function buildDeepFilterNetSkipReason(input: DeepFilterNetInput): AudioToolSkipReason | undefined {
  if (input.runMode === 'production_blocked') return { code: 'production_deepfilternet_blocked', message: 'Production DeepFilterNet is blocked until model-weight and deployment approval.', tool: 'deepfilternet' }
  if (!input.localDevToolExecution) return { code: 'deepfilternet_not_enabled', message: 'DeepFilterNet local-dev execution was not explicitly enabled.', tool: 'deepfilternet' }
  if (!input.sourceAudioLocalPath || !existsSync(input.sourceAudioLocalPath)) return { code: 'local_audio_missing', message: 'DeepFilterNet skipped because local audio is unavailable.', tool: 'deepfilternet' }
  return { code: 'deepfilternet_unavailable', message: 'DeepFilterNet execution is scaffolded only unless the tool is already installed and approved.', tool: 'deepfilternet' }
}

function unavailable(tool: 'deepfilternet'): AudioToolSkipReason {
  return { code: `${tool}_unavailable`, message: `${tool} is not available in Milestone 9 scaffolding.`, tool }
}

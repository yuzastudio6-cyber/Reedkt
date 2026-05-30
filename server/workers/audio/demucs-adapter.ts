import { existsSync } from 'node:fs'
import path from 'node:path'
import { assertNoPathTraversal, assertNoSignedUrlOrRawUrl } from '../media/media-path-safety'
import type { AudioFoundationRunMode, AudioToolSkipReason } from './audio-foundation-types'
import {
  DEMUCS_APPROVAL_REQUIRED_MESSAGE,
  validateDemucsModelApproval,
  type DemucsModelApprovalInput,
  type DemucsModelApprovalResult,
} from './demucs-model-approval'

export type DemucsSeparationMode = 'vocals' | 'stems-4' | 'instrumental'

export interface DemucsInput {
  sourceAudioLocalPath?: string
  outputDirectory?: string
  demucsCommand?: string
  separationMode?: DemucsSeparationMode
  timeoutMs: number
  runMode: AudioFoundationRunMode
  localDevToolExecution?: boolean
  modelWeightManifestId?: string
  allowModelDownload?: boolean
  modelApproval?: DemucsModelApprovalInput
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
  if (input.separationMode && !['vocals', 'stems-4', 'instrumental'].includes(input.separationMode)) {
    throw new Error('Demucs separation mode must be vocals, stems-4, or instrumental.')
  }
  if (input.runMode === 'production_blocked') {
    throw new Error('Production Demucs execution is blocked; use manifest-gated worker modes only after deployment approval.')
  }
}

export function buildDemucsCommand(input: DemucsInput): { command: string; args: string[] } {
  validateDemucsInput(input)
  const approval = input.runMode === 'dry_run'
    ? undefined
    : validateDemucsModelApproval(input.modelApproval)
  const mode = input.separationMode ?? 'vocals'
  if (approval && !approval.valid) throw new Error(approval.blockers.join(' '))
  const args = [
    ...argsForMode(mode),
    '-o',
    input.outputDirectory ?? '',
    ...(approval?.manifest?.model_id ? ['-n', approval.manifest.model_id] : []),
    ...(approval?.modelDirectory ? ['--repo', approval.modelDirectory] : []),
    input.sourceAudioLocalPath ?? '',
  ].filter(Boolean)

  return { command: input.demucsCommand ?? 'demucs', args }
}

export async function runDemucsSeparation(input: DemucsInput): Promise<
  | { status: 'skipped'; skipReason: AudioToolSkipReason; approval?: DemucsModelApprovalResult }
  | { status: 'planned'; command: { command: string; args: string[] }; expectedStemPaths: string[]; approval?: DemucsModelApprovalResult }
> {
  validateDemucsInput(input)
  const approval = input.runMode === 'dry_run'
    ? undefined
    : validateDemucsModelApproval(input.modelApproval)
  const skipReason = buildDemucsSkipReason(input, approval)
  if (skipReason) return { status: 'skipped', skipReason, approval }

  return {
    status: 'planned',
    command: buildDemucsCommand(input),
    expectedStemPaths: buildExpectedStemPaths(input.outputDirectory ?? '.', input.separationMode ?? 'vocals'),
    approval,
  }
}

export function buildDemucsSkipReason(input: DemucsInput, approval = validateDemucsModelApproval(input.modelApproval)): AudioToolSkipReason | undefined {
  if (input.runMode === 'production_blocked') return { code: 'production_demucs_blocked', message: 'Production Demucs is blocked until manifest-gated deployment approval.', tool: 'demucs' }
  if (input.separationMode && !['vocals', 'stems-4', 'instrumental'].includes(input.separationMode)) return { code: 'demucs_invalid_mode', message: 'Demucs supports only vocals, stems-4, or instrumental separation modes.', tool: 'demucs' }
  if (!input.localDevToolExecution) return { code: 'demucs_not_enabled', message: 'Demucs execution was not explicitly enabled for this worker.', tool: 'demucs' }
  if (!input.sourceAudioLocalPath || !existsSync(input.sourceAudioLocalPath)) return { code: 'local_audio_missing', message: 'Demucs skipped because local audio is unavailable.', tool: 'demucs' }
  if (!approval.valid) return { code: 'demucs_approval_required', message: approval.blockers.join(' ') || DEMUCS_APPROVAL_REQUIRED_MESSAGE, tool: 'demucs' }
  return undefined
}

export function buildExpectedStemPaths(outputDirectory: string, mode: DemucsSeparationMode): string[] {
  const stemRoot = path.join(outputDirectory, 'demucs-stems')
  if (mode === 'vocals') return [path.join(stemRoot, 'vocals.wav'), path.join(stemRoot, 'no_vocals.wav')]
  if (mode === 'instrumental') return [path.join(stemRoot, 'instrumental.wav')]
  return [
    path.join(stemRoot, 'vocals.wav'),
    path.join(stemRoot, 'drums.wav'),
    path.join(stemRoot, 'bass.wav'),
    path.join(stemRoot, 'other.wav'),
  ]
}

function argsForMode(mode: DemucsSeparationMode): string[] {
  if (mode === 'vocals' || mode === 'instrumental') return ['--two-stems', 'vocals']
  return []
}

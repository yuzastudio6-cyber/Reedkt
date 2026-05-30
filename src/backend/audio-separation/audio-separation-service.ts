export type AudioSeparationMode = 'vocals' | 'stems-4' | 'instrumental'
export type AudioSeparationEngine = 'demucs'
export type AudioSeparationJobStatus = 'queued' | 'running' | 'completed' | 'blocked' | 'failed'
export type AudioSeparationStemKind = 'vocals' | 'instrumental' | 'no_vocals' | 'drums' | 'bass' | 'other'

export interface CreateAudioSeparationJobInput {
  workspaceId?: string
  projectId?: string
  mediaAssetId?: string
  sourceAudioArtifactId?: string
  sourceMediaObjectPath?: string
  mode: AudioSeparationMode
  engine: AudioSeparationEngine
}

export interface AudioSeparationStem {
  stemId: string
  kind: AudioSeparationStemKind
  label: string
  storageObjectPath: string
  contentType: 'audio/wav'
  previewAvailable: boolean
  downloadAvailable: boolean
  isPrivate: true
}

export interface AudioSeparationJob {
  jobId: string
  workspaceId: string
  projectId: string
  mediaAssetId: string
  sourceAudioArtifactId: string
  sourceMediaObjectPath: string
  mode: AudioSeparationMode
  engine: AudioSeparationEngine
  status: AudioSeparationJobStatus
  progressPercent: number
  workerKind: 'audio_separation'
  modelApproval: {
    required: true
    engine: 'demucs'
    modelId: string
    runtimeDownloadsAllowed: false
    enforcedForRuntime: true
    mockBypass: boolean
  }
  actions: string[]
  blockedUses: string[]
  stems: AudioSeparationStem[]
  warnings: string[]
  mockOnly: boolean
}

export interface AudioSeparationRemuxResult {
  jobId: string
  status: 'blocked' | 'queued'
  message: string
  warnings: string[]
  mockOnly: boolean
}

const rightsNotice = 'Only upload, separate, export, or share audio that you own, have licensed, or are legally permitted to use. Dukira does not grant rights to third-party songs, vocals, instrumentals, or separated stems.'

export const DEMUCS_AUDIO_SEPARATION_ACTIONS = [
  'Separate Vocals',
  'Remove Background Music',
  'Split Stems',
  'Create Instrumental',
  'Isolate Voice from Music',
] as const

export const DEEPFILTERNET_VOICE_CLEANUP_ACTIONS = [
  'Clean Voice',
  'Enhance Speech',
  'Remove Background Noise',
  'Speech Denoise',
  'Voice Cleanup',
] as const

export const RNNOISE_ACTIVE_ACTIONS: string[] = []

export function createMockAudioSeparationJob(input: CreateAudioSeparationJobInput): AudioSeparationJob {
  validateAudioSeparationJobInput(input)
  const workspaceId = input.workspaceId ?? 'mock-workspace'
  const projectId = input.projectId ?? 'mock-project'
  const mediaAssetId = input.mediaAssetId ?? 'mock-media-asset'
  const jobId = `mock-demucs-${input.mode}-${mediaAssetId}`
  const sourceAudioArtifactId = input.sourceAudioArtifactId ?? `audio-source-${mediaAssetId}`
  const sourceMediaObjectPath = input.sourceMediaObjectPath ?? `mock-private/workspaces/${workspaceId}/projects/${projectId}/media/${mediaAssetId}/source.wav`

  return {
    jobId,
    workspaceId,
    projectId,
    mediaAssetId,
    sourceAudioArtifactId,
    sourceMediaObjectPath,
    mode: input.mode,
    engine: 'demucs',
    status: 'completed',
    progressPercent: 100,
    workerKind: 'audio_separation',
    modelApproval: {
      required: true,
      engine: 'demucs',
      modelId: 'htdemucs-or-company-model',
      runtimeDownloadsAllowed: false,
      enforcedForRuntime: true,
      mockBypass: true,
    },
    actions: actionsForMode(input.mode),
    blockedUses: [...DEEPFILTERNET_VOICE_CLEANUP_ACTIONS],
    stems: stemsForMode(input.mode, jobId),
    warnings: [
      'Mock route only; no Demucs model was loaded and no media was processed.',
      'Non-mock Demucs execution requires a valid approved model artifact, approval.json, and checksum.',
      rightsNotice,
    ],
    mockOnly: true,
  }
}

export function getMockAudioSeparationJob(jobId: string): AudioSeparationJob {
  const mode = modeFromJobId(jobId)
  return createMockAudioSeparationJob({
    mode,
    engine: 'demucs',
    mediaAssetId: jobId.replace(/^mock-demucs-[^-]+-/, '') || 'mock-media-asset',
  })
}

export function getMockAudioSeparationStems(jobId: string): AudioSeparationStem[] {
  return stemsForMode(modeFromJobId(jobId), jobId)
}

export function requestMockAudioSeparationRemux(jobId: string): AudioSeparationRemuxResult {
  return {
    jobId,
    status: 'blocked',
    message: 'Audio-stem remux is not enabled in the mock Demucs flow until a reviewed media pipeline supports it.',
    warnings: [
      'No final delivery export was created.',
      'No public URL or signed URL was created.',
      rightsNotice,
    ],
    mockOnly: true,
  }
}

export function getAudioSeparationRightsNotice(): string {
  return rightsNotice
}

function validateAudioSeparationJobInput(input: CreateAudioSeparationJobInput): void {
  if (input.engine !== 'demucs') throw new Error('Audio separation jobs currently support only engine="demucs".')
  if (!['vocals', 'stems-4', 'instrumental'].includes(input.mode)) throw new Error('Audio separation mode must be vocals, stems-4, or instrumental.')
}

function actionsForMode(mode: AudioSeparationMode): string[] {
  if (mode === 'vocals') return ['Separate Vocals', 'Isolate Voice from Music']
  if (mode === 'instrumental') return ['Remove Background Music', 'Create Instrumental']
  return ['Split Stems', 'Separate Vocals', 'Remove Background Music']
}

function stemsForMode(mode: AudioSeparationMode, jobId: string): AudioSeparationStem[] {
  const kinds: AudioSeparationStemKind[] = mode === 'vocals'
    ? ['vocals', 'no_vocals']
    : mode === 'instrumental'
      ? ['instrumental']
      : ['vocals', 'drums', 'bass', 'other']

  return kinds.map((kind) => ({
    stemId: `${jobId}-${kind}`,
    kind,
    label: labelForStem(kind),
    storageObjectPath: `mock-private/audio-separation/${jobId}/stems/${kind}.wav`,
    contentType: 'audio/wav',
    previewAvailable: true,
    downloadAvailable: true,
    isPrivate: true,
  }))
}

function labelForStem(kind: AudioSeparationStemKind): string {
  if (kind === 'no_vocals') return 'No vocals'
  return kind.replaceAll('_', ' ')
}

function modeFromJobId(jobId: string): AudioSeparationMode {
  if (jobId.includes('stems-4')) return 'stems-4'
  if (jobId.includes('instrumental')) return 'instrumental'
  return 'vocals'
}

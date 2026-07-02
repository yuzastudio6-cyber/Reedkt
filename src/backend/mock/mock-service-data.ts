import type { MockClipInput } from '../backend-types'

export const MOCK_USER_ID = 'mock-user-owner'
export const MOCK_WORKSPACE_ID = 'mock-workspace-reeditpro'

export const mockRealEstatePrompt =
  'Create a polished real estate walkthrough from these source clips. Keep it clean, premium, and clear. Use Stroke Motion only where it helps explain value.'

export const mockStrokeMotionSourceReadingPrompt =
  'Use source reading mode to turn the Joseph and Mary passage into respectful Stroke Motion. Do not make Mary look guilty.'

export const mockClips: MockClipInput[] = [
  {
    fileName: 'entry-living-room-walkthrough.mp4',
    mimeType: 'video/mp4',
    durationSeconds: 12,
    userNotes: 'Opening walkthrough from entry into living room.',
    uploadedOrder: 1,
  },
  {
    fileName: 'kitchen-detail-shots.mov',
    mimeType: 'video/quicktime',
    durationSeconds: 10,
    userNotes: 'Kitchen finishes and cabinet details.',
    uploadedOrder: 2,
  },
  {
    fileName: 'speaker-investment-line.mp4',
    mimeType: 'video/mp4',
    durationSeconds: 8,
    userNotes: 'Speaker explains the investment angle.',
    uploadedOrder: 3,
  },
  {
    fileName: 'exterior-backyard.mp4',
    mimeType: 'video/mp4',
    durationSeconds: 11,
    userNotes: 'Backyard and exterior closing shots.',
    uploadedOrder: 4,
  },
]

export const mockStrokeMotionWorkerNotes = [
  'Do not make Mary look guilty.',
  'Show Joseph’s misunderstanding respectfully.',
  'Keep divine presence symbolic, not literal.',
  'Use one continuous stroke line if possible.',
  'Make the animation understandable without words.',
] as const

export const mockProviderPlaceholders = [
  'svg_renderer',
  'lottie_renderer',
  'remotion_renderer',
  'google_cloud_worker',
  'lyria_pro',
] as const

export const mockQaChecks = [
  'speech_clarity',
  'cut_smoothness',
  'caption_readability',
  'music_balance',
  'sfx_balance',
  'transition_quality',
  'signature_timing',
  'user_instruction_compliance',
  'professional_standard',
] as const

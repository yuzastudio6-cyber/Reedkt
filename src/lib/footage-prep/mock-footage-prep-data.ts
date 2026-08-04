import type { MediaKind, WorkflowID } from '../../types'

export const MOCK_CREATED_AT = '2026-01-01T00:00:00.000Z'

export type MockFootagePrepScenario =
  | 'messy_talking_head'
  | 'real_estate'
  | 'screen_recording'

export type MockSourceMediaScenario =
  | MockFootagePrepScenario
  | 'main_talking_head'
  | 'kitchen_b_roll'
  | 'exterior_b_roll'
  | 'pool_b_roll'
  | 'dashboard_screenshot'
  | 'brand_logo'

export interface MockFootagePrepSourceMedia {
  mediaAssetId: WorkflowID
  label: string
  mediaKind: MediaKind
  durationMs: number
  width?: number
  height?: number
  frameRate?: number
  hasAudio?: boolean
  mockScenario?: MockSourceMediaScenario
  sourceMetadataAuthority?: 'verified_private_upload_probe'
}

export interface MockFootagePrepInput {
  projectId: WorkflowID
  workspaceId?: WorkflowID
  userId?: WorkflowID
  sourceMedia: MockFootagePrepSourceMedia[]
}

export const messyTalkingHeadFootageInput: MockFootagePrepInput = {
  projectId: 'project-demo-footage-prep',
  workspaceId: 'workspace-demo-footage-prep',
  userId: 'user-demo-footage-prep',
  sourceMedia: [
    {
      mediaAssetId: 'media-demo-messy-talking-head-raw',
      label: 'Messy talking-head raw upload',
      mediaKind: 'video',
      durationMs: 756000,
      width: 1920,
      height: 1080,
      frameRate: 29.97,
      hasAudio: true,
      mockScenario: 'messy_talking_head',
    },
  ],
}

export const realEstateFootagePrepInput: MockFootagePrepInput = {
  projectId: 'project-demo-real-estate-footage-prep',
  workspaceId: 'workspace-demo-footage-prep',
  userId: 'user-demo-footage-prep',
  sourceMedia: [
    {
      mediaAssetId: 'media-real-estate-main-talking-head',
      label: 'Agent talking-head property intro',
      mediaKind: 'video',
      durationMs: 300000,
      width: 1080,
      height: 1920,
      frameRate: 30,
      hasAudio: true,
      mockScenario: 'main_talking_head',
    },
    {
      mediaAssetId: 'media-real-estate-kitchen-tour',
      label: 'Kitchen b-roll clip',
      mediaKind: 'video',
      durationMs: 45000,
      width: 1080,
      height: 1920,
      frameRate: 30,
      hasAudio: true,
      mockScenario: 'kitchen_b_roll',
    },
    {
      mediaAssetId: 'media-real-estate-exterior',
      label: 'Exterior property clip',
      mediaKind: 'video',
      durationMs: 38000,
      width: 1080,
      height: 1920,
      frameRate: 30,
      hasAudio: true,
      mockScenario: 'exterior_b_roll',
    },
    {
      mediaAssetId: 'media-real-estate-pool',
      label: 'Pool and backyard clip',
      mediaKind: 'video',
      durationMs: 30000,
      width: 1080,
      height: 1920,
      frameRate: 30,
      hasAudio: true,
      mockScenario: 'pool_b_roll',
    },
    {
      mediaAssetId: 'media-real-estate-logo',
      label: 'Brokerage logo image',
      mediaKind: 'logo',
      durationMs: 0,
      width: 1600,
      height: 800,
      hasAudio: false,
      mockScenario: 'brand_logo',
    },
  ],
}

export const screenRecordingFootagePrepInput: MockFootagePrepInput = {
  projectId: 'project-demo-screen-recording-footage-prep',
  workspaceId: 'workspace-demo-footage-prep',
  userId: 'user-demo-footage-prep',
  sourceMedia: [
    {
      mediaAssetId: 'media-screen-recording-main',
      label: 'Dashboard walkthrough screen recording',
      mediaKind: 'screen_recording',
      durationMs: 420000,
      width: 1920,
      height: 1080,
      frameRate: 30,
      hasAudio: true,
      mockScenario: 'screen_recording',
    },
    {
      mediaAssetId: 'media-screen-recording-dashboard-proof',
      label: 'Dashboard proof screenshot',
      mediaKind: 'screenshot',
      durationMs: 0,
      width: 2400,
      height: 1600,
      hasAudio: false,
      mockScenario: 'dashboard_screenshot',
    },
    {
      mediaAssetId: 'media-screen-recording-logo',
      label: 'Product logo',
      mediaKind: 'logo',
      durationMs: 0,
      width: 1400,
      height: 700,
      hasAudio: false,
      mockScenario: 'brand_logo',
    },
  ],
}

export const defaultMockFootagePrepInput = messyTalkingHeadFootageInput

export function getMockInputScenario(input: MockFootagePrepInput): MockFootagePrepScenario {
  const explicitScenario = input.sourceMedia.find((item) =>
    item.mockScenario === 'messy_talking_head' ||
    item.mockScenario === 'real_estate' ||
    item.mockScenario === 'screen_recording',
  )?.mockScenario

  if (explicitScenario === 'messy_talking_head' || explicitScenario === 'real_estate' || explicitScenario === 'screen_recording') {
    return explicitScenario
  }

  if (input.projectId.includes('real-estate')) return 'real_estate'
  if (input.projectId.includes('screen-recording')) return 'screen_recording'
  return 'messy_talking_head'
}

export function getPrimaryMockSourceMedia(input: MockFootagePrepInput): MockFootagePrepSourceMedia {
  return input.sourceMedia.find((item) => item.mediaKind === 'video' || item.mediaKind === 'screen_recording') ?? input.sourceMedia[0]
}

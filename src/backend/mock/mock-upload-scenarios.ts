import type { CreateUploadPlanInput, UploadFileLike, UploadPurpose } from '../../types/upload'
import { MOCK_USER_ID, MOCK_WORKSPACE_ID } from './mock-service-data'

export const MOCK_UPLOAD_PROJECT_ID = 'mock-upload-project-reeditpro'

export interface MockUploadScenario {
  id: string
  label: string
  purpose: UploadPurpose
  file: UploadFileLike
  workspaceId?: string
  projectId?: string
  userId?: string
  uploadedOrder?: number
  expectedOk: boolean
  expectedWarningIncludes?: string
}

function scenario(input: MockUploadScenario): MockUploadScenario {
  return input
}

export const mockUploadScenarios: MockUploadScenario[] = [
  scenario({
    id: 'single-source-video-upload',
    label: 'Single source video upload',
    purpose: 'source_media',
    file: { name: 'entry-walkthrough.mp4', type: 'video/mp4', size: 180 * 1024 * 1024 },
    workspaceId: MOCK_WORKSPACE_ID,
    projectId: MOCK_UPLOAD_PROJECT_ID,
    userId: MOCK_USER_ID,
    uploadedOrder: 1,
    expectedOk: true,
  }),
  scenario({
    id: 'source-clip-one',
    label: 'Multiple source clips uploaded in order - clip one',
    purpose: 'source_media',
    file: { name: 'clip-01-opening.mp4', type: 'video/mp4', size: 90 * 1024 * 1024 },
    workspaceId: MOCK_WORKSPACE_ID,
    projectId: MOCK_UPLOAD_PROJECT_ID,
    userId: MOCK_USER_ID,
    uploadedOrder: 1,
    expectedOk: true,
  }),
  scenario({
    id: 'source-clip-two',
    label: 'Multiple source clips uploaded in order - clip two',
    purpose: 'source_media',
    file: { name: 'clip-02-details.mov', type: 'video/quicktime', size: 120 * 1024 * 1024 },
    workspaceId: MOCK_WORKSPACE_ID,
    projectId: MOCK_UPLOAD_PROJECT_ID,
    userId: MOCK_USER_ID,
    uploadedOrder: 2,
    expectedOk: true,
  }),
  scenario({
    id: 'reference-video-upload',
    label: 'Reference video upload',
    purpose: 'reference_media',
    file: { name: 'style-reference.webm', type: 'video/webm', size: 210 * 1024 * 1024 },
    workspaceId: MOCK_WORKSPACE_ID,
    projectId: MOCK_UPLOAD_PROJECT_ID,
    userId: MOCK_USER_ID,
    expectedOk: true,
  }),
  scenario({
    id: 'thumbnail-upload',
    label: 'Thumbnail upload',
    purpose: 'thumbnail',
    file: { name: 'project-thumbnail.webp', type: 'image/webp', size: 2 * 1024 * 1024 },
    workspaceId: MOCK_WORKSPACE_ID,
    projectId: MOCK_UPLOAD_PROJECT_ID,
    userId: MOCK_USER_ID,
    expectedOk: true,
  }),
  scenario({
    id: 'audio-sfx-asset-upload',
    label: 'Audio/SFX asset upload',
    purpose: 'audio_asset',
    file: { name: 'soft-transition-hit.wav', type: 'audio/wav', size: 8 * 1024 * 1024 },
    workspaceId: MOCK_WORKSPACE_ID,
    projectId: MOCK_UPLOAD_PROJECT_ID,
    userId: MOCK_USER_ID,
    expectedOk: true,
    expectedWarningIncludes: 'backend',
  }),
  scenario({
    id: 'generated-asset-placeholder',
    label: 'Generated asset storage placeholder',
    purpose: 'generated_asset',
    file: { name: 'stroke-motion-overlay.png', type: 'image/png', size: 4 * 1024 * 1024 },
    workspaceId: MOCK_WORKSPACE_ID,
    projectId: MOCK_UPLOAD_PROJECT_ID,
    userId: MOCK_USER_ID,
    expectedOk: true,
    expectedWarningIncludes: 'backend',
  }),
  scenario({
    id: 'preview-render-placeholder',
    label: 'Preview render storage placeholder',
    purpose: 'preview_render',
    file: { name: 'preview-render.mp4', type: 'video/mp4', size: 350 * 1024 * 1024 },
    workspaceId: MOCK_WORKSPACE_ID,
    projectId: MOCK_UPLOAD_PROJECT_ID,
    userId: MOCK_USER_ID,
    expectedOk: true,
    expectedWarningIncludes: 'backend',
  }),
  scenario({
    id: 'final-export-placeholder',
    label: 'Final export storage placeholder',
    purpose: 'final_export',
    file: { name: 'final-export.mp4', type: 'video/mp4', size: 900 * 1024 * 1024 },
    workspaceId: MOCK_WORKSPACE_ID,
    projectId: MOCK_UPLOAD_PROJECT_ID,
    userId: MOCK_USER_ID,
    expectedOk: true,
    expectedWarningIncludes: 'backend',
  }),
  scenario({
    id: 'unsupported-file-type-rejected',
    label: 'Unsupported file type rejected',
    purpose: 'source_media',
    file: { name: 'script.pdf', type: 'application/pdf', size: 1 * 1024 * 1024 },
    workspaceId: MOCK_WORKSPACE_ID,
    projectId: MOCK_UPLOAD_PROJECT_ID,
    userId: MOCK_USER_ID,
    expectedOk: false,
  }),
  scenario({
    id: 'too-large-file-rejected',
    label: 'Too-large file rejected',
    purpose: 'final_export',
    file: { name: 'huge-final-export.mp4', type: 'video/mp4', size: 6 * 1024 * 1024 * 1024 },
    workspaceId: MOCK_WORKSPACE_ID,
    projectId: MOCK_UPLOAD_PROJECT_ID,
    userId: MOCK_USER_ID,
    expectedOk: false,
  }),
  scenario({
    id: 'missing-workspace-blocked',
    label: 'Missing workspace blocked',
    purpose: 'source_media',
    file: { name: 'clip-without-workspace.mp4', type: 'video/mp4', size: 20 * 1024 * 1024 },
    projectId: MOCK_UPLOAD_PROJECT_ID,
    userId: MOCK_USER_ID,
    expectedOk: false,
  }),
  scenario({
    id: 'supabase-not-configured-mock-mode',
    label: 'Supabase not configured mock mode',
    purpose: 'profile_asset',
    file: { name: 'profile-avatar.png', type: 'image/png', size: 500 * 1024 },
    workspaceId: MOCK_WORKSPACE_ID,
    userId: MOCK_USER_ID,
    expectedOk: true,
    expectedWarningIncludes: 'mock',
  }),
]

export function getMockUploadScenarioById(id: string): MockUploadScenario | undefined {
  return mockUploadScenarios.find((item) => item.id === id)
}

export function getDefaultMockUploadScenario(): MockUploadScenario {
  return mockUploadScenarios[0]
}

export function getMockUploadPlanInput(scenarioItem: MockUploadScenario): CreateUploadPlanInput {
  return {
    file: scenarioItem.file,
    purpose: scenarioItem.purpose,
    workspaceId: scenarioItem.workspaceId,
    projectId: scenarioItem.projectId,
    userId: scenarioItem.userId,
    uploadedOrder: scenarioItem.uploadedOrder,
  }
}

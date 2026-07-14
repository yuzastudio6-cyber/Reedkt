import type {
  ExportSettings,
  MockExportEstimate,
  MockExportEstimateLineItem,
} from '../../types'
import { MOCK_CREATED_AT } from '../footage-prep'
import { getEnabledExportTargets } from './export-settings-builder'

type BuildMockExportEstimateInput = {
  projectId: string
  workspaceId?: string
  userId?: string
  exportSettings: ExportSettings
}

function lineItem(projectId: string, index: number, label: string, quantity: number, unitCredits: number, explanation: string): MockExportEstimateLineItem {
  return {
    id: `${projectId}-mock-export-line-${String(index).padStart(3, '0')}`,
    label,
    quantity,
    credits: quantity * unitCredits,
    explanation,
  }
}

export function buildMockExportEstimate({
  exportSettings,
  projectId,
  userId,
  workspaceId,
}: BuildMockExportEstimateInput): MockExportEstimate {
  const enabledTargets = getEnabledExportTargets(exportSettings)
  const lineItems: MockExportEstimateLineItem[] = enabledTargets.length > 0
    ? [lineItem(
        projectId,
        1,
        'Covered by approved 4K edit estimate',
        enabledTargets.length,
        0,
        '1080p, 2K/1440p, and 4K outputs within the approved aspect ratio use the existing edit reservation. No export-time estimate or charge is allowed.',
      )]
    : []
  const totalCredits = 0

  return {
    id: `${projectId}-mock-export-estimate`,
    projectId,
    workspaceId,
    userId,
    status: 'approved',
    lineItems,
    totalCredits,
    coverageSource: 'approved_edit_4k_ceiling',
    requiresCreditPrompt: false,
    allowsAdditionalExportCharge: false,
    explanation: enabledTargets.length > 0
      ? 'Export cost was included when the edit estimate was approved at the 4K UHD ceiling. This export step must not ask for, reserve, or deduct credits again.'
      : 'No export targets are enabled. The approved edit estimate still retains its 4K UHD delivery ceiling.',
    createdAt: MOCK_CREATED_AT,
    updatedAt: MOCK_CREATED_AT,
  }
}

export function summarizeMockExportEstimate(estimate: MockExportEstimate | null) {
  if (!estimate) return 'Approved edit credit coverage has not been verified yet.'
  return estimate.requiresCreditPrompt
    ? `${estimate.totalCredits} estimated export credit${estimate.totalCredits === 1 ? '' : 's'}.`
    : 'Export is covered by the approved 4K edit estimate; no additional credits are due.'
}

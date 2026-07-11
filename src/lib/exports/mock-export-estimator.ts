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
  const lineItems: MockExportEstimateLineItem[] = []
  let index = 1

  if (enabledTargets.length > 0) {
    lineItems.push(lineItem(projectId, index, 'Base export package', 1, 2, 'Internal packaging setup for the enabled export targets.'))
    index += 1
    lineItems.push(lineItem(projectId, index, 'Enabled export targets', enabledTargets.length, 1, 'One estimated credit per platform output record.'))
    index += 1
  }

  const fourKTargets = enabledTargets.filter((target) => target.resolution === '4k').length
  if (fourKTargets > 0) {
    lineItems.push(lineItem(projectId, index, '4K output uplift', fourKTargets, 3, 'Higher-resolution export rehearsal complexity.'))
    index += 1
  }

  const fourteenFortyTargets = enabledTargets.filter((target) => target.resolution === '1440p').length
  if (fourteenFortyTargets > 0) {
    lineItems.push(lineItem(projectId, index, '1440p output uplift', fourteenFortyTargets, 2, 'Higher-resolution export rehearsal complexity.'))
    index += 1
  }

  const maximumQualityTargets = enabledTargets.filter((target) => target.quality === 'maximum').length
  if (maximumQualityTargets > 0) {
    lineItems.push(lineItem(projectId, index, 'Maximum quality outputs', maximumQualityTargets, 2, 'Maximum quality export rehearsal pass.'))
    index += 1
  }

  const highQualityTargets = enabledTargets.filter((target) => target.quality === 'high').length
  if (highQualityTargets > 0) {
    lineItems.push(lineItem(projectId, index, 'High quality outputs', highQualityTargets, 1, 'High quality export rehearsal pass.'))
    index += 1
  }

  const burnInTargets = enabledTargets.filter((target) => target.captionMode === 'burn_in').length
  if (burnInTargets > 0) {
    lineItems.push(lineItem(projectId, index, 'Caption burn-in', burnInTargets, 1, 'Caption burn-in packaging for platform output records.'))
    index += 1
  }

  const safeZoneTargets = enabledTargets.some((target) => target.enforceSafeZones)
  if (safeZoneTargets) {
    lineItems.push(lineItem(projectId, index, 'Safe-zone enforcement', 1, 1, 'Platform safe-zone enforcement check.'))
    index += 1
  }

  const customTargets = enabledTargets.filter((target) =>
    target.platform === 'custom' || target.aspectRatio === 'custom' || target.resolution === 'custom',
  ).length
  if (customTargets > 0) {
    lineItems.push(lineItem(projectId, index, 'Custom output handling', customTargets, 2, 'Estimate for custom platform, aspect, or resolution handling.'))
  }

  const totalCredits = lineItems.reduce((total, item) => total + item.credits, 0)

  return {
    id: `${projectId}-mock-export-estimate`,
    projectId,
    workspaceId,
    userId,
    status: 'ready',
    lineItems,
    totalCredits,
    explanation: totalCredits > 0
      ? 'This is an internal export credit preview, not billing. No credits are reserved, deducted, or refunded here.'
      : 'No export targets are enabled, so the export credit preview is 0 credits. No billing occurs.',
    createdAt: MOCK_CREATED_AT,
    updatedAt: MOCK_CREATED_AT,
  }
}

export function summarizeMockExportEstimate(estimate: MockExportEstimate | null) {
  if (!estimate) return 'No export credit preview yet.'
  return `${estimate.totalCredits} estimated export credit${estimate.totalCredits === 1 ? '' : 's'}.`
}

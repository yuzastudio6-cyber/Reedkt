import type {
  RevisionCreditEstimate,
  RevisionCreditLineItem,
  RevisionOperationClassification,
  RevisionRequest,
} from '../../types'
import { MOCK_CREATED_AT } from '../footage-prep'

type BuildMockRevisionCreditEstimateInput = {
  revisionRequest: RevisionRequest
  projectId: string
  workspaceId?: string
  userId?: string
}

function createLineItem(
  revisionRequest: RevisionRequest,
  index: number,
  label: string,
  quantity: number,
  unitCredits: number,
  explanation: string,
): RevisionCreditLineItem {
  return {
    id: `${revisionRequest.id}-credit-line-${String(index).padStart(3, '0')}`,
    label,
    quantity,
    credits: quantity * unitCredits,
    explanation,
  }
}

function count(classifications: RevisionOperationClassification[], predicate: (classification: RevisionOperationClassification) => boolean) {
  return classifications.filter(predicate).length
}

export function buildMockRevisionCreditEstimate({
  projectId,
  revisionRequest,
  userId,
  workspaceId,
}: BuildMockRevisionCreditEstimateInput): RevisionCreditEstimate {
  const classifications = revisionRequest.classifications
  const lineItems: RevisionCreditLineItem[] = []

  if (revisionRequest.costPolicy !== 'free') {
    const previewRerenders = count(classifications, (classification) => classification.executionMode === 'preview_rerender')
    const styleTiming = count(classifications, (classification) => classification.impact === 'style' || classification.impact === 'timing')
    const assetReplacements = count(classifications, (classification) =>
      classification.impact === 'asset_replacement' && classification.executionMode !== 'premium_generation',
    )
    const aiRegenerations = count(classifications, (classification) => classification.executionMode === 'ai_regeneration')
    const premiumGenerations = count(classifications, (classification) => classification.executionMode === 'premium_generation')
    let index = 1

    if (previewRerenders > 0) {
      lineItems.push(createLineItem(revisionRequest, index, 'Preview rerender operations', previewRerenders, 2, 'Mock rerender work for preview-affecting Edit Map operations.'))
      index += 1
    }
    if (styleTiming > 0) {
      lineItems.push(createLineItem(revisionRequest, index, 'Style and timing adjustments', styleTiming, 1, 'Additional local complexity for style or timing changes.'))
      index += 1
    }
    if (assetReplacements > 0) {
      lineItems.push(createLineItem(revisionRequest, index, 'Asset replacement', assetReplacements, 3, 'Mock credit estimate for replacing preview inputs.'))
      index += 1
    }
    if (aiRegenerations > 0) {
      lineItems.push(createLineItem(revisionRequest, index, 'AI regeneration', aiRegenerations, 5, 'Mock estimate for AI regeneration requests. No provider is called.'))
      index += 1
    }
    if (premiumGenerations > 0) {
      lineItems.push(createLineItem(revisionRequest, index, 'Premium generation', premiumGenerations, 10, 'Premium mock estimate for Real Motion, Stroke Motion, or premium-like revision work.'))
    }

    const subtotal = lineItems.reduce((total, item) => total + item.credits, 0)
    if (subtotal > 0) {
      lineItems.unshift(createLineItem(revisionRequest, 0, 'Revision coordination', 1, 1, 'Local mock coordination estimate for grouping revision operations.'))
    }
  }

  const totalCredits = lineItems.reduce((total, item) => total + item.credits, 0)

  return {
    id: `${revisionRequest.id}-credit-estimate`,
    projectId,
    workspaceId,
    userId,
    status: 'ready',
    lineItems,
    totalCredits,
    explanation: totalCredits > 0
      ? 'This is a local mock revision estimate, not real billing. No credits are reserved, deducted, or refunded in this milestone.'
      : 'This revision is local/free in the mock workflow. No real billing or rendering occurs.',
    createdAt: MOCK_CREATED_AT,
    updatedAt: MOCK_CREATED_AT,
  }
}

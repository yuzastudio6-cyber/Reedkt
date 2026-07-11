import type {
  EditDocument,
  EditElement,
  EditGroup,
  EditMapLocalOperation,
  EditSystem,
  RevisionCostPolicy,
  RevisionExecutionMode,
  RevisionOperationClassification,
  RevisionOperationImpact,
} from '../../types'

type ClassificationInput = {
  editOperation: EditMapLocalOperation
  editDocument?: EditDocument | null
  systems?: EditSystem[]
  groups?: EditGroup[]
  elements?: EditElement[]
}

type ClassificationsInput = {
  editOperations: EditMapLocalOperation[]
  editDocument?: EditDocument | null
  systems?: EditSystem[]
  groups?: EditGroup[]
  elements?: EditElement[]
}

const executionPriority: Record<RevisionExecutionMode, number> = {
  local_only: 0,
  metadata_only: 1,
  preview_rerender: 2,
  ai_regeneration: 3,
  premium_generation: 4,
}

const costPriority: Record<RevisionCostPolicy, number> = {
  free: 0,
  mock_credits_required: 1,
  approval_required: 2,
  premium_approval_required: 3,
}

function getTargetSystem(input: ClassificationInput) {
  const group = input.groups?.find((candidate) => candidate.id === input.editOperation.targetGroupId)
  const element = input.elements?.find((candidate) => candidate.id === input.editOperation.targetElementId)
  const systemId = input.editOperation.targetSystemId ?? group?.systemId ?? element?.systemId
  return input.systems?.find((candidate) => candidate.id === systemId)
}

function getTargetGroup(input: ClassificationInput) {
  const element = input.elements?.find((candidate) => candidate.id === input.editOperation.targetElementId)
  const groupId = input.editOperation.targetGroupId ?? element?.groupId
  return input.groups?.find((candidate) => candidate.id === groupId)
}

function getTargetElement(input: ClassificationInput) {
  return input.elements?.find((candidate) => candidate.id === input.editOperation.targetElementId)
}

function isPremiumTarget(system?: EditSystem, element?: EditElement) {
  const values = [
    system?.kind,
    system?.name,
    element?.source.kind,
    element?.label,
  ]
    .filter((value): value is string => Boolean(value))
    .map((value) => value.toLowerCase())

  return values.some((value) =>
    value.includes('real_motion') ||
    value.includes('real motion') ||
    value.includes('stroke_motion') ||
    value.includes('stroke motion') ||
    value.includes('premium'),
  )
}

function getAffectedTargets(input: ClassificationInput) {
  const system = getTargetSystem(input)
  const group = getTargetGroup(input)
  const element = getTargetElement(input)

  return [{
    systemId: system?.id,
    groupId: group?.id,
    elementId: element?.id,
    systemKind: system?.kind,
    label: element?.label ?? group?.name ?? system?.name ?? input.editDocument?.id,
  }]
}

function hasTimingPatch(operation: EditMapLocalOperation) {
  return Boolean(operation.patch?.timeRange || operation.patch?.visualBounds || operation.type === 'move_element')
}

function makeClassification(
  input: ClassificationInput,
  impact: RevisionOperationImpact,
  executionMode: RevisionExecutionMode,
  costPolicy: RevisionCostPolicy,
  explanation: string,
): RevisionOperationClassification {
  return {
    editOperationId: input.editOperation.id,
    operationType: input.editOperation.type,
    impact,
    executionMode,
    costPolicy,
    affectedTargets: getAffectedTargets(input),
    explanation,
  }
}

export function classifyEditOperationForRevision(input: ClassificationInput): RevisionOperationClassification {
  const { editOperation } = input
  const system = getTargetSystem(input)
  const element = getTargetElement(input)
  const premiumTarget = isPremiumTarget(system, element)

  if (editOperation.type === 'set_system_visibility' || editOperation.type === 'set_group_visibility' || editOperation.type === 'set_element_visibility') {
    return makeClassification(input, 'visibility', 'local_only', 'free', 'Visibility changes are applied locally and do not need a mock rerender.')
  }

  if (editOperation.type === 'lock_group' || editOperation.type === 'unlock_group' || editOperation.type === 'lock_element' || editOperation.type === 'unlock_element') {
    return makeClassification(input, 'metadata', 'metadata_only', 'free', 'Lock changes are local Edit Map metadata and do not need credits.')
  }

  if (editOperation.type === 'update_group_style') {
    return makeClassification(input, 'style', 'preview_rerender', 'mock_credits_required', 'Group style changes affect the preview look and need a mock rerender estimate.')
  }

  if (editOperation.type === 'update_element') {
    return makeClassification(
      input,
      hasTimingPatch(editOperation) ? 'timing' : 'style',
      'preview_rerender',
      'mock_credits_required',
      'Element updates affect preview output and need a mock rerender estimate.',
    )
  }

  if (editOperation.type === 'move_element') {
    return makeClassification(input, 'timing', 'preview_rerender', 'mock_credits_required', 'Moving an element changes composition/timing and needs a mock rerender estimate.')
  }

  if (editOperation.type === 'replace_asset') {
    return makeClassification(
      input,
      'asset_replacement',
      premiumTarget ? 'premium_generation' : 'preview_rerender',
      premiumTarget ? 'premium_approval_required' : 'approval_required',
      premiumTarget
        ? 'Replacing a premium motion target requires explicit premium mock approval.'
        : 'Replacing an asset changes preview inputs and requires local approval.',
    )
  }

  if (editOperation.type === 'regenerate_element') {
    return makeClassification(
      input,
      'ai_regeneration',
      premiumTarget ? 'premium_generation' : 'ai_regeneration',
      premiumTarget ? 'premium_approval_required' : 'approval_required',
      premiumTarget
        ? 'Regenerating a premium motion element requires explicit premium mock approval.'
        : 'Regeneration is a mock AI revision path and requires local approval.',
    )
  }

  if (editOperation.type === 'delete_element' || editOperation.type === 'restore_element') {
    return makeClassification(input, 'layout', 'preview_rerender', 'mock_credits_required', 'Delete/restore changes the preview layout and needs a mock rerender estimate.')
  }

  return makeClassification(input, 'unknown', 'preview_rerender', 'mock_credits_required', 'This Edit Map operation is treated as preview-affecting until a future revision rule handles it.')
}

export function classifyEditOperationsForRevision(input: ClassificationsInput): RevisionOperationClassification[] {
  return input.editOperations.map((editOperation) =>
    classifyEditOperationForRevision({
      ...input,
      editOperation,
    }),
  )
}

export function getRevisionExecutionMode(classifications: RevisionOperationClassification[]): RevisionExecutionMode {
  return classifications.reduce<RevisionExecutionMode>((current, classification) =>
    executionPriority[classification.executionMode] > executionPriority[current]
      ? classification.executionMode
      : current,
  'local_only')
}

export function getRevisionCostPolicy(classifications: RevisionOperationClassification[]): RevisionCostPolicy {
  return classifications.reduce<RevisionCostPolicy>((current, classification) =>
    costPriority[classification.costPolicy] > costPriority[current]
      ? classification.costPolicy
      : current,
  'free')
}

export function getRevisionOperationSummary(classifications: RevisionOperationClassification[]) {
  if (!classifications.length) return 'No Edit Map operations are pending revision.'

  const impactLabels = Array.from(new Set(classifications.map((classification) => classification.impact.replace(/_/g, ' '))))
  const preview = impactLabels.slice(0, 3).join(', ')
  const suffix = impactLabels.length > 3 ? ', and more' : ''

  return `Revision updates ${classifications.length} edit item${classifications.length === 1 ? '' : 's'}: ${preview}${suffix}.`
}

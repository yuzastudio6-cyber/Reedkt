import {
  getProviderModelsForStep,
  getToolIdsForStep,
  getWorkerJobStepProfile,
  getWorkerStepsForPlan,
} from './worker-runtime-catalog'
import type { EditPlan, EditLevel, FallbackAction, ProviderModel } from '../types/reeditpro'
import type {
  WorkerFallbackPolicy,
  WorkerInputContract,
  WorkerJobStepType,
  WorkerRuntimeJobPlan,
  WorkerRuntimePlan,
  WorkerRuntimeStepPlan,
} from '../types/worker-runtime'

type CreateWorkerRuntimePlanParams = {
  projectId: string
  editPlanVersionId: string
  approvedPlanSnapshotId?: string
  plan: EditPlan
}

const mockLimitations = [
  'Mock worker runtime plan only.',
  'No workers are executed.',
  'No backend/job queue/storage integration exists in this milestone.',
  'Future backend must use approved plan snapshots.',
]

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values))
}

function getEditLevel(plan: EditPlan): EditLevel {
  return plan.compiledIntent?.resolvedSettings.editLevel ?? plan.creditEstimate.editLevel ?? 'pro'
}

function isAiVideoModel(model: ProviderModel) {
  return model === 'wan_2_2_kf2v_flash' ||
    model === 'wan_2_6_i2v_flash' ||
    model === 'hailuo_2_3_fast' ||
    model === 'hailuo_02' ||
    model === 'veo_3_1_lite'
}

function approvedVeoInRoute(plan: EditPlan) {
  return (plan.visualAssetPlan ?? []).some((asset) =>
    asset.providerRoute.primaryModel === 'veo_3_1_lite' ||
    asset.providerRoute.fallbackModels.includes('veo_3_1_lite') ||
    asset.providerRoute.fallbackSteps.some((step) => step.model === 'veo_3_1_lite'),
  )
}

function sourceAssetIds(plan: EditPlan) {
  return unique([
    ...plan.sourceSequenceMap.map((item) => item.clipId),
    ...(plan.segmentEditPlans ?? []).flatMap((segment) => segment.sourceClipIds),
  ])
}

function operationIds(plan: EditPlan) {
  return unique((plan.segmentEditPlans ?? []).flatMap((segment) => segment.operations.map((operation) => operation.id)))
}

function rendererLayerIds(plan: EditPlan) {
  return unique([
    ...(plan.segmentEditPlans ?? []).flatMap((segment) => segment.rendererLayerIds),
    ...(plan.rendererCompositionPlan?.layers ?? []).map((layer) => layer.id),
  ])
}

function toolStrategyItemIds(plan: EditPlan) {
  return unique([
    ...(plan.segmentEditPlans ?? []).flatMap((segment) => segment.toolStrategyItemIds ?? []),
    ...(plan.toolStrategyPlan?.items ?? []).map((item) => item.id),
  ])
}

function visualAssetPlanItemIds(plan: EditPlan) {
  return unique([
    ...(plan.visualAssetPlan ?? []).map((asset) => asset.id),
    ...(plan.segmentEditPlans ?? []).flatMap((segment) => segment.visualAssetPlanItemIds),
  ])
}

function baseInputContract(params: CreateWorkerRuntimePlanParams, stepType: WorkerJobStepType, fallbackPolicy: WorkerFallbackPolicy): WorkerInputContract {
  const plan = params.plan

  return {
    approvedPlanSnapshotId: params.approvedPlanSnapshotId ?? 'pending-approved-snapshot',
    projectId: params.projectId,
    editPlanVersionId: params.editPlanVersionId,
    creditReservationId: 'future-credit-reservation-required',
    sourceAssetIds: sourceAssetIds(plan),
    segmentIds: (plan.segmentEditPlans ?? []).map((segment) => segment.id),
    operationIds: operationIds(plan),
    visualAssetPlanItemIds: visualAssetPlanItemIds(plan),
    rendererLayerIds: rendererLayerIds(plan),
    toolStrategyItemIds: toolStrategyItemIds(plan),
    providerPromptPlanIds: (plan.providerPromptPlans ?? []).map((prompt) => prompt.id),
    settings: {
      stepType,
      planningOnly: true,
      frontendExecutionAllowed: false,
      editLevel: getEditLevel(plan),
    },
    fallbackPolicy: fallbackPolicy.tierPolicyNotes,
    qaChecks: [
      'Confirm approved snapshot compliance.',
      'Confirm no raw chat reinterpretation.',
      'Confirm no frontend worker execution.',
    ],
    notes: [
      'Future worker input contract only.',
      'No backend worker, queue, storage, provider, or renderer is invoked in this milestone.',
    ],
  }
}

function fallbackPolicyForStep(stepType: WorkerJobStepType, plan: EditPlan): WorkerFallbackPolicy {
  const editLevel = getEditLevel(plan)
  const profileModels = getProviderModelsForStep(stepType, plan)
  const allowedActions = new Set<FallbackAction>(['retry_same_model', 'simplify_prompt', 'manual_review'])
  const allowedProviderModels = new Set<ProviderModel>()

  if (stepType === 'generate_gpt_image_asset') {
    allowedProviderModels.add('gpt_image_2')
    allowedActions.add('convert_to_motion_design')
  }

  if (stepType === 'generate_ai_video_asset') {
    for (const model of profileModels.filter(isAiVideoModel)) {
      if (model === 'veo_3_1_lite') {
        if (editLevel === 'premium' && approvedVeoInRoute(plan)) {
          allowedProviderModels.add(model)
        }
      } else {
        allowedProviderModels.add(model)
      }
    }

    allowedActions.add('try_fallback_model')
    allowedActions.add('split_scene')
    allowedActions.add('convert_to_still')
    allowedActions.add('convert_to_motion_design')
  }

  if (stepType === 'generate_mask_asset' || stepType === 'render_map_asset' || stepType === 'render_dataviz_asset' || stepType === 'capture_browser_asset') {
    allowedActions.add('convert_to_still')
  }

  return {
    allowedActions: Array.from(allowedActions),
    allowedProviderModels: Array.from(allowedProviderModels),
    allowedToolIds: getToolIdsForStep(stepType),
    maxRetries: editLevel === 'basic' ? 1 : editLevel === 'pro' ? 2 : 3,
    requiresUserApprovalIfExceeded: true,
    tierPolicyNotes: [
      'Workers may retry or fallback only within approved route and allowance.',
      'Workers request new user approval if fallback exceeds the approved plan.',
      editLevel === 'premium'
        ? 'Premium may use Veo only as final fallback/rescue when the approved route includes it.'
        : 'Basic/Pro worker fallback cannot use Veo.',
      'Worker steps execute approved snapshots, not raw chat.',
    ],
  }
}

function workerNotesForStep(stepType: WorkerJobStepType, plan: EditPlan) {
  const notes = [
    'Future backend worker step only.',
    'No frontend worker execution occurs in this mock plan.',
    'Use approved plan snapshot inputs and approved fallback policy.',
  ]

  if (stepType === 'capture_browser_asset') {
    notes.push('Browser capture requires authorized/user-provided source and must not bypass auth, paywalls, CAPTCHAs, or site restrictions.')
  }

  if (stepType === 'generate_mask_asset') {
    notes.push('Future segmentation/tracking worker required; no real mask is generated in frontend.')
  }

  if (stepType === 'generate_ai_video_asset') {
    notes.push(getEditLevel(plan) === 'premium' ? 'Premium Veo is final fallback only if already approved.' : 'Basic/Pro no Veo.')
  }

  return notes
}

function createStepPlan(params: CreateWorkerRuntimePlanParams, stepType: WorkerJobStepType, index: number): WorkerRuntimeStepPlan {
  const profile = getWorkerJobStepProfile(stepType)

  if (!profile) {
    throw new Error(`Missing worker job step profile: ${stepType}`)
  }

  const fallbackPolicy = fallbackPolicyForStep(stepType, params.plan)

  return {
    id: `worker-step-${index + 1}-${stepType}`,
    stepType,
    workerGroup: profile.workerGroup,
    executionMode: profile.executionMode,
    label: profile.label,
    purpose: profile.purpose,
    order: index + 1,
    status: 'planned',
    inputContract: baseInputContract(params, stepType, fallbackPolicy),
    expectedOutputs: profile.outputTypes,
    fallbackPolicy,
    creditImpact: profile.creditImpact,
    qaResponsibilities: profile.qaResponsibilities,
    failureHandling: profile.failureHandling,
    workerNotes: [
      ...workerNotesForStep(stepType, params.plan),
      ...profile.safetyNotes,
    ],
  }
}

export function createWorkerRuntimePlan(params: CreateWorkerRuntimePlanParams): WorkerRuntimePlan {
  const stepTypes = getWorkerStepsForPlan(params.plan)
  const steps = stepTypes.map((stepType, index) => createStepPlan(params, stepType, index))
  const workerGroupsUsed = unique(steps.map((step) => step.workerGroup))
  const providerModelsReferenced = unique(steps.flatMap((step) => step.fallbackPolicy.allowedProviderModels))
  const openSourceToolsReferenced = unique(steps.flatMap((step) => step.fallbackPolicy.allowedToolIds))
  const job: WorkerRuntimeJobPlan = {
    id: `worker-job-${params.editPlanVersionId}`,
    projectId: params.projectId,
    editPlanVersionId: params.editPlanVersionId,
    approvedPlanSnapshotId: params.approvedPlanSnapshotId,
    status: params.approvedPlanSnapshotId ? 'queued' : 'waiting_for_approval',
    label: 'Approved edit worker runtime',
    summary: 'Future workers execute the approved plan snapshot, enforce credit reservation, produce QA, and request new approval when fallback exceeds policy.',
    steps,
    workerGroupsUsed,
    providerModelsReferenced,
    openSourceToolsReferenced,
    requiresCreditReservation: true,
    approvalRequired: true,
    canRunInFrontend: false,
    limitations: mockLimitations,
    qaChecks: [
      'Approved snapshot exists before work.',
      'Credit reservation exists before expensive work.',
      'Basic/Pro no Veo and Premium fallback-only Veo are enforced.',
      'Workers do not reinterpret raw chat.',
    ],
    notes: [
      'This job is a typed mock plan only.',
      'No queue, storage, worker, tool, provider, or renderer is invoked.',
    ],
  }

  return {
    id: `worker-runtime-plan-${params.editPlanVersionId}`,
    summary: `Mock worker runtime plan with ${steps.length} planned future worker step${steps.length === 1 ? '' : 's'}.`,
    jobs: [job],
    totalSteps: steps.length,
    workerGroupsUsed,
    providerModelsReferenced,
    openSourceToolsReferenced,
    approvalRequired: true,
    creditReservationRequired: true,
    frontendExecutionAllowed: false,
    globalRules: [
      'Workers execute approved plan snapshots, not raw chat.',
      'Worker tools do not run before approval and credit reservation.',
      'Fallback cannot exceed approved plan without user approval.',
      'Browser capture must not bypass auth, paywalls, CAPTCHAs, or site restrictions.',
      'Basic/Pro cannot use Veo. Premium can use Veo only as final fallback/rescue.',
    ],
    limitations: mockLimitations,
    qaChecks: [
      'Worker runtime plan exists before approval.',
      'Frontend execution remains disabled.',
      'Foundational worker steps are present.',
      'Conditional steps match active planner features.',
      'Mock-only limitations are visible.',
    ],
  }
}

import type { ApprovedPlanSnapshot } from '../../src/types/edit-planning-db'
import type { JSONObject, ProfessionalSkillBackendIntent, ProfessionalSkillModelRoleTrace } from '../../src/types'
import {
  createEditSessionExecutionRehearsal,
  type EditSessionExecutionRehearsal,
} from '../../src/lib/edit-session-execution-rehearsal'
import {
  resolveApprovedSnapshotInternalTestAdapterToolNames,
  validateProfessionalSkillBackendIntent,
} from '../../src/lib/professional-skills'
import { REEDITPRO_MODEL_ROLE_CONTRACT_VERSION } from '../../src/lib/model-role-routing-contract'
import {
  createProfessionalToolAdapterBoundedExecutionGate,
  createProfessionalToolAdapterOrchestrationPlan,
  resolveProfessionalToolAdapterContract,
  type ProfessionalToolAdapterBoundedExecutionGate,
  type ProfessionalToolAdapterOrchestrationPlan,
  type ProfessionalToolAdapterSourceTruthEvidenceReview,
} from '../tool-registry'
import { hideInternalToolNamesInCopy } from '../../src/lib/tool-display-labels'
import {
  createApprovedToolWorkManifest,
  type ApprovedToolWorkManifest,
} from './approved-tool-work-manifest'

export type ApprovedEditExecutionPackageStatus =
  | 'ready_for_mock_preview_review'
  | 'ready_for_mock_preview_with_adapter_gates'
  | 'blocked_missing_execution_plan'
  | 'blocked_invalid_tool_work_manifest'

export interface ApprovedEditExecutionPackage {
  id: string
  workspaceId: string
  projectId: string
  editSessionId: string
  approvedPlanSnapshotId: string
  creditReservationId: string
  status: ApprovedEditExecutionPackageStatus
  rehearsal: EditSessionExecutionRehearsal
  toolWorkManifest: ApprovedToolWorkManifest
  adapterOrchestrationPlan?: ProfessionalToolAdapterOrchestrationPlan
  boundedAdapterExecutionGate?: ProfessionalToolAdapterBoundedExecutionGate
  boundedAdapterSourceTruthReview?: ProfessionalToolAdapterSourceTruthEvidenceReview
  requestedAdapterToolNames: string[]
  adapterCandidateScope: 'approved_snapshot_plus_requested' | 'requested_only'
  professionalSkillTrace?: ApprovedEditExecutionPackageProfessionalSkillTrace
  packageReadyToolIds: string[]
  modelWeightApprovedToolIds: string[]
  resolvedAdapterToolCount: number
  boundedAdapterExecutionReady: boolean
  boundedAdapterReadyToolCount: number
  boundedAdapterBlockedToolCount: number
  boundedAdapterBlockers: string[]
  privateArtifactRefCount: number
  agentCallReady: boolean
  liveExecutionReady: false
  userFacingSummary: string
  backendHandoffSummary: string
  blockers: string[]
  noRuntimeSideEffects: string[]
}

export interface ApprovedEditExecutionPackageProfessionalSkillTrace {
  source: 'approved_professional_skill_plan'
  status: string
  selectedSkillCount: number
  selectedFamilies: string[]
  activityGroups: Array<{
    id: string
    label: string
    status: string
    selectedActivityCount: number
    readyActivityCount: number
    reviewActivityCount: number
    blockedActivityCount: number
    userFacingSummary: string
  }>
  selectionEvidence: Array<{
    skillId: string
    userFacingActivity: string
    sources: string[]
    summaries: string[]
  }>
  backendIntentCount: number
  backendIntentKinds: string[]
  backendIntents: ApprovedEditExecutionPackageBackendIntentTrace[]
  modelRoleTrace: ProfessionalSkillModelRoleTrace
  qaGateCount: number
  warnings: string[]
  blockers: string[]
  editBriefOptional: true
  promptFirstPlanning: true
  noUserVisibleToolNames: true
}

export interface ApprovedEditExecutionPackageBackendIntentTrace {
  intentId: string
  intentKind: ProfessionalSkillBackendIntent['intentKind']
  executionBoundary: ProfessionalSkillBackendIntent['executionBoundary']
  providerRoute?: string
  providerModel?: string
  modelRoleId?: ProfessionalSkillBackendIntent['modelRoleId']
  requestedModelUse?: ProfessionalSkillBackendIntent['requestedModelUse']
  generationType?: string
  outputAssetType?: string
  hiddenAdapterToolCount: number
  requiredApprovalGates: string[]
}

export interface CreateApprovedEditExecutionPackageInput {
  workspaceId: string
  approvedSnapshot: ApprovedPlanSnapshot
  requestedAdapterToolNames?: string[]
  adapterCandidateScope?: 'approved_snapshot_plus_requested' | 'requested_only'
  creditReservationId: string
  packageReadyToolIds?: string[]
  modelWeightApprovedToolIds?: string[]
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))
}

function privateArtifactRefsFromRehearsal(
  rehearsal: EditSessionExecutionRehearsal,
): JSONObject[] {
  return (rehearsal.executionPlan?.assetManifest ?? [])
    .filter((asset) => Boolean(asset.storagePath || asset.storageBucket))
    .map((asset) => ({
      artifactId: asset.id,
      assetType: asset.assetType,
      storageProvider: asset.storageProvider,
      storageBucket: asset.storageBucket ?? null,
      storageObjectPath: asset.storagePath ?? `mock/edit-assets/${asset.id}`,
      sourceOfTruth: true,
      privateArtifact: true,
    }))
}

function adapterCandidates(input: CreateApprovedEditExecutionPackageInput): string[] {
  const sourceTools = input.adapterCandidateScope === 'requested_only'
    ? input.requestedAdapterToolNames ?? []
    : [
        ...resolveApprovedSnapshotInternalTestAdapterToolNames(input.approvedSnapshot),
        ...(input.requestedAdapterToolNames ?? []),
      ]
  const canonicalToolIds = sourceTools.flatMap((toolName) => {
    const canonicalToolId = resolveProfessionalToolAdapterContract(toolName)?.canonicalToolId
    return canonicalToolId ? [canonicalToolId] : []
  })

  return unique(canonicalToolIds)
}

function sanitizeSkillTraceCopy(value: unknown): string {
  return hideInternalToolNamesInCopy(String(value ?? '')).trim()
}

function createBackendIntentTrace(
  intent: ProfessionalSkillBackendIntent,
): ApprovedEditExecutionPackageBackendIntentTrace {
  return {
    intentId: intent.intentId,
    intentKind: intent.intentKind,
    executionBoundary: intent.executionBoundary,
    providerRoute: intent.providerRoute,
    providerModel: intent.providerModel,
    modelRoleId: intent.modelRoleId,
    requestedModelUse: intent.requestedModelUse,
    generationType: intent.generationType,
    outputAssetType: intent.outputAssetType,
    hiddenAdapterToolCount: intent.hiddenAdapterToolNames.length,
    requiredApprovalGates: unique(intent.requiredApprovalGates),
  }
}

function createProfessionalSkillTrace(
  approvedSnapshot: ApprovedPlanSnapshot,
): ApprovedEditExecutionPackageProfessionalSkillTrace | undefined {
  const skillPlan = approvedSnapshot.professionalSkillPlan
  if (
    !skillPlan ||
    skillPlan.noUserVisibleToolNames !== true ||
    !professionalSkillModelRoleTraceIsPackageReady(skillPlan.modelRoleTrace) ||
    skillPlan.backendIntents.some((intent) => !validateProfessionalSkillBackendIntent(intent).ok)
  ) {
    return undefined
  }

  return {
    source: 'approved_professional_skill_plan',
    status: sanitizeSkillTraceCopy(skillPlan.status) || 'unknown',
    selectedSkillCount: Number.isFinite(skillPlan.selectedSkillCount) ? skillPlan.selectedSkillCount : 0,
    selectedFamilies: unique(skillPlan.selectedFamilies.map((family) => sanitizeSkillTraceCopy(family))),
    activityGroups: skillPlan.activityGroups.slice(0, 8).flatMap((group) => {
      const id = sanitizeSkillTraceCopy(group.id)
      const label = sanitizeSkillTraceCopy(group.label)
      const status = sanitizeSkillTraceCopy(group.status)
      const userFacingSummary = sanitizeSkillTraceCopy(group.userFacingSummary)

      return id && label && status && userFacingSummary
        ? [{
            id,
            label,
            status,
            selectedActivityCount: group.selectedActivityCount,
            readyActivityCount: group.readyActivityCount,
            reviewActivityCount: group.reviewActivityCount,
            blockedActivityCount: group.blockedActivityCount,
            userFacingSummary,
          }]
        : []
    }),
    selectionEvidence: skillPlan.selectedSkills.slice(0, 12).flatMap((skill) => {
      const skillId = sanitizeSkillTraceCopy(skill.skillId)
      const userFacingActivity = sanitizeSkillTraceCopy(skill.userFacingActivity)
      const sources = unique(skill.selectionSources.map((source) => sanitizeSkillTraceCopy(source)))
      const summaries = unique((skill.selectionEvidence ?? []).map((evidence) => sanitizeSkillTraceCopy(evidence.summary))).slice(0, 4)

      return skillId && userFacingActivity && sources.length > 0
        ? [{
            skillId,
            userFacingActivity,
            sources,
            summaries,
          }]
        : []
    }),
    backendIntentCount: skillPlan.backendIntents.length,
    backendIntentKinds: unique(skillPlan.backendIntents.map((intent) => intent.intentKind)),
    backendIntents: skillPlan.backendIntents.map(createBackendIntentTrace),
    modelRoleTrace: skillPlan.modelRoleTrace,
    qaGateCount: skillPlan.qaGateSummary.length,
    warnings: unique(skillPlan.warnings.map((warning) => sanitizeSkillTraceCopy(warning))).slice(0, 4),
    blockers: unique(skillPlan.blockers.map((blocker) => sanitizeSkillTraceCopy(blocker))).slice(0, 4),
    editBriefOptional: true,
    promptFirstPlanning: true,
    noUserVisibleToolNames: true,
  }
}

function professionalSkillModelRoleTraceIsPackageReady(
  trace: ProfessionalSkillModelRoleTrace | undefined,
): trace is ProfessionalSkillModelRoleTrace {
  if (
    !trace ||
    trace.source !== 'reeditpro_model_role_contract' ||
    trace.contractVersion !== REEDITPRO_MODEL_ROLE_CONTRACT_VERSION ||
    trace.checkedContractCount !== 7 ||
    trace.ok !== true ||
    trace.blocked !== false ||
    trace.mockOnly !== true ||
    trace.errors.length > 0
  ) {
    return false
  }

  const kimiPrimaryRole = trace.roles.find((role) => role.modelRoleId === 'kimi_k3_main_edit_agent')
  if (
    !kimiPrimaryRole ||
    kimiPrimaryRole.providerBoundary !== 'kimi_k3_provider_boundary' ||
    kimiPrimaryRole.canonicalProviderModel !== 'kimi-k3' ||
    !kimiPrimaryRole.requestedUses.includes('edit_planning') ||
    kimiPrimaryRole.reasoningRouteRole !== 'primary' ||
    kimiPrimaryRole.reasoningRoutePriority !== 1 ||
    kimiPrimaryRole.fallbackOnly !== false ||
    kimiPrimaryRole.userReasoningAllowed !== true ||
    kimiPrimaryRole.editPlanningAllowed !== true ||
    kimiPrimaryRole.creativeStrategyAllowed !== true ||
    kimiPrimaryRole.editQaReasoningAllowed !== true ||
    kimiPrimaryRole.visualUnderstandingAllowed !== false ||
    kimiPrimaryRole.toolCodeAllowed !== true ||
    kimiPrimaryRole.remotionDraftAllowed !== true
  ) {
    return false
  }

  const terraFallbackRole = trace.roles.find(
    (role) => role.modelRoleId === 'gpt_5_6_terra_fallback_edit_agent',
  )
  if (
    !terraFallbackRole ||
    terraFallbackRole.providerBoundary !== 'gpt_5_6_terra_provider_boundary' ||
    terraFallbackRole.canonicalProviderModel !== 'gpt-5.6-terra' ||
    !terraFallbackRole.requestedUses.includes('edit_planning') ||
    terraFallbackRole.reasoningRouteRole !== 'fallback' ||
    terraFallbackRole.reasoningRoutePriority !== 2 ||
    terraFallbackRole.fallbackOnly !== true ||
    terraFallbackRole.userReasoningAllowed !== true ||
    terraFallbackRole.editPlanningAllowed !== true ||
    terraFallbackRole.creativeStrategyAllowed !== true ||
    terraFallbackRole.editQaReasoningAllowed !== true ||
    terraFallbackRole.visualUnderstandingAllowed !== false ||
    terraFallbackRole.toolCodeAllowed !== true ||
    terraFallbackRole.remotionDraftAllowed !== true
  ) {
    return false
  }

  const visualRole = trace.roles.find((role) =>
    role.modelRoleId === 'visual_intelligence_gemini_pro_high')
  if (
    !visualRole ||
    visualRole.providerBoundary !==
      'vertex_gemini_pro_visual_intelligence_boundary' ||
    visualRole.canonicalProviderModel !== 'gemini-3.1-pro-preview' ||
    !visualRole.requestedUses.includes('visual_understanding') ||
    visualRole.reasoningRouteRole !== 'specialist' ||
    visualRole.reasoningRoutePriority !== null ||
    visualRole.fallbackOnly !== false ||
    visualRole.userReasoningAllowed !== false ||
    visualRole.editPlanningAllowed !== false ||
    visualRole.creativeStrategyAllowed !== false ||
    visualRole.editQaReasoningAllowed !== false ||
    visualRole.visualUnderstandingAllowed !== true ||
    visualRole.toolCodeAllowed !== false
  ) {
    return false
  }

  const deepSeekFallbackRole = trace.roles.find((role) => role.modelRoleId === 'deepseek_v4_tool_code_agent')
  return Boolean(
    deepSeekFallbackRole &&
    deepSeekFallbackRole.providerBoundary === 'deepseek_v4_pro_tool_code_boundary' &&
    deepSeekFallbackRole.canonicalProviderModel === 'deepseek-v4-pro' &&
    deepSeekFallbackRole.reasoningRouteRole === 'fallback' &&
    deepSeekFallbackRole.reasoningRoutePriority === 3 &&
    deepSeekFallbackRole.fallbackOnly === true &&
    deepSeekFallbackRole.userReasoningAllowed === true &&
    deepSeekFallbackRole.editPlanningAllowed === true &&
    deepSeekFallbackRole.creativeStrategyAllowed === true &&
    deepSeekFallbackRole.editQaReasoningAllowed === true &&
    deepSeekFallbackRole.visualUnderstandingAllowed === false &&
    deepSeekFallbackRole.toolCodeAllowed === true &&
    deepSeekFallbackRole.remotionDraftAllowed === true &&
    deepSeekFallbackRole.requestedUses.includes('edit_planning')
  )
}

export function createApprovedEditExecutionPackage(
  input: CreateApprovedEditExecutionPackageInput,
): ApprovedEditExecutionPackage {
  const { approvedSnapshot } = input
  const rehearsal = createEditSessionExecutionRehearsal({ approvedSnapshot })
  const toolWorkManifest = createApprovedToolWorkManifest({
    workspaceId: input.workspaceId,
    approvedSnapshot,
    creditReservationId: input.creditReservationId,
  })
  const privateArtifactRefs = privateArtifactRefsFromRehearsal(rehearsal)
  const requestedAdapterToolNames = adapterCandidates(input)
  const adapterOrchestrationPlan = requestedAdapterToolNames.length
    ? createProfessionalToolAdapterOrchestrationPlan({
      workspaceId: input.workspaceId,
      projectId: approvedSnapshot.projectId,
      requestedToolNames: requestedAdapterToolNames,
      userIntentSummary: approvedSnapshot.compiledIntent?.goalSummary,
      evidence: {
        approvedPlanSnapshotId: approvedSnapshot.id,
        creditEstimateId: approvedSnapshot.creditEstimateId,
        creditReservationId: input.creditReservationId,
        packageReadyToolIds: input.packageReadyToolIds,
        modelWeightApprovedToolIds: input.modelWeightApprovedToolIds,
        privateArtifactRefs,
      },
    })
    : undefined
  const boundedAdapterExecutionGate = requestedAdapterToolNames.length
    ? createProfessionalToolAdapterBoundedExecutionGate({
      workspaceId: input.workspaceId,
      projectId: approvedSnapshot.projectId,
      requestedToolNames: requestedAdapterToolNames,
      userIntentSummary: approvedSnapshot.compiledIntent?.goalSummary,
      evidence: {
        approvedPlanSnapshotId: approvedSnapshot.id,
        creditEstimateId: approvedSnapshot.creditEstimateId,
        creditReservationId: input.creditReservationId,
        packageReadyToolIds: input.packageReadyToolIds,
        modelWeightApprovedToolIds: input.modelWeightApprovedToolIds,
        privateArtifactRefs,
      },
    })
    : undefined
  const professionalSkillTrace = createProfessionalSkillTrace(approvedSnapshot)
  const missingProfessionalSkillTraceBlocker = approvedSnapshot.professionalSkillPlan && !professionalSkillTrace
    ? ['Approved snapshot professional skill plan is missing valid canonical model-role trace evidence.']
    : []
  const boundedAdapterBlockers = unique(boundedAdapterExecutionGate?.blockers ?? [])
  const blockers = [
    ...(rehearsal.status === 'blocked_missing_execution_plan'
      ? [rehearsal.finalRenderBlockReason]
      : []),
    ...(adapterOrchestrationPlan?.blockers ?? []),
    ...missingProfessionalSkillTraceBlocker,
    ...toolWorkManifest.blockers,
  ]
  const status: ApprovedEditExecutionPackageStatus = toolWorkManifest.status === 'blocked_structural_inconsistency'
    ? 'blocked_invalid_tool_work_manifest'
    : rehearsal.status === 'blocked_missing_execution_plan'
    ? 'blocked_missing_execution_plan'
    : adapterOrchestrationPlan?.status === 'blocked'
      ? 'ready_for_mock_preview_with_adapter_gates'
      : 'ready_for_mock_preview_review'
  const agentCallReady = rehearsal.status === 'ready_for_mock_preview_review' &&
    (!adapterOrchestrationPlan || adapterOrchestrationPlan.status !== 'blocked') &&
    missingProfessionalSkillTraceBlocker.length === 0 &&
    toolWorkManifest.status !== 'blocked_structural_inconsistency'

  return {
    id: `approved-edit-execution-package-${approvedSnapshot.id}`,
    workspaceId: input.workspaceId,
    projectId: approvedSnapshot.projectId,
    editSessionId: approvedSnapshot.editSessionId,
    approvedPlanSnapshotId: approvedSnapshot.id,
    creditReservationId: input.creditReservationId,
    status,
    rehearsal,
    toolWorkManifest,
    adapterOrchestrationPlan,
    boundedAdapterExecutionGate,
    requestedAdapterToolNames,
    adapterCandidateScope: input.adapterCandidateScope ?? 'approved_snapshot_plus_requested',
    professionalSkillTrace,
    packageReadyToolIds: unique(input.packageReadyToolIds ?? []),
    modelWeightApprovedToolIds: unique(input.modelWeightApprovedToolIds ?? []),
    resolvedAdapterToolCount: adapterOrchestrationPlan?.resolvedToolCount ?? 0,
    boundedAdapterExecutionReady: boundedAdapterExecutionGate?.status === 'ready_for_bounded_execution',
    boundedAdapterReadyToolCount: boundedAdapterExecutionGate?.readyToolCount ?? 0,
    boundedAdapterBlockedToolCount: boundedAdapterExecutionGate?.blockedToolCount ?? 0,
    boundedAdapterBlockers,
    privateArtifactRefCount: privateArtifactRefs.length,
    agentCallReady,
    liveExecutionReady: false,
    userFacingSummary: [
      rehearsal.userFacingSummary,
      adapterOrchestrationPlan
        ? adapterOrchestrationPlan.userFacingSummary
        : 'No extra professional adapter package is needed for this edit yet.',
    ].join(' '),
    backendHandoffSummary: [
      `Approved snapshot ${approvedSnapshot.id} is the execution source of truth.`,
      `Execution graph work items: ${rehearsal.plannedWorkItemCount}.`,
      `Private artifact references: ${privateArtifactRefs.length}.`,
      `Professional adapter tools resolved: ${adapterOrchestrationPlan?.resolvedToolCount ?? 0}.`,
      `Approved tool-work manifest: ${toolWorkManifest.status}; ${toolWorkManifest.reconciliation.executableOperationCount} private executable and ${toolWorkManifest.reconciliation.degradedOperationCount} degraded planned operation(s).`,
      `Bounded adapter gate ready: ${boundedAdapterExecutionGate?.readyToolCount ?? 0}; blocked: ${boundedAdapterExecutionGate?.blockedToolCount ?? 0}.`,
      'Live execution remains false until worker/runtime, storage, QA, and cost gates are explicitly satisfied.',
    ].join(' '),
    blockers,
    noRuntimeSideEffects: unique([
      ...rehearsal.noRuntimeSideEffects,
      ...(adapterOrchestrationPlan?.noRuntimeSideEffects ?? []),
      ...toolWorkManifest.externalReleaseBlocks,
      'This package does not dispatch workers, process media, call providers, render, write Supabase/GCS, or bill users.',
    ]),
  }
}

import type { JSONObject } from '../../src/types'
import type {
  ProductionRegistryWorkerType,
  ProductionToolId,
  ProductionToolInputType,
  ProductionToolOutputType,
} from './production-tool-types'
import {
  listProfessionalToolAdapterContracts,
  normalizeRequestedToolName,
  resolveProfessionalToolAdapterContract,
  type ProfessionalToolAdapterContract,
  type ProfessionalToolAdapterMode,
} from './professional-tool-adapter-contracts'
import {
  buildProfessionalToolArchitectureProgramMap,
  type ProfessionalToolSourceTruthAuthority,
  type ProfessionalToolSourceTruthStatus,
} from './professional-tool-architecture-program'

export type ProfessionalToolAdapterPlanMode = Extract<
  ProfessionalToolAdapterMode,
  'dry_run' | 'bounded_execution' | 'readiness_check'
>

export type ProfessionalToolAdapterPlanStatus =
  | 'ready_for_dry_run'
  | 'ready_for_bounded_execution'
  | 'ready_for_readiness_check'
  | 'blocked'

export interface ProfessionalToolAdapterEvidence {
  approvedPlanSnapshotId?: string
  creditEstimateId?: string
  creditReservationId?: string
  packageReadyToolIds?: Array<ProductionToolId | string>
  modelWeightApprovedToolIds?: Array<ProductionToolId | string>
  privateArtifactRefs?: JSONObject[]
}

export interface ProfessionalToolAdapterPlanInput {
  workspaceId: string
  projectId: string
  requestedToolNames: string[]
  mode?: ProfessionalToolAdapterPlanMode
  evidence?: ProfessionalToolAdapterEvidence
  userIntentSummary?: string
}

export interface ProfessionalToolAdapterPlanTool {
  requestedToolName: string
  canonicalToolId: ProductionToolId
  sourceTruthStatus: ProfessionalToolSourceTruthStatus
  sourceTruthAuthority: ProfessionalToolSourceTruthAuthority
  nextGate: string
  capabilityFamily: ProfessionalToolAdapterContract['capabilityFamily']
  workerType: ProductionRegistryWorkerType
  mode: ProfessionalToolAdapterPlanMode
  status: 'ready' | 'blocked'
  userFacingActivity: string
  privateInputManifestKinds: ProductionToolInputType[]
  privateOutputManifestKinds: ProductionToolOutputType[]
  qaGates: ProfessionalToolAdapterContract['qaGates']
  blockerNotes: string[]
}

export type ProfessionalToolAdapterSourceTruthIssueCategory =
  | 'accepted_owner_lane_runtime_gate'
  | 'model_manifest_required'
  | 'scope_decision_required'
  | 'evaluation_hold'
  | 'contract_required'
  | 'unknown_tool'

export interface ProfessionalToolAdapterSourceTruthIssue {
  requestedToolName: string
  canonicalToolId?: ProductionToolId
  sourceTruthStatus?: ProfessionalToolSourceTruthStatus
  sourceTruthAuthority?: ProfessionalToolSourceTruthAuthority
  nextGate: string
  category: ProfessionalToolAdapterSourceTruthIssueCategory
  userFacingSummary: string
  internalBlocker: string
}

export interface ProfessionalToolAdapterPlan {
  id: string
  workspaceId: string
  projectId: string
  mode: ProfessionalToolAdapterPlanMode
  status: ProfessionalToolAdapterPlanStatus
  requestedToolCount: number
  resolvedToolCount: number
  unresolvedToolNames: string[]
  sourceTruthIssues: ProfessionalToolAdapterSourceTruthIssue[]
  tools: ProfessionalToolAdapterPlanTool[]
  qaGateTypes: ProfessionalToolAdapterContract['qaGates']
  privateInputManifestKinds: ProductionToolInputType[]
  privateOutputManifestKinds: ProductionToolOutputType[]
  blockers: string[]
  approvedSnapshotRequired: true
  approvedSnapshotReady: boolean
  creditGateRequired: boolean
  creditGateReady: boolean
  frontendExecutionAllowed: false
  productReady: false
  userFacingSummary: string
  userFacingReadinessSummary: string
  internalExecutionSummary: string
  noRuntimeSideEffects: string[]
}

export interface ProfessionalToolAdapterOrchestrationPlan {
  id: string
  workspaceId: string
  projectId: string
  status: 'ready_for_adapter_dry_run_and_readiness' | 'blocked'
  requestedToolCount: number
  resolvedToolCount: number
  editAdapterPlan?: ProfessionalToolAdapterPlan
  readinessPlan?: ProfessionalToolAdapterPlan
  unresolvedToolNames: string[]
  sourceTruthIssues: ProfessionalToolAdapterSourceTruthIssue[]
  blockers: string[]
  userFacingSummary: string
  userFacingReadinessSummary: string
  noRuntimeSideEffects: string[]
}

export interface ProfessionalToolAdapterBoundedExecutionGate {
  id: string
  workspaceId: string
  projectId: string
  status: 'ready_for_bounded_execution' | 'blocked'
  requestedToolCount: number
  resolvedToolCount: number
  readyToolCount: number
  blockedToolCount: number
  unresolvedToolNames: string[]
  readyToolIds: ProductionToolId[]
  blockedToolIds: ProductionToolId[]
  blockers: string[]
  sourceTruthIssues: ProfessionalToolAdapterSourceTruthIssue[]
  approvedSnapshotReady: boolean
  creditGateReady: boolean
  privateArtifactsReady: boolean
  clientReadinessHintsTrusted: false
  serverSourceTruthRequired: true
  frontendExecutionAllowed: false
  productReady: false
  userFacingSummary: string
  userFacingReadinessSummary: string
  internalExecutionSummary: string
  noRuntimeSideEffects: string[]
  boundedExecutionPlan: ProfessionalToolAdapterPlan
}

function unique<T extends string>(values: T[]): T[] {
  return Array.from(new Set(values))
}

function evidenceSet(values: Array<ProductionToolId | string> | undefined): Set<string> {
  return new Set((values ?? []).map(normalizeRequestedToolName))
}

function readableMode(mode: ProfessionalToolAdapterPlanMode): string {
  return mode.replaceAll('_', ' ')
}

function statusForMode(mode: ProfessionalToolAdapterPlanMode): ProfessionalToolAdapterPlanStatus {
  if (mode === 'bounded_execution') return 'ready_for_bounded_execution'
  if (mode === 'readiness_check') return 'ready_for_readiness_check'
  return 'ready_for_dry_run'
}

function sourceTruthIssueForRequestedTool(requestedToolName: string): ProfessionalToolAdapterSourceTruthIssue {
  const normalized = normalizeRequestedToolName(requestedToolName)
  const programMap = buildProfessionalToolArchitectureProgramMap()
  const entry = programMap.entries.find((item) =>
    normalizeRequestedToolName(item.requestedToolName) === normalized ||
    (item.canonicalToolId ? normalizeRequestedToolName(item.canonicalToolId) === normalized : false)
  )

  if (!entry) {
    return {
      requestedToolName,
      nextGate: 'owner_selection_before_adapter_work',
      category: 'unknown_tool',
      userFacingSummary: 'One requested edit activity is not part of the approved editing capability map yet.',
      internalBlocker: `${requestedToolName} is not registered as a professional adapter contract or production tool profile.`,
    }
  }

  if (entry.implementationTier === 'owner_lane_source_truth_accepted_runtime_gated') {
    return {
      requestedToolName: entry.requestedToolName,
      canonicalToolId: entry.canonicalToolId,
      sourceTruthStatus: entry.sourceTruthStatus,
      sourceTruthAuthority: entry.sourceTruthAuthority,
      nextGate: entry.nextGate,
      category: 'accepted_owner_lane_runtime_gate',
      userFacingSummary: 'One support capability is already accepted by its owning lane and should follow its normal readiness gate.',
      internalBlocker: `${entry.requestedToolName} is accepted owner-lane source truth, but it is not a bounded professional adapter contract; route it through its owner-lane runtime gate instead of this adapter handoff.`,
    }
  }

  if (entry.sourceTruthStatus === 'registry_only_model_manifest_required') {
    return {
      requestedToolName: entry.requestedToolName,
      canonicalToolId: entry.canonicalToolId,
      sourceTruthStatus: entry.sourceTruthStatus,
      sourceTruthAuthority: entry.sourceTruthAuthority,
      nextGate: entry.nextGate,
      category: 'model_manifest_required',
      userFacingSummary: 'One requested edit activity needs an approved model package record before it can be scheduled.',
      internalBlocker: `${entry.requestedToolName} is registry-only and requires exact model/checkpoint manifest approval before it can be promoted to a bounded professional adapter.`,
    }
  }

  if (entry.sourceTruthStatus === 'registry_only_scope_decision_required') {
    return {
      requestedToolName: entry.requestedToolName,
      canonicalToolId: entry.canonicalToolId,
      sourceTruthStatus: entry.sourceTruthStatus,
      sourceTruthAuthority: entry.sourceTruthAuthority,
      nextGate: entry.nextGate,
      category: 'scope_decision_required',
      userFacingSummary: 'One requested edit activity needs an owner scope decision before it can be scheduled.',
      internalBlocker: `${entry.requestedToolName} is registry-only and requires an owner scope decision before adapter planning or execution handoff.`,
    }
  }

  if (entry.sourceTruthStatus === 'registry_only_evaluation_hold') {
    return {
      requestedToolName: entry.requestedToolName,
      canonicalToolId: entry.canonicalToolId,
      sourceTruthStatus: entry.sourceTruthStatus,
      sourceTruthAuthority: entry.sourceTruthAuthority,
      nextGate: entry.nextGate,
      category: 'evaluation_hold',
      userFacingSummary: 'One requested edit activity is still evaluation-only and is not available for scheduling.',
      internalBlocker: `${entry.requestedToolName} is registry-only and currently not selected/evaluation-only; it must stay out of execution planning unless an owner promotes it.`,
    }
  }

  return {
    requestedToolName: entry.requestedToolName,
    canonicalToolId: entry.canonicalToolId,
    sourceTruthStatus: entry.sourceTruthStatus,
    sourceTruthAuthority: entry.sourceTruthAuthority,
    nextGate: entry.nextGate,
    category: 'contract_required',
    userFacingSummary: 'One requested edit activity needs a bounded adapter contract before it can be scheduled.',
    internalBlocker: `${entry.requestedToolName} is not registered as a bounded professional adapter contract.`,
  }
}

function adapterProgramEntryForContract(contract: ProfessionalToolAdapterContract) {
  const normalized = normalizeRequestedToolName(contract.requestedToolName)
  const canonical = normalizeRequestedToolName(contract.canonicalToolId)
  const programMap = buildProfessionalToolArchitectureProgramMap()
  const entry = programMap.entries.find((item) =>
    normalizeRequestedToolName(item.requestedToolName) === normalized ||
    (item.canonicalToolId ? normalizeRequestedToolName(item.canonicalToolId) === canonical : false)
  )

  if (!entry) {
    throw new Error(`Missing professional tool architecture program entry for ${contract.requestedToolName}.`)
  }

  return entry
}

function userFacingReadinessSummaryForIssues(
  issues: readonly ProfessionalToolAdapterSourceTruthIssue[],
  fallback: string,
): string {
  if (!issues.length) return fallback

  const acceptedOwnerLaneCount = issues.filter((issue) => issue.category === 'accepted_owner_lane_runtime_gate').length
  const modelManifestCount = issues.filter((issue) => issue.category === 'model_manifest_required').length
  const scopeDecisionCount = issues.filter((issue) => issue.category === 'scope_decision_required').length
  const evaluationHoldCount = issues.filter((issue) => issue.category === 'evaluation_hold').length
  const unknownCount = issues.filter((issue) =>
    issue.category === 'contract_required' ||
    issue.category === 'unknown_tool'
  ).length
  const hardIssueCount = modelManifestCount + scopeDecisionCount + evaluationHoldCount + unknownCount
  const fragments: string[] = []

  if (acceptedOwnerLaneCount) fragments.push(`${acceptedOwnerLaneCount} support capabilit${acceptedOwnerLaneCount === 1 ? 'y follows' : 'ies follow'} owner-lane readiness`)
  if (modelManifestCount) fragments.push(`${modelManifestCount} activit${modelManifestCount === 1 ? 'y needs' : 'ies need'} model package records`)
  if (scopeDecisionCount) fragments.push(`${scopeDecisionCount} activit${scopeDecisionCount === 1 ? 'y needs' : 'ies need'} scope decisions`)
  if (evaluationHoldCount) fragments.push(`${evaluationHoldCount} activit${evaluationHoldCount === 1 ? 'y is' : 'ies are'} evaluation-only`)
  if (unknownCount) fragments.push(`${unknownCount} activit${unknownCount === 1 ? 'y needs' : 'ies need'} adapter selection`)

  if (!hardIssueCount) {
    return `${acceptedOwnerLaneCount} support capabilit${acceptedOwnerLaneCount === 1 ? 'y is' : 'ies are'} accepted by the owning lane and will follow the normal approved runtime gate.`
  }

  return `Some requested edit activities need follow-up before scheduling: ${fragments.join('; ')}.`
}

function sourceTruthIssueBlocksAdapterPlanning(issue: ProfessionalToolAdapterSourceTruthIssue): boolean {
  return issue.category !== 'accepted_owner_lane_runtime_gate'
}

function requiresCreditGate(contract: ProfessionalToolAdapterContract, mode: ProfessionalToolAdapterPlanMode): boolean {
  return mode === 'bounded_execution' && (
    contract.workerType === 'gpu_ai_worker' ||
    contract.workerType === 'render_worker'
  )
}

function toolBlockers(params: {
  contract: ProfessionalToolAdapterContract
  mode: ProfessionalToolAdapterPlanMode
  evidence: ProfessionalToolAdapterEvidence
  packageReadyIds: Set<string>
  modelWeightApprovedIds: Set<string>
}): string[] {
  const blockers: string[] = []
  const { contract, evidence, mode } = params
  const canonical = normalizeRequestedToolName(contract.canonicalToolId)

  if (!contract.modes.includes(mode)) {
    blockers.push(`${contract.canonicalToolId} does not support ${readableMode(mode)} in the current adapter contract.`)
  }

  if (!evidence.approvedPlanSnapshotId) {
    blockers.push(`${contract.canonicalToolId} requires an approved plan snapshot before agent/tool execution.`)
  }

  if (mode === 'bounded_execution' && contract.workerType === 'planning_only') {
    blockers.push(`${contract.canonicalToolId} is planning-only and must be converted to a render/worker recipe before bounded execution.`)
  }

  if (mode === 'bounded_execution' && contract.requiresPackageReadiness && !params.packageReadyIds.has(canonical)) {
    blockers.push(`${contract.canonicalToolId} needs package/runtime readiness evidence before bounded execution.`)
  }

  if (mode === 'bounded_execution' && contract.requiresModelWeightApproval && !params.modelWeightApprovedIds.has(canonical)) {
    blockers.push(`${contract.canonicalToolId} needs exact model/checkpoint approval before bounded execution.`)
  }

  if (requiresCreditGate(contract, mode) && (!evidence.creditEstimateId || !evidence.creditReservationId)) {
    blockers.push(`${contract.canonicalToolId} requires credit estimate and reservation evidence before paid/bounded work.`)
  }

  if (contract.requiresPrivateArtifacts && !evidence.privateArtifactRefs?.length) {
    blockers.push(`${contract.canonicalToolId} needs private artifact references, not raw files or signed URLs, before execution.`)
  }

  return blockers
}

export function createProfessionalToolAdapterPlan(
  input: ProfessionalToolAdapterPlanInput,
): ProfessionalToolAdapterPlan {
  const mode = input.mode ?? 'dry_run'
  const evidence = input.evidence ?? {}
  const requested = unique(input.requestedToolNames.map((name) => name.trim()).filter(Boolean))
  const packageReadyIds = evidenceSet(evidence.packageReadyToolIds)
  const modelWeightApprovedIds = evidenceSet(evidence.modelWeightApprovedToolIds)
  const tools: ProfessionalToolAdapterPlanTool[] = []
  const unresolvedToolNames: string[] = []
  const sourceTruthIssues: ProfessionalToolAdapterSourceTruthIssue[] = []
  const blockers: string[] = []

  for (const requestedToolName of requested) {
    const contract = resolveProfessionalToolAdapterContract(requestedToolName)
    if (!contract) {
      const issue = sourceTruthIssueForRequestedTool(requestedToolName)
      unresolvedToolNames.push(requestedToolName)
      sourceTruthIssues.push(issue)
      if (sourceTruthIssueBlocksAdapterPlanning(issue)) blockers.push(issue.internalBlocker)
      continue
    }
    const programEntry = adapterProgramEntryForContract(contract)

    const contractBlockers = toolBlockers({
      contract,
      evidence,
      mode,
      packageReadyIds,
      modelWeightApprovedIds,
    })
    blockers.push(...contractBlockers)

    tools.push({
      requestedToolName,
      canonicalToolId: contract.canonicalToolId,
      sourceTruthStatus: programEntry.sourceTruthStatus,
      sourceTruthAuthority: programEntry.sourceTruthAuthority,
      nextGate: programEntry.nextGate,
      capabilityFamily: contract.capabilityFamily,
      workerType: contract.workerType,
      mode,
      status: contractBlockers.length ? 'blocked' : 'ready',
      userFacingActivity: contract.userFacingActivity,
      privateInputManifestKinds: contract.privateInputManifestKinds,
      privateOutputManifestKinds: contract.privateOutputManifestKinds,
      qaGates: contract.qaGates,
      blockerNotes: contractBlockers,
    })
  }

  const qaGateTypes = unique(tools.flatMap((tool) => tool.qaGates))
  const privateInputManifestKinds = unique(tools.flatMap((tool) => tool.privateInputManifestKinds))
  const privateOutputManifestKinds = unique(tools.flatMap((tool) => tool.privateOutputManifestKinds))
  const creditGateRequired = tools.some((tool) => {
    const contract = resolveProfessionalToolAdapterContract(tool.canonicalToolId)
    return contract ? requiresCreditGate(contract, mode) : false
  })
  const creditGateReady = !creditGateRequired || Boolean(evidence.creditEstimateId && evidence.creditReservationId)
  const status = blockers.length ? 'blocked' : statusForMode(mode)

  return {
    id: `professional-tool-adapter-plan-${input.projectId}-${mode}`,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mode,
    status,
    requestedToolCount: requested.length,
    resolvedToolCount: tools.length,
    unresolvedToolNames,
    sourceTruthIssues,
    tools,
    qaGateTypes,
    privateInputManifestKinds,
    privateOutputManifestKinds,
    blockers,
    approvedSnapshotRequired: true,
    approvedSnapshotReady: Boolean(evidence.approvedPlanSnapshotId),
    creditGateRequired,
    creditGateReady,
    frontendExecutionAllowed: false,
    productReady: false,
    userFacingSummary: status === 'blocked'
      ? 'Some planned edit activities still need approval, package readiness, private artifact, or model-weight evidence before execution.'
      : `Ready to prepare ${tools.length} approved ${readableMode(mode)} edit activit${tools.length === 1 ? 'y' : 'ies'}.`,
    userFacingReadinessSummary: userFacingReadinessSummaryForIssues(
      sourceTruthIssues,
      status === 'blocked'
        ? 'Some planned edit activities still need approved readiness evidence before execution.'
        : `Ready to prepare ${tools.length} approved edit activit${tools.length === 1 ? 'y' : 'ies'}.`,
    ),
    internalExecutionSummary: [
      `Requested ${requested.length} tool adapter(s); resolved ${tools.length}.`,
      `Mode: ${mode}.`,
      input.userIntentSummary ? `User intent: ${input.userIntentSummary}` : 'User intent summary not supplied.',
      'Adapters are backend-owned; frontend execution remains disabled.',
    ].join(' '),
    noRuntimeSideEffects: [
      'Adapter planning does not import packages, execute binaries, load model weights, process media, render, call providers, write Supabase/GCS, or bill users.',
      'Bounded execution still requires approved snapshot, private artifact manifests, idempotency, cost gates, package readiness, and QA gates.',
      'User-facing chat should describe edit activities and progress, not expose implementation package names.',
    ],
  }
}

export function createProfessionalToolAdapterOrchestrationPlan(
  input: Omit<ProfessionalToolAdapterPlanInput, 'mode'>,
): ProfessionalToolAdapterOrchestrationPlan {
  const requested = unique(input.requestedToolNames.map((name) => name.trim()).filter(Boolean))
  const readinessToolNames: string[] = []
  const editAdapterToolNames: string[] = []
  const unresolvedToolNames: string[] = []

  for (const requestedToolName of requested) {
    const contract = resolveProfessionalToolAdapterContract(requestedToolName)
    if (!contract) {
      unresolvedToolNames.push(requestedToolName)
      continue
    }

    if (contract.modes.length === 1 && contract.modes[0] === 'readiness_check') {
      readinessToolNames.push(requestedToolName)
    } else {
      editAdapterToolNames.push(requestedToolName)
    }
  }

  const editAdapterPlan = editAdapterToolNames.length
    ? createProfessionalToolAdapterPlan({
      ...input,
      requestedToolNames: editAdapterToolNames,
      mode: 'dry_run',
    })
    : undefined
  const readinessPlan = readinessToolNames.length
    ? createProfessionalToolAdapterPlan({
      ...input,
      requestedToolNames: readinessToolNames,
      mode: 'readiness_check',
    })
    : undefined
  const sourceTruthIssues = unresolvedToolNames.map(sourceTruthIssueForRequestedTool)
  const blockers = [
    ...sourceTruthIssues
      .filter(sourceTruthIssueBlocksAdapterPlanning)
      .map((issue) => issue.internalBlocker),
    ...(editAdapterPlan?.blockers ?? []),
    ...(readinessPlan?.blockers ?? []),
  ]
  const resolvedToolCount = (editAdapterPlan?.resolvedToolCount ?? 0) + (readinessPlan?.resolvedToolCount ?? 0)
  const status = blockers.length ? 'blocked' : 'ready_for_adapter_dry_run_and_readiness'

  return {
    id: `professional-tool-adapter-orchestration-${input.projectId}`,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    status,
    requestedToolCount: requested.length,
    resolvedToolCount,
    editAdapterPlan,
    readinessPlan,
    unresolvedToolNames,
    sourceTruthIssues,
    blockers,
    userFacingSummary: status === 'blocked'
      ? 'Some requested edit activities still need approval or readiness evidence before adapter planning can proceed.'
      : `Ready to prepare ${editAdapterPlan?.resolvedToolCount ?? 0} edit activit${(editAdapterPlan?.resolvedToolCount ?? 0) === 1 ? 'y' : 'ies'} and ${readinessPlan?.resolvedToolCount ?? 0} runtime readiness check${(readinessPlan?.resolvedToolCount ?? 0) === 1 ? '' : 's'}.`,
    userFacingReadinessSummary: userFacingReadinessSummaryForIssues(
      sourceTruthIssues,
      status === 'blocked'
        ? 'Some requested edit activities still need approved readiness evidence before planning can proceed.'
        : 'The requested edit activities are ready for the next approved preparation step.',
    ),
    noRuntimeSideEffects: [
      ...(editAdapterPlan?.noRuntimeSideEffects ?? []),
      ...(readinessPlan?.noRuntimeSideEffects ?? []),
    ],
  }
}

export function createProfessionalToolAdapterBoundedExecutionGate(
  input: Omit<ProfessionalToolAdapterPlanInput, 'mode'>,
): ProfessionalToolAdapterBoundedExecutionGate {
  const boundedExecutionPlan = createProfessionalToolAdapterPlan({
    ...input,
    mode: 'bounded_execution',
  })
  const readyToolIds = boundedExecutionPlan.tools
    .filter((tool) => tool.status === 'ready')
    .map((tool) => tool.canonicalToolId)
  const blockedToolIds = boundedExecutionPlan.tools
    .filter((tool) => tool.status === 'blocked')
    .map((tool) => tool.canonicalToolId)
  const privateArtifactsReady = boundedExecutionPlan.tools
    .filter((tool) => {
      const contract = resolveProfessionalToolAdapterContract(tool.canonicalToolId)
      return contract?.requiresPrivateArtifacts
    })
    .every((tool) => tool.status === 'ready')
  const status = boundedExecutionPlan.status === 'ready_for_bounded_execution'
    ? 'ready_for_bounded_execution'
    : 'blocked'

  return {
    id: `professional-tool-adapter-bounded-execution-gate-${input.projectId}`,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    status,
    requestedToolCount: boundedExecutionPlan.requestedToolCount,
    resolvedToolCount: boundedExecutionPlan.resolvedToolCount,
    readyToolCount: readyToolIds.length,
    blockedToolCount: blockedToolIds.length,
    unresolvedToolNames: boundedExecutionPlan.unresolvedToolNames,
    readyToolIds,
    blockedToolIds,
    blockers: boundedExecutionPlan.blockers,
    sourceTruthIssues: boundedExecutionPlan.sourceTruthIssues,
    approvedSnapshotReady: boundedExecutionPlan.approvedSnapshotReady,
    creditGateReady: boundedExecutionPlan.creditGateReady,
    privateArtifactsReady,
    clientReadinessHintsTrusted: false,
    serverSourceTruthRequired: true,
    frontendExecutionAllowed: false,
    productReady: false,
    userFacingSummary: status === 'ready_for_bounded_execution'
      ? `Ready for approved preparation of ${readyToolIds.length} edit activit${readyToolIds.length === 1 ? 'y' : 'ies'}.`
      : `Advanced edit preparation is blocked for ${blockedToolIds.length} edit activit${blockedToolIds.length === 1 ? 'y' : 'ies'} until readiness evidence is complete.`,
    userFacingReadinessSummary: userFacingReadinessSummaryForIssues(
      boundedExecutionPlan.sourceTruthIssues,
      status === 'ready_for_bounded_execution'
        ? `Ready for approved preparation of ${readyToolIds.length} edit activit${readyToolIds.length === 1 ? 'y' : 'ies'}.`
        : `Advanced edit preparation is blocked for ${blockedToolIds.length} activit${blockedToolIds.length === 1 ? 'y' : 'ies'} until readiness evidence is complete.`,
    ),
    internalExecutionSummary: [
      boundedExecutionPlan.internalExecutionSummary,
      `Bounded ready: ${readyToolIds.length}; blocked: ${blockedToolIds.length}; unresolved: ${boundedExecutionPlan.unresolvedToolNames.length}.`,
      'This gate is server-owned and does not accept browser package/model readiness hints as source truth.',
    ].join(' '),
    noRuntimeSideEffects: [
      ...boundedExecutionPlan.noRuntimeSideEffects,
      'Bounded execution gate evaluation does not run adapters; it records server-owned readiness evidence for a future worker execution step.',
      'Client-supplied package/model readiness hints are not source truth for this gate.',
    ],
    boundedExecutionPlan,
  }
}

export function listProfessionalToolAdapterNames(): string[] {
  return listProfessionalToolAdapterContracts().map((contract) => contract.requestedToolName)
}

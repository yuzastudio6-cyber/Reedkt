import {
  getFallbackChainsForTool,
  getProductionToolProfile,
  getToolQAPolicy,
  isProductionToolId,
  type ProductionToolId,
} from '../tool-registry'
import { resolveCompleteProfessionalToolOperationSpec } from '../tool-execution/core-registry-operations/core-registry-operation-specs'
import type {
  AuthorityExecutionPackageRecord,
  AuthorityJsonBlobRef,
} from '../services/private-edit-authority-store'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import type {
  CanonicalApprovedExecutionAuthority,
  CanonicalApprovedExecutionWorkItem,
} from '../services/edit-planning-authority-service'

export const CANONICAL_APPROVED_EDIT_EXECUTION_PACKAGE_VERSION =
  'canonical-approved-edit-execution-package-v5' as const
export const CANONICAL_TOOL_AUTHORIZATION_MANIFEST_VERSION =
  'canonical-tool-authorization-manifest-v2' as const
export const CANONICAL_TOOL_OPERATION_BINDING_VERSION =
  'canonical-tool-operation-binding-v1' as const

export interface CanonicalToolOperationBinding {
  schemaVersion: typeof CANONICAL_TOOL_OPERATION_BINDING_VERSION
  toolId: ProductionToolId
  operationId: string
  approvedWorkItemId: string
  approvedWorkItemKey: string
  executionInputHash: string
  operationSpecVersion: string
  operationSpecHash: string
  disposition: 'edit_operation_candidate'
  policyBlocks: []
  productReady: false
  runtimeEvidenceReady: false
  workerDispatchAuthorized: false
  bindingHash: string
}

export interface CanonicalToolAuthorization {
  toolId: ProductionToolId
  approvedWorkItemIds: string[]
  approvedWorkItemKeys: string[]
  approvedOperationIds: string[]
  operationBindings: CanonicalToolOperationBinding[]
  operationBindingsHash: string
  category: string
  workerType: string
  executionMode: string
  productionStatus: string
  adoptionStage: string
  launchCore: boolean
  gpuRequired: boolean
  cpuAllowed: boolean
  inputTypes: string[]
  outputTypes: string[]
  supportedActions: string[]
  qa: {
    gateTypes: string[]
    requiredBeforePreview: string[]
    requiredBeforeFinalExport: string[]
  }
  fallbackChains: Array<{
    chainId: string
    trigger: string
    steps: Array<{
      action: string
      toolIds: ProductionToolId[]
      blocksFinalExport: boolean
      requiresUserReview: boolean
    }>
  }>
  capabilityState: 'approved_contract_runtime_evidence_required' | 'blocked_by_registry_policy'
  productReady: false
  runtimeEvidenceReady: false
  privateArtifactsOnly: true
  publicExecutionAllowed: false
  productionExecutionAllowed: false
  approvedSnapshotRequired: true
  creditReservationRequired: true
  costEvidencePolicy: {
    actualInternalToolCostOnly: true
    emitOnlyAfterActualWork: true
    billableToUser: false
    serviceFeeIncluded: false
    walletMutationAllowed: false
    settlementAllowed: false
  }
}

export interface CanonicalToolAuthorizationManifest {
  schemaVersion: typeof CANONICAL_TOOL_AUTHORIZATION_MANIFEST_VERSION
  source: 'canonical_approved_work_items'
  snapshotId: string
  snapshotHash: string
  reservationId: string
  workGraphHash: string
  toolIds: ProductionToolId[]
  operationIds: string[]
  operationBindings: CanonicalToolOperationBinding[]
  operationBindingCount: number
  operationBindingsHash: string
  tools: CanonicalToolAuthorization[]
  registryContractReadyCount: number
  registryBlockedCount: number
  runtimeEvidenceReadyCount: 0
  productReadyCount: 0
  workerDispatchAuthorized: false
  productionExecutionAllowed: false
  noRuntimeSideEffects: true
  manifestHash: string
}

export interface CanonicalApprovedEditExecutionPackage {
  schemaVersion: typeof CANONICAL_APPROVED_EDIT_EXECUTION_PACKAGE_VERSION
  packageRecordId: string
  source: 'canonical_edit_authority'
  purpose: 'private_internal_execution_handoff'
  authorityRevision: number
  workspaceId: string
  projectId: string
  editSessionId: string
  approvedPlanSnapshotId: string
  planId: string
  estimateId: string
  reservationId: string
  approvalId: string
  snapshotHash: string
  planHash: string
  estimateHash: string
  workGraphHash: string
  sourceSequenceHash: string
  timingHash: string
  approvedAssetManifestRef: AuthorityJsonBlobRef
  approvedAssetManifestHash: string
  plannedAssetCount: number
  requiredPlannedAssetCount: number
  approvedSourceAssetManifestRef: AuthorityJsonBlobRef
  approvedSourceAssetManifestHash: string
  sourceBindingCount: number
  requiredSourceBindingCount: number
  componentRefs: Record<string, AuthorityJsonBlobRef>
  approvedMaximumCredits: number
  reservationStatus: string
  remainingReservedCredits: number
  approvedWorkItems: Array<{
    id: string
    workItemKey: string
    workItemType: string
    workerClass: string
    executionInputRef: AuthorityJsonBlobRef
    executionInputHash: string
    sourceSequenceItemIds: string[]
    sourceCleanupDecisionIds: string[]
    expectedOutputs: CanonicalApprovedExecutionWorkItem['expectedOutputs']
    dependencyKeys: string[]
    approvedToolIds: string[]
    approvedToolOperationIds: string[]
    toolOperationBindingsHash: string
    approvedProviderRoute?: string
    providerExecutionMode: string
    fallbackPolicyRef: AuthorityJsonBlobRef
    maxAttempts: number
    attemptTimeoutSeconds: number
    scheduledDelaySeconds: number
    maximumCreditBudget: number
    required: boolean
  }>
  jobs: Array<{
    id: string
    approvedWorkItemId: string
    workItemKey: string
    jobType: string
    workerClass: string
    executionInputRef: AuthorityJsonBlobRef
    sourceSequenceItemIds: string[]
    sourceCleanupDecisionIds: string[]
    expectedAssetIds: string[]
    dependencyJobIds: string[]
    approvedToolOperationIds: string[]
    toolOperationBindingsHash: string
    dependencyState: 'blocked' | 'ready'
    dispatchState: 'not_authorized'
    maxAttempts: number
    attemptTimeoutSeconds: number
    scheduledFor: string
  }>
  toolCapabilityManifestRef: AuthorityJsonBlobRef
  approvedToolIds: ProductionToolId[]
  approvedToolOperationIds: string[]
  toolOperationBindingCount: number
  toolOperationBindingsHash: string
  toolCapabilityManifestHash: string
  approvedProviderRoutes: string[]
  status: 'canonical_authority_packaged_runtime_blocked'
  authorityHandoffReady: true
  workerDispatchReady: false
  finalRenderReady: false
  liveExecutionReady: false
  blockers: string[]
  noRuntimeSideEffects: string[]
  createdByUserId: string
  createdAt: string
  packageHash: string
}

export function createCanonicalToolAuthorizationManifest(
  authority: CanonicalApprovedExecutionAuthority,
): CanonicalToolAuthorizationManifest {
  const operationBindings = createCanonicalToolOperationBindings(authority.workItems)
  const toolIds = productionToolIds(operationBindings.map((binding) => binding.toolId))
  const tools = toolIds.map((toolId) => toolAuthorization(toolId, authority.workItems, operationBindings))
  const manifestWithoutHash = {
    schemaVersion: CANONICAL_TOOL_AUTHORIZATION_MANIFEST_VERSION,
    source: 'canonical_approved_work_items' as const,
    snapshotId: authority.snapshot.snapshotId,
    snapshotHash: authority.snapshot.snapshotHash,
    reservationId: authority.snapshot.reservationId,
    workGraphHash: authority.snapshot.workGraphHash,
    toolIds: tools.map((tool) => tool.toolId),
    operationIds: uniqueSorted(operationBindings.map((binding) => binding.operationId)),
    operationBindings,
    operationBindingCount: operationBindings.length,
    operationBindingsHash: sha256AuthorityValue(operationBindings),
    tools,
    registryContractReadyCount: tools.filter((tool) => tool.capabilityState === 'approved_contract_runtime_evidence_required').length,
    registryBlockedCount: tools.filter((tool) => tool.capabilityState === 'blocked_by_registry_policy').length,
    runtimeEvidenceReadyCount: 0 as const,
    productReadyCount: 0 as const,
    workerDispatchAuthorized: false as const,
    productionExecutionAllowed: false as const,
    noRuntimeSideEffects: true as const,
  }
  return {
    ...manifestWithoutHash,
    manifestHash: sha256AuthorityValue(manifestWithoutHash),
  }
}

export function assertCanonicalToolAuthorizationManifestMatchesAuthority(
  value: unknown,
  authority: CanonicalApprovedExecutionAuthority,
): CanonicalToolAuthorizationManifest {
  const expected = createCanonicalToolAuthorizationManifest(authority)
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    stableAuthorityStringify(value) !== stableAuthorityStringify(expected)
  ) {
    throw new Error('Canonical tool authorization manifest does not exactly match approved work-item operation authority.')
  }
  return structuredClone(expected)
}

export function createCanonicalApprovedEditExecutionPackage(input: {
  authority: CanonicalApprovedExecutionAuthority
  executionPackageRecord: AuthorityExecutionPackageRecord
  toolCapabilityManifest: CanonicalToolAuthorizationManifest
}): CanonicalApprovedEditExecutionPackage {
  const { authority, executionPackageRecord } = input
  const toolCapabilityManifest = assertCanonicalToolAuthorizationManifestMatchesAuthority(
    input.toolCapabilityManifest,
    authority,
  )
  const remainingReservedCredits = authority.reservation.reservedCredits -
    authority.reservation.spentCredits -
    authority.reservation.releasedCredits -
    authority.reservation.refundedCredits
  return {
    schemaVersion: CANONICAL_APPROVED_EDIT_EXECUTION_PACKAGE_VERSION,
    packageRecordId: executionPackageRecord.id,
    source: 'canonical_edit_authority',
    purpose: executionPackageRecord.purpose,
    authorityRevision: authority.authorityRevision,
    workspaceId: authority.snapshot.workspaceId,
    projectId: authority.snapshot.projectId,
    editSessionId: authority.snapshot.editSessionId,
    approvedPlanSnapshotId: authority.snapshot.snapshotId,
    planId: authority.snapshot.planId,
    estimateId: authority.snapshot.estimateId,
    reservationId: authority.snapshot.reservationId,
    approvalId: authority.snapshot.approvalId,
    snapshotHash: authority.snapshot.snapshotHash,
    planHash: authority.snapshot.planHash,
    estimateHash: authority.snapshot.estimateHash,
    workGraphHash: authority.snapshot.workGraphHash,
    sourceSequenceHash: authority.snapshot.sourceSequenceHash,
    timingHash: authority.snapshot.timingHash,
    approvedAssetManifestRef: authority.snapshot.approvedAssetManifestRef,
    approvedAssetManifestHash: authority.snapshot.approvedAssetManifestHash,
    plannedAssetCount: authority.assetManifest.entries.length,
    requiredPlannedAssetCount: authority.assetManifest.requiredAssetCount,
    approvedSourceAssetManifestRef: authority.snapshot.approvedSourceAssetManifestRef,
    approvedSourceAssetManifestHash: authority.snapshot.approvedSourceAssetManifestHash,
    sourceBindingCount: authority.sourceAssetManifest.bindings.length,
    requiredSourceBindingCount: authority.sourceAssetManifest.requiredBindingCount,
    componentRefs: authority.snapshot.componentRefs,
    approvedMaximumCredits: authority.estimate.approvedMaximumCredits,
    reservationStatus: authority.reservation.status,
    remainingReservedCredits,
    approvedWorkItems: authority.workItems.map((workItem) => safeWorkItem(workItem, toolCapabilityManifest)),
    jobs: authority.jobs.map((job) => ({
      ...jobOperationAuthority(job.approvedWorkItemId, toolCapabilityManifest),
      id: job.id,
      approvedWorkItemId: job.approvedWorkItemId,
      workItemKey: job.workItemKey,
      jobType: job.jobType,
      workerClass: job.workerClass,
      executionInputRef: job.executionInputRef,
      sourceSequenceItemIds: [...job.sourceSequenceItemIds],
      sourceCleanupDecisionIds: [...job.sourceCleanupDecisionIds],
      expectedAssetIds: [...job.expectedAssetIds],
      dependencyJobIds: job.dependencyJobIds,
      dependencyState: job.status,
      dispatchState: 'not_authorized',
      maxAttempts: job.maxAttempts,
      attemptTimeoutSeconds: job.attemptTimeoutSeconds,
      scheduledFor: job.scheduledFor,
    })),
    toolCapabilityManifestRef: executionPackageRecord.toolCapabilityManifestRef,
    approvedToolIds: [...toolCapabilityManifest.toolIds],
    approvedToolOperationIds: [...toolCapabilityManifest.operationIds],
    toolOperationBindingCount: toolCapabilityManifest.operationBindingCount,
    toolOperationBindingsHash: toolCapabilityManifest.operationBindingsHash,
    toolCapabilityManifestHash: toolCapabilityManifest.manifestHash,
    approvedProviderRoutes: unique(authority.workItems.flatMap((workItem) =>
      workItem.approvedProviderRoute ? [workItem.approvedProviderRoute] : [])),
    status: 'canonical_authority_packaged_runtime_blocked',
    authorityHandoffReady: true,
    workerDispatchReady: false,
    finalRenderReady: false,
    liveExecutionReady: false,
    blockers: [
      'Source media authority is frozen, but worker-safe object resolution and a tenant-scoped canonical lease must still revalidate exact storage identity immediately before byte access.',
      'Planned asset authority is frozen, but produced artifact versions, storage identity, QA evidence, merge state, and actual-cost evidence are not yet committed.',
      'Each approved tool requires server-owned installation, license/model-weight, runner, artifact, QA, and actual-cost evidence before dispatch.',
      'Final render remains blocked until all required dependency, asset, timing, and final-QA evidence is committed.',
      'Distributed production authority is not deployed; this package is private single-host internal-test evidence only.',
    ],
    noRuntimeSideEffects: [
      'Package creation did not call providers, claim workers, process media, render, write GCS, mutate paid billing, or settle credits.',
      'The canonical jobs created during approval are referenced exactly; no second job graph was created.',
      'Tool authorization is registry contract evidence only and does not claim runtime availability or execution.',
    ],
    createdByUserId: executionPackageRecord.createdByUserId,
    createdAt: executionPackageRecord.createdAt,
    packageHash: executionPackageRecord.packageHash,
  }
}

export function assertCanonicalApprovedEditExecutionPackageMatchesAuthority(input: {
  value: unknown
  authority: CanonicalApprovedExecutionAuthority
  executionPackageRecord: AuthorityExecutionPackageRecord
  toolCapabilityManifest: CanonicalToolAuthorizationManifest
}): CanonicalApprovedEditExecutionPackage {
  if (!input.value || typeof input.value !== 'object' || Array.isArray(input.value)) {
    throw new Error('Canonical execution package has an invalid object shape.')
  }
  const received = input.value as Record<string, unknown>
  const authorityRevision = received.authorityRevision
  if (!Number.isSafeInteger(authorityRevision) || Number(authorityRevision) <= 0) {
    throw new Error('Canonical execution package authority revision is invalid.')
  }
  const expected = createCanonicalApprovedEditExecutionPackage({
    authority: { ...input.authority, authorityRevision: Number(authorityRevision) },
    executionPackageRecord: input.executionPackageRecord,
    toolCapabilityManifest: input.toolCapabilityManifest,
  })
  if (stableAuthorityStringify(received) !== stableAuthorityStringify(expected)) {
    throw new Error('Canonical execution package does not exactly match approved operation authority.')
  }
  return structuredClone(expected)
}

function toolAuthorization(
  rawToolId: string,
  workItems: CanonicalApprovedExecutionWorkItem[],
  operationBindings: CanonicalToolOperationBinding[],
): CanonicalToolAuthorization {
  if (!isProductionToolId(rawToolId)) {
    throw new Error(`Canonical approved work graph references unknown production tool ${rawToolId}.`)
  }
  const profile = getProductionToolProfile(rawToolId)
  if (!profile) throw new Error(`Production tool profile ${rawToolId} is missing.`)
  const qa = getToolQAPolicy(rawToolId)
  const matchingWorkItems = workItems
    .filter((workItem) => workItem.approvedToolIds.includes(rawToolId))
    .sort(compareWorkItems)
  const matchingBindings = operationBindings.filter((binding) => binding.toolId === rawToolId)
  const blockedByRegistry = profile.productionStatus === 'blocked' ||
    profile.productionStatus === 'evaluation_only' ||
    profile.productionStatus === 'needs_license_review' ||
    profile.modelWeightPolicy.reviewStatus !== 'approved'
  return {
    toolId: rawToolId,
    approvedWorkItemIds: matchingWorkItems.map((workItem) => workItem.id),
    approvedWorkItemKeys: matchingWorkItems.map((workItem) => workItem.workItemKey),
    approvedOperationIds: uniqueSorted(matchingBindings.map((binding) => binding.operationId)),
    operationBindings: matchingBindings.map((binding) => structuredClone(binding)),
    operationBindingsHash: sha256AuthorityValue(matchingBindings),
    category: profile.category,
    workerType: profile.workerType,
    executionMode: profile.executionMode,
    productionStatus: profile.productionStatus,
    adoptionStage: profile.adoptionStage,
    launchCore: profile.launchCore,
    gpuRequired: profile.gpuRequired,
    cpuAllowed: profile.cpuAllowed,
    inputTypes: [...profile.inputTypes],
    outputTypes: [...profile.outputTypes],
    supportedActions: [...profile.supportedActions],
    qa: {
      gateTypes: [...qa.gateTypes],
      requiredBeforePreview: [...qa.requiredBeforePreview],
      requiredBeforeFinalExport: [...qa.requiredBeforeFinalExport],
    },
    fallbackChains: getFallbackChainsForTool(rawToolId).map((chain) => ({
      chainId: chain.chainId,
      trigger: chain.trigger,
      steps: chain.steps.map((step) => ({
        action: step.action,
        toolIds: [...step.toolIds],
        blocksFinalExport: step.blocksFinalExport === true,
        requiresUserReview: step.requiresUserReview === true,
      })),
    })),
    capabilityState: blockedByRegistry
      ? 'blocked_by_registry_policy'
      : 'approved_contract_runtime_evidence_required',
    productReady: false,
    runtimeEvidenceReady: false,
    privateArtifactsOnly: true,
    publicExecutionAllowed: false,
    productionExecutionAllowed: false,
    approvedSnapshotRequired: true,
    creditReservationRequired: true,
    costEvidencePolicy: {
      actualInternalToolCostOnly: true,
      emitOnlyAfterActualWork: true,
      billableToUser: false,
      serviceFeeIncluded: false,
      walletMutationAllowed: false,
      settlementAllowed: false,
    },
  }
}

function createCanonicalToolOperationBindings(
  workItems: CanonicalApprovedExecutionWorkItem[],
): CanonicalToolOperationBinding[] {
  const bindings: CanonicalToolOperationBinding[] = []
  for (const workItem of [...workItems].sort(compareWorkItems)) {
    if (workItem.executionInputHash !== sha256AuthorityValue(workItem.executionInput)) {
      throw new Error(`Canonical work item ${workItem.workItemKey} execution-input hash is invalid.`)
    }
    if (new Set(workItem.approvedToolIds).size !== workItem.approvedToolIds.length) {
      throw new Error(`Canonical work item ${workItem.workItemKey} contains duplicate approved tool identities.`)
    }

    const rawOperationIds = workItem.executionInput.approvedToolOperationIds
    if (workItem.approvedToolIds.length === 0) {
      if (rawOperationIds !== undefined && (
        !Array.isArray(rawOperationIds) ||
        rawOperationIds.length > 0
      )) {
        throw new Error(`Tool-free canonical work item ${workItem.workItemKey} contains tool operation authority.`)
      }
      continue
    }
    if (
      !Array.isArray(rawOperationIds) ||
      rawOperationIds.some((operationId) => typeof operationId !== 'string')
    ) {
      throw new Error(`Canonical work item ${workItem.workItemKey} is missing exact approved tool operation identities.`)
    }
    const operationIds = rawOperationIds as string[]
    if (new Set(operationIds).size !== operationIds.length) {
      throw new Error(`Canonical work item ${workItem.workItemKey} contains duplicate tool operation identities.`)
    }

    const expectedOperationIds: string[] = []
    for (const toolId of productionToolIds(workItem.approvedToolIds)) {
      const spec = resolveCompleteProfessionalToolOperationSpec(toolId)
      if (
        !spec ||
        spec.canonicalToolId !== toolId ||
        spec.allowedOperationIds.length !== 1 ||
        spec.disposition !== 'edit_operation_candidate' ||
        spec.policyBlocks.length > 0 ||
        spec.productReady !== false
      ) {
        throw new Error(`Canonical work item ${workItem.workItemKey} references a non-callable tool operation contract for ${toolId}.`)
      }
      const operationId = spec.allowedOperationIds[0]
      expectedOperationIds.push(operationId)
      const bindingWithoutHash = {
        schemaVersion: CANONICAL_TOOL_OPERATION_BINDING_VERSION,
        toolId,
        operationId,
        approvedWorkItemId: workItem.id,
        approvedWorkItemKey: workItem.workItemKey,
        executionInputHash: workItem.executionInputHash,
        operationSpecVersion: spec.schemaVersion,
        operationSpecHash: sha256AuthorityValue(spec),
        disposition: 'edit_operation_candidate' as const,
        policyBlocks: [] as [],
        productReady: false as const,
        runtimeEvidenceReady: false as const,
        workerDispatchAuthorized: false as const,
      }
      bindings.push({
        ...bindingWithoutHash,
        bindingHash: sha256AuthorityValue(bindingWithoutHash),
      })
    }
    if (!sameStrings(uniqueSorted(expectedOperationIds), uniqueSorted(operationIds))) {
      throw new Error(`Canonical work item ${workItem.workItemKey} tool operation identities do not match its exact tools.`)
    }
  }
  return bindings.sort(compareOperationBindings)
}

function jobOperationAuthority(
  approvedWorkItemId: string,
  manifest: CanonicalToolAuthorizationManifest,
): { approvedToolOperationIds: string[]; toolOperationBindingsHash: string } {
  const bindings = manifest.operationBindings
    .filter((binding) => binding.approvedWorkItemId === approvedWorkItemId)
    .sort(compareOperationBindings)
  return {
    approvedToolOperationIds: uniqueSorted(bindings.map((binding) => binding.operationId)),
    toolOperationBindingsHash: sha256AuthorityValue(bindings),
  }
}

function compareWorkItems(
  left: CanonicalApprovedExecutionWorkItem,
  right: CanonicalApprovedExecutionWorkItem,
): number {
  return left.id.localeCompare(right.id) || left.workItemKey.localeCompare(right.workItemKey)
}

function compareOperationBindings(
  left: CanonicalToolOperationBinding,
  right: CanonicalToolOperationBinding,
): number {
  return left.approvedWorkItemId.localeCompare(right.approvedWorkItemId) ||
    left.toolId.localeCompare(right.toolId) ||
    left.operationId.localeCompare(right.operationId)
}

function safeWorkItem(
  workItem: CanonicalApprovedExecutionWorkItem,
  manifest: CanonicalToolAuthorizationManifest,
) {
  const operationAuthority = jobOperationAuthority(workItem.id, manifest)
  return {
    id: workItem.id,
    workItemKey: workItem.workItemKey,
    workItemType: workItem.workItemType,
    workerClass: workItem.workerClass,
    executionInputRef: workItem.executionInputRef,
    executionInputHash: workItem.executionInputHash,
    sourceSequenceItemIds: [...workItem.sourceSequenceItemIds],
    sourceCleanupDecisionIds: [...workItem.sourceCleanupDecisionIds],
    expectedOutputs: workItem.expectedOutputs.map((output) => ({
      ...output,
      segmentIds: [...output.segmentIds],
      timingIds: [...output.timingIds],
      rendererLayerIds: [...output.rendererLayerIds],
    })),
    dependencyKeys: [...workItem.dependencyKeys],
    approvedToolIds: [...workItem.approvedToolIds],
    ...operationAuthority,
    ...(workItem.approvedProviderRoute ? { approvedProviderRoute: workItem.approvedProviderRoute } : {}),
    providerExecutionMode: workItem.providerExecutionMode,
    fallbackPolicyRef: workItem.fallbackPolicyRef,
    maxAttempts: workItem.maxAttempts,
    attemptTimeoutSeconds: workItem.attemptTimeoutSeconds,
    scheduledDelaySeconds: workItem.scheduledDelaySeconds,
    maximumCreditBudget: workItem.maximumCreditBudget,
    required: workItem.required,
  }
}

function unique<T extends string>(values: T[]): T[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean) as T[])]
}

function uniqueSorted<T extends string>(values: readonly T[]): T[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right))
}

function sameStrings(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index])
}

function productionToolIds(values: string[]): ProductionToolId[] {
  return uniqueSorted(values).map((value) => {
    if (!isProductionToolId(value)) throw new Error(`Unknown canonical production tool ${value}.`)
    return value
  })
}

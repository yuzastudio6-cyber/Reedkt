import { z } from 'zod'

import { workerConcurrencyPolicy } from '../cost-controls/worker-concurrency-policy'
import {
  getProductionToolProfile,
  isProductionToolId,
  type ProductionRegistryWorkerType,
  type ProductionToolId,
} from '../tool-registry'
import {
  PROVEN_TOOL_EVIDENCE_REVISION,
  PROVEN_TOOL_IDENTITY_CATALOG_VERSION,
  listProvenToolIdentityCatalog,
} from '../tool-execution/proven-tool-identity-catalog'
import type {
  CanonicalApprovedEditExecutionPackage,
  CanonicalToolAuthorizationManifest,
} from './canonical-approved-edit-execution-package'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'

export const CANONICAL_PRIVATE_RESOURCE_PLACEMENT_POLICY_VERSION =
  'canonical-private-resource-placement-policy-v1' as const
export const CANONICAL_PRIVATE_RESOURCE_PLACEMENT_MANIFEST_VERSION =
  'canonical-private-resource-placement-manifest-v1' as const
export const CANONICAL_PRIVATE_PROVEN_TOOL_PLACEMENT_CATALOG_VERSION =
  'canonical-private-proven-tool-placement-catalog-v1' as const
export const CANONICAL_PRIVATE_GLOBAL_MAX_CONCURRENCY = 4 as const

const safeKey = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)

const executableWorkerTypeSchema = z.enum([
  'api_service',
  'cpu_analysis_worker',
  'gpu_ai_worker',
  'render_worker',
  'qa_worker',
  'tool_readiness_worker',
])

export type CanonicalPrivateExecutableWorkerType = z.infer<
  typeof executableWorkerTypeSchema
>

const resourceClassSchema = z.enum([
  'control_plane_cpu_v1',
  'cpu_analysis_standard_v1',
  'gpu_l4_standard_v1',
  'render_cpu_high_memory_v1',
  'qa_cpu_standard_v1',
  'tool_readiness_cpu_v1',
])

const acceleratorSchema = z.enum(['none', 'nvidia_l4'])
const executionTargetSchema = z.enum(['cloud_run_service', 'cloud_run_job'])

const placementCoreSchema = z.object({
  workerType: executableWorkerTypeSchema,
  resourceClassId: resourceClassSchema,
  plannedCloudExecutionTarget: executionTargetSchema,
  preferredAccelerator: acceleratorSchema,
  cpuAllowed: z.boolean(),
  workerConcurrencyLimit: z.number().int().positive().max(100),
  globalConcurrencyLimit: z.literal(CANONICAL_PRIVATE_GLOBAL_MAX_CONCURRENCY),
  regionPolicyId: z.literal('project_selected_data_local_region_v1'),
  objectTransportPolicyId: z.literal('immutable_private_object_identity_v1'),
}).strict()

const provenToolPlacementSchema = placementCoreSchema.extend({
  canonicalToolId: safeKey,
  operationId: safeKey,
  runnerClass: safeKey,
  toolIdentityHash: sha256,
  toolProofHash: sha256,
  toolProfilePlacementHash: sha256,
  privateInternalEndToEndReady: z.literal(true),
  privateInternalJobAdapterReady: z.literal(true),
  placementHash: sha256,
}).strict()

const provenToolPlacementCatalogSchema = z.object({
  schemaVersion: z.literal(CANONICAL_PRIVATE_PROVEN_TOOL_PLACEMENT_CATALOG_VERSION),
  source: z.literal('proven_tool_identity_and_production_registry_reconciliation'),
  placementPolicyVersion: z.literal(CANONICAL_PRIVATE_RESOURCE_PLACEMENT_POLICY_VERSION),
  provenCatalogVersion: z.literal(PROVEN_TOOL_IDENTITY_CATALOG_VERSION),
  evidenceRevision: z.literal(PROVEN_TOOL_EVIDENCE_REVISION),
  tools: z.array(provenToolPlacementSchema).max(256),
  summary: z.object({
    totalProvenToolCount: z.number().int().nonnegative().max(256),
    cpuAnalysisToolCount: z.number().int().nonnegative().max(256),
    gpuToolCount: z.number().int().nonnegative().max(256),
    renderToolCount: z.number().int().nonnegative().max(256),
    qaToolCount: z.number().int().nonnegative().max(256),
    allToolsHaveExactResourcePlacement: z.literal(true),
    cloudDispatchAuthorized: z.literal(false),
    productionExecutionAuthorized: z.literal(false),
  }).strict(),
  catalogHash: sha256,
}).strict()

export type CanonicalPrivateProvenToolPlacementCatalog = z.infer<
  typeof provenToolPlacementCatalogSchema
>
export type CanonicalPrivateProvenToolPlacement = z.infer<
  typeof provenToolPlacementSchema
>

const workItemPlacementSchema = placementCoreSchema.extend({
  jobId: safeKey,
  approvedWorkItemId: safeKey,
  workItemKey: safeKey,
  workItemType: safeKey,
  canonicalWorkerClass: safeKey,
  approvedToolIds: z.array(safeKey).max(1),
  approvedToolOperationIds: z.array(safeKey).max(1),
  providerExecutionMode: z.enum(['none', 'primary', 'fallback', 'final_fallback']),
  placementSource: z.enum([
    'proven_tool_identity',
    'tool_registry_contract_only',
    'tool_free_control_plane_policy',
    'provider_route_contract_only',
  ]),
  privateExecutionReady: z.boolean(),
  runtimeRunnerClass: safeKey.optional(),
  toolIdentityHash: sha256.optional(),
  toolProofHash: sha256.optional(),
  requiredGate: safeKey.optional(),
  placementHash: sha256,
}).strict().superRefine((entry, context) => {
  const toolBacked = entry.approvedToolIds.length === 1
  if (toolBacked !== (entry.approvedToolOperationIds.length === 1)) {
    context.addIssue({ code: 'custom', message: 'Tool and operation placement cardinality disagree.' })
  }
  if (entry.placementSource === 'proven_tool_identity') {
    if (
      !toolBacked || !entry.privateExecutionReady || !entry.runtimeRunnerClass ||
      !entry.toolIdentityHash || !entry.toolProofHash || entry.requiredGate
    ) {
      context.addIssue({ code: 'custom', message: 'Proven tool placement evidence is incomplete.' })
    }
  }
  if (entry.placementSource === 'tool_registry_contract_only') {
    if (!toolBacked || entry.privateExecutionReady || !entry.requiredGate) {
      context.addIssue({ code: 'custom', message: 'Registry-only placement must remain execution blocked.' })
    }
  }
  if (entry.placementSource === 'tool_free_control_plane_policy') {
    if (toolBacked || !entry.privateExecutionReady || entry.runtimeRunnerClass ||
      entry.toolIdentityHash || entry.toolProofHash || entry.requiredGate) {
      context.addIssue({ code: 'custom', message: 'Tool-free placement evidence is inconsistent.' })
    }
  }
  if (entry.placementSource === 'provider_route_contract_only') {
    if (entry.privateExecutionReady || !entry.requiredGate || entry.providerExecutionMode === 'none') {
      context.addIssue({ code: 'custom', message: 'Provider placement must remain execution blocked.' })
    }
  }
  if (entry.providerExecutionMode !== 'none' && entry.privateExecutionReady) {
    context.addIssue({ code: 'custom', message: 'Provider-backed placement cannot gain private execution authority.' })
  }
})

export const canonicalPrivateResourcePlacementManifestSchema = z.object({
  schemaVersion: z.literal(CANONICAL_PRIVATE_RESOURCE_PLACEMENT_MANIFEST_VERSION),
  source: z.literal('canonical_execution_package_resource_reconciliation'),
  placementPolicyVersion: z.literal(CANONICAL_PRIVATE_RESOURCE_PLACEMENT_POLICY_VERSION),
  identity: z.object({
    workspaceId: safeKey,
    projectId: safeKey,
    editSessionId: safeKey,
    packageRecordId: safeKey,
    approvedPlanSnapshotId: safeKey,
    packageHash: sha256,
    snapshotHash: sha256,
    workGraphHash: sha256,
    toolCapabilityManifestHash: sha256,
    provenToolPlacementCatalogHash: sha256,
  }).strict(),
  placements: z.array(workItemPlacementSchema).min(1).max(256),
  summary: z.object({
    totalJobCount: z.number().int().positive().max(256),
    privatelyExecutableJobCount: z.number().int().nonnegative().max(256),
    blockedJobCount: z.number().int().nonnegative().max(256),
    controlPlaneJobCount: z.number().int().nonnegative().max(256),
    cpuAnalysisJobCount: z.number().int().nonnegative().max(256),
    gpuJobCount: z.number().int().nonnegative().max(256),
    renderJobCount: z.number().int().nonnegative().max(256),
    qaJobCount: z.number().int().nonnegative().max(256),
    maximumGlobalConcurrency: z.literal(CANONICAL_PRIVATE_GLOBAL_MAX_CONCURRENCY),
    callerSelectedPlacement: z.literal(false),
    allPlacementsServerDerived: z.literal(true),
  }).strict(),
  boundaries: z.object({
    privateInternalOnly: z.literal(true),
    placementFrozenInApprovedSnapshot: z.literal(false),
    placementBoundToExecutionPackage: z.literal(true),
    cloudDispatchAuthorized: z.literal(false),
    googleCloudResourceMutationAuthorized: z.literal(false),
    providerActivationAuthorized: z.literal(false),
    customerBillingAuthorized: z.literal(false),
    walletMutationAuthorized: z.literal(false),
    publicDeliveryAuthorized: z.literal(false),
    productionExecutionAuthorized: z.literal(false),
  }).strict(),
  manifestHash: sha256,
}).strict()

export type CanonicalPrivateResourcePlacementManifest = z.infer<
  typeof canonicalPrivateResourcePlacementManifestSchema
>
export type CanonicalPrivateWorkItemResourcePlacement = z.infer<
  typeof workItemPlacementSchema
>

export function createCanonicalPrivateProvenToolPlacementCatalog():
CanonicalPrivateProvenToolPlacementCatalog {
  const tools = listProvenToolIdentityCatalog()
    .filter((record) =>
      record.verificationState === 'canonical_e2e_verified' &&
      record.readiness.privateInternalEndToEndReady &&
      record.readiness.privateInternalJobAdapterReady)
    .map((record) => {
      const profile = getProductionToolProfile(record.canonicalToolId)
      if (!profile || !isExecutableWorkerType(profile.workerType) || !record.runtime.runnerClass) {
        throw new Error(
          `Proven tool ${record.canonicalToolId} lacks an executable server resource placement.`,
        )
      }
      const placement = placementForWorkerType(profile.workerType, {
        gpuRequired: profile.gpuRequired,
        cpuAllowed: profile.cpuAllowed,
      })
      const toolProfilePlacementHash = sha256AuthorityValue({
        canonicalToolId: profile.toolId,
        workerType: profile.workerType,
        executionMode: profile.executionMode,
        productionStatus: profile.productionStatus,
        gpuRequired: profile.gpuRequired,
        cpuAllowed: profile.cpuAllowed,
      })
      const withoutHash = {
        canonicalToolId: record.canonicalToolId,
        operationId: record.operationId,
        runnerClass: record.runtime.runnerClass,
        toolIdentityHash: record.identityHash,
        toolProofHash: record.proofHash,
        toolProfilePlacementHash,
        ...placement,
        privateInternalEndToEndReady: true as const,
        privateInternalJobAdapterReady: true as const,
      }
      return provenToolPlacementSchema.parse({
        ...withoutHash,
        placementHash: sha256AuthorityValue(withoutHash),
      })
    })
    .sort((left, right) => left.canonicalToolId.localeCompare(right.canonicalToolId))
  const payload = {
    schemaVersion: CANONICAL_PRIVATE_PROVEN_TOOL_PLACEMENT_CATALOG_VERSION,
    source: 'proven_tool_identity_and_production_registry_reconciliation' as const,
    placementPolicyVersion: CANONICAL_PRIVATE_RESOURCE_PLACEMENT_POLICY_VERSION,
    provenCatalogVersion: PROVEN_TOOL_IDENTITY_CATALOG_VERSION,
    evidenceRevision: PROVEN_TOOL_EVIDENCE_REVISION,
    tools,
    summary: {
      totalProvenToolCount: tools.length,
      cpuAnalysisToolCount: countWorker(tools, 'cpu_analysis_worker'),
      gpuToolCount: countWorker(tools, 'gpu_ai_worker'),
      renderToolCount: countWorker(tools, 'render_worker'),
      qaToolCount: countWorker(tools, 'qa_worker'),
      allToolsHaveExactResourcePlacement: true as const,
      cloudDispatchAuthorized: false as const,
      productionExecutionAuthorized: false as const,
    },
  }
  return provenToolPlacementCatalogSchema.parse({
    ...payload,
    catalogHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalPrivateProvenToolPlacementCatalog(
  value: unknown,
): CanonicalPrivateProvenToolPlacementCatalog {
  const parsed = provenToolPlacementCatalogSchema.safeParse(value)
  if (!parsed.success) throw new Error('Proven tool resource placement catalog is invalid.')
  const current = createCanonicalPrivateProvenToolPlacementCatalog()
  if (stableAuthorityStringify(parsed.data) !== stableAuthorityStringify(current)) {
    throw new Error('Proven tool resource placement catalog no longer matches current evidence.')
  }
  return parsed.data
}

export function createCanonicalPrivateResourcePlacementManifest(input: {
  executionPackage: CanonicalApprovedEditExecutionPackage
  toolCapabilityManifest: CanonicalToolAuthorizationManifest
}): CanonicalPrivateResourcePlacementManifest {
  const { executionPackage, toolCapabilityManifest } = input
  if (
    executionPackage.toolCapabilityManifestHash !== toolCapabilityManifest.manifestHash ||
    executionPackage.toolOperationBindingsHash !== toolCapabilityManifest.operationBindingsHash ||
    executionPackage.approvedPlanSnapshotId !== toolCapabilityManifest.snapshotId ||
    executionPackage.snapshotHash !== toolCapabilityManifest.snapshotHash ||
    executionPackage.workGraphHash !== toolCapabilityManifest.workGraphHash
  ) throw new Error('Execution package tool capability lineage changed before placement.')

  const workItems = new Map(executionPackage.approvedWorkItems.map((item) => [item.id, item]))
  const provenCatalog = createCanonicalPrivateProvenToolPlacementCatalog()
  const provenTools = new Map(provenCatalog.tools.map((tool) => [tool.canonicalToolId, tool]))
  const toolAuthorizations = new Map(toolCapabilityManifest.tools.map((tool) => [tool.toolId, tool]))
  const placements = executionPackage.jobs.map((job) => {
    const workItem = workItems.get(job.approvedWorkItemId)
    if (!workItem || workItem.workItemKey !== job.workItemKey) {
      throw new Error('Canonical job placement cannot resolve its approved work item.')
    }
    if (
      workItem.approvedToolIds.length > 1 || workItem.approvedToolOperationIds.length > 1 ||
      workItem.approvedToolIds.length !== workItem.approvedToolOperationIds.length
    ) throw new Error('Canonical resource placement requires atomic one-tool work items.')

    const toolId = workItem.approvedToolIds[0]
    const operationId = workItem.approvedToolOperationIds[0]
    if (toolId && operationId) {
      if (!isProductionToolId(toolId)) {
        throw new Error(`Canonical work item ${workItem.workItemKey} has no production tool profile.`)
      }
      const authorization = toolAuthorizations.get(toolId)
      const profile = getProductionToolProfile(toolId)
      const operationBinding = toolCapabilityManifest.operationBindings.find((binding) =>
        binding.toolId === toolId &&
        binding.operationId === operationId &&
        binding.approvedWorkItemId === workItem.id)
      if (
        !authorization || !profile || !operationBinding ||
        !isExecutableWorkerType(profile.workerType) ||
        authorization.workerType !== profile.workerType ||
        authorization.gpuRequired !== profile.gpuRequired ||
        authorization.cpuAllowed !== profile.cpuAllowed ||
        sha256AuthorityValue([operationBinding]) !== workItem.toolOperationBindingsHash
      ) throw new Error('Canonical tool resource placement conflicts with package authority.')

      const proven = provenTools.get(toolId)
      const privateExecutionReady = Boolean(
        proven &&
        proven.operationId === operationId &&
        workItem.providerExecutionMode === 'none',
      )
      const withoutHash = {
        jobId: job.id,
        approvedWorkItemId: workItem.id,
        workItemKey: workItem.workItemKey,
        workItemType: workItem.workItemType,
        canonicalWorkerClass: workItem.workerClass,
        approvedToolIds: [toolId],
        approvedToolOperationIds: [operationId],
        providerExecutionMode: workItem.providerExecutionMode as
          'none' | 'primary' | 'fallback' | 'final_fallback',
        placementSource: workItem.providerExecutionMode !== 'none'
          ? 'provider_route_contract_only' as const
          : privateExecutionReady
            ? 'proven_tool_identity' as const
            : 'tool_registry_contract_only' as const,
        privateExecutionReady,
        ...placementForWorkerType(profile.workerType, {
          gpuRequired: profile.gpuRequired,
          cpuAllowed: profile.cpuAllowed,
        }),
        ...(proven
          ? {
              runtimeRunnerClass: proven.runnerClass,
              toolIdentityHash: proven.toolIdentityHash,
              toolProofHash: proven.toolProofHash,
            }
          : {}),
        ...(!privateExecutionReady
          ? {
              requiredGate: workItem.providerExecutionMode !== 'none'
                ? 'provider_activation_and_approved_route' as const
                : 'canonical_private_tool_execution_evidence' as const,
            }
          : {}),
      }
      return workItemPlacementSchema.parse({
        ...withoutHash,
        placementHash: sha256AuthorityValue(withoutHash),
      })
    }

    const workerType = toolFreeWorkerType(workItem.workerClass, workItem.workItemType)
    const privateExecutionReady = workItem.providerExecutionMode === 'none'
    const withoutHash = {
      jobId: job.id,
      approvedWorkItemId: workItem.id,
      workItemKey: workItem.workItemKey,
      workItemType: workItem.workItemType,
      canonicalWorkerClass: workItem.workerClass,
      approvedToolIds: [],
      approvedToolOperationIds: [],
      providerExecutionMode: workItem.providerExecutionMode as
        'none' | 'primary' | 'fallback' | 'final_fallback',
      placementSource: privateExecutionReady
        ? 'tool_free_control_plane_policy' as const
        : 'provider_route_contract_only' as const,
      privateExecutionReady,
      ...placementForWorkerType(workerType, { gpuRequired: false, cpuAllowed: true }),
      ...(!privateExecutionReady
        ? { requiredGate: 'provider_activation_and_approved_route' as const }
        : {}),
    }
    return workItemPlacementSchema.parse({
      ...withoutHash,
      placementHash: sha256AuthorityValue(withoutHash),
    })
  })
  if (new Set(placements.map((entry) => entry.jobId)).size !== executionPackage.jobs.length) {
    throw new Error('Canonical resource placement does not cover each job exactly once.')
  }
  const payload = {
    schemaVersion: CANONICAL_PRIVATE_RESOURCE_PLACEMENT_MANIFEST_VERSION,
    source: 'canonical_execution_package_resource_reconciliation' as const,
    placementPolicyVersion: CANONICAL_PRIVATE_RESOURCE_PLACEMENT_POLICY_VERSION,
    identity: {
      workspaceId: executionPackage.workspaceId,
      projectId: executionPackage.projectId,
      editSessionId: executionPackage.editSessionId,
      packageRecordId: executionPackage.packageRecordId,
      approvedPlanSnapshotId: executionPackage.approvedPlanSnapshotId,
      packageHash: executionPackage.packageHash,
      snapshotHash: executionPackage.snapshotHash,
      workGraphHash: executionPackage.workGraphHash,
      toolCapabilityManifestHash: toolCapabilityManifest.manifestHash,
      provenToolPlacementCatalogHash: provenCatalog.catalogHash,
    },
    placements,
    summary: {
      totalJobCount: placements.length,
      privatelyExecutableJobCount: placements.filter((entry) => entry.privateExecutionReady).length,
      blockedJobCount: placements.filter((entry) => !entry.privateExecutionReady).length,
      controlPlaneJobCount: countWorker(placements, 'api_service'),
      cpuAnalysisJobCount: countWorker(placements, 'cpu_analysis_worker'),
      gpuJobCount: countWorker(placements, 'gpu_ai_worker'),
      renderJobCount: countWorker(placements, 'render_worker'),
      qaJobCount: countWorker(placements, 'qa_worker'),
      maximumGlobalConcurrency: CANONICAL_PRIVATE_GLOBAL_MAX_CONCURRENCY,
      callerSelectedPlacement: false as const,
      allPlacementsServerDerived: true as const,
    },
    boundaries: {
      privateInternalOnly: true as const,
      placementFrozenInApprovedSnapshot: false as const,
      placementBoundToExecutionPackage: true as const,
      cloudDispatchAuthorized: false as const,
      googleCloudResourceMutationAuthorized: false as const,
      providerActivationAuthorized: false as const,
      customerBillingAuthorized: false as const,
      walletMutationAuthorized: false as const,
      publicDeliveryAuthorized: false as const,
      productionExecutionAuthorized: false as const,
    },
  }
  return canonicalPrivateResourcePlacementManifestSchema.parse({
    ...payload,
    manifestHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalPrivateResourcePlacementManifest(input: {
  value: unknown
  executionPackage: CanonicalApprovedEditExecutionPackage
  toolCapabilityManifest: CanonicalToolAuthorizationManifest
}): CanonicalPrivateResourcePlacementManifest {
  const parsed = canonicalPrivateResourcePlacementManifestSchema.safeParse(input.value)
  if (!parsed.success) throw new Error('Canonical resource placement manifest is invalid.')
  const current = createCanonicalPrivateResourcePlacementManifest(input)
  if (stableAuthorityStringify(parsed.data) !== stableAuthorityStringify(current)) {
    throw new Error('Canonical resource placement manifest no longer matches package authority.')
  }
  return parsed.data
}

function placementForWorkerType(
  workerType: CanonicalPrivateExecutableWorkerType,
  profile: { gpuRequired: boolean; cpuAllowed: boolean },
) {
  const maximum = workerConcurrencyPolicy.maxConcurrentJobsByWorkerType[workerType]
  if (!Number.isSafeInteger(maximum) || maximum! <= 0) {
    throw new Error(`Worker concurrency policy is missing for ${workerType}.`)
  }
  const resources = {
    api_service: {
      resourceClassId: 'control_plane_cpu_v1',
      plannedCloudExecutionTarget: 'cloud_run_service',
      preferredAccelerator: 'none',
    },
    cpu_analysis_worker: {
      resourceClassId: 'cpu_analysis_standard_v1',
      plannedCloudExecutionTarget: 'cloud_run_job',
      preferredAccelerator: 'none',
    },
    gpu_ai_worker: {
      resourceClassId: 'gpu_l4_standard_v1',
      plannedCloudExecutionTarget: 'cloud_run_job',
      preferredAccelerator: 'nvidia_l4',
    },
    render_worker: {
      resourceClassId: 'render_cpu_high_memory_v1',
      plannedCloudExecutionTarget: 'cloud_run_job',
      preferredAccelerator: 'none',
    },
    qa_worker: {
      resourceClassId: 'qa_cpu_standard_v1',
      plannedCloudExecutionTarget: 'cloud_run_job',
      preferredAccelerator: 'none',
    },
    tool_readiness_worker: {
      resourceClassId: 'tool_readiness_cpu_v1',
      plannedCloudExecutionTarget: 'cloud_run_job',
      preferredAccelerator: 'none',
    },
  } as const
  const resource = resources[workerType]
  if (profile.gpuRequired !== (resource.preferredAccelerator === 'nvidia_l4')) {
    throw new Error(`Tool GPU policy conflicts with resource placement for ${workerType}.`)
  }
  return {
    workerType,
    ...resource,
    cpuAllowed: profile.cpuAllowed,
    workerConcurrencyLimit: maximum!,
    globalConcurrencyLimit: CANONICAL_PRIVATE_GLOBAL_MAX_CONCURRENCY,
    regionPolicyId: 'project_selected_data_local_region_v1' as const,
    objectTransportPolicyId: 'immutable_private_object_identity_v1' as const,
  }
}

function toolFreeWorkerType(
  workerClass: string,
  workItemType: string,
): CanonicalPrivateExecutableWorkerType {
  if (workerClass === 'authority_worker' || workerClass === 'private_test_worker') {
    return 'api_service'
  }
  if (workerClass === 'qa_worker' || workItemType === 'run_final_qa' ||
    workItemType === 'run_asset_qa' || workItemType === 'run_timing_qa') {
    return 'qa_worker'
  }
  if (workerClass === 'render_worker' || workerClass === 'controlled_graphics_worker') {
    return 'render_worker'
  }
  if ([
    'audio_analysis_worker',
    'audio_processing_worker',
    'color_processing_worker',
    'image_processing_worker',
    'media_analysis_worker',
    'media_processing_worker',
  ].includes(workerClass)) return 'cpu_analysis_worker'
  throw new Error(`Tool-free canonical worker class ${workerClass} has no resource placement.`)
}

function isExecutableWorkerType(
  value: ProductionRegistryWorkerType,
): value is CanonicalPrivateExecutableWorkerType {
  return executableWorkerTypeSchema.safeParse(value).success
}

function countWorker(
  entries: readonly { workerType: CanonicalPrivateExecutableWorkerType }[],
  workerType: CanonicalPrivateExecutableWorkerType,
): number {
  return entries.filter((entry) => entry.workerType === workerType).length
}

export function canonicalPrivateResourceLaneKey(
  placement: CanonicalPrivateWorkItemResourcePlacement,
): string {
  return `${placement.workerType}:${placement.resourceClassId}:${placement.preferredAccelerator}`
}

export function canonicalPrivateToolPlacementFor(
  catalog: CanonicalPrivateProvenToolPlacementCatalog,
  toolId: ProductionToolId,
): CanonicalPrivateProvenToolPlacement {
  const placement = catalog.tools.find((entry) => entry.canonicalToolId === toolId)
  if (!placement) throw new Error(`No proven private resource placement exists for ${toolId}.`)
  return placement
}

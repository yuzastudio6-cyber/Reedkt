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
  CANONICAL_LIVING_FRAME_PENDING_OPERATION_WORKER_CLASS,
  CANONICAL_LIVING_FRAME_REMBG_GPU_MASK_TOOL_OPERATION,
  CANONICAL_LIVING_FRAME_REMBG_GPU_MASK_WORKER_CLASS,
} from '../../src/types/living-frame-canonical-work-graph-projection'
import { CANONICAL_CAPTION_SPECIALIST_WORKER_CLASS } from
  '../../src/types/canonical-caption-specialist-execution'
import type {
  CanonicalToolExecutionAuthority,
} from './canonical-tool-execution-authority'
import { PROFESSIONAL_LONG_FORM_CONTROLLER_WORKER_CLASS } from './professional-long-form-approved-snapshot-bridge'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'

export const CANONICAL_PRIVATE_RESOURCE_PLACEMENT_POLICY_VERSION =
  'canonical-private-resource-placement-policy-v1' as const
export const CANONICAL_PRIVATE_RESOURCE_PLACEMENT_MANIFEST_VERSION =
  'canonical-private-resource-placement-manifest-v2' as const
export const CANONICAL_PRIVATE_PROVEN_TOOL_PLACEMENT_CATALOG_VERSION =
  'canonical-private-proven-tool-placement-catalog-v1' as const
export const CANONICAL_APPROVED_WORK_GRAPH_RESOURCE_PLACEMENT_AUTHORITY_VERSION =
  'canonical-approved-work-graph-resource-placement-authority-v1' as const
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

const workItemPlacementCoreSchema = placementCoreSchema.extend({
  workItemKey: safeKey,
  workItemType: safeKey,
  canonicalWorkerClass: safeKey,
  required: z.boolean(),
  approvedToolIds: z.array(safeKey).max(1),
  approvedToolOperationIds: z.array(safeKey).max(1),
  providerExecutionMode: z.enum(['none', 'primary', 'fallback', 'final_fallback']),
  placementSource: z.enum([
    'proven_tool_identity',
    'tool_registry_contract_only',
    'tool_free_control_plane_policy',
    'living_frame_operation_admission_pending',
    'long_form_controller_contract_only',
    'provider_route_contract_only',
  ]),
  privateExecutionReady: z.boolean(),
  runtimeRunnerClass: safeKey.optional(),
  toolIdentityHash: sha256.optional(),
  toolProofHash: sha256.optional(),
  requiredGate: safeKey.optional(),
}).strict()

const frozenWorkItemPlacementSchema = workItemPlacementCoreSchema.extend({
  placementHash: sha256,
}).strict().superRefine((entry, context) => {
  validatePlacementEvidence(entry, context)
})

const workItemPlacementSchema = workItemPlacementCoreSchema.extend({
  jobId: safeKey,
  approvedWorkItemId: safeKey,
  placementHash: sha256,
}).strict().superRefine((entry, context) => {
  validatePlacementEvidence(entry, context)
})

function validatePlacementEvidence(
  entry: z.infer<typeof workItemPlacementCoreSchema>,
  context: z.RefinementCtx,
): void {
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
  if (
    entry.placementSource ===
      'living_frame_operation_admission_pending'
  ) {
    if (
      toolBacked
      || entry.privateExecutionReady
      || entry.runtimeRunnerClass
      || entry.toolIdentityHash
      || entry.toolProofHash
      || !entry.requiredGate
      || entry.providerExecutionMode !== 'none'
    ) {
      context.addIssue({
        code: 'custom',
        message:
          'Living Frame pending-operation placement must remain tool-free and execution blocked.',
      })
    }
  }
  if (entry.placementSource === 'long_form_controller_contract_only') {
    if (
      toolBacked || entry.privateExecutionReady || entry.runtimeRunnerClass ||
      entry.toolIdentityHash || entry.toolProofHash || !entry.requiredGate
    ) {
      context.addIssue({
        code: 'custom',
        message: 'Long-form controller placement must remain execution blocked.',
      })
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
}

export const canonicalApprovedWorkGraphResourcePlacementAuthoritySchema = z.object({
  schemaVersion: z.literal(CANONICAL_APPROVED_WORK_GRAPH_RESOURCE_PLACEMENT_AUTHORITY_VERSION),
  source: z.literal('server_approved_work_graph_resource_policy'),
  placementPolicyVersion: z.literal(CANONICAL_PRIVATE_RESOURCE_PLACEMENT_POLICY_VERSION),
  workItemAuthorityHash: sha256,
  toolIdentityAuthorityHash: sha256,
  provenToolPlacementCatalogHash: sha256,
  placements: z.array(frozenWorkItemPlacementSchema).min(1).max(256),
  summary: z.object({
    totalWorkItemCount: z.number().int().positive().max(256),
    privatelyExecutableWorkItemCount: z.number().int().nonnegative().max(256),
    blockedWorkItemCount: z.number().int().nonnegative().max(256),
    controlPlaneWorkItemCount: z.number().int().nonnegative().max(256),
    cpuAnalysisWorkItemCount: z.number().int().nonnegative().max(256),
    gpuWorkItemCount: z.number().int().nonnegative().max(256),
    renderWorkItemCount: z.number().int().nonnegative().max(256),
    qaWorkItemCount: z.number().int().nonnegative().max(256),
    allWorkItemsHaveExactPlacement: z.literal(true),
    callerSelectedPlacement: z.literal(false),
  }).strict(),
  boundaries: z.object({
    contentAddressedPlanAuthority: z.literal(true),
    approvedSnapshotHashBindingRequired: z.literal(true),
    placementMutationAfterApprovalAllowed: z.literal(false),
    privateInternalOnly: z.literal(true),
    cloudDispatchAuthorized: z.literal(false),
    googleCloudResourceMutationAuthorized: z.literal(false),
    providerActivationAuthorized: z.literal(false),
    customerBillingAuthorized: z.literal(false),
    walletMutationAuthorized: z.literal(false),
    publicDeliveryAuthorized: z.literal(false),
    productionExecutionAuthorized: z.literal(false),
  }).strict(),
  authorityHash: sha256,
}).strict()

export type CanonicalApprovedWorkGraphResourcePlacementAuthority = z.infer<
  typeof canonicalApprovedWorkGraphResourcePlacementAuthoritySchema
>
export type CanonicalFrozenWorkItemResourcePlacement = z.infer<
  typeof frozenWorkItemPlacementSchema
>

export interface CanonicalResourcePlacementAuthorityWorkItem {
  workItemKey: string
  workItemType: string
  workerClass: string
  required: boolean
  approvedToolIds: string[]
  approvedToolOperationIds: string[]
  providerExecutionMode: string
}

export interface CanonicalResourcePlacementToolIdentity {
  canonicalToolId: string
  operationId: string
  identityHash: string
  proofHash: string
  verificationState: string
  runtime: { runnerClass: string | null }
  readiness: {
    privateInternalEndToEndReady: boolean
    privateInternalJobAdapterReady: boolean
  }
}

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
    toolExecutionAuthorityHash: sha256,
    approvedResourcePlacementAuthorityHash: sha256,
    approvedResourcePlacementAuthorityBlobHash: sha256,
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
    placementFrozenInApprovedSnapshot: z.literal(true),
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

export function createCanonicalApprovedWorkGraphResourcePlacementAuthority(input: {
  workItems: CanonicalResourcePlacementAuthorityWorkItem[]
  tools: CanonicalResourcePlacementToolIdentity[]
}): CanonicalApprovedWorkGraphResourcePlacementAuthority {
  const workItems = [...input.workItems].sort((left, right) =>
    left.workItemKey.localeCompare(right.workItemKey))
  if (
    workItems.length === 0 ||
    new Set(workItems.map((workItem) => workItem.workItemKey)).size !== workItems.length
  ) throw new Error('Canonical resource placement requires unique approved work-item keys.')

  const tools = [...input.tools].sort((left, right) =>
    left.canonicalToolId.localeCompare(right.canonicalToolId))
  if (new Set(tools.map((tool) => tool.canonicalToolId)).size !== tools.length) {
    throw new Error('Canonical resource placement tool identities must be unique.')
  }
  const toolById = new Map(tools.map((tool) => [tool.canonicalToolId, tool]))
  const provenCatalog = createCanonicalPrivateProvenToolPlacementCatalog()
  const provenById = new Map(provenCatalog.tools.map((tool) => [tool.canonicalToolId, tool]))
  const placements = workItems.map((workItem) => {
    if (
      workItem.approvedToolIds.length > 1 ||
      workItem.approvedToolOperationIds.length > 1 ||
      workItem.approvedToolIds.length !== workItem.approvedToolOperationIds.length
    ) throw new Error('Canonical resource placement requires atomic one-tool work items.')
    const toolId = workItem.approvedToolIds[0]
    const operationId = workItem.approvedToolOperationIds[0]
    if (toolId && operationId) {
      if (!isProductionToolId(toolId)) {
        throw new Error(`Canonical work item ${workItem.workItemKey} has no production tool profile.`)
      }
      const profile = getProductionToolProfile(toolId)
      const tool = toolById.get(toolId)
      if (
        !profile || !tool || tool.operationId !== operationId ||
        !isExecutableWorkerType(profile.workerType)
      ) throw new Error('Canonical tool resource placement lacks exact tool-operation authority.')
      const proven = provenById.get(toolId)
      const exactProvenIdentity = Boolean(
        proven &&
        proven.operationId === operationId &&
        proven.runnerClass === tool.runtime.runnerClass &&
        proven.toolIdentityHash === tool.identityHash &&
        proven.toolProofHash === tool.proofHash &&
        tool.verificationState === 'canonical_e2e_verified' &&
        tool.readiness.privateInternalEndToEndReady &&
        tool.readiness.privateInternalJobAdapterReady,
      )
      const livingFrameRembgGpuRuntimePending =
        toolId === 'rembg'
        && operationId ===
          CANONICAL_LIVING_FRAME_REMBG_GPU_MASK_TOOL_OPERATION
        && workItem.workerClass ===
          CANONICAL_LIVING_FRAME_REMBG_GPU_MASK_WORKER_CLASS
      const admittedProvenIdentity =
        exactProvenIdentity
        && !livingFrameRembgGpuRuntimePending
      const privateExecutionReady =
        admittedProvenIdentity &&
        workItem.providerExecutionMode === 'none'
      const withoutHash = {
        workItemKey: workItem.workItemKey,
        workItemType: workItem.workItemType,
        canonicalWorkerClass: workItem.workerClass,
        required: workItem.required,
        approvedToolIds: [toolId],
        approvedToolOperationIds: [operationId],
        providerExecutionMode: resourceProviderExecutionMode(workItem.providerExecutionMode),
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
        ...(admittedProvenIdentity
          ? {
              runtimeRunnerClass: tool.runtime.runnerClass!,
              toolIdentityHash: tool.identityHash,
              toolProofHash: tool.proofHash,
            }
          : {}),
        ...(!privateExecutionReady
          ? {
              requiredGate: workItem.providerExecutionMode !== 'none'
                ? 'provider_activation_and_approved_route' as const
                : livingFrameRembgGpuRuntimePending
                  ? 'canonical_rembg_cloud_run_gpu_runtime_qualification' as const
                : 'canonical_private_tool_execution_evidence' as const,
            }
          : {}),
      }
      return frozenWorkItemPlacementSchema.parse({
        ...withoutHash,
        placementHash: sha256AuthorityValue(withoutHash),
      })
    }

    const workerType = toolFreeWorkerType(workItem.workerClass, workItem.workItemType)
    const longFormController = workItem.workerClass ===
      PROFESSIONAL_LONG_FORM_CONTROLLER_WORKER_CLASS
    const livingFrameOperationPending =
      workItem.workerClass ===
      CANONICAL_LIVING_FRAME_PENDING_OPERATION_WORKER_CLASS
    const privateExecutionReady =
      !longFormController &&
      !livingFrameOperationPending &&
      workItem.providerExecutionMode === 'none'
    const withoutHash = {
      workItemKey: workItem.workItemKey,
      workItemType: workItem.workItemType,
      canonicalWorkerClass: workItem.workerClass,
      required: workItem.required,
      approvedToolIds: [],
      approvedToolOperationIds: [],
      providerExecutionMode: resourceProviderExecutionMode(workItem.providerExecutionMode),
      placementSource: longFormController
        ? 'long_form_controller_contract_only' as const
        : livingFrameOperationPending
          ? 'living_frame_operation_admission_pending' as const
        : privateExecutionReady
          ? 'tool_free_control_plane_policy' as const
          : 'provider_route_contract_only' as const,
      privateExecutionReady,
      ...placementForWorkerType(workerType, { gpuRequired: false, cpuAllowed: true }),
      ...(!privateExecutionReady
        ? {
            requiredGate: longFormController
              ? 'canonical_professional_long_form_controller_service_only_no_worker_dispatch' as const
              : livingFrameOperationPending
                ? 'canonical_living_frame_dependency_input_operation_admission' as const
              : 'provider_activation_and_approved_route' as const,
          }
        : {}),
    }
    return frozenWorkItemPlacementSchema.parse({
      ...withoutHash,
      placementHash: sha256AuthorityValue(withoutHash),
    })
  })
  const workItemAuthority = workItems.map(resourceWorkItemAuthorityProjection)
  const toolIdentityAuthority = tools.map(resourceToolIdentityAuthorityProjection)
  const payload = {
    schemaVersion: CANONICAL_APPROVED_WORK_GRAPH_RESOURCE_PLACEMENT_AUTHORITY_VERSION,
    source: 'server_approved_work_graph_resource_policy' as const,
    placementPolicyVersion: CANONICAL_PRIVATE_RESOURCE_PLACEMENT_POLICY_VERSION,
    workItemAuthorityHash: sha256AuthorityValue(workItemAuthority),
    toolIdentityAuthorityHash: sha256AuthorityValue(toolIdentityAuthority),
    provenToolPlacementCatalogHash: provenCatalog.catalogHash,
    placements,
    summary: {
      totalWorkItemCount: placements.length,
      privatelyExecutableWorkItemCount: placements.filter((entry) =>
        entry.privateExecutionReady).length,
      blockedWorkItemCount: placements.filter((entry) =>
        !entry.privateExecutionReady).length,
      controlPlaneWorkItemCount: countWorker(placements, 'api_service'),
      cpuAnalysisWorkItemCount: countWorker(placements, 'cpu_analysis_worker'),
      gpuWorkItemCount: countWorker(placements, 'gpu_ai_worker'),
      renderWorkItemCount: countWorker(placements, 'render_worker'),
      qaWorkItemCount: countWorker(placements, 'qa_worker'),
      allWorkItemsHaveExactPlacement: true as const,
      callerSelectedPlacement: false as const,
    },
    boundaries: {
      contentAddressedPlanAuthority: true as const,
      approvedSnapshotHashBindingRequired: true as const,
      placementMutationAfterApprovalAllowed: false as const,
      privateInternalOnly: true as const,
      cloudDispatchAuthorized: false as const,
      googleCloudResourceMutationAuthorized: false as const,
      providerActivationAuthorized: false as const,
      customerBillingAuthorized: false as const,
      walletMutationAuthorized: false as const,
      publicDeliveryAuthorized: false as const,
      productionExecutionAuthorized: false as const,
    },
  }
  return canonicalApprovedWorkGraphResourcePlacementAuthoritySchema.parse({
    ...payload,
    authorityHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalApprovedWorkGraphResourcePlacementAuthority(input: {
  value: unknown
  workItems: CanonicalResourcePlacementAuthorityWorkItem[]
  tools: CanonicalResourcePlacementToolIdentity[]
}): CanonicalApprovedWorkGraphResourcePlacementAuthority {
  const parsed = canonicalApprovedWorkGraphResourcePlacementAuthoritySchema.safeParse(input.value)
  if (!parsed.success) throw new Error('Approved work-graph resource placement authority is invalid.')
  const { authorityHash, ...payload } = parsed.data
  if (
    authorityHash !== sha256AuthorityValue(payload) ||
    parsed.data.placements.some((placement) => {
      const { placementHash, ...withoutHash } = placement
      return placementHash !== sha256AuthorityValue(withoutHash)
    })
  ) throw new Error('Approved work-graph resource placement authority hash is invalid.')
  const current = createCanonicalApprovedWorkGraphResourcePlacementAuthority(input)
  if (
    stableAuthorityStringify(structuralPlacementAuthority(parsed.data)) !==
    stableAuthorityStringify(structuralPlacementAuthority(current))
  ) throw new Error('Approved work-graph resource placement no longer matches immutable work authority.')
  return parsed.data
}

export function createCanonicalPrivateResourcePlacementManifest(input: {
  executionPackage: CanonicalApprovedEditExecutionPackage
  toolCapabilityManifest: CanonicalToolAuthorizationManifest
  toolExecutionAuthority: CanonicalToolExecutionAuthority
}): CanonicalPrivateResourcePlacementManifest {
  const { executionPackage, toolCapabilityManifest, toolExecutionAuthority } = input
  const toolExecutionAuthorityRef =
    executionPackage.componentRefs.canonicalToolExecutionAuthority
  if (
    executionPackage.toolCapabilityManifestHash !== toolCapabilityManifest.manifestHash ||
    executionPackage.toolOperationBindingsHash !== toolCapabilityManifest.operationBindingsHash ||
    executionPackage.approvedPlanSnapshotId !== toolCapabilityManifest.snapshotId ||
    executionPackage.snapshotHash !== toolCapabilityManifest.snapshotHash ||
    executionPackage.workGraphHash !== toolCapabilityManifest.workGraphHash ||
    !toolExecutionAuthorityRef ||
    toolExecutionAuthorityRef.sha256 !== sha256AuthorityValue(toolExecutionAuthority)
  ) throw new Error('Execution package tool capability lineage changed before placement.')

  const workItems = new Map(executionPackage.approvedWorkItems.map((item) => [item.id, item]))
  const approvedPlacementAuthority =
    assertCanonicalApprovedWorkGraphResourcePlacementAuthority({
      value: toolExecutionAuthority.resourcePlacementAuthority,
      workItems: executionPackage.approvedWorkItems.map((workItem) => ({
        workItemKey: workItem.workItemKey,
        workItemType: workItem.workItemType,
        workerClass: workItem.workerClass,
        required: workItem.required,
        approvedToolIds: [...workItem.approvedToolIds],
        approvedToolOperationIds: [...workItem.approvedToolOperationIds],
        providerExecutionMode: workItem.providerExecutionMode,
      })),
      tools: toolExecutionAuthority.tools,
    })
  const frozenPlacements = new Map(approvedPlacementAuthority.placements.map((placement) =>
    [placement.workItemKey, placement]))
  if (
    frozenPlacements.size !== executionPackage.approvedWorkItems.length ||
    executionPackage.approvedWorkItems.some((workItem) =>
      !frozenPlacements.has(workItem.workItemKey))
  ) throw new Error('Approved snapshot resource placement does not cover every work item exactly once.')

  const provenCatalog = createCanonicalPrivateProvenToolPlacementCatalog()
  const toolAuthorizations = new Map(toolCapabilityManifest.tools.map((tool) => [tool.toolId, tool]))
  const placements = executionPackage.jobs.map((job) => {
    const workItem = workItems.get(job.approvedWorkItemId)
    const frozen = frozenPlacements.get(job.workItemKey)
    if (
      !workItem || !frozen || workItem.workItemKey !== job.workItemKey ||
      frozen.workItemType !== workItem.workItemType ||
      frozen.canonicalWorkerClass !== workItem.workerClass ||
      frozen.required !== workItem.required ||
      stableAuthorityStringify(frozen.approvedToolIds) !==
        stableAuthorityStringify(workItem.approvedToolIds) ||
      stableAuthorityStringify(frozen.approvedToolOperationIds) !==
        stableAuthorityStringify(workItem.approvedToolOperationIds) ||
      frozen.providerExecutionMode !== workItem.providerExecutionMode
    ) {
      throw new Error('Canonical job placement cannot resolve its approved work item.')
    }
    const toolId = workItem.approvedToolIds[0]
    const operationId = workItem.approvedToolOperationIds[0]
    if (toolId && operationId) {
      if (!isProductionToolId(toolId)) {
        throw new Error(`Canonical work item ${workItem.workItemKey} has no production tool profile.`)
      }
      const authorization = toolAuthorizations.get(toolId)
      const operationBinding = toolCapabilityManifest.operationBindings.find((binding) =>
        binding.toolId === toolId &&
        binding.operationId === operationId &&
        binding.approvedWorkItemId === workItem.id)
      if (
        !authorization || !operationBinding ||
        authorization.workerType !== frozen.workerType ||
        authorization.gpuRequired !== (frozen.preferredAccelerator === 'nvidia_l4') ||
        authorization.cpuAllowed !== frozen.cpuAllowed ||
        sha256AuthorityValue([operationBinding]) !== workItem.toolOperationBindingsHash
      ) throw new Error('Canonical tool resource placement conflicts with package authority.')
    } else if (toolId || operationId) {
      throw new Error('Canonical tool resource placement has mismatched tool-operation cardinality.')
    }
    const { placementHash: frozenPlacementHash, ...frozenWithoutHash } = frozen
    const withoutHash = {
      jobId: job.id,
      approvedWorkItemId: workItem.id,
      ...frozenWithoutHash,
    }
    if (frozenPlacementHash !== sha256AuthorityValue(frozenWithoutHash)) {
      throw new Error('Approved snapshot resource placement hash is invalid.')
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
      toolExecutionAuthorityHash: toolExecutionAuthority.authorityHash,
      approvedResourcePlacementAuthorityHash: approvedPlacementAuthority.authorityHash,
      approvedResourcePlacementAuthorityBlobHash: toolExecutionAuthorityRef.sha256,
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
      placementFrozenInApprovedSnapshot: true as const,
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
  toolExecutionAuthority: CanonicalToolExecutionAuthority
}): CanonicalPrivateResourcePlacementManifest {
  const parsed = canonicalPrivateResourcePlacementManifestSchema.safeParse(input.value)
  if (!parsed.success) throw new Error('Canonical resource placement manifest is invalid.')
  const current = createCanonicalPrivateResourcePlacementManifest(input)
  if (stableAuthorityStringify(parsed.data) !== stableAuthorityStringify(current)) {
    throw new Error('Canonical resource placement manifest no longer matches package authority.')
  }
  return parsed.data
}

function resourceProviderExecutionMode(
  value: string,
): 'none' | 'primary' | 'fallback' | 'final_fallback' {
  if (
    value !== 'none' && value !== 'primary' &&
    value !== 'fallback' && value !== 'final_fallback'
  ) throw new Error('Canonical resource placement provider execution mode is invalid.')
  return value
}

function resourceWorkItemAuthorityProjection(
  workItem: CanonicalResourcePlacementAuthorityWorkItem,
) {
  return {
    workItemKey: workItem.workItemKey,
    workItemType: workItem.workItemType,
    workerClass: workItem.workerClass,
    required: workItem.required,
    approvedToolIds: [...workItem.approvedToolIds],
    approvedToolOperationIds: [...workItem.approvedToolOperationIds],
    providerExecutionMode: resourceProviderExecutionMode(workItem.providerExecutionMode),
  }
}

function resourceToolIdentityAuthorityProjection(
  tool: CanonicalResourcePlacementToolIdentity,
) {
  return {
    canonicalToolId: tool.canonicalToolId,
    operationId: tool.operationId,
    identityHash: tool.identityHash,
    proofHash: tool.proofHash,
    verificationState: tool.verificationState,
    runtimeRunnerClass: tool.runtime.runnerClass,
    privateInternalEndToEndReady: tool.readiness.privateInternalEndToEndReady,
    privateInternalJobAdapterReady: tool.readiness.privateInternalJobAdapterReady,
  }
}

function structuralPlacementAuthority(
  authority: CanonicalApprovedWorkGraphResourcePlacementAuthority,
) {
  return {
    schemaVersion: authority.schemaVersion,
    source: authority.source,
    placementPolicyVersion: authority.placementPolicyVersion,
    workItemAuthorityHash: authority.workItemAuthorityHash,
    toolIdentityAuthorityHash: authority.toolIdentityAuthorityHash,
    placements: authority.placements,
    summary: authority.summary,
    boundaries: authority.boundaries,
  }
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
  if (workerClass === PROFESSIONAL_LONG_FORM_CONTROLLER_WORKER_CLASS) {
    return 'api_service'
  }
  if (
    workerClass ===
      CANONICAL_LIVING_FRAME_PENDING_OPERATION_WORKER_CLASS
  ) {
    return 'api_service'
  }
  if (workerClass === 'provider_worker') return 'cpu_analysis_worker'
  if (workerClass === CANONICAL_CAPTION_SPECIALIST_WORKER_CLASS) {
    return 'cpu_analysis_worker'
  }
  if (workerClass === 'qa_worker' || workItemType === 'run_final_qa' ||
    workItemType === 'run_asset_qa' || workItemType === 'run_timing_qa') {
    return 'qa_worker'
  }
  if (
    workerClass === 'render_worker'
    || workerClass === 'render_planning_worker'
    || workerClass === 'controlled_graphics_worker'
  ) {
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

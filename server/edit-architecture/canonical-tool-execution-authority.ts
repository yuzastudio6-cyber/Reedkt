import { z } from 'zod'

import { ApiError } from '../errors/api-error'
import { isProductionToolId, type ProductionToolId } from '../tool-registry'
import {
  resolveCompleteProfessionalToolOperationSpec,
} from '../tool-execution/core-registry-operations/core-registry-operation-specs'
import {
  PROVEN_TOOL_EVIDENCE_REVISION,
  PROVEN_TOOL_IDENTITY_CATALOG_VERSION,
  getToolIdentityRecord,
} from '../tool-execution/proven-tool-identity-catalog'
import { sha256AuthorityValue, stableAuthorityStringify } from '../services/private-edit-authority-store'
import {
  assertCanonicalApprovedWorkGraphResourcePlacementAuthority,
  canonicalApprovedWorkGraphResourcePlacementAuthoritySchema,
  createCanonicalApprovedWorkGraphResourcePlacementAuthority,
  type CanonicalApprovedWorkGraphResourcePlacementAuthority,
  type CanonicalResourcePlacementAuthorityWorkItem,
} from './canonical-private-resource-placement-authority'

export const CANONICAL_TOOL_EXECUTION_AUTHORITY_VERSION =
  'canonical-tool-execution-authority-v2' as const

const safeKey = z.string()
  .trim()
  .min(1)
  .max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/)

const outputAuthoritySchema = z.object({
  outputKey: safeKey,
  contentType: z.string().trim().min(1).max(160).optional(),
  required: z.boolean(),
}).strict()

const workItemAuthoritySchema = z.object({
  workItemKey: safeKey,
  required: z.boolean(),
  expectedOutputs: z.array(outputAuthoritySchema).min(1).max(128),
}).strict()

const toolAuthorityEntrySchema = z.object({
  stableToolIdentity: safeKey,
  canonicalToolId: safeKey,
  operationId: safeKey,
  operationSpecHash: sha256,
  identityHash: sha256,
  proofHash: sha256,
  verificationState: z.enum([
    'canonical_e2e_verified',
    'confined_runner_verified',
    'declared_not_runner_verified',
    'intentionally_non_executable',
  ]),
  runtime: z.object({
    runnerClass: safeKey.nullable(),
    packageOrBinaryName: z.string().trim().min(1).max(240),
    pinnedVersion: z.string().trim().min(1).max(240).nullable(),
    networkMode: z.enum(['none', 'not_verified']),
    frontendExecutionAllowed: z.literal(false),
  }).strict(),
  readiness: z.object({
    privateInternalRunnerReady: z.boolean(),
    privateInternalEndToEndReady: z.boolean(),
    privateInternalJobAdapterReady: z.boolean(),
    productReady: z.literal(false),
    externalBetaReady: z.literal(false),
    productionReady: z.literal(false),
  }).strict(),
  evidence: z.object({
    canonicalEvidenceKey: safeKey.nullable(),
    canonicalJobAdapterEvidenceKey: safeKey.nullable(),
  }).strict(),
  workItems: z.array(workItemAuthoritySchema).min(1).max(256),
}).strict()

export const canonicalToolExecutionAuthoritySchema = z.object({
  schemaVersion: z.literal(CANONICAL_TOOL_EXECUTION_AUTHORITY_VERSION),
  source: z.literal('server_proven_tool_identity_catalog_reconciliation'),
  catalogVersion: z.literal(PROVEN_TOOL_IDENTITY_CATALOG_VERSION),
  evidenceRevision: z.string().trim().min(1).max(80),
  strategyAuthority: z.object({
    declaredToolIds: z.array(safeKey).max(256),
    declaredExactOperationIds: z.array(safeKey).max(256),
    workGraphToolIds: z.array(safeKey).max(256),
    unusedDeclaredToolIds: z.array(safeKey).max(256),
    declarationHash: sha256,
  }).strict(),
  tools: z.array(toolAuthorityEntrySchema).max(256),
  resourcePlacementAuthority: canonicalApprovedWorkGraphResourcePlacementAuthoritySchema,
  summary: z.object({
    declaredToolCount: z.number().int().nonnegative(),
    workGraphToolCount: z.number().int().nonnegative(),
    requiredWorkGraphToolCount: z.number().int().nonnegative(),
    privateEndToEndReadyToolCount: z.number().int().nonnegative(),
    privateJobAdapterReadyToolCount: z.number().int().nonnegative(),
    allRequiredToolsPrivateEndToEndReady: z.literal(true),
    allRequiredToolsPrivateJobAdapterReady: z.literal(true),
    allWorkItemsHaveFrozenResourcePlacement: z.literal(true),
    frontendExecutionAllowed: z.literal(false),
    providerExecutionAuthorized: z.literal(false),
    customerBillingAuthorized: z.literal(false),
    productionExecutionAuthorized: z.literal(false),
  }).strict(),
  authorityHash: sha256,
}).strict()

export type CanonicalToolExecutionAuthority = z.infer<
  typeof canonicalToolExecutionAuthoritySchema
>

export interface CanonicalToolAuthorityWorkItem {
  workItemKey: string
  workItemType: string
  workerClass: string
  providerExecutionMode: string
  approvedToolIds: string[]
  required: boolean
  expectedOutputs: Array<{
    outputKey: string
    contentType?: string
    required: boolean
  }>
  executionInput: Record<string, unknown>
}

interface StrategyProjection {
  declaredToolIds: string[]
  declaredExactOperationIds: string[]
  workGraphToolIds: string[]
  unusedDeclaredToolIds: string[]
  declarationHash: string
}

export function createCanonicalToolExecutionAuthority(input: {
  toolStrategyPlan: Record<string, unknown>
  workItems: CanonicalToolAuthorityWorkItem[]
}): CanonicalToolExecutionAuthority {
  const strategyAuthority = projectStrategyAuthority(input.toolStrategyPlan, input.workItems)
  const requiredToolIds = unique(input.workItems
    .filter((workItem) => workItem.required)
    .flatMap((workItem) => workItem.approvedToolIds))
  const tools = strategyAuthority.workGraphToolIds.map((rawToolId) => {
    if (!isProductionToolId(rawToolId)) {
      throw invalid('Canonical work graph contains a tool without a production identity.', {
        toolId: rawToolId,
      })
    }
    const toolId = rawToolId as ProductionToolId
    const record = getToolIdentityRecord(toolId)
    const spec = resolveCompleteProfessionalToolOperationSpec(toolId)
    if (!spec || spec.allowedOperationIds.length !== 1) {
      throw notReady(
        'Canonical tool execution authority could not resolve one exact operation identity.',
        'canonical_tool_operation_contract',
        toolId,
      )
    }
    const workItems = input.workItems
      .filter((workItem) => workItem.approvedToolIds.includes(toolId))
      .map((workItem) => {
        const operationIds = workItem.executionInput.approvedToolOperationIds
        if (
          !Array.isArray(operationIds) ||
          operationIds.length !== workItem.approvedToolIds.length ||
          !operationIds.includes(record.operationId)
        ) {
          throw invalid('Canonical work item operation authority does not match its proven tool identity.', {
            toolId,
            workItemKey: workItem.workItemKey,
          })
        }
        return {
          workItemKey: workItem.workItemKey,
          required: workItem.required,
          expectedOutputs: workItem.expectedOutputs.map((output) => ({
            outputKey: output.outputKey,
            ...(output.contentType ? { contentType: output.contentType } : {}),
            required: output.required,
          })),
        }
      })
      .sort((left, right) => left.workItemKey.localeCompare(right.workItemKey))

    if (
      requiredToolIds.includes(toolId) &&
      (!record.readiness.privateInternalEndToEndReady ||
        !record.readiness.privateInternalJobAdapterReady)
    ) {
      throw notReady(
        'A required canonical work item cannot be approved without exact private lifecycle and job-adapter evidence.',
        'canonical_tool_identity_e2e_and_job_adapter_evidence',
        toolId,
        {
          verificationState: record.verificationState,
          privateInternalEndToEndReady: record.readiness.privateInternalEndToEndReady,
          privateInternalJobAdapterReady: record.readiness.privateInternalJobAdapterReady,
        },
      )
    }

    return {
      stableToolIdentity: record.stableToolIdentity,
      canonicalToolId: toolId,
      operationId: record.operationId,
      operationSpecHash: record.operationSpecHash,
      identityHash: record.identityHash,
      proofHash: record.proofHash,
      verificationState: record.verificationState,
      runtime: { ...record.runtime },
      readiness: { ...record.readiness },
      evidence: {
        canonicalEvidenceKey: record.evidence.canonicalEvidenceKey,
        canonicalJobAdapterEvidenceKey: record.evidence.canonicalJobAdapterEvidenceKey,
      },
      workItems,
    }
  })
  const resourcePlacementWorkItems = input.workItems.map(resourcePlacementWorkItem)
  const resourcePlacementAuthority =
    createCanonicalApprovedWorkGraphResourcePlacementAuthority({
      workItems: resourcePlacementWorkItems,
      tools,
    })
  const payload = {
    schemaVersion: CANONICAL_TOOL_EXECUTION_AUTHORITY_VERSION,
    source: 'server_proven_tool_identity_catalog_reconciliation' as const,
    catalogVersion: PROVEN_TOOL_IDENTITY_CATALOG_VERSION,
    evidenceRevision: PROVEN_TOOL_EVIDENCE_REVISION,
    strategyAuthority,
    tools,
    resourcePlacementAuthority,
    summary: {
      declaredToolCount: strategyAuthority.declaredToolIds.length,
      workGraphToolCount: tools.length,
      requiredWorkGraphToolCount: requiredToolIds.length,
      privateEndToEndReadyToolCount: tools.filter((tool) =>
        tool.readiness.privateInternalEndToEndReady).length,
      privateJobAdapterReadyToolCount: tools.filter((tool) =>
        tool.readiness.privateInternalJobAdapterReady).length,
      allRequiredToolsPrivateEndToEndReady: true as const,
      allRequiredToolsPrivateJobAdapterReady: true as const,
      allWorkItemsHaveFrozenResourcePlacement: true as const,
      frontendExecutionAllowed: false as const,
      providerExecutionAuthorized: false as const,
      customerBillingAuthorized: false as const,
      productionExecutionAuthorized: false as const,
    },
  }
  return canonicalToolExecutionAuthoritySchema.parse({
    ...payload,
    authorityHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalToolExecutionAuthority(input: {
  value: unknown
  toolStrategyPlan: Record<string, unknown>
  workItems: CanonicalToolAuthorityWorkItem[]
}): CanonicalToolExecutionAuthority {
  const parsed = canonicalToolExecutionAuthoritySchema.safeParse(input.value)
  if (!parsed.success) {
    throw invalidPersisted('Canonical tool execution authority is invalid.', {
      validation: parsed.error.flatten(),
    })
  }
  const authority = parsed.data
  const { authorityHash, ...payload } = authority
  if (authorityHash !== sha256AuthorityValue(payload)) {
    throw invalidPersisted('Canonical tool execution authority hash is invalid.')
  }
  try {
    assertCanonicalApprovedWorkGraphResourcePlacementAuthority({
      value: authority.resourcePlacementAuthority,
      workItems: input.workItems.map(resourcePlacementWorkItem),
      tools: authority.tools,
    })
  } catch {
    throw invalidPersisted(
      'Canonical tool execution resource placement authority is invalid or no longer executable.',
    )
  }

  const current = createCanonicalToolExecutionAuthority({
    toolStrategyPlan: input.toolStrategyPlan,
    workItems: input.workItems,
  })
  if (
    stableAuthorityStringify(structuralAuthority(authority)) !==
    stableAuthorityStringify(structuralAuthority(current))
  ) {
    throw invalidPersisted(
      'Canonical tool execution authority no longer matches its immutable work graph and current tool identities.',
    )
  }
  return authority
}

function projectStrategyAuthority(
  toolStrategyPlan: Record<string, unknown>,
  workItems: CanonicalToolAuthorityWorkItem[],
): StrategyProjection {
  const compactToolIds = optionalStringArray(toolStrategyPlan, 'toolIds')
  const richToolIds = optionalStringArray(toolStrategyPlan, 'toolIdsUsed')
  if (
    compactToolIds && richToolIds &&
    stableAuthorityStringify([...compactToolIds].sort()) !==
      stableAuthorityStringify([...richToolIds].sort())
  ) {
    throw invalid('Canonical tool strategy declarations disagree between toolIds and toolIdsUsed.')
  }
  const declaredToolIds = unique([...(compactToolIds ?? []), ...(richToolIds ?? [])]).sort()
  const declaredExactOperationIds = optionalStringArray(
    toolStrategyPlan,
    'exactOperationIds',
  )?.sort() ?? []
  const workGraphToolIds = unique(workItems.flatMap((workItem) => workItem.approvedToolIds)).sort()
  if (workGraphToolIds.length > 0 && declaredToolIds.length === 0) {
    throw invalid('Canonical tool-backed work requires an explicit tool strategy declaration.', {
      requiredGate: 'canonical_tool_strategy_execution_authority',
    })
  }
  const undeclaredWorkGraphToolIds = workGraphToolIds.filter((toolId) =>
    !declaredToolIds.includes(toolId))
  if (undeclaredWorkGraphToolIds.length > 0) {
    throw invalid('Canonical work graph contains tools absent from the approved tool strategy.', {
      undeclaredWorkGraphToolIds,
    })
  }

  const workGraphOperationIds = unique(workItems.flatMap((workItem) => {
    const value = workItem.executionInput.approvedToolOperationIds
    return Array.isArray(value)
      ? value.filter((operationId): operationId is string => typeof operationId === 'string')
      : []
  })).sort()
  if (declaredExactOperationIds.length > 0) {
    const missingOperationIds = workGraphOperationIds.filter((operationId) =>
      !declaredExactOperationIds.includes(operationId))
    if (missingOperationIds.length > 0) {
      throw invalid('Canonical work graph contains operations absent from exact tool strategy authority.', {
        missingOperationIds,
      })
    }
    for (const operationId of declaredExactOperationIds) {
      const matchingToolId = declaredToolIds.find((toolId) => {
        if (!isProductionToolId(toolId)) return false
        return resolveCompleteProfessionalToolOperationSpec(toolId)
          ?.allowedOperationIds.includes(operationId) === true
      })
      if (!matchingToolId) {
        throw invalid('Exact tool strategy operation does not belong to a declared canonical tool.', {
          operationId,
        })
      }
    }
  }

  const projection = {
    declaredToolIds,
    declaredExactOperationIds,
    workGraphToolIds,
    unusedDeclaredToolIds: declaredToolIds.filter((toolId) =>
      !workGraphToolIds.includes(toolId)),
  }
  return {
    ...projection,
    declarationHash: sha256AuthorityValue(projection),
  }
}

function structuralAuthority(authority: CanonicalToolExecutionAuthority) {
  return {
    schemaVersion: authority.schemaVersion,
    source: authority.source,
    catalogVersion: authority.catalogVersion,
    strategyAuthority: authority.strategyAuthority,
    tools: authority.tools.map((tool) => ({
      stableToolIdentity: tool.stableToolIdentity,
      canonicalToolId: tool.canonicalToolId,
      operationId: tool.operationId,
      operationSpecHash: tool.operationSpecHash,
      identityHash: tool.identityHash,
      runtime: tool.runtime,
      workItems: tool.workItems,
    })),
    resourcePlacementAuthority: structuralResourcePlacementAuthority(
      authority.resourcePlacementAuthority,
    ),
    summary: {
      declaredToolCount: authority.summary.declaredToolCount,
      workGraphToolCount: authority.summary.workGraphToolCount,
      requiredWorkGraphToolCount: authority.summary.requiredWorkGraphToolCount,
      allWorkItemsHaveFrozenResourcePlacement:
        authority.summary.allWorkItemsHaveFrozenResourcePlacement,
      frontendExecutionAllowed: authority.summary.frontendExecutionAllowed,
      providerExecutionAuthorized: authority.summary.providerExecutionAuthorized,
      customerBillingAuthorized: authority.summary.customerBillingAuthorized,
      productionExecutionAuthorized: authority.summary.productionExecutionAuthorized,
    },
  }
}

function resourcePlacementWorkItem(
  workItem: CanonicalToolAuthorityWorkItem,
): CanonicalResourcePlacementAuthorityWorkItem {
  const rawOperationIds = workItem.executionInput.approvedToolOperationIds
  const approvedToolOperationIds = rawOperationIds === undefined &&
    workItem.approvedToolIds.length === 0
    ? []
    : Array.isArray(rawOperationIds) && rawOperationIds.every((value) =>
      typeof value === 'string')
      ? [...rawOperationIds] as string[]
      : undefined
  if (!approvedToolOperationIds) {
    throw invalid('Canonical resource placement requires exact approved tool operation identities.', {
      workItemKey: workItem.workItemKey,
    })
  }
  return {
    workItemKey: workItem.workItemKey,
    workItemType: workItem.workItemType,
    workerClass: workItem.workerClass,
    required: workItem.required,
    approvedToolIds: [...workItem.approvedToolIds],
    approvedToolOperationIds,
    providerExecutionMode: workItem.providerExecutionMode,
  }
}

function structuralResourcePlacementAuthority(
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

function optionalStringArray(
  value: Record<string, unknown>,
  field: string,
): string[] | undefined {
  if (!(field in value)) return undefined
  const raw = value[field]
  if (
    !Array.isArray(raw) ||
    raw.length > 256 ||
    raw.some((item) => typeof item !== 'string' || !safeKey.safeParse(item).success) ||
    new Set(raw).size !== raw.length
  ) {
    throw invalid(`Canonical tool strategy ${field} must be a unique string array.`)
  }
  return [...raw] as string[]
}

function unique(values: string[]): string[] {
  return [...new Set(values)]
}

function notReady(
  message: string,
  requiredGate: string,
  toolId: string,
  details?: Record<string, unknown>,
): ApiError {
  return new ApiError('TOOL_NOT_READY', message, 409, {
    requiredGate,
    toolId,
    ...details,
  })
}

function invalid(message: string, details?: Record<string, unknown>): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 400, details)
}

function invalidPersisted(message: string, details?: Record<string, unknown>): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 409, details)
}

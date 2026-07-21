import { createHash } from 'node:crypto'

import { z } from 'zod'

import {
  createCanonicalProviderOperationRegistry,
  createCanonicalProviderOperationRegistryV2,
  resolveCanonicalProviderOperation,
  resolveCanonicalProviderOperationV2,
} from '../edit-architecture/canonical-provider-work-authority'
import { ApiError } from '../errors/api-error'
import {
  readPrivateFileIfExistsWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
} from '../security/private-local-persistence'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  listCompleteProfessionalToolOperationSpecs,
} from '../tool-execution/core-registry-operations/core-registry-operation-specs'
import type {
  ProfessionalToolOperationSpec,
} from '../tool-execution/professional-tool-operation-spec-types'
import {
  privateEmbeddedProcessResourceObservationSchema,
  type PrivateEmbeddedProcessResourceObservation,
} from '../tool-execution/private-embedded-process-resource-observation'
import { calculateInfrastructureRuntimeCostMicros } from './cost-math'
import {
  TOOL_COST_RATE_CARD,
  TOOL_COST_RATE_CARD_VERSION,
} from './rate-card'

export const PRIVATE_WORKER_RESOURCE_USAGE_COST_EVIDENCE_VERSION =
  'private-worker-resource-usage-cost-evidence-v1' as const
export const PRIVATE_WORKER_RESOURCE_OBSERVER_SNAPSHOT_VERSION =
  'private-worker-resource-observer-snapshot-v1' as const

const identity = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const safeInteger = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)
const positiveSafeInteger = safeInteger.refine((value) => value > 0)
const artifactSchema = z.object({
  artifactId: identity,
  sha256,
  byteLength: safeInteger,
}).strict()

const evidenceIdentitySchema = z.object({
  ownerUserId: identity,
  workspaceId: identity,
  projectId: identity,
  editSessionId: identity,
  approvedPlanSnapshotId: identity,
  approvedPlanSnapshotHash: sha256,
  packageRecordId: identity,
  packageHash: sha256,
  approvedWorkItemId: identity,
  approvedWorkItemHash: sha256,
  jobId: identity,
  executionAttemptId: identity,
  attemptOrdinal: z.number().int().positive().max(10),
  leaseId: identity,
  leaseHash: sha256,
  dispatchGrantId: identity,
  dispatchGrantHash: sha256,
  idempotencyKeyHash: sha256,
}).strict()

const runtimeIdentitySchema = z.object({
  workerClass: identity,
  runtimeExecutionIdentityDigest: sha256,
  runtimeImageDigest: sha256,
  runtimeAttestationDigest: sha256,
  containerIdentityDigest: sha256,
  cloudExecutionResourceDigest: sha256.nullable(),
  measurementAgentVersion: identity,
  measurementAgentDigest: sha256,
  leaseExpiresAt: timestamp,
}).strict()

const operationAuthoritySchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('registered_tool_operation'),
    registryVersion: z.literal('professional-tool-operation-spec-v1'),
    canonicalToolId: identity,
    operationId: identity,
    operationProfileId: identity,
    operationProfileHash: sha256,
    registryWorkerType: identity,
    runtimeClass: identity,
    networkMode: z.enum(['offline_required', 'conditional_approved_destination']),
    requiredMeasurementContractHash: sha256,
    maximumAttemptsPerApprovedWorkItem: z.number().int().positive().max(10),
    maximumElapsedMilliseconds: positiveSafeInteger,
    maximumVcpuCount: positiveSafeInteger,
    maximumMemoryMib: positiveSafeInteger,
    maximumGpuCount: z.number().int().min(0).max(8),
    maximumInputBytes: positiveSafeInteger,
    maximumOutputBytes: positiveSafeInteger,
    maximumOutputArtifacts: z.number().int().positive().max(64),
    maximumNetworkEgressBytes: safeInteger,
    maximumAuthorizedInfrastructureCostMicros: z.null(),
    privateInternalRunnerVerified: z.literal(true),
    productReady: z.literal(false),
  }).strict(),
  z.object({
    kind: z.literal('registered_provider_operation'),
    registryVersion: z.enum([
      'canonical-provider-operation-registry-v1',
      'canonical-provider-operation-registry-v2',
    ]),
    canonicalToolId: z.null(),
    operationId: identity,
    operationProfileId: identity,
    operationProfileHash: sha256,
    registryWorkerType: identity,
    runtimeClass: z.literal('provider_transport_worker_unreleased'),
    networkMode: z.literal('provider_transport_unreleased'),
    requiredMeasurementContractHash: sha256,
    maximumAttemptsPerApprovedWorkItem: z.literal(1),
    maximumElapsedMilliseconds: positiveSafeInteger,
    maximumVcpuCount: z.literal(1),
    maximumMemoryMib: z.literal(1_024),
    maximumGpuCount: z.literal(0),
    maximumInputBytes: positiveSafeInteger,
    maximumOutputBytes: positiveSafeInteger,
    maximumOutputArtifacts: z.number().int().positive().max(8),
    maximumNetworkEgressBytes: positiveSafeInteger,
    maximumAuthorizedInfrastructureCostMicros: safeInteger.nullable(),
    privateInternalRunnerVerified: z.literal(false),
    productReady: z.literal(false),
  }).strict(),
])

const observerSnapshotSchema = z.object({
  schemaVersion: z.literal(PRIVATE_WORKER_RESOURCE_OBSERVER_SNAPSHOT_VERSION),
  runtimeExecutionIdentityDigest: sha256,
  containerIdentityDigest: sha256,
  measurementAgentDigest: sha256,
  capturedAt: timestamp,
  cpuUsageNanoseconds: safeInteger,
  memoryCurrentBytes: safeInteger,
  memoryPeakBytes: safeInteger,
  gpuActiveMilliseconds: safeInteger.nullable(),
  rawSnapshotDigest: sha256,
}).strict()

const resourceUsageSchema = z.object({
  measurementClass: z.enum([
    'private_injected_observed_resource_snapshots',
    'private_embedded_observed_resource_snapshots',
    'canonical_backend_observed_resource_snapshots_unreleased',
  ]),
  startedAt: timestamp,
  finishedAt: timestamp,
  wallTimeMilliseconds: positiveSafeInteger,
  allocatedVcpuCount: positiveSafeInteger,
  allocatedMemoryMib: positiveSafeInteger,
  allocatedGpuCount: z.number().int().min(0).max(8),
  allocatedVcpuMilliseconds: positiveSafeInteger,
  allocatedMemoryMibMilliseconds: positiveSafeInteger,
  allocatedGpuMilliseconds: safeInteger,
  observedCpuMicroseconds: safeInteger,
  observedPeakMemoryBytes: safeInteger,
  observedGpuActiveMilliseconds: safeInteger,
  networkEgressBytes: safeInteger,
  infrastructureEvidenceDigest: sha256,
  startSnapshotDigest: sha256,
  finishSnapshotDigest: sha256,
}).strict()

export const privateWorkerResourceUsageCostEvidenceSchema = z.object({
  schemaVersion: z.literal(PRIVATE_WORKER_RESOURCE_USAGE_COST_EVIDENCE_VERSION),
  boundary: z.literal('internal_production_cost_only'),
  evidenceClass: z.enum([
    'private_injected_observed_usage_test',
    'private_embedded_observed_usage_test',
    'canonical_backend_observed_usage_unreleased',
  ]),
  evidenceId: identity,
  identity: evidenceIdentitySchema,
  attemptIdentityHash: sha256,
  attemptInputHash: sha256,
  operation: operationAuthoritySchema,
  runtime: runtimeIdentitySchema,
  observerSnapshots: z.object({
    start: observerSnapshotSchema,
    finish: observerSnapshotSchema,
  }).strict(),
  input: z.object({
    manifestHash: sha256,
    artifacts: z.array(artifactSchema).max(64),
  }).strict(),
  output: z.object({
    disposition: z.enum(['accepted', 'partial_rejected', 'none']),
    manifestHash: sha256,
    artifacts: z.array(artifactSchema).max(64),
  }).strict(),
  resourceUsage: resourceUsageSchema,
  infrastructureCost: z.object({
    rateCardVersion: z.literal(TOOL_COST_RATE_CARD_VERSION),
    rateCardDigest: sha256,
    rateAuthorityClass: z.literal('mock_safe_placeholder_not_cloud_invoice'),
    billableMilliseconds: positiveSafeInteger,
    breakdownMicros: z.record(z.string(), safeInteger),
    actualInternalCostMicros: safeInteger,
    officialCloudRateApproved: z.literal(false),
    invoiceReconciled: z.literal(false),
    providerCostIncluded: z.literal(false),
  }).strict(),
  outcome: z.object({
    state: z.enum(['completed', 'failed', 'unknown']),
    failureCategory: z.enum([
      'none',
      'provider_error',
      'reeditpro_error',
      'validation_error',
      'timeout',
      'cancelled',
      'unknown',
    ]),
    failedOrUnknownAttemptCostRetained: z.literal(true),
  }).strict(),
  commercialBoundary: z.object({
    customerPriceIncluded: z.literal(false),
    customerCreditsIncluded: z.literal(false),
    serviceFeeIncluded: z.literal(false),
    walletMutationPerformed: z.literal(false),
    billingMutationPerformed: z.literal(false),
  }).strict(),
  persistence: z.object({
    privateLocalCreateOnly: z.literal(true),
    databaseBacked: z.literal(false),
    productionDurability: z.literal(false),
  }).strict(),
  readiness: z.object({
    observedUsageContractVerified: z.literal(true),
    observedUsageTransportQualified: z.literal(false),
    productionRateAuthority: z.literal(false),
    distributedDurability: z.literal(false),
    productionReady: z.literal(false),
  }).strict(),
  createdAt: timestamp,
  evidenceHash: sha256,
}).strict().superRefine((value, context) => {
  const duration = Date.parse(value.resourceUsage.finishedAt)
    - Date.parse(value.resourceUsage.startedAt)
  const usage = value.resourceUsage
  const snapshots = value.observerSnapshots
  if (
    duration !== usage.wallTimeMilliseconds
    || usage.allocatedVcpuMilliseconds !==
      usage.allocatedVcpuCount * usage.wallTimeMilliseconds
    || usage.allocatedMemoryMibMilliseconds !==
      usage.allocatedMemoryMib * usage.wallTimeMilliseconds
    || usage.allocatedGpuMilliseconds !==
      usage.allocatedGpuCount * usage.wallTimeMilliseconds
    || usage.observedCpuMicroseconds > maximumObservedCpuMicroseconds({
      allocatedVcpuCount: usage.allocatedVcpuCount,
      wallTimeMilliseconds: usage.wallTimeMilliseconds,
    })
    || usage.observedPeakMemoryBytes > usage.allocatedMemoryMib * 1024 * 1024
    || usage.observedGpuActiveMilliseconds > usage.allocatedGpuMilliseconds
    || value.runtime.workerClass !== value.operation.registryWorkerType
    || Date.parse(value.createdAt) < Date.parse(usage.finishedAt)
    || (value.evidenceClass === 'canonical_backend_observed_usage_unreleased') !==
      (value.runtime.cloudExecutionResourceDigest !== null)
    || usage.measurementClass !== measurementClassFor(value.evidenceClass)
  ) context.addIssue({ code: 'custom', message: 'Worker resource usage math is inconsistent.' })
  if (
    Date.parse(value.resourceUsage.finishedAt) > Date.parse(value.runtime.leaseExpiresAt)
    || value.resourceUsage.wallTimeMilliseconds >
      value.operation.maximumElapsedMilliseconds
    || value.identity.attemptOrdinal >
      value.operation.maximumAttemptsPerApprovedWorkItem
    || value.resourceUsage.allocatedVcpuCount > value.operation.maximumVcpuCount
    || value.resourceUsage.allocatedMemoryMib > value.operation.maximumMemoryMib
    || value.resourceUsage.allocatedGpuCount > value.operation.maximumGpuCount
    || value.resourceUsage.networkEgressBytes >
      value.operation.maximumNetworkEgressBytes
  ) context.addIssue({ code: 'custom', message: 'Worker resource usage exceeded immutable authority.' })
  const expectedCpuMicroseconds = Math.floor(
    (snapshots.finish.cpuUsageNanoseconds - snapshots.start.cpuUsageNanoseconds) / 1_000,
  )
  const expectedGpuMilliseconds =
    (snapshots.finish.gpuActiveMilliseconds ?? 0)
      - (snapshots.start.gpuActiveMilliseconds ?? 0)
  const expectedPeakMemoryBytes = Math.max(
    snapshots.start.memoryPeakBytes,
    snapshots.finish.memoryPeakBytes,
    snapshots.finish.memoryCurrentBytes,
  )
  if (
    snapshots.start.rawSnapshotDigest !==
      hashPrivateWorkerResourceObserverSnapshot(snapshots.start)
    || snapshots.finish.rawSnapshotDigest !==
      hashPrivateWorkerResourceObserverSnapshot(snapshots.finish)
    || snapshots.start.capturedAt !== usage.startedAt
    || snapshots.finish.capturedAt !== usage.finishedAt
    || snapshots.start.runtimeExecutionIdentityDigest !==
      value.runtime.runtimeExecutionIdentityDigest
    || snapshots.finish.runtimeExecutionIdentityDigest !==
      value.runtime.runtimeExecutionIdentityDigest
    || snapshots.start.containerIdentityDigest !== value.runtime.containerIdentityDigest
    || snapshots.finish.containerIdentityDigest !== value.runtime.containerIdentityDigest
    || snapshots.start.measurementAgentDigest !== value.runtime.measurementAgentDigest
    || snapshots.finish.measurementAgentDigest !== value.runtime.measurementAgentDigest
    || snapshots.start.memoryPeakBytes < snapshots.start.memoryCurrentBytes
    || snapshots.finish.memoryPeakBytes < snapshots.finish.memoryCurrentBytes
    || snapshots.finish.memoryPeakBytes < snapshots.start.memoryPeakBytes
    || snapshots.finish.cpuUsageNanoseconds < snapshots.start.cpuUsageNanoseconds
    || expectedGpuMilliseconds < 0
    || (usage.allocatedGpuCount === 0 && (
      snapshots.start.gpuActiveMilliseconds !== null
      || snapshots.finish.gpuActiveMilliseconds !== null
    ))
    || (usage.allocatedGpuCount > 0 && (
      snapshots.start.gpuActiveMilliseconds === null
      || snapshots.finish.gpuActiveMilliseconds === null
    ))
    || expectedCpuMicroseconds !== usage.observedCpuMicroseconds
    || expectedPeakMemoryBytes !== usage.observedPeakMemoryBytes
    || expectedGpuMilliseconds !== usage.observedGpuActiveMilliseconds
  ) context.addIssue({ code: 'custom', message: 'Worker observer snapshot lineage is inconsistent.' })
  const expectedInfrastructureDigest = workerInfrastructureEvidenceDigest({
    operationProfileHash: value.operation.operationProfileHash,
    runtimeExecutionIdentityDigest: value.runtime.runtimeExecutionIdentityDigest,
    startSnapshotDigest: snapshots.start.rawSnapshotDigest,
    finishSnapshotDigest: snapshots.finish.rawSnapshotDigest,
    wallTimeMilliseconds: usage.wallTimeMilliseconds,
    observedCpuMicroseconds: usage.observedCpuMicroseconds,
    observedPeakMemoryBytes: usage.observedPeakMemoryBytes,
    observedGpuActiveMilliseconds: usage.observedGpuActiveMilliseconds,
    networkEgressBytes: usage.networkEgressBytes,
  })
  if (usage.infrastructureEvidenceDigest !== expectedInfrastructureDigest) {
    context.addIssue({ code: 'custom', message: 'Worker infrastructure evidence digest changed.' })
  }
  const expectedAttemptIdentityHash = sha256AuthorityValue({
    domain: 'private_worker_resource_usage_cost_identity_v1',
    identity: value.identity,
    operationProfileHash: value.operation.operationProfileHash,
    runtimeExecutionIdentityDigest: value.runtime.runtimeExecutionIdentityDigest,
  })
  if (
    value.attemptIdentityHash !== expectedAttemptIdentityHash
    || value.evidenceId !== `workerusage_${expectedAttemptIdentityHash.slice(0, 48)}`
  ) context.addIssue({ code: 'custom', message: 'Worker attempt identity digest changed.' })
  if (
    value.input.manifestHash !== artifactManifestDigest('input', value.input.artifacts)
    || value.output.manifestHash !== artifactManifestDigest(
      'output',
      value.output.artifacts,
    )
  ) context.addIssue({ code: 'custom', message: 'Worker artifact manifest digest changed.' })
  const inputBytes = value.input.artifacts.reduce(
    (total, artifact) => total + artifact.byteLength,
    0,
  )
  const outputBytes = value.output.artifacts.reduce(
    (total, artifact) => total + artifact.byteLength,
    0,
  )
  if (
    !Number.isSafeInteger(inputBytes)
    || !Number.isSafeInteger(outputBytes)
    || inputBytes > value.operation.maximumInputBytes
    || outputBytes > value.operation.maximumOutputBytes
    || value.output.artifacts.length > value.operation.maximumOutputArtifacts
    || new Set(value.input.artifacts.map((artifact) => artifact.artifactId)).size !==
      value.input.artifacts.length
    || new Set(value.output.artifacts.map((artifact) => artifact.artifactId)).size !==
      value.output.artifacts.length
  ) context.addIssue({ code: 'custom', message: 'Worker artifact authority is inconsistent.' })
  const expectedCost = calculateInfrastructureRuntimeCostMicros({
    wallTimeMilliseconds: usage.wallTimeMilliseconds,
    renderSeconds: 0,
    vcpuCount: usage.allocatedVcpuCount,
    memoryGib: usage.allocatedMemoryMib / 1_024,
    gpuCount: usage.allocatedGpuCount,
    tempStorageGibHours: 0,
    outputStorageGibHours: 0,
    networkEgressMib: usage.networkEgressBytes / (1024 * 1024),
    computeLevel: 'standard',
  })
  if (
    !expectedCost.ok
    || value.infrastructureCost.rateCardDigest !== sha256AuthorityValue(TOOL_COST_RATE_CARD)
    || value.infrastructureCost.billableMilliseconds !==
      (expectedCost.ok ? expectedCost.data.billableMilliseconds : -1)
    || value.infrastructureCost.actualInternalCostMicros !==
      (expectedCost.ok ? expectedCost.data.actualInternalCostMicros : -1)
    || stableAuthorityStringify(value.infrastructureCost.breakdownMicros) !==
      stableAuthorityStringify(expectedCost.ok
        ? numericBreakdown(expectedCost.data.breakdownMicros)
        : {})
    || (value.operation.maximumAuthorizedInfrastructureCostMicros !== null
      && value.infrastructureCost.actualInternalCostMicros >
        value.operation.maximumAuthorizedInfrastructureCostMicros)
  ) context.addIssue({ code: 'custom', message: 'Worker infrastructure cost derivation changed.' })
  if (
    (value.outcome.state === 'completed') !==
      (value.outcome.failureCategory === 'none')
    || (value.outcome.state === 'completed') !==
      (value.output.disposition === 'accepted')
    || (value.output.disposition === 'none' && value.output.artifacts.length !== 0)
    || (value.outcome.state === 'completed'
      && value.operation.kind === 'registered_provider_operation'
      && (value.output.artifacts.length !==
        value.operation.maximumOutputArtifacts || outputBytes === 0))
  ) context.addIssue({ code: 'custom', message: 'Worker outcome and output disposition are inconsistent.' })
})

export type PrivateWorkerResourceUsageCostEvidence = z.infer<
  typeof privateWorkerResourceUsageCostEvidenceSchema
>
export type PrivateWorkerResourceObserverSnapshot = z.infer<
  typeof observerSnapshotSchema
>

export interface CreatePrivateWorkerResourceUsageCostEvidenceInput {
  localStorageRoot: string
  evidenceClass: PrivateWorkerResourceUsageCostEvidence['evidenceClass']
  operation:
    | {
        kind: 'registered_tool_operation'
        canonicalToolId: string
        operationId: string
      }
    | {
        kind: 'registered_provider_operation'
        operationId: string
      }
  identity: PrivateWorkerResourceUsageCostEvidence['identity']
  attemptInputHash: string
  runtime: Omit<PrivateWorkerResourceUsageCostEvidence['runtime'], 'leaseExpiresAt'> & {
    leaseExpiresAt: string
  }
  allocation: {
    vcpuCount: number
    memoryMib: number
    gpuCount: number
  }
  startSnapshot: PrivateWorkerResourceObserverSnapshot
  finishSnapshot: PrivateWorkerResourceObserverSnapshot
  input: PrivateWorkerResourceUsageCostEvidence['input']
  output: PrivateWorkerResourceUsageCostEvidence['output']
  networkEgressBytes: number
  outcome: Omit<PrivateWorkerResourceUsageCostEvidence['outcome'],
    'failedOrUnknownAttemptCostRetained'>
  createdAt: string
}

export async function createPrivateWorkerResourceUsageCostEvidence(
  rawInput: CreatePrivateWorkerResourceUsageCostEvidenceInput,
): Promise<{
  evidence: PrivateWorkerResourceUsageCostEvidence
  idempotencyStatus: 'inserted' | 'duplicate_returned'
}> {
  const input = validateInput(rawInput)
  const operation = resolveOperationAuthority(input.operation, input.evidenceClass)
  assertRuntimeAndSnapshots(input, operation)
  assertArtifacts(input.input, 'input', operation)
  assertArtifacts(input.output, 'output', operation)
  assertOutcome(input, operation)

  const startedAtMs = Date.parse(input.startSnapshot.capturedAt)
  const finishedAtMs = Date.parse(input.finishSnapshot.capturedAt)
  const wallTimeMilliseconds = finishedAtMs - startedAtMs
  const observedCpuMicroseconds = Math.floor(
    (input.finishSnapshot.cpuUsageNanoseconds - input.startSnapshot.cpuUsageNanoseconds) / 1_000,
  )
  const observedGpuActiveMilliseconds =
    (input.finishSnapshot.gpuActiveMilliseconds ?? 0)
      - (input.startSnapshot.gpuActiveMilliseconds ?? 0)
  const observedPeakMemoryBytes = Math.max(
    input.startSnapshot.memoryPeakBytes,
    input.finishSnapshot.memoryPeakBytes,
    input.finishSnapshot.memoryCurrentBytes,
  )
  const resourceUsage = {
    measurementClass: measurementClassFor(input.evidenceClass),
    startedAt: input.startSnapshot.capturedAt,
    finishedAt: input.finishSnapshot.capturedAt,
    wallTimeMilliseconds,
    allocatedVcpuCount: input.allocation.vcpuCount,
    allocatedMemoryMib: input.allocation.memoryMib,
    allocatedGpuCount: input.allocation.gpuCount,
    allocatedVcpuMilliseconds: input.allocation.vcpuCount * wallTimeMilliseconds,
    allocatedMemoryMibMilliseconds: input.allocation.memoryMib * wallTimeMilliseconds,
    allocatedGpuMilliseconds: input.allocation.gpuCount * wallTimeMilliseconds,
    observedCpuMicroseconds,
    observedPeakMemoryBytes,
    observedGpuActiveMilliseconds,
    networkEgressBytes: input.networkEgressBytes,
    infrastructureEvidenceDigest: workerInfrastructureEvidenceDigest({
      operationProfileHash: operation.operationProfileHash,
      runtimeExecutionIdentityDigest: input.runtime.runtimeExecutionIdentityDigest,
      startSnapshotDigest: input.startSnapshot.rawSnapshotDigest,
      finishSnapshotDigest: input.finishSnapshot.rawSnapshotDigest,
      wallTimeMilliseconds,
      observedCpuMicroseconds,
      observedPeakMemoryBytes,
      observedGpuActiveMilliseconds,
      networkEgressBytes: input.networkEgressBytes,
    }),
    startSnapshotDigest: input.startSnapshot.rawSnapshotDigest,
    finishSnapshotDigest: input.finishSnapshot.rawSnapshotDigest,
  }
  const calculated = calculateInfrastructureRuntimeCostMicros({
    wallTimeMilliseconds,
    renderSeconds: 0,
    vcpuCount: input.allocation.vcpuCount,
    memoryGib: input.allocation.memoryMib / 1_024,
    gpuCount: input.allocation.gpuCount,
    tempStorageGibHours: 0,
    outputStorageGibHours: 0,
    networkEgressMib: input.networkEgressBytes / (1024 * 1024),
    computeLevel: 'standard',
  })
  if (
    !calculated.ok
    || calculated.data.rateCardVersion !== TOOL_COST_RATE_CARD_VERSION
    || !calculated.data.billableMilliseconds
  ) throw invalid('Worker infrastructure cost calculation failed closed.')
  if (
    operation.maximumAuthorizedInfrastructureCostMicros !== null
    && calculated.data.actualInternalCostMicros >
      operation.maximumAuthorizedInfrastructureCostMicros
  ) throw invalid('Worker infrastructure cost exceeded its approved operation ceiling.')

  const attemptIdentityHash = sha256AuthorityValue({
    domain: 'private_worker_resource_usage_cost_identity_v1',
    identity: input.identity,
    operationProfileHash: operation.operationProfileHash,
    runtimeExecutionIdentityDigest: input.runtime.runtimeExecutionIdentityDigest,
  })
  const payload = {
    schemaVersion: PRIVATE_WORKER_RESOURCE_USAGE_COST_EVIDENCE_VERSION,
    boundary: 'internal_production_cost_only' as const,
    evidenceClass: input.evidenceClass,
    evidenceId: `workerusage_${attemptIdentityHash.slice(0, 48)}`,
    identity: input.identity,
    attemptIdentityHash,
    attemptInputHash: input.attemptInputHash,
    operation,
    runtime: input.runtime,
    observerSnapshots: {
      start: input.startSnapshot,
      finish: input.finishSnapshot,
    },
    input: input.input,
    output: input.output,
    resourceUsage,
    infrastructureCost: {
      rateCardVersion: TOOL_COST_RATE_CARD_VERSION,
      rateCardDigest: sha256AuthorityValue(TOOL_COST_RATE_CARD),
      rateAuthorityClass: 'mock_safe_placeholder_not_cloud_invoice' as const,
      billableMilliseconds: calculated.data.billableMilliseconds,
      breakdownMicros: numericBreakdown(calculated.data.breakdownMicros),
      actualInternalCostMicros: calculated.data.actualInternalCostMicros,
      officialCloudRateApproved: false as const,
      invoiceReconciled: false as const,
      providerCostIncluded: false as const,
    },
    outcome: {
      ...input.outcome,
      failedOrUnknownAttemptCostRetained: true as const,
    },
    commercialBoundary: {
      customerPriceIncluded: false as const,
      customerCreditsIncluded: false as const,
      serviceFeeIncluded: false as const,
      walletMutationPerformed: false as const,
      billingMutationPerformed: false as const,
    },
    persistence: {
      privateLocalCreateOnly: true as const,
      databaseBacked: false as const,
      productionDurability: false as const,
    },
    readiness: {
      observedUsageContractVerified: true as const,
      observedUsageTransportQualified: false as const,
      productionRateAuthority: false as const,
      distributedDurability: false as const,
      productionReady: false as const,
    },
    createdAt: input.createdAt,
  }
  assertNoCommercialFields(payload)
  const evidence = parseOrInvalid(privateWorkerResourceUsageCostEvidenceSchema, {
    ...payload,
    evidenceHash: sha256AuthorityValue(payload),
  }, 'Worker resource usage evidence failed derived-integrity validation.')
  const bytes = Buffer.from(`${stableAuthorityStringify(evidence)}\n`, 'utf8')
  const relativePath = evidenceRelativePath(evidence.identity)
  const publication = await writePrivateFileCreateOnlyWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath,
    content: bytes,
  })
  const persisted = await readPrivateWorkerResourceUsageCostEvidence({
    localStorageRoot: input.localStorageRoot,
    ownerUserId: input.identity.ownerUserId,
    workspaceId: input.identity.workspaceId,
    projectId: input.identity.projectId,
    executionAttemptId: input.identity.executionAttemptId,
  })
  if (!persisted || persisted.evidenceHash !== evidence.evidenceHash) {
    throw invalid('Worker resource usage evidence failed create-only readback.')
  }
  return {
    evidence: persisted,
    idempotencyStatus: publication.created ? 'inserted' : 'duplicate_returned',
  }
}

export async function readPrivateWorkerResourceUsageCostEvidence(input: {
  localStorageRoot: string
  ownerUserId: string
  workspaceId: string
  projectId: string
  executionAttemptId: string
}): Promise<PrivateWorkerResourceUsageCostEvidence | undefined> {
  const relativePath = evidenceRelativePath(input)
  const bytes = await readPrivateFileIfExistsWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath,
  })
  if (!bytes) return undefined
  if (bytes.byteLength < 2 || bytes.byteLength > 256 * 1024) {
    throw invalid('Stored worker resource usage evidence exceeds its byte boundary.')
  }
  let decoded: unknown
  try {
    decoded = JSON.parse(bytes.toString('utf8'))
  } catch {
    throw invalid('Stored worker resource usage evidence is not valid JSON.')
  }
  const evidence = parseOrInvalid(
    privateWorkerResourceUsageCostEvidenceSchema,
    decoded,
    'Stored worker resource usage evidence is invalid.',
  )
  const currentOperation = resolveOperationAuthority(
    evidence.operation.kind === 'registered_tool_operation'
      ? {
          kind: 'registered_tool_operation',
          canonicalToolId: evidence.operation.canonicalToolId,
          operationId: evidence.operation.operationId,
        }
      : {
          kind: 'registered_provider_operation',
          operationId: evidence.operation.operationId,
        },
    evidence.evidenceClass,
  )
  if (
    stableAuthorityStringify(currentOperation) !==
      stableAuthorityStringify(evidence.operation)
  ) throw invalid('Stored worker operation authority no longer matches its registry version.')
  assertArtifacts(evidence.input, 'input', evidence.operation)
  assertArtifacts(evidence.output, 'output', evidence.operation)
  const { evidenceHash, ...payload } = evidence
  if (
    evidenceHash !== sha256AuthorityValue(payload)
    || evidence.identity.ownerUserId !== input.ownerUserId
    || evidence.identity.workspaceId !== input.workspaceId
    || evidence.identity.projectId !== input.projectId
    || evidence.identity.executionAttemptId !== input.executionAttemptId
  ) throw invalid('Stored worker resource usage evidence integrity changed.')
  assertNoCommercialFields(evidence)
  return evidence
}

export function hashPrivateWorkerResourceArtifactManifest(input: {
  direction: 'input' | 'output'
  artifacts: readonly z.infer<typeof artifactSchema>[]
}): string {
  assertArtifactList(input.artifacts)
  return artifactManifestDigest(input.direction, input.artifacts)
}

export function hashPrivateWorkerResourceObserverSnapshot(
  input: Omit<PrivateWorkerResourceObserverSnapshot, 'rawSnapshotDigest'>
    | PrivateWorkerResourceObserverSnapshot,
): string {
  return sha256AuthorityValue({
    domain: 'private_worker_resource_observer_snapshot_v1',
    snapshot: {
      schemaVersion: input.schemaVersion,
      runtimeExecutionIdentityDigest: input.runtimeExecutionIdentityDigest,
      containerIdentityDigest: input.containerIdentityDigest,
      measurementAgentDigest: input.measurementAgentDigest,
      capturedAt: input.capturedAt,
      cpuUsageNanoseconds: input.cpuUsageNanoseconds,
      memoryCurrentBytes: input.memoryCurrentBytes,
      memoryPeakBytes: input.memoryPeakBytes,
      gpuActiveMilliseconds: input.gpuActiveMilliseconds,
    },
  })
}

export function createPrivateWorkerObserverSnapshotsFromEmbeddedObservation(input: {
  observation: PrivateEmbeddedProcessResourceObservation
  runtimeExecutionIdentityDigest: string
}): {
  start: PrivateWorkerResourceObserverSnapshot
  finish: PrivateWorkerResourceObserverSnapshot
} {
  const observation = parseOrInvalid(
    privateEmbeddedProcessResourceObservationSchema,
    input.observation,
    'Embedded worker resource observation is invalid.',
  )
  parseOrInvalid(
    sha256,
    input.runtimeExecutionIdentityDigest,
    'Worker runtime execution identity digest is invalid.',
  )
  const snapshot = (
    point: PrivateEmbeddedProcessResourceObservation['start'],
  ): PrivateWorkerResourceObserverSnapshot => {
    const withoutDigest = {
      schemaVersion: PRIVATE_WORKER_RESOURCE_OBSERVER_SNAPSHOT_VERSION,
      runtimeExecutionIdentityDigest: input.runtimeExecutionIdentityDigest,
      containerIdentityDigest: observation.containerIdentityDigest,
      measurementAgentDigest: observation.measurementAgentDigest,
      capturedAt: point.capturedAt,
      cpuUsageNanoseconds: point.cpuUsageNanoseconds,
      memoryCurrentBytes: point.memoryCurrentBytes,
      memoryPeakBytes: point.memoryPeakBytes,
      gpuActiveMilliseconds: point.gpuActiveMilliseconds,
    }
    return {
      ...withoutDigest,
      rawSnapshotDigest: hashPrivateWorkerResourceObserverSnapshot(withoutDigest),
    }
  }
  return {
    start: snapshot(observation.start),
    finish: snapshot(observation.finish),
  }
}

export function summarizePrivateWorkerResourceUsageCoverage() {
  const specs = listCompleteProfessionalToolOperationSpecs()
  const providerProfiles = [
    ...createCanonicalProviderOperationRegistry(),
    ...createCanonicalProviderOperationRegistryV2(),
  ]
  const required = [
    'startedAt',
    'completedAt',
    'wallTimeMilliseconds',
    'attemptNumber',
    'inputBytes',
    'outputBytes',
    'peakMemoryMiB',
    'vcpuMilliseconds',
  ]
  const missingMeasurementOperationIds = specs
    .filter((spec) => required.some((measurement) =>
      !spec.costEvidence.requiredMeasurements.includes(measurement)))
    .flatMap((spec) => spec.allowedOperationIds)
  const gpuOperationSpecs = specs.filter((spec) => spec.resourceCeilings.gpuLimit > 0)
  const missingGpuMeasurementOperationIds = gpuOperationSpecs
    .filter((spec) => !spec.costEvidence.requiredMeasurements.includes('gpuMilliseconds'))
    .flatMap((spec) => spec.allowedOperationIds)
  const privateInternalRunnerVerifiedCount = specs.filter((spec) =>
    spec.privateInternalExecutionReady).length
  const toolOperationIds = specs.flatMap((spec) => spec.allowedOperationIds)
  const canonicalToolIds = new Set(specs.map((spec) => spec.canonicalToolId))
  const payload = {
    schemaVersion: 'private-worker-resource-usage-coverage-v1' as const,
    registeredToolOperationSpecCount: specs.length,
    registeredCanonicalToolIdentityCount: canonicalToolIds.size,
    registeredToolOperationIdCount: toolOperationIds.length,
    registeredProviderOperationCount: providerProfiles.length,
    totalOperationContractCount: toolOperationIds.length + providerProfiles.length,
    toolOperationContractsWithRequiredCpuMemoryMeasurements:
      toolOperationIds.length - missingMeasurementOperationIds.length,
    providerOperationContractsWithRequiredCpuMemoryMeasurements:
      providerProfiles.length,
    totalOperationContractsWithRequiredCpuMemoryMeasurements:
      toolOperationIds.length - missingMeasurementOperationIds.length
        + providerProfiles.length,
    registeredGpuToolOperationCount: gpuOperationSpecs.length,
    gpuToolOperationContractsWithRequiredGpuMeasurements:
      gpuOperationSpecs.length - missingGpuMeasurementOperationIds.length,
    privateInternalRunnerVerifiedToolOperationCount:
      privateInternalRunnerVerifiedCount,
    plannedOrPolicyBlockedToolOperationCount:
      toolOperationIds.length - privateInternalRunnerVerifiedCount,
    missingMeasurementOperationIds,
    missingGpuMeasurementOperationIds,
    productReadyCount: 0 as const,
    providerTransportReadyCount: providerProfiles.filter((profile) =>
      profile.readiness.providerTransportActivated).length,
    cloudObservedUsageTransportReadyCount: 0 as const,
  }
  return {
    ...payload,
    evidenceHash: sha256AuthorityValue(payload),
  }
}

export function assertPrivateWorkerResourceUsageProductionAuthority(
  evidence: PrivateWorkerResourceUsageCostEvidence,
): never {
  parseOrInvalid(
    privateWorkerResourceUsageCostEvidenceSchema,
    evidence,
    'Worker resource usage evidence is invalid.',
  )
  throw new ApiError(
    'TOOL_NOT_READY',
    'Worker resource usage evidence is private/injected or unreleased and cannot authorize production.',
    503,
    {
      requiredGates: [
        'deployed_observed_usage_transport',
        'official_immutable_cloud_rate_snapshot',
        'invoice_reconciliation',
        'distributed_attempt_evidence_durability',
        'canonical_worker_runtime_qualification',
      ],
    },
  )
}

function validateInput(
  input: CreatePrivateWorkerResourceUsageCostEvidenceInput,
): CreatePrivateWorkerResourceUsageCostEvidenceInput {
  if (!input.localStorageRoot.trim()) throw invalid('Worker resource usage storage root is required.')
  parseOrInvalid(evidenceIdentitySchema, input.identity, 'Worker attempt identity is invalid.')
  parseOrInvalid(runtimeIdentitySchema, input.runtime, 'Worker runtime identity is invalid.')
  parseOrInvalid(observerSnapshotSchema, input.startSnapshot,
    'Worker start resource snapshot is invalid.')
  parseOrInvalid(observerSnapshotSchema, input.finishSnapshot,
    'Worker finish resource snapshot is invalid.')
  parseOrInvalid(sha256, input.attemptInputHash, 'Worker attempt input hash is invalid.')
  parseOrInvalid(timestamp, input.createdAt, 'Worker evidence creation time is invalid.')
  if (
    !Number.isSafeInteger(input.allocation.vcpuCount) || input.allocation.vcpuCount < 1
    || !Number.isSafeInteger(input.allocation.memoryMib) || input.allocation.memoryMib < 128
    || !Number.isSafeInteger(input.allocation.gpuCount) || input.allocation.gpuCount < 0
    || input.allocation.gpuCount > 8
    || !Number.isSafeInteger(input.networkEgressBytes) || input.networkEgressBytes < 0
  ) throw invalid('Worker resource allocation is invalid.')
  if (
    Date.parse(input.startSnapshot.capturedAt) >= Date.parse(input.finishSnapshot.capturedAt)
    || Date.parse(input.finishSnapshot.capturedAt) > Date.parse(input.runtime.leaseExpiresAt)
    || Date.parse(input.createdAt) < Date.parse(input.finishSnapshot.capturedAt)
  ) throw invalid('Worker resource usage interval is invalid.')
  if (
    input.finishSnapshot.cpuUsageNanoseconds < input.startSnapshot.cpuUsageNanoseconds
    || (input.finishSnapshot.gpuActiveMilliseconds ?? 0) <
      (input.startSnapshot.gpuActiveMilliseconds ?? 0)
    || input.startSnapshot.memoryPeakBytes < input.startSnapshot.memoryCurrentBytes
    || input.finishSnapshot.memoryPeakBytes < input.finishSnapshot.memoryCurrentBytes
    || input.finishSnapshot.memoryPeakBytes < input.startSnapshot.memoryPeakBytes
  ) throw invalid('Worker resource counters moved backwards.')
  if (
    input.startSnapshot.rawSnapshotDigest !==
      hashPrivateWorkerResourceObserverSnapshot(input.startSnapshot)
    || input.finishSnapshot.rawSnapshotDigest !==
      hashPrivateWorkerResourceObserverSnapshot(input.finishSnapshot)
  ) throw invalid('Worker resource observer snapshot digest changed.')
  return input
}

function measurementClassFor(
  evidenceClass: PrivateWorkerResourceUsageCostEvidence['evidenceClass'],
): PrivateWorkerResourceUsageCostEvidence['resourceUsage']['measurementClass'] {
  if (evidenceClass === 'private_injected_observed_usage_test') {
    return 'private_injected_observed_resource_snapshots'
  }
  if (evidenceClass === 'private_embedded_observed_usage_test') {
    return 'private_embedded_observed_resource_snapshots'
  }
  return 'canonical_backend_observed_resource_snapshots_unreleased'
}

function resolveOperationAuthority(
  operation: CreatePrivateWorkerResourceUsageCostEvidenceInput['operation'],
  evidenceClass: CreatePrivateWorkerResourceUsageCostEvidenceInput['evidenceClass'],
): PrivateWorkerResourceUsageCostEvidence['operation'] {
  if (operation.kind === 'registered_provider_operation') {
    if (evidenceClass !== 'private_injected_observed_usage_test') {
      throw invalid('Provider resource usage is injected-only while transport remains blocked.')
    }
    let profile:
      | ReturnType<typeof resolveCanonicalProviderOperation>
      | ReturnType<typeof resolveCanonicalProviderOperationV2>
    try {
      profile = resolveCanonicalProviderOperation(operation.operationId)
    } catch {
      try {
        profile = resolveCanonicalProviderOperationV2(operation.operationId)
      } catch {
        throw invalid('Provider operation lacks one exact registered metering authority.')
      }
    }
    const measurementContract = {
      required: [
        'startedAt',
        'completedAt',
        'wallTimeMilliseconds',
        'attemptNumber',
        'inputBytes',
        'outputBytes',
        'peakMemoryMiB',
        'vcpuMilliseconds',
        'networkEgressBytes',
      ],
      internalProductionCostOnly: true,
      failedAndUnknownCostRetained: true,
    }
    let maximumOutputBytes: number
    let maximumOutputArtifacts: number
    let maximumAuthorizedInfrastructureCostMicros: number | null
    if (profile.schemaVersion === 'canonical-provider-operation-registry-v2') {
      maximumOutputBytes = profile.expectedOutputs.reduce(
        (total: number, output) => total + output.maximumByteLength,
        0,
      )
      maximumOutputArtifacts = profile.expectedOutputs.length
      maximumAuthorizedInfrastructureCostMicros = null
    } else {
      maximumOutputBytes = profile.expectedOutput.maximumByteLength
      maximumOutputArtifacts = 1
      maximumAuthorizedInfrastructureCostMicros =
        profile.costPolicy.maximumAuthorizedInfrastructureCostMicros
    }
    return parseOrInvalid(operationAuthoritySchema, {
      kind: 'registered_provider_operation',
      registryVersion: profile.schemaVersion,
      canonicalToolId: null,
      operationId: profile.operationId,
      operationProfileId: profile.providerBoundaryProfileId,
      operationProfileHash: profile.profileHash,
      registryWorkerType: profile.expectedWorkerClass,
      runtimeClass: 'provider_transport_worker_unreleased',
      networkMode: 'provider_transport_unreleased',
      requiredMeasurementContractHash: sha256AuthorityValue(measurementContract),
      maximumAttemptsPerApprovedWorkItem: 1,
      maximumElapsedMilliseconds: profile.requestPolicy.maximumElapsedMilliseconds,
      maximumVcpuCount: 1,
      maximumMemoryMib: 1_024,
      maximumGpuCount: 0,
      maximumInputBytes: profile.requestPolicy.maximumRequestBodyBytes,
      maximumOutputBytes,
      maximumOutputArtifacts,
      maximumNetworkEgressBytes:
        profile.requestPolicy.maximumCapturedResponseBytes,
      maximumAuthorizedInfrastructureCostMicros,
      privateInternalRunnerVerified: false,
      productReady: false,
    }, 'Provider operation metering authority is invalid.')
  }

  const matches = listCompleteProfessionalToolOperationSpecs().filter((spec) =>
    spec.allowedOperationIds.includes(operation.operationId))
  if (
    matches.length !== 1
    || matches[0].canonicalToolId !== operation.canonicalToolId
    || !matches[0].privateInternalExecutionReady
    || matches[0].entrypoint.implementationStatus !== 'private_internal_runner_verified'
  ) throw invalid('Tool operation lacks one exact private runner-verified metering authority.')
  return toolOperationAuthority(matches[0])
}

function toolOperationAuthority(
  spec: ProfessionalToolOperationSpec,
): PrivateWorkerResourceUsageCostEvidence['operation'] {
  const operationId = spec.allowedOperationIds[0]
  if (!operationId || spec.allowedOperationIds.length !== 1) {
    throw invalid('Tool operation metering requires one exact operation identity.')
  }
  return parseOrInvalid(operationAuthoritySchema, {
    kind: 'registered_tool_operation',
    registryVersion: spec.schemaVersion,
    canonicalToolId: spec.canonicalToolId,
    operationId,
    operationProfileId: spec.entrypoint.fixedInvocationProfileId,
    operationProfileHash: sha256AuthorityValue(spec),
    registryWorkerType: spec.workerRuntime.registryWorkerType,
    runtimeClass: spec.workerRuntime.runtimeClass,
    networkMode: spec.networkPolicy.mode,
    requiredMeasurementContractHash: sha256AuthorityValue(spec.costEvidence),
    maximumAttemptsPerApprovedWorkItem:
      spec.resourceCeilings.maxAttemptsPerApprovedWorkItem,
    maximumElapsedMilliseconds: spec.resourceCeilings.timeoutMs,
    maximumVcpuCount: spec.resourceCeilings.vcpuLimit,
    maximumMemoryMib: spec.resourceCeilings.memoryMiBLimit,
    maximumGpuCount: spec.resourceCeilings.gpuLimit,
    maximumInputBytes: spec.resourceCeilings.maxInputBytes,
    maximumOutputBytes: spec.resourceCeilings.maxOutputBytes,
    maximumOutputArtifacts: spec.resourceCeilings.maxOutputArtifacts,
    maximumNetworkEgressBytes: spec.resourceCeilings.maxNetworkResponseBytes,
    maximumAuthorizedInfrastructureCostMicros: null,
    privateInternalRunnerVerified: true,
    productReady: false,
  }, 'Tool operation metering authority is invalid.')
}

function assertRuntimeAndSnapshots(
  input: CreatePrivateWorkerResourceUsageCostEvidenceInput,
  operation: PrivateWorkerResourceUsageCostEvidence['operation'],
): void {
  for (const snapshot of [input.startSnapshot, input.finishSnapshot]) {
    if (
      snapshot.runtimeExecutionIdentityDigest !== input.runtime.runtimeExecutionIdentityDigest
      || snapshot.containerIdentityDigest !== input.runtime.containerIdentityDigest
      || snapshot.measurementAgentDigest !== input.runtime.measurementAgentDigest
    ) throw invalid('Worker resource snapshot lost exact runtime identity.')
  }
  const elapsed = Date.parse(input.finishSnapshot.capturedAt)
    - Date.parse(input.startSnapshot.capturedAt)
  const expectedGpu = operation.kind === 'registered_tool_operation'
    && operation.runtimeClass.includes('cuda')
    ? 1
    : 0
  if (
    input.runtime.workerClass !== operation.registryWorkerType
    || input.identity.attemptOrdinal > operation.maximumAttemptsPerApprovedWorkItem
    || elapsed <= 0 || elapsed > operation.maximumElapsedMilliseconds
    || input.allocation.vcpuCount > operation.maximumVcpuCount
    || input.allocation.memoryMib > operation.maximumMemoryMib
    || input.allocation.gpuCount > operation.maximumGpuCount
    || input.allocation.gpuCount !== expectedGpu
  ) throw invalid('Worker resource allocation exceeded the operation profile.')
  const observedCpuMicroseconds = Math.floor(
    (input.finishSnapshot.cpuUsageNanoseconds - input.startSnapshot.cpuUsageNanoseconds) / 1_000,
  )
  const observedGpuMilliseconds =
    (input.finishSnapshot.gpuActiveMilliseconds ?? 0)
      - (input.startSnapshot.gpuActiveMilliseconds ?? 0)
  if (
    observedCpuMicroseconds > maximumObservedCpuMicroseconds({
      allocatedVcpuCount: input.allocation.vcpuCount,
      wallTimeMilliseconds: elapsed,
    })
    || Math.max(
      input.startSnapshot.memoryPeakBytes,
      input.finishSnapshot.memoryPeakBytes,
      input.finishSnapshot.memoryCurrentBytes,
    ) > input.allocation.memoryMib * 1024 * 1024
    || observedGpuMilliseconds > input.allocation.gpuCount * elapsed
    || (input.allocation.gpuCount === 0 && (
      input.startSnapshot.gpuActiveMilliseconds !== null
      || input.finishSnapshot.gpuActiveMilliseconds !== null
    ))
    || (input.allocation.gpuCount > 0 && (
      input.startSnapshot.gpuActiveMilliseconds === null
      || input.finishSnapshot.gpuActiveMilliseconds === null
    ))
  ) throw invalid('Observed worker usage exceeded allocated resources.')
}

function assertArtifacts(
  manifest: PrivateWorkerResourceUsageCostEvidence['input']
    | PrivateWorkerResourceUsageCostEvidence['output'],
  direction: 'input' | 'output',
  operation: PrivateWorkerResourceUsageCostEvidence['operation'],
): void {
  assertArtifactList(manifest.artifacts)
  const totalBytes = manifest.artifacts.reduce(
    (total, artifact) => total + artifact.byteLength,
    0,
  )
  const byteCeiling = direction === 'input'
    ? operation.maximumInputBytes
    : operation.maximumOutputBytes
  if (
    !Number.isSafeInteger(totalBytes)
    || totalBytes > byteCeiling
    || (direction === 'output'
      && manifest.artifacts.length > operation.maximumOutputArtifacts)
  ) throw invalid(`Worker ${direction} artifacts exceeded immutable operation ceilings.`)
  if (manifest.manifestHash !== hashPrivateWorkerResourceArtifactManifest({
    direction,
    artifacts: manifest.artifacts,
  })) throw invalid(`Worker ${direction} artifact manifest integrity changed.`)
}

function assertArtifactList(artifacts: readonly z.infer<typeof artifactSchema>[]): void {
  if (artifacts.length > 64) throw invalid('Worker artifact manifest exceeds its cardinality ceiling.')
  const ids = new Set<string>()
  for (const artifact of artifacts) {
    parseOrInvalid(artifactSchema, artifact, 'Worker artifact identity is invalid.')
    if (ids.has(artifact.artifactId)) throw invalid('Worker artifact manifest contains duplicate identities.')
    ids.add(artifact.artifactId)
  }
}

function artifactManifestDigest(
  direction: 'input' | 'output',
  artifacts: readonly z.infer<typeof artifactSchema>[],
): string {
  return sha256AuthorityValue({
    domain: `private_worker_resource_${direction}_manifest_v1`,
    artifacts,
  })
}

function assertOutcome(
  input: CreatePrivateWorkerResourceUsageCostEvidenceInput,
  operation: PrivateWorkerResourceUsageCostEvidence['operation'],
): void {
  const completed = input.outcome.state === 'completed'
  if (
    completed !== (input.outcome.failureCategory === 'none')
    || completed !== (input.output.disposition === 'accepted')
    || (input.output.disposition === 'none' && input.output.artifacts.length !== 0)
  ) throw invalid('Worker outcome and output disposition are inconsistent.')
  if (
    completed
    && (
      input.output.artifacts.length !== operation.maximumOutputArtifacts
      || input.output.artifacts[0]?.byteLength === 0
    )
    && operation.kind === 'registered_provider_operation'
  ) throw invalid('Completed provider work requires one nonempty private output artifact.')
}

function numericBreakdown(value: Record<string, unknown>): Record<string, number> {
  const result: Record<string, number> = {}
  for (const [key, entry] of Object.entries(value)) {
    if (!Number.isSafeInteger(entry) || (entry as number) < 0) {
      throw invalid(`Worker infrastructure cost breakdown field ${key} is invalid.`)
    }
    result[key] = entry as number
  }
  return result
}

function maximumObservedCpuMicroseconds(input: {
  allocatedVcpuCount: number
  wallTimeMilliseconds: number
}): number {
  // Docker's default CFS bandwidth period is 100 ms. A short observation can
  // straddle two quota boundaries, so cumulative process CPU can legitimately
  // exceed vCPU × wall time by at most two periods without exceeding the
  // container's configured quota. This allowance validates the counter only;
  // cost remains derived from exact allocated vCPU wall time.
  return input.allocatedVcpuCount * (input.wallTimeMilliseconds * 1_000 + 200_000)
}

function workerInfrastructureEvidenceDigest(input: {
  operationProfileHash: string
  runtimeExecutionIdentityDigest: string
  startSnapshotDigest: string
  finishSnapshotDigest: string
  wallTimeMilliseconds: number
  observedCpuMicroseconds: number
  observedPeakMemoryBytes: number
  observedGpuActiveMilliseconds: number
  networkEgressBytes: number
}): string {
  return sha256AuthorityValue({
    domain: 'private_worker_resource_usage_interval_v1',
    ...input,
  })
}

function evidenceRelativePath(input: {
  ownerUserId: string
  workspaceId: string
  projectId: string
  executionAttemptId: string
}): string {
  for (const value of [
    input.ownerUserId,
    input.workspaceId,
    input.projectId,
    input.executionAttemptId,
  ]) parseOrInvalid(identity, value, 'Worker evidence lookup identity is invalid.')
  const tenantHash = sha256Text(
    `${input.ownerUserId}\u0000${input.workspaceId}\u0000${input.projectId}`,
  ).slice(0, 32)
  const attemptLookupHash = sha256AuthorityValue({
    domain: 'private_worker_resource_usage_cost_lookup_v1',
    ownerUserId: input.ownerUserId,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    executionAttemptId: input.executionAttemptId,
  })
  return `private-internal/worker-resource-usage-cost/v1/${tenantHash}/${attemptLookupHash}.json`
}

function assertNoCommercialFields(value: unknown): void {
  const forbidden = /(^|\.)(price|customerPrice|credits|serviceFee|wallet|billing|charge|invoice)(\.|$)/iu
  walk(value, '', (path) => {
    if (forbidden.test(path) && ![
      'commercialBoundary.customerPriceIncluded',
      'commercialBoundary.customerCreditsIncluded',
      'commercialBoundary.serviceFeeIncluded',
      'commercialBoundary.walletMutationPerformed',
      'commercialBoundary.billingMutationPerformed',
      'infrastructureCost.invoiceReconciled',
    ].includes(path)) {
      throw invalid(`Worker resource usage evidence contains commercial field ${path}.`)
    }
  })
}

function walk(value: unknown, path: string, visit: (path: string) => void): void {
  if (!value || typeof value !== 'object') return
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const next = path ? `${path}.${key}` : key
    visit(next)
    walk(child, next, visit)
  }
}

function sha256Text(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function parseOrInvalid<T>(
  schema: { parse: (value: unknown) => T },
  value: unknown,
  message: string,
): T {
  try {
    return schema.parse(value)
  } catch {
    throw invalid(message)
  }
}

function invalid(message: string): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 400, {
    requiredGate: 'private_worker_resource_usage_cost_integrity',
  })
}

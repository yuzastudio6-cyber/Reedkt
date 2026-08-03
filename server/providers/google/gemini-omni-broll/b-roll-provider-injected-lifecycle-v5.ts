import { createHash } from 'node:crypto'
import { z } from 'zod'

import {
  readPrivateFileIfExistsWithinRoot,
  readPrivateTextFileIfExistsWithinRoot,
  withPrivateCooperativeFileLockWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
  writePrivateTextFileAtomicWithinRoot,
} from '../../../security/private-local-persistence'
import { hashSkillValue } from '../../../edit-skills/core/skill-capability-manifest-hash'
import { skillSha256Schema } from '../../../edit-skills/core/skill-capability-manifest-schema'
import {
  assertBrollProviderWorkAuthorizationV5,
  brollProviderAuthorizationRequestHashV5,
  type BrollProviderRequestPackageV5,
  type BrollProviderWorkAuthorizationV5,
} from './b-roll-provider-authority-v5'
import {
  createBrollProviderLifecyclePolicyV5,
} from './b-roll-provider-lifecycle-policy-v5'

export const BROLL_PROVIDER_INJECTED_LIFECYCLE_V5_VERSION =
  'gemini_omni_b_roll_injected_lifecycle_v5' as const
export const BROLL_PROVIDER_CONSUMER_RECEIPT_V5_VERSION =
  'gemini_omni_b_roll_consumer_receipt_v5' as const

const identity = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/-]*$/u)
  .refine((value) => !value.includes('..'))
const timestamp = z.string().datetime({ offset: true })

const leaseSchema = z.object({
  leaseId: skillSha256Schema,
  workerIdentity: identity,
  claimedAt: timestamp,
  expiresAt: timestamp,
  leaseHash: skillSha256Schema,
}).strict()

const dispatchGrantSchema = z.object({
  grantId: skillSha256Schema,
  leaseId: skillSha256Schema,
  dispatchCredentialHash: skillSha256Schema,
  issuedAt: timestamp,
  consumedAt: timestamp,
  providerRequestStartedAtConsumption: z.literal(false),
  consumedExactlyOnce: z.literal(true),
  grantHash: skillSha256Schema,
}).strict()

const privateOutputSchema = z.object({
  outputId: identity,
  role: z.literal('provider_b_roll_candidate_video_mp4'),
  artifactType: z.literal('provider_b_roll_candidate_video_mp4'),
  contentType: z.literal('video/mp4'),
  privateObjectIdentityHash: skillSha256Schema,
  privateObjectRelativePath: z.string().trim().min(1).max(500)
    .regex(/^b-roll\/provider-v5\/objects\/[a-f0-9]{64}\.mp4$/u),
  sha256: skillSha256Schema,
  byteLength: z.number().int().positive().max(67_108_864),
  providerGenerated: z.boolean(),
  createOnly: z.literal(true),
  checksumReadbackVerified: z.literal(true),
  browserReadable: z.literal(false),
  automaticSelectionAllowed: z.literal(false),
  timelineMutationAllowed: z.literal(false),
}).strict()

const costEvidenceSchema = z.object({
  actualProviderRequestCount: z.literal(0),
  injectedSimulationProviderRequestCount: z.union([z.literal(0), z.literal(1)]),
  providerRequestCount: z.union([z.literal(0), z.literal(1)]),
  generationSubmissionCount: z.union([z.literal(0), z.literal(1)]),
  providerCostMicros: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  infrastructureCostMicros: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  totalInternalCostMicros: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  serviceFeeIncluded: z.literal(false),
  failedOrUnknownAttemptCostRetained: z.boolean(),
  rawInfrastructureUsageEvidenceDigest: skillSha256Schema,
}).strict()

const lifecycleCoreSchema = z.object({
  schemaVersion: z.literal(BROLL_PROVIDER_INJECTED_LIFECYCLE_V5_VERSION),
  attemptId: skillSha256Schema,
  authorizationHash: skillSha256Schema,
  requestPackageHash: skillSha256Schema,
  authorizationRequestHash: skillSha256Schema,
  lifecyclePolicyHash: skillSha256Schema,
  operationId: z.literal('provider.google.generate_b_roll_candidate.v1'),
  providerRouteId: z.literal('gemini_omni_flash'),
  configuredModelAlias: z.literal('gemini-omni-flash-preview'),
  lease: leaseSchema,
  dispatchGrant: dispatchGrantSchema,
  state: z.enum(['succeeded', 'failed', 'unknown_reconciliation_required', 'reconciled_succeeded', 'reconciled_failed']),
  output: privateOutputSchema.nullable(),
  cost: costEvidenceSchema,
  sanitizedFailureCode: identity.nullable(),
  providerOutcomeDigest: skillSha256Schema.nullable(),
  liveProviderCallMade: z.literal(false),
  injectedOutputOnly: z.literal(true),
  alternateProviderFallbackUsed: z.literal(false),
  retryCount: z.literal(0),
  redirectCount: z.literal(0),
  completedAt: timestamp,
}).strict()

export const brollProviderInjectedLifecycleStateV5Schema = lifecycleCoreSchema.extend({
  stateHash: skillSha256Schema,
}).strict().superRefine((state, context) => {
  const { stateHash, ...core } = state
  const succeeded = state.state === 'succeeded' || state.state === 'reconciled_succeeded'
  const unresolved = state.state === 'unknown_reconciliation_required'
  if (
    hashSkillValue(core) !== stateHash ||
    state.cost.providerCostMicros + state.cost.infrastructureCostMicros !==
      state.cost.totalInternalCostMicros ||
    (succeeded !== Boolean(state.output)) ||
    (state.state === 'failed' && !state.sanitizedFailureCode) ||
    (state.state === 'reconciled_failed' && !state.sanitizedFailureCode) ||
    (unresolved && !state.providerOutcomeDigest) ||
    state.cost.providerRequestCount !== state.cost.injectedSimulationProviderRequestCount ||
    (state.cost.providerRequestCount !== state.cost.generationSubmissionCount) ||
    ((state.state === 'failed' || state.state === 'unknown_reconciliation_required' ||
      state.state === 'reconciled_failed') !== state.cost.failedOrUnknownAttemptCostRetained)
  ) context.addIssue({ code: 'custom', message: 'B-roll provider injected lifecycle state is inconsistent.' })
})

export type BrollProviderInjectedLifecycleStateV5 = z.infer<
  typeof brollProviderInjectedLifecycleStateV5Schema
>

const consumerReceiptCoreSchema = z.object({
  schemaVersion: z.literal(BROLL_PROVIDER_CONSUMER_RECEIPT_V5_VERSION),
  attemptId: skillSha256Schema,
  authorizationHash: skillSha256Schema,
  requestPackageHash: skillSha256Schema,
  approvedPlanSnapshotId: identity,
  packageRecordId: identity,
  reservationId: identity,
  approvedWorkItemId: identity,
  expectedOutputId: identity,
  manifestSkillKey: z.literal('b_roll'),
  manifestSkillVersion: identity,
  manifestContractVersion: identity,
  manifestHash: skillSha256Schema,
  assignmentId: identity,
  assignmentHash: skillSha256Schema,
  planHash: skillSha256Schema,
  workGraphHash: skillSha256Schema,
  brollComponentHash: skillSha256Schema,
  output: privateOutputSchema,
  sourceVerified: z.literal(true),
  privateChecksumReadbackVerified: z.literal(true),
  automaticSelectionAllowed: z.literal(false),
  timelineMutationAllowed: z.literal(false),
  productionEligible: z.literal(false),
  providerTransportQualification: z.literal('internal_injected_only'),
  cost: costEvidenceSchema,
  createdAt: timestamp,
}).strict()

export const brollProviderConsumerReceiptV5Schema = consumerReceiptCoreSchema.extend({
  receiptHash: skillSha256Schema,
}).strict().superRefine((receipt, context) => {
  const { receiptHash, ...core } = receipt
  if (hashSkillValue(core) !== receiptHash) {
    context.addIssue({ code: 'custom', message: 'B-roll provider consumer receipt hash is invalid.' })
  }
})

export type BrollProviderConsumerReceiptV5 = z.infer<
  typeof brollProviderConsumerReceiptV5Schema
>

export type BrollProviderInjectedOutcomeV5 =
  | {
      state: 'succeeded'
      outputId: string
      bytes: Buffer | Uint8Array
      infrastructureCostMicros: number
      rawInfrastructureUsageEvidenceDigest: string
    }
  | {
      state: 'failed'
      sanitizedFailureCode: string
      infrastructureCostMicros: number
      rawInfrastructureUsageEvidenceDigest: string
    }
  | {
      state: 'unknown_reconciliation_required'
      providerOutcomeDigest: string
      providerCostMicros: number
      infrastructureCostMicros: number
      rawInfrastructureUsageEvidenceDigest: string
    }

export interface BrollProviderInjectedLifecycleTimesV5 {
  claimedAt: string
  issuedAt: string
  consumedAt: string
  completedAt: string
}

export async function executePrivateInjectedBrollProviderLifecycleV5(input: {
  localStorageRoot: string
  authorization: BrollProviderWorkAuthorizationV5
  requestPackage: BrollProviderRequestPackageV5
  workerIdentity: string
  dispatchSecret: string
  leaseDurationMs: number
  times: BrollProviderInjectedLifecycleTimesV5
  outcome: BrollProviderInjectedOutcomeV5
}): Promise<{
  disposition: 'executed' | 'completed_replay'
  state: BrollProviderInjectedLifecycleStateV5
  consumerReceipt: BrollProviderConsumerReceiptV5 | null
}> {
  const authorization = assertBrollProviderWorkAuthorizationV5({
    value: input.authorization,
    requestPackage: input.requestPackage,
  })
  assertExecutionInput(input, authorization)
  const policy = createBrollProviderLifecyclePolicyV5()
  const authorizationRequestHash = brollProviderAuthorizationRequestHashV5(authorization)
  const attemptId = hashSkillValue({
    domain: 'reeditpro:b-roll-provider-attempt:v5',
    authorizationRequestHash,
  })
  const statePath = statePathFor(attemptId)
  return withPrivateCooperativeFileLockWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: `b-roll/provider-v5/locks/${attemptId}.lock`,
    operation: async () => {
      const existing = await readLifecycleState(input.localStorageRoot, statePath)
      if (existing) {
        assertExistingStateMatches(existing, authorization, input.requestPackage, policy.policyHash)
        return {
          disposition: 'completed_replay',
          state: existing,
          consumerReceipt: await readReceiptIfSucceeded({
            localStorageRoot: input.localStorageRoot,
            authorization,
            requestPackage: input.requestPackage,
            state: existing,
          }),
        }
      }
      const lease = createLease({
        attemptId,
        workerIdentity: input.workerIdentity,
        claimedAt: input.times.claimedAt,
        leaseDurationMs: input.leaseDurationMs,
        authorizationExpiresAt: authorization.expiresAt,
      })
      const dispatchGrant = createConsumedGrant({
        authorization,
        lease,
        dispatchSecret: input.dispatchSecret,
        issuedAt: input.times.issuedAt,
        consumedAt: input.times.consumedAt,
      })
      const output = input.outcome.state === 'succeeded'
        ? await persistInjectedOutput({
            localStorageRoot: input.localStorageRoot,
            authorization,
            requestPackage: input.requestPackage,
            attemptId,
            outputId: input.outcome.outputId,
            bytes: input.outcome.bytes,
            providerGenerated: false,
          })
        : null
      const providerRequestCount = input.outcome.state === 'unknown_reconciliation_required' ? 1 : 0
      const providerCostMicros = input.outcome.state === 'unknown_reconciliation_required'
        ? input.outcome.providerCostMicros
        : 0
      const cost = createCostEvidence({
        authorization,
        providerRequestCount,
        providerCostMicros,
        infrastructureCostMicros: input.outcome.infrastructureCostMicros,
        rawInfrastructureUsageEvidenceDigest: input.outcome.rawInfrastructureUsageEvidenceDigest,
        failedOrUnknownAttemptCostRetained: input.outcome.state !== 'succeeded',
      })
      const core = lifecycleCoreSchema.parse({
        schemaVersion: BROLL_PROVIDER_INJECTED_LIFECYCLE_V5_VERSION,
        attemptId,
        authorizationHash: authorization.authorityHash,
        requestPackageHash: input.requestPackage.requestPackageHash,
        authorizationRequestHash,
        lifecyclePolicyHash: policy.policyHash,
        operationId: authorization.operationId,
        providerRouteId: authorization.providerRouteId,
        configuredModelAlias: authorization.configuredModelAlias,
        lease,
        dispatchGrant,
        state: input.outcome.state,
        output,
        cost,
        sanitizedFailureCode: input.outcome.state === 'failed'
          ? input.outcome.sanitizedFailureCode
          : null,
        providerOutcomeDigest: input.outcome.state === 'unknown_reconciliation_required'
          ? input.outcome.providerOutcomeDigest
          : null,
        liveProviderCallMade: false,
        injectedOutputOnly: true,
        alternateProviderFallbackUsed: false,
        retryCount: 0,
        redirectCount: 0,
        completedAt: input.times.completedAt,
      })
      const state = brollProviderInjectedLifecycleStateV5Schema.parse({
        ...core,
        stateHash: hashSkillValue(core),
      })
      await persistLifecycleState(input.localStorageRoot, statePath, state)
      const consumerReceipt = await readReceiptIfSucceeded({
        localStorageRoot: input.localStorageRoot,
        authorization,
        requestPackage: input.requestPackage,
        state,
      })
      return { disposition: 'executed', state, consumerReceipt }
    },
  })
}

export async function reconcilePrivateInjectedBrollProviderUnknownV5(input: {
  localStorageRoot: string
  authorization: BrollProviderWorkAuthorizationV5
  requestPackage: BrollProviderRequestPackageV5
  reconciledAt: string
  outcome:
    | { state: 'succeeded'; outputId: string; bytes: Buffer | Uint8Array }
    | { state: 'failed'; sanitizedFailureCode: string }
}): Promise<{
  state: BrollProviderInjectedLifecycleStateV5
  consumerReceipt: BrollProviderConsumerReceiptV5 | null
}> {
  const authorization = assertBrollProviderWorkAuthorizationV5({
    value: input.authorization,
    requestPackage: input.requestPackage,
  })
  const policy = createBrollProviderLifecyclePolicyV5()
  const authorizationRequestHash = brollProviderAuthorizationRequestHashV5(authorization)
  const attemptId = hashSkillValue({
    domain: 'reeditpro:b-roll-provider-attempt:v5',
    authorizationRequestHash,
  })
  const statePath = statePathFor(attemptId)
  return withPrivateCooperativeFileLockWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: `b-roll/provider-v5/locks/${attemptId}.lock`,
    operation: async () => {
      const existing = await readLifecycleState(input.localStorageRoot, statePath)
      if (!existing) throw new Error('B-roll provider unknown attempt does not exist.')
      assertExistingStateMatches(existing, authorization, input.requestPackage, policy.policyHash)
      if (existing.state !== 'unknown_reconciliation_required') {
        if (existing.state === 'reconciled_succeeded' || existing.state === 'reconciled_failed') {
          return {
            state: existing,
            consumerReceipt: await readReceiptIfSucceeded({
              localStorageRoot: input.localStorageRoot,
              authorization,
              requestPackage: input.requestPackage,
              state: existing,
            }),
          }
        }
        throw new Error('Only an unresolved B-roll provider outcome may be reconciled.')
      }
      const output = input.outcome.state === 'succeeded'
        ? await persistInjectedOutput({
            localStorageRoot: input.localStorageRoot,
            authorization,
            requestPackage: input.requestPackage,
            attemptId,
            outputId: input.outcome.outputId,
            bytes: input.outcome.bytes,
            providerGenerated: false,
          })
        : null
      const core = lifecycleCoreSchema.parse({
        ...stripStateHash(existing),
        state: input.outcome.state === 'succeeded' ? 'reconciled_succeeded' : 'reconciled_failed',
        output,
        sanitizedFailureCode: input.outcome.state === 'failed'
          ? input.outcome.sanitizedFailureCode
          : null,
        providerOutcomeDigest: existing.providerOutcomeDigest,
        cost: {
          ...existing.cost,
          failedOrUnknownAttemptCostRetained: input.outcome.state === 'failed',
        },
        completedAt: input.reconciledAt,
      })
      const state = brollProviderInjectedLifecycleStateV5Schema.parse({
        ...core,
        stateHash: hashSkillValue(core),
      })
      await persistLifecycleState(input.localStorageRoot, statePath, state)
      return {
        state,
        consumerReceipt: await readReceiptIfSucceeded({
          localStorageRoot: input.localStorageRoot,
          authorization,
          requestPackage: input.requestPackage,
          state,
        }),
      }
    },
  })
}

export async function readBrollProviderConsumerReceiptV5(input: {
  localStorageRoot: string
  authorization: BrollProviderWorkAuthorizationV5
  requestPackage: BrollProviderRequestPackageV5
}): Promise<BrollProviderConsumerReceiptV5> {
  const authorization = assertBrollProviderWorkAuthorizationV5({
    value: input.authorization,
    requestPackage: input.requestPackage,
  })
  const attemptId = hashSkillValue({
    domain: 'reeditpro:b-roll-provider-attempt:v5',
    authorizationRequestHash: brollProviderAuthorizationRequestHashV5(authorization),
  })
  const state = await readLifecycleState(input.localStorageRoot, statePathFor(attemptId))
  if (!state) throw new Error('B-roll provider lifecycle state is missing.')
  const receipt = await readReceiptIfSucceeded({ ...input, authorization, state })
  if (!receipt) throw new Error('B-roll provider output is not consumer-ready.')
  return receipt
}

function assertExecutionInput(
  input: {
    workerIdentity: string
    dispatchSecret: string
    leaseDurationMs: number
    times: BrollProviderInjectedLifecycleTimesV5
    outcome: BrollProviderInjectedOutcomeV5
  },
  authorization: BrollProviderWorkAuthorizationV5,
): void {
  identity.parse(input.workerIdentity)
  if (input.dispatchSecret.length < 32 || input.dispatchSecret.length > 4_096) {
    throw new Error('B-roll provider dispatch secret is invalid.')
  }
  if (!Number.isSafeInteger(input.leaseDurationMs) || input.leaseDurationMs < 1_000 || input.leaseDurationMs > 600_000) {
    throw new Error('B-roll provider lease duration is invalid.')
  }
  const times = Object.values(input.times).map((value) => Date.parse(timestamp.parse(value)))
  if (times.some((value) => !Number.isFinite(value)) ||
    !(times[0]! <= times[1]! && times[1]! <= times[2]! && times[2]! <= times[3]!)) {
    throw new Error('B-roll provider lifecycle timestamps are invalid.')
  }
  if (times[0]! < Date.parse(authorization.authorizedAt) ||
    times[3]! > Date.parse(authorization.expiresAt)) {
    throw new Error('B-roll provider lifecycle is outside authorization time.')
  }
  skillSha256Schema.parse(input.outcome.rawInfrastructureUsageEvidenceDigest)
  if (input.outcome.state === 'unknown_reconciliation_required') {
    skillSha256Schema.parse(input.outcome.providerOutcomeDigest)
  }
}

function createLease(input: {
  attemptId: string
  workerIdentity: string
  claimedAt: string
  leaseDurationMs: number
  authorizationExpiresAt: string
}): z.infer<typeof leaseSchema> {
  const expiresAt = new Date(Date.parse(input.claimedAt) + input.leaseDurationMs).toISOString()
  if (Date.parse(expiresAt) > Date.parse(input.authorizationExpiresAt)) {
    throw new Error('B-roll provider lease exceeds authorization expiry.')
  }
  const core = {
    leaseId: hashSkillValue({ domain: 'reeditpro:b-roll-provider-lease:v5', attemptId: input.attemptId }),
    workerIdentity: input.workerIdentity,
    claimedAt: input.claimedAt,
    expiresAt,
  }
  return leaseSchema.parse({ ...core, leaseHash: hashSkillValue(core) })
}

function createConsumedGrant(input: {
  authorization: BrollProviderWorkAuthorizationV5
  lease: z.infer<typeof leaseSchema>
  dispatchSecret: string
  issuedAt: string
  consumedAt: string
}): z.infer<typeof dispatchGrantSchema> {
  if (Date.parse(input.issuedAt) < Date.parse(input.lease.claimedAt) ||
    Date.parse(input.consumedAt) < Date.parse(input.issuedAt) ||
    Date.parse(input.consumedAt) >= Date.parse(input.lease.expiresAt)) {
    throw new Error('B-roll provider dispatch is outside its lease.')
  }
  const grantId = hashSkillValue({
    domain: 'reeditpro:b-roll-provider-dispatch-grant:v5',
    authorizationHash: input.authorization.authorityHash,
    leaseHash: input.lease.leaseHash,
  })
  const dispatchCredentialHash = sha256Text([
    'reeditpro:b-roll-provider-dispatch-credential:v5',
    grantId,
    input.dispatchSecret,
  ].join(':'))
  const core = {
    grantId,
    leaseId: input.lease.leaseId,
    dispatchCredentialHash,
    issuedAt: input.issuedAt,
    consumedAt: input.consumedAt,
    providerRequestStartedAtConsumption: false as const,
    consumedExactlyOnce: true as const,
  }
  return dispatchGrantSchema.parse({ ...core, grantHash: hashSkillValue(core) })
}

function createCostEvidence(input: {
  authorization: BrollProviderWorkAuthorizationV5
  providerRequestCount: 0 | 1
  providerCostMicros: number
  infrastructureCostMicros: number
  rawInfrastructureUsageEvidenceDigest: string
  failedOrUnknownAttemptCostRetained: boolean
}): z.infer<typeof costEvidenceSchema> {
  for (const value of [input.providerCostMicros, input.infrastructureCostMicros]) {
    if (!Number.isSafeInteger(value) || value < 0) throw new Error('B-roll provider cost is invalid.')
  }
  const totalInternalCostMicros = input.providerCostMicros + input.infrastructureCostMicros
  if (
    input.providerCostMicros > input.authorization.maximumAuthorizedProviderCostMicros ||
    input.infrastructureCostMicros > input.authorization.maximumAuthorizedInfrastructureCostMicros ||
    totalInternalCostMicros > input.authorization.maximumAuthorizedTotalInternalCostMicros
  ) throw new Error('B-roll provider attempt exceeded its internal cost authority.')
  return costEvidenceSchema.parse({
    actualProviderRequestCount: 0,
    injectedSimulationProviderRequestCount: input.providerRequestCount,
    providerRequestCount: input.providerRequestCount,
    generationSubmissionCount: input.providerRequestCount,
    providerCostMicros: input.providerCostMicros,
    infrastructureCostMicros: input.infrastructureCostMicros,
    totalInternalCostMicros,
    serviceFeeIncluded: false,
    failedOrUnknownAttemptCostRetained: input.failedOrUnknownAttemptCostRetained,
    rawInfrastructureUsageEvidenceDigest: input.rawInfrastructureUsageEvidenceDigest,
  })
}

async function persistInjectedOutput(input: {
  localStorageRoot: string
  authorization: BrollProviderWorkAuthorizationV5
  requestPackage: BrollProviderRequestPackageV5
  attemptId: string
  outputId: string
  bytes: Buffer | Uint8Array
  providerGenerated: boolean
}): Promise<z.infer<typeof privateOutputSchema>> {
  identity.parse(input.outputId)
  const bytes = Buffer.isBuffer(input.bytes) ? input.bytes : Buffer.from(input.bytes)
  if (bytes.byteLength < 16 || bytes.byteLength > 67_108_864 || !isMp4(bytes)) {
    throw new Error('B-roll provider output is not an allowed bounded MP4.')
  }
  const sha256 = sha256Bytes(bytes)
  const privateObjectIdentityHash = hashSkillValue({
    domain: 'reeditpro:b-roll-provider-private-output:v5',
    attemptId: input.attemptId,
    outputId: input.outputId,
    expectedOutputId: input.authorization.expectedOutputId,
    requestPackageHash: input.requestPackage.requestPackageHash,
    sha256,
  })
  const privateObjectRelativePath =
    `b-roll/provider-v5/objects/${privateObjectIdentityHash}.mp4`
  await writePrivateFileCreateOnlyWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: privateObjectRelativePath,
    content: bytes,
  })
  const readback = await readPrivateFileIfExistsWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: privateObjectRelativePath,
  })
  if (!readback || !readback.equals(bytes) || sha256Bytes(readback) !== sha256) {
    throw new Error('B-roll provider private output checksum readback failed.')
  }
  return privateOutputSchema.parse({
    outputId: input.outputId,
    role: 'provider_b_roll_candidate_video_mp4',
    artifactType: 'provider_b_roll_candidate_video_mp4',
    contentType: 'video/mp4',
    privateObjectIdentityHash,
    privateObjectRelativePath,
    sha256,
    byteLength: bytes.byteLength,
    providerGenerated: input.providerGenerated,
    createOnly: true,
    checksumReadbackVerified: true,
    browserReadable: false,
    automaticSelectionAllowed: false,
    timelineMutationAllowed: false,
  })
}

async function readReceiptIfSucceeded(input: {
  localStorageRoot: string
  authorization: BrollProviderWorkAuthorizationV5
  requestPackage: BrollProviderRequestPackageV5
  state: BrollProviderInjectedLifecycleStateV5
}): Promise<BrollProviderConsumerReceiptV5 | null> {
  if (!input.state.output) return null
  const output = input.state.output
  const bytes = await readPrivateFileIfExistsWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: output.privateObjectRelativePath,
  })
  if (!bytes || bytes.byteLength !== output.byteLength || sha256Bytes(bytes) !== output.sha256 || !isMp4(bytes)) {
    throw new Error('B-roll provider consumer receipt could not verify private output.')
  }
  const core = consumerReceiptCoreSchema.parse({
    schemaVersion: BROLL_PROVIDER_CONSUMER_RECEIPT_V5_VERSION,
    attemptId: input.state.attemptId,
    authorizationHash: input.authorization.authorityHash,
    requestPackageHash: input.requestPackage.requestPackageHash,
    approvedPlanSnapshotId: input.authorization.approvedPlanSnapshotId,
    packageRecordId: input.authorization.packageRecordId,
    reservationId: input.authorization.reservationId,
    approvedWorkItemId: input.authorization.approvedWorkItemId,
    expectedOutputId: input.authorization.expectedOutputId,
    manifestSkillKey: input.authorization.manifestRef.skillKey,
    manifestSkillVersion: input.authorization.manifestRef.skillVersion,
    manifestContractVersion: input.authorization.manifestRef.contractVersion,
    manifestHash: input.authorization.manifestRef.manifestHash,
    assignmentId: input.authorization.assignmentId,
    assignmentHash: input.authorization.assignmentHash,
    planHash: input.authorization.planHash,
    workGraphHash: input.authorization.workGraphHash,
    brollComponentHash: input.authorization.brollComponentHash,
    output,
    sourceVerified: true,
    privateChecksumReadbackVerified: true,
    automaticSelectionAllowed: false,
    timelineMutationAllowed: false,
    productionEligible: false,
    providerTransportQualification: 'internal_injected_only',
    cost: input.state.cost,
    createdAt: input.state.completedAt,
  })
  const receipt = brollProviderConsumerReceiptV5Schema.parse({
    ...core,
    receiptHash: hashSkillValue(core),
  })
  const receiptPath = `b-roll/provider-v5/receipts/${receipt.receiptHash}.json`
  await writePrivateFileCreateOnlyWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: receiptPath,
    content: Buffer.from(`${JSON.stringify(receipt)}\n`, 'utf8'),
  })
  return receipt
}

function assertExistingStateMatches(
  state: BrollProviderInjectedLifecycleStateV5,
  authorization: BrollProviderWorkAuthorizationV5,
  requestPackage: BrollProviderRequestPackageV5,
  lifecyclePolicyHash: string,
): void {
  if (
    state.authorizationHash !== authorization.authorityHash ||
    state.requestPackageHash !== requestPackage.requestPackageHash ||
    state.authorizationRequestHash !== brollProviderAuthorizationRequestHashV5(authorization) ||
    state.lifecyclePolicyHash !== lifecyclePolicyHash ||
    state.providerRouteId !== authorization.providerRouteId ||
    state.configuredModelAlias !== authorization.configuredModelAlias
  ) throw new Error('B-roll provider lifecycle replay authority was substituted.')
}

async function readLifecycleState(
  localStorageRoot: string,
  relativePath: string,
): Promise<BrollProviderInjectedLifecycleStateV5 | undefined> {
  const text = await readPrivateTextFileIfExistsWithinRoot({ rootPath: localStorageRoot, relativePath })
  return text ? brollProviderInjectedLifecycleStateV5Schema.parse(JSON.parse(text)) : undefined
}

async function persistLifecycleState(
  localStorageRoot: string,
  relativePath: string,
  state: BrollProviderInjectedLifecycleStateV5,
): Promise<void> {
  await writePrivateTextFileAtomicWithinRoot({
    rootPath: localStorageRoot,
    relativePath,
    content: `${JSON.stringify(state)}\n`,
  })
}

function statePathFor(attemptId: string): string {
  return `b-roll/provider-v5/attempts/${attemptId.slice(0, 2)}/${attemptId}.json`
}

function stripStateHash(
  state: BrollProviderInjectedLifecycleStateV5,
): Omit<BrollProviderInjectedLifecycleStateV5, 'stateHash'> {
  const core = { ...state } as Partial<BrollProviderInjectedLifecycleStateV5>
  delete core.stateHash
  return core as Omit<BrollProviderInjectedLifecycleStateV5, 'stateHash'>
}

function isMp4(bytes: Buffer): boolean {
  return bytes.subarray(4, 8).toString('ascii') === 'ftyp'
}

function sha256Bytes(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function sha256Text(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

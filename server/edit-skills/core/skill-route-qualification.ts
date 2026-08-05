import { z } from 'zod'

import type { SkillJobRuntimeBindingDefinition } from './edit-skill-runtime-binding'
import { ACTIVE_QUALIFICATION_RANK, type SkillQualificationStatus } from './edit-skill-ids'
import { hashSkillValue } from './skill-capability-manifest-hash'
import {
  skillIdentitySchema,
  skillManifestReferenceSchema,
  skillSha256Schema,
} from './skill-capability-manifest-schema'
import type { SkillManifestReference } from './skill-capability-manifest-types'
import {
  skillGitCommitShaSchema,
  skillQualificationDependencyAuthorityHashSchema,
} from './skill-qualification-evidence'
import type { SkillQualificationRegistry } from './skill-qualification-registry'

export const skillRuntimeEnvironmentClassSchema = z.enum([
  'internal_fixture',
  'canonical_private',
  'production_server',
])

export const skillRuntimeAdapterClassSchema = z.enum([
  'internal_qualification_adapter',
  'canonical_private_execution_adapter',
  'production_worker_adapter',
])

const qualifiedBindingSchema = z.object({
  jobType: skillIdentitySchema,
  operationId: skillIdentitySchema,
  adapterClass: skillRuntimeAdapterClassSchema,
  bindingHash: skillSha256Schema,
}).strict()

const routeGateEvidenceRefSchema = z.object({
  gateKey: skillIdentitySchema,
  disposition: z.enum(['passed', 'blocked', 'not_applicable']),
  evidenceHash: skillSha256Schema,
}).strict()

const skillRouteQualificationReceiptCoreSchema = z.object({
  schemaVersion: z.literal('edit-skill-route-qualification-receipt-v1'),
  manifestRef: skillManifestReferenceSchema,
  skillQualificationReceiptHash: skillSha256Schema.optional(),
  routeKey: skillIdentitySchema,
  environmentClass: skillRuntimeEnvironmentClassSchema,
  qualificationStatus: z.enum([
    'planning_qualified',
    'internal_execution_qualified',
    'production_qualified',
    'blocked',
  ]),
  qualifiedBindings: z.array(qualifiedBindingSchema).min(1).max(1_000),
  requiredGateKeys: z.array(skillIdentitySchema).min(1).max(100),
  gateEvidenceRefs: z.array(routeGateEvidenceRefSchema).min(1).max(100),
  testedCommitSha: skillGitCommitShaSchema,
  sourceTreeHash: skillSha256Schema,
  dependencyAuthorityHashes: z.array(skillQualificationDependencyAuthorityHashSchema)
    .max(100),
  evidenceClass: z.enum([
    'actual_fixture_adapter_evidence',
    'actual_planning_evidence',
    'actual_canonical_private_evidence',
    'actual_production_evidence',
    'qualification_candidate_execution',
    'blocked_external_evidence',
    'blocked_missing_canonical_private_evidence',
    'blocked_production_evidence',
  ]),
  fixtureEvidenceOnly: z.boolean(),
  qualificationCandidateOnly: z.boolean(),
  providerRequestCount: z.number().int().nonnegative(),
  gpuExecutionCount: z.number().int().nonnegative(),
  productionWorkerObserved: z.boolean(),
}).strict().superRefine((value, context) => {
  const expectedAdapterClass = value.environmentClass === 'internal_fixture'
    ? 'internal_qualification_adapter'
    : value.environmentClass === 'canonical_private'
      ? 'canonical_private_execution_adapter'
      : 'production_worker_adapter'
  if (value.qualifiedBindings.some((binding) =>
    binding.adapterClass !== expectedAdapterClass)) context.addIssue({
    code: 'custom',
    message: 'Route qualification contains a binding for another runtime environment.',
  })
  const bindingKeys = value.qualifiedBindings.map((binding) =>
    `${binding.jobType}:${binding.operationId}:${binding.adapterClass}`)
  if (new Set(bindingKeys).size !== bindingKeys.length) context.addIssue({
    code: 'custom', message: 'Route qualification contains duplicate binding claims.',
  })
  if (
    new Set(value.requiredGateKeys).size !== value.requiredGateKeys.length ||
    new Set(value.gateEvidenceRefs.map((gate) => gate.gateKey)).size !==
      value.gateEvidenceRefs.length ||
    value.requiredGateKeys.some((gateKey) =>
      !value.gateEvidenceRefs.some((gate) => gate.gateKey === gateKey))
  ) context.addIssue({
    code: 'custom', message: 'Route qualification has missing or duplicate gate evidence.',
  })
  const hasBlockedGate = value.gateEvidenceRefs.some((gate) =>
    gate.disposition === 'blocked')
  if ((value.qualificationStatus === 'blocked') !== hasBlockedGate) context.addIssue({
    code: 'custom',
    message: 'Route qualification status does not match its independently recorded gates.',
  })
  if (value.fixtureEvidenceOnly !== (value.environmentClass === 'internal_fixture')) {
    context.addIssue({
      code: 'custom',
      message: 'Fixture evidence may authorize only the internal fixture environment.',
    })
  }
  if (value.qualificationCandidateOnly &&
    value.evidenceClass !== 'qualification_candidate_execution') context.addIssue({
    code: 'custom', message: 'Qualification candidates require an exact candidate evidence class.',
  })
  if (value.environmentClass === 'production_server' && (
    value.qualificationStatus !== 'production_qualified' ||
    !value.productionWorkerObserved ||
    value.fixtureEvidenceOnly ||
    value.qualificationCandidateOnly
  )) context.addIssue({
    code: 'custom', message: 'Production route qualification exceeds actual production evidence.',
  })
  if (!value.fixtureEvidenceOnly && !value.qualificationCandidateOnly &&
    !value.skillQualificationReceiptHash) context.addIssue({
    code: 'custom', message: 'Executable route qualification must bind the current skill receipt.',
  })
})

export const skillRouteQualificationReceiptSchema =
  skillRouteQualificationReceiptCoreSchema.extend({
    receiptHash: skillSha256Schema,
  }).strict().superRefine((value, context) => {
    const { receiptHash, ...core } = value
    if (hashSkillValue(core) !== receiptHash) context.addIssue({
      code: 'custom', message: 'Route qualification receipt hash is stale or forged.',
    })
  })

export type SkillRouteQualificationReceipt = z.infer<
  typeof skillRouteQualificationReceiptSchema
>

export function createSkillRouteQualificationReceipt(
  input: z.input<typeof skillRouteQualificationReceiptCoreSchema>,
): SkillRouteQualificationReceipt {
  const core = skillRouteQualificationReceiptCoreSchema.parse(input)
  return skillRouteQualificationReceiptSchema.parse({
    ...core,
    receiptHash: hashSkillValue(core),
  })
}

function routeKey(input: {
  manifestRef: SkillManifestReference
  routeKey: string
  environmentClass: z.infer<typeof skillRuntimeEnvironmentClassSchema>
}): string {
  return `${input.manifestRef.skillKey}@${input.manifestRef.skillVersion}:` +
    `${input.manifestRef.contractVersion}:${input.manifestRef.manifestHash}:` +
    `${input.routeKey}:${input.environmentClass}`
}

export class SkillRouteQualificationRegistry {
  readonly #skillQualifications: SkillQualificationRegistry
  readonly #qualificationIssuanceMode: boolean
  readonly #receipts = new Map<string, SkillRouteQualificationReceipt>()

  constructor(input: {
    skillQualifications: SkillQualificationRegistry
    qualificationIssuanceMode?: boolean
  }) {
    this.#skillQualifications = input.skillQualifications
    this.#qualificationIssuanceMode = input.qualificationIssuanceMode ?? false
  }

  register(input: {
    receipt: SkillRouteQualificationReceipt
    bindings: readonly SkillJobRuntimeBindingDefinition[]
  }): void {
    const receipt = skillRouteQualificationReceiptSchema.parse(input.receipt)
    if (receipt.qualificationCandidateOnly && !this.#qualificationIssuanceMode) {
      throw new Error('Qualification-candidate route authority is disabled outside receipt issuance.')
    }
    if (receipt.skillQualificationReceiptHash) {
      const skillReceipt = this.#skillQualifications.resolve(receipt.manifestRef)
      if (skillReceipt.receiptHash !== receipt.skillQualificationReceiptHash) {
        throw new Error('Route qualification binds a stale skill qualification receipt.')
      }
    }
    const currentBindings = new Map(input.bindings.map((binding) => [
      `${binding.jobType}:${binding.operationId}:${binding.adapterClass}`,
      binding,
    ]))
    const exactRouteBindings = input.bindings.filter((binding) =>
      binding.skillKey === receipt.manifestRef.skillKey &&
      binding.skillVersion === receipt.manifestRef.skillVersion &&
      binding.contractVersion === receipt.manifestRef.contractVersion &&
      binding.manifestHash === receipt.manifestRef.manifestHash &&
      binding.routeKey === receipt.routeKey &&
      binding.environmentClass === receipt.environmentClass)
    if (
      exactRouteBindings.length !== receipt.qualifiedBindings.length ||
      new Set(exactRouteBindings.map((binding) => binding.bindingHash)).size !==
        exactRouteBindings.length ||
      exactRouteBindings.some((binding) =>
        !receipt.qualifiedBindings.some((qualified) =>
          qualified.bindingHash === binding.bindingHash))
    ) throw new Error('Route qualification does not cover the exact current binding set.')
    for (const qualified of receipt.qualifiedBindings) {
      const current = currentBindings.get(
        `${qualified.jobType}:${qualified.operationId}:${qualified.adapterClass}`,
      )
      if (
        !current ||
        current.manifestHash !== receipt.manifestRef.manifestHash ||
        current.skillKey !== receipt.manifestRef.skillKey ||
        current.skillVersion !== receipt.manifestRef.skillVersion ||
        current.contractVersion !== receipt.manifestRef.contractVersion ||
        current.environmentClass !== receipt.environmentClass ||
        current.routeKey !== receipt.routeKey ||
        current.bindingHash !== qualified.bindingHash
      ) throw new Error('Route qualification references a stale job, operation, adapter, or binding.')
    }
    const key = routeKey(receipt)
    const existing = this.#receipts.get(key)
    if (existing && existing.receiptHash !== receipt.receiptHash) {
      throw new Error(`Duplicate route/environment qualification claim for ${key}.`)
    }
    this.#receipts.set(key, receipt)
  }

  resolve(input: {
    binding: SkillJobRuntimeBindingDefinition
    expectedQualification?: SkillQualificationStatus
  }): SkillRouteQualificationReceipt {
    const receipt = this.#receipts.get(routeKey({
      manifestRef: {
        schemaVersion: 'edit-skill-manifest-reference-v1',
        skillKey: input.binding.skillKey,
        skillVersion: input.binding.skillVersion,
        contractVersion: input.binding.contractVersion,
        manifestHash: input.binding.manifestHash,
      },
      routeKey: input.binding.routeKey,
      environmentClass: input.binding.environmentClass,
    }))
    if (!receipt) throw new Error('Runtime route qualification receipt is missing.')
    if (receipt.qualificationCandidateOnly && !this.#qualificationIssuanceMode) {
      throw new Error('Qualification-candidate route authority cannot authorize runtime execution.')
    }
    if (receipt.skillQualificationReceiptHash) {
      const skillReceipt = this.#skillQualifications.resolve(receipt.manifestRef)
      if (skillReceipt.receiptHash !== receipt.skillQualificationReceiptHash) {
        throw new Error('Runtime route qualification receipt became stale.')
      }
    }
    const qualified = receipt.qualifiedBindings.find((binding) =>
      binding.jobType === input.binding.jobType &&
      binding.operationId === input.binding.operationId &&
      binding.adapterClass === input.binding.adapterClass &&
      binding.bindingHash === input.binding.bindingHash)
    if (!qualified) throw new Error('Runtime operation is absent from the qualified route.')
    if (receipt.qualificationStatus === 'blocked') {
      throw new Error('Runtime route is blocked by independently verified qualification gates.')
    }
    const actualRank = ACTIVE_QUALIFICATION_RANK[receipt.qualificationStatus]
    const requiredRank = ACTIVE_QUALIFICATION_RANK[input.binding.requiredQualification]
    if (actualRank === undefined || requiredRank === undefined || actualRank < requiredRank) {
      throw new Error('Runtime route is under-qualified for the exact binding.')
    }
    if (input.expectedQualification &&
      input.expectedQualification !== receipt.qualificationStatus) {
      throw new Error('Caller qualification expectation differs from independently resolved authority.')
    }
    return receipt
  }

  resolveReceipt(input: {
    manifestRef: SkillManifestReference
    routeKey: string
    environmentClass: z.infer<typeof skillRuntimeEnvironmentClassSchema>
  }): SkillRouteQualificationReceipt {
    const receipt = this.#receipts.get(routeKey(input))
    if (!receipt) throw new Error('Route qualification receipt is missing.')
    if (receipt.qualificationCandidateOnly && !this.#qualificationIssuanceMode) {
      throw new Error('Qualification-candidate route authority cannot authorize support output.')
    }
    if (receipt.skillQualificationReceiptHash) {
      const skillReceipt = this.#skillQualifications.resolve(receipt.manifestRef)
      if (skillReceipt.receiptHash !== receipt.skillQualificationReceiptHash) {
        throw new Error('Support route qualification receipt became stale.')
      }
    }
    return receipt
  }

  list(): readonly SkillRouteQualificationReceipt[] {
    return [...this.#receipts.values()]
  }
}

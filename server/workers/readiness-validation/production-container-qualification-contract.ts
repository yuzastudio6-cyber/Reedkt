import { createHash } from 'node:crypto'

import { z } from 'zod'

import {
  isProductionToolId,
  type ProductionToolId,
} from '../../tool-registry'
import { productionToolReadinessSpecs } from '../production-readiness'
import type { ProductionContainerImageRole } from '../production-readiness'
import { getContainerImageReadinessManifestEntry } from './container-image-readiness-manifest'
import { PRODUCTION_CONTAINER_QUALIFICATION_RECEIPT_VERSION } from './readiness-validation-types'

export const PRODUCTION_CONTAINER_QUALIFICATION_CANDIDATE_VERSION =
  'production-container-qualification-candidate-v1' as const
export const PRODUCTION_CONTAINER_QUALIFICATION_CONTRACT_VERIFICATION_VERSION =
  'production-container-qualification-contract-verification-v1' as const

const sha1 = z.string().regex(/^[a-f0-9]{40}$/u)
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const imageDigest = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const safeIdentity = z.string().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:@/+-]*$/u)
  .refine((value) => !value.includes('..'))
const imageRoleSchema = z.enum([
  'api',
  'cpu_worker',
  'gpu_worker',
  'render_worker',
  'qa_worker',
  'tool_readiness_worker',
])
const toolIdSchema = z.string().refine(isProductionToolId)

export type ProductionContainerQualificationProbeExecutionKind =
  | 'command_version_or_capability'
  | 'python_import'
  | 'node_package_metadata'
  | 'registry_policy_only'

export interface ProductionContainerQualificationProbeDefinition {
  checkId: string
  toolId: ProductionToolId
  executionKind: ProductionContainerQualificationProbeExecutionKind
  expectation: 'present' | 'absent'
  requiredForImageQualification: boolean
  command?: string
  args?: string[]
  expectedPatternSource?: string
  expectedPatternFlags?: string
  pythonPackageName?: string
  pythonImportName?: string
  nodePackageName?: string
  nodePackageJsonPath?: string
}

export interface ProductionContainerQualificationProbePlan {
  schemaVersion: 'production-container-qualification-probe-plan-v1'
  imageRole: ProductionContainerImageRole
  imageName: string
  manifestHash: string
  definitionHash: string
  requiredToolIds: ProductionToolId[]
  optionalToolIds: ProductionToolId[]
  forbiddenToolIds: ProductionToolId[]
  checks: ProductionContainerQualificationProbeDefinition[]
}

const probeCheckResultSchema = z.object({
  checkId: safeIdentity,
  toolId: toolIdSchema,
  executionKind: z.enum([
    'command_version_or_capability',
    'python_import',
    'node_package_metadata',
    'registry_policy_only',
  ]),
  expectation: z.enum(['present', 'absent']),
  requiredForImageQualification: z.boolean(),
  status: z.enum(['passed', 'failed', 'not_checked']),
  observedEvidenceHash: sha256,
  checkedAt: timestamp,
}).strict()

export type ProductionContainerQualificationProbeCheckResult = z.infer<
  typeof probeCheckResultSchema
>

export const productionContainerQualificationCandidateSchema = z.object({
  schemaVersion: z.literal(PRODUCTION_CONTAINER_QUALIFICATION_CANDIDATE_VERSION),
  targetReceiptVersion: z.literal(PRODUCTION_CONTAINER_QUALIFICATION_RECEIPT_VERSION),
  evidenceClass: z.literal('container_runtime_self_attested_candidate_unreleased'),
  sourceIdentityAuthority: z.literal('human_runner_supplied_not_independently_verified'),
  sourceCommitSha: sha1,
  sourceTreeHash: sha1,
  imageRole: imageRoleSchema,
  imageName: safeIdentity,
  imageReference: z.string().min(73).max(1_024)
    .regex(/^[^\s@]+@sha256:[a-f0-9]{64}$/u),
  immutableImageDigest: imageDigest,
  manifestHash: sha256,
  probeDefinitionHash: sha256,
  requiredToolIds: z.array(toolIdSchema).max(72),
  optionalToolIds: z.array(toolIdSchema).max(72),
  forbiddenToolIds: z.array(toolIdSchema).max(72),
  checks: z.array(probeCheckResultSchema).min(1).max(512),
  checksHash: sha256,
  runtimeCheckCoverageComplete: z.boolean(),
  requiredRuntimeChecksPassed: z.boolean(),
  forbiddenToolAbsenceVerified: z.boolean(),
  manualLicenseAndModelGatesVerified: z.literal(false),
  candidateReadyForIndependentVerification: z.boolean(),
  safety: z.object({
    explicitHumanConfirmation: z.literal(true),
    containerRuntimeMode: z.literal(true),
    networkMode: z.literal('none'),
    readOnlyRootFilesystem: z.literal(true),
    capabilitiesDropped: z.literal(true),
    noNewPrivileges: z.literal(true),
    nonRootUser: z.literal(true),
    userMediaMounted: z.literal(false),
    mediaProcessed: z.literal(false),
    modelWeightsLoaded: z.literal(false),
    modelDownloadPerformed: z.literal(false),
    inferencePerformed: z.literal(false),
    providerCallPerformed: z.literal(false),
    secretPayloadRead: z.literal(false),
    cloudMutationPerformed: z.literal(false),
    deploymentPerformed: z.literal(false),
    publicDeliveryPerformed: z.literal(false),
  }).strict(),
  costBoundary: z.object({
    evidenceState: z.literal('readiness_probe_infrastructure_cost_not_metered_non_promotable'),
    providerCostIncluded: z.literal(false),
    customerPriceIncluded: z.literal(false),
    customerCreditsIncluded: z.literal(false),
    serviceFeeIncluded: z.literal(false),
    walletOrBillingMutationPerformed: z.literal(false),
  }).strict(),
  startedAt: timestamp,
  completedAt: timestamp,
  productionImageQualified: z.literal(false),
  externalBetaReady: z.literal(false),
  productionReady: z.literal(false),
  receiptHash: sha256,
}).strict().superRefine((candidate, context) => {
  if (Date.parse(candidate.completedAt) < Date.parse(candidate.startedAt)) {
    context.addIssue({ code: 'custom', message: 'Container qualification timestamps are invalid.' })
  }
  for (const [label, values] of [
    ['requiredToolIds', candidate.requiredToolIds],
    ['optionalToolIds', candidate.optionalToolIds],
    ['forbiddenToolIds', candidate.forbiddenToolIds],
    ['checkIds', candidate.checks.map((check) => check.checkId)],
  ] as const) {
    if (new Set(values).size !== values.length) {
      context.addIssue({ code: 'custom', message: `${label} contains duplicates.` })
    }
  }
  const digest = candidate.imageReference.slice(candidate.imageReference.lastIndexOf('@') + 1)
  if (digest !== candidate.immutableImageDigest) {
    context.addIssue({ code: 'custom', message: 'Image reference and immutable digest differ.' })
  }
})

export type ProductionContainerQualificationCandidate = z.infer<
  typeof productionContainerQualificationCandidateSchema
>

export interface ProductionContainerQualificationObservation {
  present: boolean
  evidenceHash: string
}

export interface ProductionContainerQualificationProbeAdapter {
  inspectCommand(input: {
    command: string
    args: string[]
    expectedPattern?: RegExp
    presenceOnly: boolean
  }): ProductionContainerQualificationObservation
  inspectPythonImport(input: {
    packageName: string
    importName: string
  }): ProductionContainerQualificationObservation
  inspectNodePackage(input: {
    packageName: string
    packageJsonPath: string
  }): ProductionContainerQualificationObservation
}

export interface ProductionContainerQualificationContractVerification {
  schemaVersion: typeof PRODUCTION_CONTAINER_QUALIFICATION_CONTRACT_VERIFICATION_VERSION
  evidenceClass: 'source_verified_contract_fixture_unreleased'
  candidateReceiptHash: string
  candidateIntegrityVerified: true
  expectedSourceCommitMatched: boolean
  expectedSourceTreeMatched: boolean
  expectedImageRoleMatched: boolean
  expectedImmutableImageDigestMatched: boolean
  runtimeChecksPassed: boolean
  forbiddenAbsencePassed: boolean
  manualLicenseAndModelGatesVerified: false
  productionImageQualified: false
  externalBetaReady: false
  productionReady: false
  verificationHash: string
}

export function buildProductionContainerQualificationProbePlan(
  imageRole: ProductionContainerImageRole,
): ProductionContainerQualificationProbePlan {
  const manifest = requireManifest(imageRole)
  const checks = [
    ...manifest.expectedToolIds.flatMap((toolId) => buildToolProbeDefinitions({
      toolId,
      expectation: 'present',
      required: manifest.requiredToolIds.includes(toolId),
    })),
    ...manifest.forbiddenToolIds.flatMap((toolId) => buildToolProbeDefinitions({
      toolId,
      expectation: 'absent',
      required: true,
    })),
  ].sort((left, right) => left.checkId.localeCompare(right.checkId))
  const manifestPayload = manifestQualificationPayload(manifest)
  const manifestHash = hashProductionContainerQualificationValue(manifestPayload)
  const planPayload = {
    schemaVersion: 'production-container-qualification-probe-plan-v1' as const,
    imageRole,
    imageName: manifest.imageName,
    manifestHash,
    requiredToolIds: [...manifest.requiredToolIds].sort(),
    optionalToolIds: [...manifest.optionalToolIds].sort(),
    forbiddenToolIds: [...manifest.forbiddenToolIds].sort(),
    checks,
  }
  return deepFreeze({
    ...planPayload,
    definitionHash: hashProductionContainerQualificationValue(planPayload),
  })
}

export function runProductionContainerQualificationProbeWithAdapter(input: {
  imageRole: ProductionContainerImageRole
  imageReference: string
  sourceCommitSha: string
  sourceTreeHash: string
  adapter: ProductionContainerQualificationProbeAdapter
  now?: () => Date
}): ProductionContainerQualificationCandidate {
  const plan = buildProductionContainerQualificationProbePlan(input.imageRole)
  const now = input.now ?? (() => new Date())
  const startedAt = validNow(now).toISOString()
  const checks = plan.checks.map((definition) => executeProbeDefinition(
    definition,
    input.adapter,
    validNow(now).toISOString(),
  ))
  const completedAt = validNow(now).toISOString()
  return buildProductionContainerQualificationCandidate({
    plan,
    imageReference: input.imageReference,
    sourceCommitSha: input.sourceCommitSha,
    sourceTreeHash: input.sourceTreeHash,
    checks,
    startedAt,
    completedAt,
  })
}

export function assertProductionContainerQualificationCandidateIntegrity(
  rawCandidate: unknown,
): ProductionContainerQualificationCandidate {
  const candidate = productionContainerQualificationCandidateSchema.parse(rawCandidate)
  const plan = buildProductionContainerQualificationProbePlan(candidate.imageRole)
  if (
    candidate.imageName !== plan.imageName ||
    candidate.manifestHash !== plan.manifestHash ||
    candidate.probeDefinitionHash !== plan.definitionHash ||
    !sameValues(candidate.requiredToolIds, plan.requiredToolIds) ||
    !sameValues(candidate.optionalToolIds, plan.optionalToolIds) ||
    !sameValues(candidate.forbiddenToolIds, plan.forbiddenToolIds)
  ) throw new Error('Container qualification candidate does not match the source-owned image manifest.')

  const resultByCheckId = new Map(candidate.checks.map((check) => [check.checkId, check]))
  if (
    resultByCheckId.size !== plan.checks.length ||
    plan.checks.some((definition) => {
      const result = resultByCheckId.get(definition.checkId)
      return !result ||
        result.toolId !== definition.toolId ||
        result.executionKind !== definition.executionKind ||
        result.expectation !== definition.expectation ||
        result.requiredForImageQualification !== definition.requiredForImageQualification
    })
  ) throw new Error('Container qualification check results do not match the source-owned probe plan.')

  if (candidate.checksHash !== hashProductionContainerQualificationValue(candidate.checks)) {
    throw new Error('Container qualification checks hash is invalid.')
  }
  const expectedCoverage = evaluateProbeCoverage(plan, candidate.checks)
  for (const key of [
    'runtimeCheckCoverageComplete',
    'requiredRuntimeChecksPassed',
    'forbiddenToolAbsenceVerified',
    'candidateReadyForIndependentVerification',
  ] as const) {
    if (candidate[key] !== expectedCoverage[key]) {
      throw new Error(`Container qualification ${key} is invalid.`)
    }
  }
  const { receiptHash: _receiptHash, ...receiptPayload } = candidate
  void _receiptHash
  if (candidate.receiptHash !== hashProductionContainerQualificationValue(receiptPayload)) {
    throw new Error('Container qualification receipt hash is invalid.')
  }
  return deepFreeze(candidate)
}

export function verifyProductionContainerQualificationContractFixture(input: {
  candidate: unknown
  expectedSourceCommitSha: string
  expectedSourceTreeHash: string
  expectedImageRole: ProductionContainerImageRole
  expectedImmutableImageDigest: string
}): ProductionContainerQualificationContractVerification {
  const candidate = assertProductionContainerQualificationCandidateIntegrity(input.candidate)
  const payload = {
    schemaVersion: PRODUCTION_CONTAINER_QUALIFICATION_CONTRACT_VERIFICATION_VERSION,
    evidenceClass: 'source_verified_contract_fixture_unreleased' as const,
    candidateReceiptHash: candidate.receiptHash,
    candidateIntegrityVerified: true as const,
    expectedSourceCommitMatched: sha1.parse(input.expectedSourceCommitSha) === candidate.sourceCommitSha,
    expectedSourceTreeMatched: sha1.parse(input.expectedSourceTreeHash) === candidate.sourceTreeHash,
    expectedImageRoleMatched: imageRoleSchema.parse(input.expectedImageRole) === candidate.imageRole,
    expectedImmutableImageDigestMatched:
      imageDigest.parse(input.expectedImmutableImageDigest) === candidate.immutableImageDigest,
    runtimeChecksPassed: candidate.requiredRuntimeChecksPassed,
    forbiddenAbsencePassed: candidate.forbiddenToolAbsenceVerified,
    manualLicenseAndModelGatesVerified: false as const,
    productionImageQualified: false as const,
    externalBetaReady: false as const,
    productionReady: false as const,
  }
  return deepFreeze({
    ...payload,
    verificationHash: hashProductionContainerQualificationValue(payload),
  })
}

export function hashProductionContainerQualificationValue(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(stableJsonValue(value))).digest('hex')
}

function buildProductionContainerQualificationCandidate(input: {
  plan: ProductionContainerQualificationProbePlan
  imageReference: string
  sourceCommitSha: string
  sourceTreeHash: string
  checks: ProductionContainerQualificationProbeCheckResult[]
  startedAt: string
  completedAt: string
}): ProductionContainerQualificationCandidate {
  const parsedReference = z.string().regex(/^[^\s@]+@sha256:[a-f0-9]{64}$/u)
    .parse(input.imageReference)
  const imageName = parsedReference.slice(0, parsedReference.lastIndexOf('@'))
    .split('/').at(-1)
  if (imageName !== input.plan.imageName) {
    throw new Error('Immutable image reference does not match the source-owned image role.')
  }
  const checks = input.checks.slice().sort((left, right) => left.checkId.localeCompare(right.checkId))
  const coverage = evaluateProbeCoverage(input.plan, checks)
  const payload = {
    schemaVersion: PRODUCTION_CONTAINER_QUALIFICATION_CANDIDATE_VERSION,
    targetReceiptVersion: PRODUCTION_CONTAINER_QUALIFICATION_RECEIPT_VERSION,
    evidenceClass: 'container_runtime_self_attested_candidate_unreleased' as const,
    sourceIdentityAuthority: 'human_runner_supplied_not_independently_verified' as const,
    sourceCommitSha: sha1.parse(input.sourceCommitSha),
    sourceTreeHash: sha1.parse(input.sourceTreeHash),
    imageRole: input.plan.imageRole,
    imageName: input.plan.imageName,
    imageReference: parsedReference,
    immutableImageDigest: imageDigest.parse(parsedReference.slice(parsedReference.lastIndexOf('@') + 1)),
    manifestHash: input.plan.manifestHash,
    probeDefinitionHash: input.plan.definitionHash,
    requiredToolIds: [...input.plan.requiredToolIds],
    optionalToolIds: [...input.plan.optionalToolIds],
    forbiddenToolIds: [...input.plan.forbiddenToolIds],
    checks,
    checksHash: hashProductionContainerQualificationValue(checks),
    ...coverage,
    manualLicenseAndModelGatesVerified: false as const,
    safety: {
      explicitHumanConfirmation: true as const,
      containerRuntimeMode: true as const,
      networkMode: 'none' as const,
      readOnlyRootFilesystem: true as const,
      capabilitiesDropped: true as const,
      noNewPrivileges: true as const,
      nonRootUser: true as const,
      userMediaMounted: false as const,
      mediaProcessed: false as const,
      modelWeightsLoaded: false as const,
      modelDownloadPerformed: false as const,
      inferencePerformed: false as const,
      providerCallPerformed: false as const,
      secretPayloadRead: false as const,
      cloudMutationPerformed: false as const,
      deploymentPerformed: false as const,
      publicDeliveryPerformed: false as const,
    },
    costBoundary: {
      evidenceState: 'readiness_probe_infrastructure_cost_not_metered_non_promotable' as const,
      providerCostIncluded: false as const,
      customerPriceIncluded: false as const,
      customerCreditsIncluded: false as const,
      serviceFeeIncluded: false as const,
      walletOrBillingMutationPerformed: false as const,
    },
    startedAt: timestamp.parse(input.startedAt),
    completedAt: timestamp.parse(input.completedAt),
    productionImageQualified: false as const,
    externalBetaReady: false as const,
    productionReady: false as const,
  }
  return assertProductionContainerQualificationCandidateIntegrity({
    ...payload,
    receiptHash: hashProductionContainerQualificationValue(payload),
  })
}

function buildToolProbeDefinitions(input: {
  toolId: ProductionToolId
  expectation: 'present' | 'absent'
  required: boolean
}): ProductionContainerQualificationProbeDefinition[] {
  const spec = productionToolReadinessSpecs.find((candidate) => candidate.toolId === input.toolId)
  if (!spec) throw new Error(`Missing production readiness spec for ${input.toolId}.`)
  const suffix = input.expectation === 'present' ? 'present' : 'absent'
  const definitions: ProductionContainerQualificationProbeDefinition[] = [
    ...spec.commandChecks.map((check, index) => ({
      checkId: `${input.toolId}_command_${index}_${suffix}`,
      toolId: input.toolId,
      executionKind: 'command_version_or_capability' as const,
      expectation: input.expectation,
      requiredForImageQualification: input.required,
      command: check.command,
      args: [...check.versionArgs],
      expectedPatternSource: check.expectedPattern,
      expectedPatternFlags: 'i',
    })),
    ...spec.pythonImportChecks.map((check, index) => ({
      checkId: `${input.toolId}_python_${index}_${suffix}`,
      toolId: input.toolId,
      executionKind: 'python_import' as const,
      expectation: input.expectation,
      requiredForImageQualification: input.required,
      pythonPackageName: check.packageName,
      pythonImportName: check.importName,
    })),
    ...spec.nodePackageChecks.map((check, index) => ({
      checkId: `${input.toolId}_node_${index}_${suffix}`,
      toolId: input.toolId,
      executionKind: 'node_package_metadata' as const,
      expectation: input.expectation,
      requiredForImageQualification: input.required,
      nodePackageName: check.packageName,
      nodePackageJsonPath: `${check.importName}/package.json`,
    })),
  ]
  return definitions.length > 0 ? definitions : [{
    checkId: `${input.toolId}_registry_only_${suffix}`,
    toolId: input.toolId,
    executionKind: 'registry_policy_only',
    expectation: input.expectation,
    requiredForImageQualification: input.required,
  }]
}

function executeProbeDefinition(
  definition: ProductionContainerQualificationProbeDefinition,
  adapter: ProductionContainerQualificationProbeAdapter,
  checkedAt: string,
): ProductionContainerQualificationProbeCheckResult {
  if (definition.executionKind === 'registry_policy_only') {
    return probeResult(definition, 'not_checked', hashProductionContainerQualificationValue({
      checkId: definition.checkId,
      status: 'not_checked',
      reason: 'no_safe_runtime_probe_defined',
    }), checkedAt)
  }
  let observation: ProductionContainerQualificationObservation
  try {
    if (definition.executionKind === 'command_version_or_capability') {
      observation = adapter.inspectCommand({
        command: definition.command!,
        args: definition.args ?? [],
        expectedPattern: definition.expectation === 'present' && definition.expectedPatternSource
          ? new RegExp(definition.expectedPatternSource, definition.expectedPatternFlags)
          : undefined,
        presenceOnly: definition.expectation === 'absent',
      })
    } else if (definition.executionKind === 'python_import') {
      observation = adapter.inspectPythonImport({
        packageName: definition.pythonPackageName!,
        importName: definition.pythonImportName!,
      })
    } else {
      observation = adapter.inspectNodePackage({
        packageName: definition.nodePackageName!,
        packageJsonPath: definition.nodePackageJsonPath!,
      })
    }
  } catch {
    observation = {
      present: false,
      evidenceHash: hashProductionContainerQualificationValue({
        checkId: definition.checkId,
        sanitizedFailure: true,
      }),
    }
  }
  const passed = definition.expectation === 'present'
    ? observation.present
    : !observation.present
  return probeResult(definition, passed ? 'passed' : 'failed', sha256.parse(
    observation.evidenceHash,
  ), checkedAt)
}

function probeResult(
  definition: ProductionContainerQualificationProbeDefinition,
  status: ProductionContainerQualificationProbeCheckResult['status'],
  observedEvidenceHash: string,
  checkedAt: string,
): ProductionContainerQualificationProbeCheckResult {
  return probeCheckResultSchema.parse({
    checkId: definition.checkId,
    toolId: definition.toolId,
    executionKind: definition.executionKind,
    expectation: definition.expectation,
    requiredForImageQualification: definition.requiredForImageQualification,
    status,
    observedEvidenceHash,
    checkedAt,
  })
}

function evaluateProbeCoverage(
  plan: ProductionContainerQualificationProbePlan,
  checks: ProductionContainerQualificationProbeCheckResult[],
) {
  const checksForTool = (toolId: ProductionToolId, expectation: 'present' | 'absent') =>
    checks.filter((check) => check.toolId === toolId && check.expectation === expectation)
  const requiredCoverage = plan.requiredToolIds.every((toolId) => {
    const toolChecks = checksForTool(toolId, 'present')
    return toolChecks.length > 0 && toolChecks.every((check) =>
      check.executionKind !== 'registry_policy_only' && check.status !== 'not_checked')
  })
  const requiredPassed = requiredCoverage && plan.requiredToolIds.every((toolId) =>
    checksForTool(toolId, 'present').every((check) => check.status === 'passed'))
  const forbiddenCoverage = plan.forbiddenToolIds.every((toolId) => {
    const toolChecks = checksForTool(toolId, 'absent')
    return toolChecks.length > 0 && toolChecks.every((check) =>
      check.executionKind !== 'registry_policy_only' && check.status !== 'not_checked')
  })
  const forbiddenPassed = forbiddenCoverage && plan.forbiddenToolIds.every((toolId) =>
    checksForTool(toolId, 'absent').every((check) => check.status === 'passed'))
  return {
    runtimeCheckCoverageComplete: requiredCoverage && forbiddenCoverage,
    requiredRuntimeChecksPassed: requiredPassed,
    forbiddenToolAbsenceVerified: forbiddenPassed,
    candidateReadyForIndependentVerification: requiredPassed && forbiddenPassed,
  }
}

function manifestQualificationPayload(manifest: ReturnType<typeof requireManifest>) {
  return {
    imageRole: manifest.imageRole,
    imageName: manifest.imageName,
    dockerfilePath: manifest.dockerfilePath,
    workerType: manifest.workerType,
    expectedToolIds: [...manifest.expectedToolIds].sort(),
    requiredToolIds: [...manifest.requiredToolIds].sort(),
    optionalToolIds: [...manifest.optionalToolIds].sort(),
    forbiddenToolIds: [...manifest.forbiddenToolIds].sort(),
    modelWeightToolIds: [...manifest.modelWeightToolIds].sort(),
  }
}

function requireManifest(imageRole: ProductionContainerImageRole) {
  const manifest = getContainerImageReadinessManifestEntry(imageRole)
  if (!manifest) throw new Error(`Missing container readiness manifest for ${imageRole}.`)
  return manifest
}

function sameValues(left: string[], right: string[]): boolean {
  return left.length === right.length &&
    left.every((value, index) => value === right[index])
}

function validNow(now: () => Date): Date {
  const value = now()
  if (!Number.isFinite(value.getTime())) throw new Error('Container qualification clock is invalid.')
  return value
}

function stableJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableJsonValue)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, nested]) => nested !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, stableJsonValue(nested)]),
    )
  }
  return value
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const nested of Object.values(value as Record<string, unknown>)) deepFreeze(nested)
  }
  return value
}

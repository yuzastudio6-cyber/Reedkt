import { createHash } from 'node:crypto'

import { z } from 'zod'

import {
  evaluateToolLicensePolicy,
  getProductionToolProfile,
  isProductionToolId,
  type ProductionToolId,
} from '../../tool-registry'
import {
  assertProductionContainerQualificationCandidateIntegrity,
  hashProductionContainerQualificationValue,
  PRODUCTION_CONTAINER_QUALIFICATION_CANDIDATE_VERSION,
  type ProductionContainerQualificationCandidate,
} from './production-container-qualification-contract'
import { PRODUCTION_CONTAINER_QUALIFICATION_RECEIPT_VERSION } from './readiness-validation-types'

export const PRODUCTION_CONTAINER_QUALIFICATION_HOST_VERIFICATION_VERSION =
  'production-container-qualification-host-verification-v1' as const

export const PRODUCTION_CONTAINER_SOURCE_COMMIT_LABEL =
  'org.opencontainers.image.revision' as const
export const PRODUCTION_CONTAINER_SOURCE_TREE_LABEL =
  'io.reeditpro.source.tree' as const
export const PRODUCTION_CONTAINER_IMAGE_ROLE_LABEL =
  'io.reeditpro.image.role' as const
export const PRODUCTION_CONTAINER_SOURCE_CLEAN_LABEL =
  'io.reeditpro.build.source.clean' as const
export const PRODUCTION_CONTAINER_CANDIDATE_VERSION_LABEL =
  'io.reeditpro.container.qualification.candidate.version' as const

const sha1 = z.string().regex(/^[a-f0-9]{40}$/u)
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const imageDigest = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const immutableImageReference = z.string().min(73).max(1_024)
  .regex(/^[^\s@]+@sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const imageRoleSchema = z.enum([
  'api',
  'cpu_worker',
  'gpu_worker',
  'render_worker',
  'qa_worker',
  'tool_readiness_worker',
])
const toolIdSchema = z.string().refine(isProductionToolId)

const sourceObservationSchema = z.object({
  schemaVersion: z.literal('production-container-host-source-observation-v1'),
  evidenceClass: z.literal('bounded_local_git_source_observation'),
  sourceCommitSha: sha1,
  sourceTreeHash: sha1,
  worktreeClean: z.boolean(),
  statusEntryCount: z.number().int().min(0).max(100_000),
  statusEvidenceHash: sha256,
  rawGitStatusPersisted: z.literal(false),
  repositoryPathProjected: z.literal(false),
  evidenceHash: sha256,
}).strict()

export type ProductionContainerQualificationSourceObservation = z.infer<
  typeof sourceObservationSchema
>

const imageLabelsSchema = z.object({
  sourceCommitSha: sha1,
  sourceTreeHash: sha1,
  imageRole: imageRoleSchema,
  sourceClean: z.literal('true'),
  candidateContractVersion: z.literal(PRODUCTION_CONTAINER_QUALIFICATION_CANDIDATE_VERSION),
}).strict()

const imageObservationSchema = z.object({
  schemaVersion: z.literal('production-container-host-image-observation-v1'),
  evidenceClass: z.literal('bounded_local_docker_image_inspect_observation'),
  inspectedImageReference: immutableImageReference,
  imageIdDigest: imageDigest,
  repoDigests: z.array(immutableImageReference).min(1).max(64),
  labels: imageLabelsSchema,
  localContainerEndpointVerified: z.literal(true),
  containerEndpointEvidenceHash: sha256,
  inspectionEvidenceHash: sha256,
  inspectedObjectCount: z.literal(1),
  rawDockerInspectionPersisted: z.literal(false),
  localContainerEndpointProjected: z.literal(false),
  localPathProjected: z.literal(false),
  evidenceHash: sha256,
}).strict().superRefine((observation, context) => {
  const sorted = [...observation.repoDigests].sort()
  if (
    new Set(observation.repoDigests).size !== observation.repoDigests.length ||
    !observation.repoDigests.every((value, index) => value === sorted[index])
  ) {
    context.addIssue({
      code: 'custom',
      message: 'Container image repository digests must be unique and sorted.',
    })
  }
})

export type ProductionContainerQualificationImageObservation = z.infer<
  typeof imageObservationSchema
>

export interface ProductionContainerQualificationHostAdapter {
  inspectSource(): ProductionContainerQualificationSourceObservation
  inspectImage(input: {
    imageReference: string
  }): ProductionContainerQualificationImageObservation
}

export const productionContainerQualificationHostVerificationSchema = z.object({
  schemaVersion: z.literal(PRODUCTION_CONTAINER_QUALIFICATION_HOST_VERIFICATION_VERSION),
  targetReceiptVersion: z.literal(PRODUCTION_CONTAINER_QUALIFICATION_RECEIPT_VERSION),
  evidenceClass: z.literal('local_host_source_image_verification_unreleased'),
  promotionEligibility: z.literal('not_promotable_without_reviewed_manual_and_release_authority'),
  candidateReceiptHash: sha256,
  candidateIntegrityVerified: z.literal(true),
  sourceIdentityAuthority: z.literal('bounded_local_git_head_tree_and_clean_status'),
  imageIdentityAuthority: z.literal('bounded_local_docker_image_inspect'),
  sourceObservationHash: sha256,
  sourceRevalidationObservationHash: sha256,
  imageObservationHash: sha256,
  sourceCommitSha: sha1,
  sourceTreeHash: sha1,
  sourceCommitMatched: z.literal(true),
  sourceTreeMatched: z.literal(true),
  cleanWorktreeVerified: z.literal(true),
  sourceRevalidatedAfterImageInspection: z.literal(true),
  imageRole: imageRoleSchema,
  imageReference: immutableImageReference,
  immutableImageDigest: imageDigest,
  immutableRepoDigestMatched: z.literal(true),
  sourceLabelsMatched: z.literal(true),
  imageRoleLabelMatched: z.literal(true),
  sourceCleanLabelMatched: z.literal(true),
  candidateVersionLabelMatched: z.literal(true),
  runtimeChecksPassed: z.literal(true),
  forbiddenToolAbsenceVerified: z.literal(true),
  requiredToolIds: z.array(toolIdSchema).max(72),
  runtimeObservedOptionalToolIds: z.array(toolIdSchema).max(72),
  pendingManualQualificationToolIds: z.array(toolIdSchema).max(72),
  pendingLicenseReviewToolIds: z.array(toolIdSchema).max(72),
  pendingModelWeightReviewToolIds: z.array(toolIdSchema).max(72),
  manualLicenseAndModelGatesVerified: z.literal(false),
  safety: z.object({
    dockerBuildPerformed: z.literal(false),
    dockerPullPerformed: z.literal(false),
    dockerRunPerformed: z.literal(false),
    imagePushPerformed: z.literal(false),
    mediaProcessed: z.literal(false),
    modelWeightsLoaded: z.literal(false),
    inferencePerformed: z.literal(false),
    providerCallPerformed: z.literal(false),
    secretPayloadRead: z.literal(false),
    cloudMutationPerformed: z.literal(false),
    databaseMutationPerformed: z.literal(false),
    deploymentPerformed: z.literal(false),
    publicDeliveryPerformed: z.literal(false),
    rawGitStatusPersisted: z.literal(false),
    rawDockerInspectionPersisted: z.literal(false),
    localPathProjected: z.literal(false),
  }).strict(),
  costBoundary: z.object({
    evidenceState: z.literal('local_read_only_verification_cost_not_metered_non_promotable'),
    providerCostIncluded: z.literal(false),
    infrastructureProductionCostIncluded: z.literal(false),
    customerPriceIncluded: z.literal(false),
    customerCreditsIncluded: z.literal(false),
    serviceFeeIncluded: z.literal(false),
    walletOrBillingMutationPerformed: z.literal(false),
  }).strict(),
  startedAt: timestamp,
  completedAt: timestamp,
  productionImageQualified: z.literal(false),
  deployedReleaseQualified: z.literal(false),
  externalBetaReady: z.literal(false),
  productionReady: z.literal(false),
  verificationHash: sha256,
}).strict().superRefine((receipt, context) => {
  if (Date.parse(receipt.completedAt) < Date.parse(receipt.startedAt)) {
    context.addIssue({ code: 'custom', message: 'Host verification timestamps are invalid.' })
  }
  for (const [label, values] of [
    ['requiredToolIds', receipt.requiredToolIds],
    ['runtimeObservedOptionalToolIds', receipt.runtimeObservedOptionalToolIds],
    ['pendingManualQualificationToolIds', receipt.pendingManualQualificationToolIds],
    ['pendingLicenseReviewToolIds', receipt.pendingLicenseReviewToolIds],
    ['pendingModelWeightReviewToolIds', receipt.pendingModelWeightReviewToolIds],
  ] as const) {
    const sorted = [...values].sort()
    if (
      new Set(values).size !== values.length ||
      !values.every((value, index) => value === sorted[index])
    ) {
      context.addIssue({ code: 'custom', message: `${label} must be unique and sorted.` })
    }
  }
})

export type ProductionContainerQualificationHostVerification = z.infer<
  typeof productionContainerQualificationHostVerificationSchema
>

export function createProductionContainerQualificationSourceObservation(input: {
  sourceCommitSha: string
  sourceTreeHash: string
  worktreeClean: boolean
  statusEntryCount: number
  statusEvidenceHash: string
}): ProductionContainerQualificationSourceObservation {
  const payload = {
    schemaVersion: 'production-container-host-source-observation-v1' as const,
    evidenceClass: 'bounded_local_git_source_observation' as const,
    sourceCommitSha: sha1.parse(input.sourceCommitSha),
    sourceTreeHash: sha1.parse(input.sourceTreeHash),
    worktreeClean: input.worktreeClean,
    statusEntryCount: input.statusEntryCount,
    statusEvidenceHash: sha256.parse(input.statusEvidenceHash),
    rawGitStatusPersisted: false as const,
    repositoryPathProjected: false as const,
  }
  return deepFreeze(sourceObservationSchema.parse({
    ...payload,
    evidenceHash: hashProductionContainerQualificationValue(payload),
  }))
}

export function createProductionContainerQualificationImageObservation(input: {
  inspectedImageReference: string
  imageIdDigest: string
  repoDigests: string[]
  labels: ProductionContainerQualificationImageObservation['labels']
  containerEndpointEvidenceHash: string
  inspectionEvidenceHash: string
}): ProductionContainerQualificationImageObservation {
  const payload = {
    schemaVersion: 'production-container-host-image-observation-v1' as const,
    evidenceClass: 'bounded_local_docker_image_inspect_observation' as const,
    inspectedImageReference: immutableImageReference.parse(input.inspectedImageReference),
    imageIdDigest: imageDigest.parse(input.imageIdDigest),
    repoDigests: input.repoDigests.map((value) => immutableImageReference.parse(value)).sort(),
    labels: imageLabelsSchema.parse(input.labels),
    localContainerEndpointVerified: true as const,
    containerEndpointEvidenceHash: sha256.parse(input.containerEndpointEvidenceHash),
    inspectionEvidenceHash: sha256.parse(input.inspectionEvidenceHash),
    inspectedObjectCount: 1 as const,
    rawDockerInspectionPersisted: false as const,
    localContainerEndpointProjected: false as const,
    localPathProjected: false as const,
  }
  return deepFreeze(imageObservationSchema.parse({
    ...payload,
    evidenceHash: hashProductionContainerQualificationValue(payload),
  }))
}

export function verifyProductionContainerQualificationWithHostAdapter(input: {
  candidate: unknown
  adapter: ProductionContainerQualificationHostAdapter
  now?: () => Date
}): ProductionContainerQualificationHostVerification {
  const candidate = assertProductionContainerQualificationCandidateIntegrity(input.candidate)
  if (!candidate.candidateReadyForIndependentVerification) {
    throw new Error('Container qualification candidate has not passed its runtime checks.')
  }

  const now = input.now ?? (() => new Date())
  const startedAt = validNow(now).toISOString()
  const source = assertSourceObservationIntegrity(input.adapter.inspectSource())
  if (!source.worktreeClean || source.statusEntryCount !== 0) {
    throw new Error('Independent source verification requires an exactly clean worktree.')
  }
  if (source.sourceCommitSha !== candidate.sourceCommitSha) {
    throw new Error('Candidate source commit does not match the independently inspected checkout.')
  }
  if (source.sourceTreeHash !== candidate.sourceTreeHash) {
    throw new Error('Candidate source tree does not match the independently inspected checkout.')
  }

  const image = assertImageObservationIntegrity(input.adapter.inspectImage({
    imageReference: candidate.imageReference,
  }))
  assertImageMatchesCandidate(image, candidate)
  const sourceRevalidation = assertSourceObservationIntegrity(input.adapter.inspectSource())
  if (
    !sourceRevalidation.worktreeClean ||
    sourceRevalidation.statusEntryCount !== 0 ||
    sourceRevalidation.sourceCommitSha !== candidate.sourceCommitSha ||
    sourceRevalidation.sourceTreeHash !== candidate.sourceTreeHash ||
    sourceRevalidation.evidenceHash !== source.evidenceHash
  ) {
    throw new Error('Independent source identity changed during image verification.')
  }

  const runtimeObservedOptionalToolIds = candidate.optionalToolIds.filter((toolId) => {
    const checks = candidate.checks.filter((check) =>
      check.toolId === toolId && check.expectation === 'present')
    return checks.length > 0 && checks.every((check) => check.status === 'passed')
  }).sort()
  const pendingManualQualificationToolIds = [
    ...new Set([...candidate.requiredToolIds, ...runtimeObservedOptionalToolIds]),
  ].sort() as ProductionToolId[]
  const pendingLicenseReviewToolIds = pendingManualQualificationToolIds
    .filter(toolNeedsLicenseReview)
    .sort()
  const pendingModelWeightReviewToolIds = pendingManualQualificationToolIds
    .filter((toolId) => getProductionToolProfile(toolId)?.modelWeightsRequired === true)
    .sort()
  const completedAt = validNow(now).toISOString()

  const payload = {
    schemaVersion: PRODUCTION_CONTAINER_QUALIFICATION_HOST_VERIFICATION_VERSION,
    targetReceiptVersion: PRODUCTION_CONTAINER_QUALIFICATION_RECEIPT_VERSION,
    evidenceClass: 'local_host_source_image_verification_unreleased' as const,
    promotionEligibility: 'not_promotable_without_reviewed_manual_and_release_authority' as const,
    candidateReceiptHash: candidate.receiptHash,
    candidateIntegrityVerified: true as const,
    sourceIdentityAuthority: 'bounded_local_git_head_tree_and_clean_status' as const,
    imageIdentityAuthority: 'bounded_local_docker_image_inspect' as const,
    sourceObservationHash: source.evidenceHash,
    sourceRevalidationObservationHash: sourceRevalidation.evidenceHash,
    imageObservationHash: image.evidenceHash,
    sourceCommitSha: source.sourceCommitSha,
    sourceTreeHash: source.sourceTreeHash,
    sourceCommitMatched: true as const,
    sourceTreeMatched: true as const,
    cleanWorktreeVerified: true as const,
    sourceRevalidatedAfterImageInspection: true as const,
    imageRole: candidate.imageRole,
    imageReference: candidate.imageReference,
    immutableImageDigest: candidate.immutableImageDigest,
    immutableRepoDigestMatched: true as const,
    sourceLabelsMatched: true as const,
    imageRoleLabelMatched: true as const,
    sourceCleanLabelMatched: true as const,
    candidateVersionLabelMatched: true as const,
    runtimeChecksPassed: true as const,
    forbiddenToolAbsenceVerified: true as const,
    requiredToolIds: [...candidate.requiredToolIds].sort(),
    runtimeObservedOptionalToolIds,
    pendingManualQualificationToolIds,
    pendingLicenseReviewToolIds,
    pendingModelWeightReviewToolIds,
    manualLicenseAndModelGatesVerified: false as const,
    safety: {
      dockerBuildPerformed: false as const,
      dockerPullPerformed: false as const,
      dockerRunPerformed: false as const,
      imagePushPerformed: false as const,
      mediaProcessed: false as const,
      modelWeightsLoaded: false as const,
      inferencePerformed: false as const,
      providerCallPerformed: false as const,
      secretPayloadRead: false as const,
      cloudMutationPerformed: false as const,
      databaseMutationPerformed: false as const,
      deploymentPerformed: false as const,
      publicDeliveryPerformed: false as const,
      rawGitStatusPersisted: false as const,
      rawDockerInspectionPersisted: false as const,
      localPathProjected: false as const,
    },
    costBoundary: {
      evidenceState: 'local_read_only_verification_cost_not_metered_non_promotable' as const,
      providerCostIncluded: false as const,
      infrastructureProductionCostIncluded: false as const,
      customerPriceIncluded: false as const,
      customerCreditsIncluded: false as const,
      serviceFeeIncluded: false as const,
      walletOrBillingMutationPerformed: false as const,
    },
    startedAt,
    completedAt,
    productionImageQualified: false as const,
    deployedReleaseQualified: false as const,
    externalBetaReady: false as const,
    productionReady: false as const,
  }
  return assertHostVerificationIntegrity({
    ...payload,
    verificationHash: hashProductionContainerQualificationValue(payload),
  })
}

export function assertHostVerificationIntegrity(
  rawReceipt: unknown,
): ProductionContainerQualificationHostVerification {
  const receipt = productionContainerQualificationHostVerificationSchema.parse(rawReceipt)
  const { verificationHash, ...payload } = receipt
  if (verificationHash !== hashProductionContainerQualificationValue(payload)) {
    throw new Error('Container host verification hash is invalid.')
  }
  return deepFreeze(receipt)
}

function assertSourceObservationIntegrity(
  rawObservation: unknown,
): ProductionContainerQualificationSourceObservation {
  const observation = sourceObservationSchema.parse(rawObservation)
  const { evidenceHash, ...payload } = observation
  if (evidenceHash !== hashProductionContainerQualificationValue(payload)) {
    throw new Error('Container source observation hash is invalid.')
  }
  return deepFreeze(observation)
}

function assertImageObservationIntegrity(
  rawObservation: unknown,
): ProductionContainerQualificationImageObservation {
  const observation = imageObservationSchema.parse(rawObservation)
  const { evidenceHash, ...payload } = observation
  if (evidenceHash !== hashProductionContainerQualificationValue(payload)) {
    throw new Error('Container image observation hash is invalid.')
  }
  return deepFreeze(observation)
}

function assertImageMatchesCandidate(
  image: ProductionContainerQualificationImageObservation,
  candidate: ProductionContainerQualificationCandidate,
): void {
  if (image.inspectedImageReference !== candidate.imageReference) {
    throw new Error('Inspected image reference does not match the candidate.')
  }
  if (!image.repoDigests.includes(candidate.imageReference)) {
    throw new Error('Local image metadata does not contain the candidate immutable repository digest.')
  }
  if (
    image.labels.sourceCommitSha !== candidate.sourceCommitSha ||
    image.labels.sourceTreeHash !== candidate.sourceTreeHash
  ) throw new Error('Container OCI source labels do not match the candidate source identity.')
  if (image.labels.imageRole !== candidate.imageRole) {
    throw new Error('Container image-role label does not match the candidate role.')
  }
  if (image.labels.sourceClean !== 'true') {
    throw new Error('Container clean-source label is not verified.')
  }
  if (image.labels.candidateContractVersion !== PRODUCTION_CONTAINER_QUALIFICATION_CANDIDATE_VERSION) {
    throw new Error('Container candidate-contract label is not verified.')
  }
}

function toolNeedsLicenseReview(toolId: ProductionToolId): boolean {
  const profile = getProductionToolProfile(toolId)
  if (!profile) return true
  const license = evaluateToolLicensePolicy(profile)
  return !license.allowed || license.warnings.length > 0 ||
    profile.productionStatus === 'needs_license_review'
}

function validNow(now: () => Date): Date {
  const value = now()
  if (!Number.isFinite(value.getTime())) throw new Error('Host verification clock is invalid.')
  return value
}

export function hashBoundedHostObservation(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const nested of Object.values(value as Record<string, unknown>)) deepFreeze(nested)
  }
  return value
}

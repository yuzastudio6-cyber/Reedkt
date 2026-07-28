import { z } from 'zod'

import { GPU_MODEL_WEIGHT_MANIFEST_TEMPLATES } from '../../model-weights/model-weight-manifest-templates'
import {
  PRODUCTION_TOOL_IDS,
  evaluateToolLicensePolicy,
  getProductionToolProfile,
  isProductionToolId,
  type ProductionToolId,
} from '../../tool-registry'
import { GPU_PENDING_SOURCE_INSTALL_REVIEW } from '../production-readiness/gpu-tool-python-import-checks'
import {
  assertHostVerificationIntegrity,
  assertProductionContainerQualificationSourceObservationIntegrity,
  hashBoundedHostObservation,
  type ProductionContainerQualificationHostVerification,
  type ProductionContainerQualificationSourceObservation,
} from './production-container-qualification-independent-verification'
import { hashProductionContainerQualificationValue } from './production-container-qualification-contract'

export const PRODUCTION_CONTAINER_MANUAL_QUALIFICATION_REVIEW_PACKAGE_VERSION =
  'production-container-manual-qualification-review-package-v1' as const

const sha1 = z.string().regex(/^[a-f0-9]{40}$/u)
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const imageDigest = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const immutableImageReference = z.string().min(73).max(1_024)
  .regex(/^[^\s@]+@sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const safeText = z.string().min(1).max(2_000)
const toolIdSchema = z.string().refine(isProductionToolId)
const imageRoleSchema = z.enum([
  'api',
  'cpu_worker',
  'gpu_worker',
  'render_worker',
  'qa_worker',
  'tool_readiness_worker',
])

const toolReviewItemSchema = z.object({
  toolId: toolIdSchema,
  runtimeObservation: z.enum(['required_runtime_tool', 'runtime_observed_optional_tool']),
  profileDigest: sha256,
  displayName: safeText,
  productionStatus: safeText,
  workerType: safeText,
  installPhase: safeText,
  declaredLicense: safeText,
  licenseFamily: safeText,
  licenseRisk: safeText,
  commercialUseStatus: safeText,
  distributionRisk: safeText,
  licensePolicyCurrentlyAllowsProduction: z.boolean(),
  licenseDecisionReviewRequired: z.boolean(),
  licenseBlockingReasons: z.array(safeText).max(32),
  licenseWarnings: z.array(safeText).max(32),
  modelWeightsRequired: z.boolean(),
  modelWeightProfileReviewStatus: safeText,
  modelWeightCommercialUseStatus: safeText,
  modelWeightReviewRequired: z.boolean(),
  modelWeightTemplateId: safeText.nullable(),
  modelWeightTemplateDigest: sha256.nullable(),
  modelWeightTemplateSummary: z.object({
    modelName: safeText,
    modelVersion: safeText,
    declaredSource: safeText,
    declaredLicense: safeText,
    commercialUseAllowed: z.boolean(),
    commercialUseStatus: safeText,
    redistributionAllowed: z.boolean(),
    requiresAttribution: z.boolean(),
    reviewStatus: safeText,
    checksumPresent: z.boolean(),
    riskNotes: z.array(safeText).max(32),
  }).strict().nullable(),
  sourceInstallReviewRequired: z.boolean(),
  sourceInstallPackageName: safeText.nullable(),
  sourceInstallReason: safeText.nullable(),
  packageReleaseReviewRequired: z.literal(true),
  reviewState: z.literal('pending_human_review'),
  itemHash: sha256,
}).strict()

export type ProductionContainerManualQualificationToolReviewItem = z.infer<
  typeof toolReviewItemSchema
>

export const productionContainerManualQualificationReviewPackageSchema = z.object({
  schemaVersion: z.literal(PRODUCTION_CONTAINER_MANUAL_QUALIFICATION_REVIEW_PACKAGE_VERSION),
  evidenceClass: z.literal('source_generated_image_bound_manual_review_package_non_promotable'),
  authorityClass: z.literal('review_input_only_no_approval_or_release_authority'),
  hostVerificationVersion: z.literal('production-container-qualification-host-verification-v1'),
  hostVerificationHash: sha256,
  candidateReceiptHash: sha256,
  sourceObservationHash: sha256,
  sourceRevalidationObservationHash: sha256,
  exactCleanSourceReverified: z.literal(true),
  sourceCommitSha: sha1,
  sourceTreeHash: sha1,
  imageRole: imageRoleSchema,
  imageReference: immutableImageReference,
  immutableImageDigest: imageDigest,
  toolReviewItems: z.array(toolReviewItemSchema).max(PRODUCTION_TOOL_IDS.length),
  toolInventoryHash: sha256,
  pendingManualQualificationToolIds: z.array(toolIdSchema).max(PRODUCTION_TOOL_IDS.length),
  pendingLicenseDecisionToolIds: z.array(toolIdSchema).max(PRODUCTION_TOOL_IDS.length),
  pendingModelWeightReviewToolIds: z.array(toolIdSchema).max(PRODUCTION_TOOL_IDS.length),
  pendingSourceInstallReviewToolIds: z.array(toolIdSchema).max(PRODUCTION_TOOL_IDS.length),
  reviewRequirements: z.object({
    exactPackageOrSourceVersionRequired: z.literal(true),
    packageOrSourceChecksumRequired: z.literal(true),
    reproducibleInstallEvidenceRequired: z.literal(true),
    softwareBillOfMaterialsRequired: z.literal(true),
    licenseTextAndProvenanceRequired: z.literal(true),
    commercialUseDecisionRequired: z.literal(true),
    distributionDecisionRequired: z.literal(true),
    attributionDecisionRequired: z.literal(true),
    exactModelCheckpointVersionAndChecksumRequiredWhenApplicable: z.literal(true),
    modelCardLicenseAndCommercialDecisionRequiredWhenApplicable: z.literal(true),
    securityAndQualityQualificationSeparate: z.literal(true),
  }).strict(),
  reviewState: z.literal('not_started'),
  reviewerDecisionAccepted: z.literal(false),
  manualLicenseAndModelGatesVerified: z.literal(false),
  sourceInstallGatesVerified: z.literal(false),
  productionImageQualified: z.literal(false),
  deployedReleaseQualified: z.literal(false),
  externalBetaReady: z.literal(false),
  productionReady: z.literal(false),
  costBoundary: z.object({
    evidenceState: z.literal('manual_review_preparation_has_no_production_cost_or_commercial_authority'),
    providerCostIncluded: z.literal(false),
    infrastructureProductionCostIncluded: z.literal(false),
    customerPriceIncluded: z.literal(false),
    customerCreditsIncluded: z.literal(false),
    serviceFeeIncluded: z.literal(false),
    walletOrBillingMutationPerformed: z.literal(false),
  }).strict(),
  createdAt: timestamp,
  packageHash: sha256,
}).strict().superRefine((reviewPackage, context) => {
  for (const [label, values] of [
    ['toolReviewItems', reviewPackage.toolReviewItems.map((item) => item.toolId)],
    ['pendingManualQualificationToolIds', reviewPackage.pendingManualQualificationToolIds],
    ['pendingLicenseDecisionToolIds', reviewPackage.pendingLicenseDecisionToolIds],
    ['pendingModelWeightReviewToolIds', reviewPackage.pendingModelWeightReviewToolIds],
    ['pendingSourceInstallReviewToolIds', reviewPackage.pendingSourceInstallReviewToolIds],
  ] as const) {
    const sorted = [...values].sort()
    if (
      new Set(values).size !== values.length ||
      !values.every((value, index) => value === sorted[index])
    ) context.addIssue({ code: 'custom', message: `${label} must be unique and sorted.` })
  }
})

export type ProductionContainerManualQualificationReviewPackage = z.infer<
  typeof productionContainerManualQualificationReviewPackageSchema
>

export interface ProductionContainerManualQualificationSourceAdapter {
  inspectSource(): ProductionContainerQualificationSourceObservation
}

export function buildProductionContainerManualQualificationReviewPackage(input: {
  hostVerification: unknown
  sourceAdapter: ProductionContainerManualQualificationSourceAdapter
  now?: () => Date
}): ProductionContainerManualQualificationReviewPackage {
  const hostVerification = assertHostVerificationIntegrity(input.hostVerification)
  const source = inspectMatchingCleanSource(hostVerification, input.sourceAdapter)
  const toolReviewItems = hostVerification.pendingManualQualificationToolIds
    .map((toolId) => buildToolReviewItem(toolId, hostVerification))
    .sort((left, right) => left.toolId.localeCompare(right.toolId))
  const pendingLicenseDecisionToolIds = toolReviewItems
    .filter((item) => item.licenseDecisionReviewRequired)
    .map((item) => item.toolId)
    .sort()
  const pendingModelWeightReviewToolIds = toolReviewItems
    .filter((item) => item.modelWeightReviewRequired)
    .map((item) => item.toolId)
    .sort()
  const pendingSourceInstallReviewToolIds = toolReviewItems
    .filter((item) => item.sourceInstallReviewRequired)
    .map((item) => item.toolId)
    .sort()

  if (!sameValues(pendingLicenseDecisionToolIds, hostVerification.pendingLicenseReviewToolIds)) {
    throw new Error('Host verification license inventory is stale against the exact source registry.')
  }
  if (!sameValues(pendingModelWeightReviewToolIds, hostVerification.pendingModelWeightReviewToolIds)) {
    throw new Error('Host verification model-weight inventory is stale against the exact source registry.')
  }

  const sourceRevalidation = inspectMatchingCleanSource(hostVerification, input.sourceAdapter)
  if (sourceRevalidation.evidenceHash !== source.evidenceHash) {
    throw new Error('Source identity changed while preparing the manual qualification package.')
  }
  const createdAt = validNow(input.now ?? (() => new Date())).toISOString()
  const payload = {
    schemaVersion: PRODUCTION_CONTAINER_MANUAL_QUALIFICATION_REVIEW_PACKAGE_VERSION,
    evidenceClass: 'source_generated_image_bound_manual_review_package_non_promotable' as const,
    authorityClass: 'review_input_only_no_approval_or_release_authority' as const,
    hostVerificationVersion: hostVerification.schemaVersion,
    hostVerificationHash: hostVerification.verificationHash,
    candidateReceiptHash: hostVerification.candidateReceiptHash,
    sourceObservationHash: source.evidenceHash,
    sourceRevalidationObservationHash: sourceRevalidation.evidenceHash,
    exactCleanSourceReverified: true as const,
    sourceCommitSha: hostVerification.sourceCommitSha,
    sourceTreeHash: hostVerification.sourceTreeHash,
    imageRole: hostVerification.imageRole,
    imageReference: hostVerification.imageReference,
    immutableImageDigest: hostVerification.immutableImageDigest,
    toolReviewItems,
    toolInventoryHash: hashProductionContainerQualificationValue(toolReviewItems),
    pendingManualQualificationToolIds: [...hostVerification.pendingManualQualificationToolIds],
    pendingLicenseDecisionToolIds,
    pendingModelWeightReviewToolIds,
    pendingSourceInstallReviewToolIds,
    reviewRequirements: {
      exactPackageOrSourceVersionRequired: true as const,
      packageOrSourceChecksumRequired: true as const,
      reproducibleInstallEvidenceRequired: true as const,
      softwareBillOfMaterialsRequired: true as const,
      licenseTextAndProvenanceRequired: true as const,
      commercialUseDecisionRequired: true as const,
      distributionDecisionRequired: true as const,
      attributionDecisionRequired: true as const,
      exactModelCheckpointVersionAndChecksumRequiredWhenApplicable: true as const,
      modelCardLicenseAndCommercialDecisionRequiredWhenApplicable: true as const,
      securityAndQualityQualificationSeparate: true as const,
    },
    reviewState: 'not_started' as const,
    reviewerDecisionAccepted: false as const,
    manualLicenseAndModelGatesVerified: false as const,
    sourceInstallGatesVerified: false as const,
    productionImageQualified: false as const,
    deployedReleaseQualified: false as const,
    externalBetaReady: false as const,
    productionReady: false as const,
    costBoundary: {
      evidenceState: 'manual_review_preparation_has_no_production_cost_or_commercial_authority' as const,
      providerCostIncluded: false as const,
      infrastructureProductionCostIncluded: false as const,
      customerPriceIncluded: false as const,
      customerCreditsIncluded: false as const,
      serviceFeeIncluded: false as const,
      walletOrBillingMutationPerformed: false as const,
    },
    createdAt,
  }
  return assertProductionContainerManualQualificationReviewPackage({
    ...payload,
    packageHash: hashProductionContainerQualificationValue(payload),
  }, hostVerification)
}

export function assertProductionContainerManualQualificationReviewPackage(
  rawPackage: unknown,
  rawHostVerification: unknown,
): ProductionContainerManualQualificationReviewPackage {
  const hostVerification = assertHostVerificationIntegrity(rawHostVerification)
  const reviewPackage = productionContainerManualQualificationReviewPackageSchema.parse(rawPackage)
  const { packageHash, ...payload } = reviewPackage
  if (packageHash !== hashProductionContainerQualificationValue(payload)) {
    throw new Error('Container manual qualification review package hash is invalid.')
  }
  if (
    reviewPackage.hostVerificationHash !== hostVerification.verificationHash ||
    reviewPackage.candidateReceiptHash !== hostVerification.candidateReceiptHash ||
    reviewPackage.sourceCommitSha !== hostVerification.sourceCommitSha ||
    reviewPackage.sourceTreeHash !== hostVerification.sourceTreeHash ||
    reviewPackage.imageRole !== hostVerification.imageRole ||
    reviewPackage.imageReference !== hostVerification.imageReference ||
    reviewPackage.immutableImageDigest !== hostVerification.immutableImageDigest ||
    !sameValues(
      reviewPackage.pendingManualQualificationToolIds,
      hostVerification.pendingManualQualificationToolIds,
    )
  ) throw new Error('Container manual qualification package does not match the host verification receipt.')

  const expectedItems = hostVerification.pendingManualQualificationToolIds
    .map((toolId) => buildToolReviewItem(toolId, hostVerification))
    .sort((left, right) => left.toolId.localeCompare(right.toolId))
  if (
    reviewPackage.toolInventoryHash !== hashProductionContainerQualificationValue(expectedItems) ||
    hashProductionContainerQualificationValue(reviewPackage.toolReviewItems) !==
      hashProductionContainerQualificationValue(expectedItems)
  ) throw new Error('Container manual qualification tool inventory is stale or invalid.')
  return deepFreeze(reviewPackage)
}

function buildToolReviewItem(
  toolId: ProductionToolId,
  hostVerification: ProductionContainerQualificationHostVerification,
): ProductionContainerManualQualificationToolReviewItem {
  const profile = getProductionToolProfile(toolId)
  if (!profile) throw new Error(`Missing source-owned tool profile for ${toolId}.`)
  const license = evaluateToolLicensePolicy(profile)
  const template = GPU_MODEL_WEIGHT_MANIFEST_TEMPLATES.find((candidate) =>
    candidate.toolId === toolId)
  const sourceInstall = GPU_PENDING_SOURCE_INSTALL_REVIEW.find((candidate) =>
    candidate.toolId === toolId)
  const profilePayload = {
    toolId: profile.toolId,
    displayName: profile.displayName,
    productionStatus: profile.productionStatus,
    workerType: profile.workerType,
    installPhase: profile.installPhase,
    license: profile.license,
    licenseFamily: profile.licenseFamily,
    licenseRisk: profile.licenseRisk,
    commercialUseStatus: profile.commercialUseStatus,
    distributionRisk: profile.distributionRisk,
    modelWeightsRequired: profile.modelWeightsRequired,
    modelWeightPolicy: profile.modelWeightPolicy,
  }
  const templateSummary = template ? {
    modelName: template.modelName,
    modelVersion: template.modelVersion,
    declaredSource: template.source,
    declaredLicense: template.license,
    commercialUseAllowed: template.commercialUseAllowed,
    commercialUseStatus: template.commercialUseStatus,
    redistributionAllowed: template.redistributionAllowed,
    requiresAttribution: template.requiresAttribution,
    reviewStatus: template.reviewStatus,
    checksumPresent: Boolean(template.checksum),
    riskNotes: [...template.riskNotes],
  } : null
  const payload = {
    toolId,
    runtimeObservation: hostVerification.requiredToolIds.includes(toolId)
      ? 'required_runtime_tool' as const
      : 'runtime_observed_optional_tool' as const,
    profileDigest: hashProductionContainerQualificationValue(profilePayload),
    displayName: profile.displayName,
    productionStatus: profile.productionStatus,
    workerType: profile.workerType,
    installPhase: profile.installPhase,
    declaredLicense: profile.license,
    licenseFamily: profile.licenseFamily,
    licenseRisk: profile.licenseRisk,
    commercialUseStatus: profile.commercialUseStatus,
    distributionRisk: profile.distributionRisk,
    licensePolicyCurrentlyAllowsProduction: license.allowed,
    licenseDecisionReviewRequired: !license.allowed || license.warnings.length > 0 ||
      profile.productionStatus === 'needs_license_review',
    licenseBlockingReasons: [...license.blockingReasons],
    licenseWarnings: [...license.warnings],
    modelWeightsRequired: profile.modelWeightsRequired,
    modelWeightProfileReviewStatus: profile.modelWeightPolicy.reviewStatus,
    modelWeightCommercialUseStatus: profile.modelWeightPolicy.commercialUseStatus,
    modelWeightReviewRequired: profile.modelWeightsRequired,
    modelWeightTemplateId: template?.id ?? null,
    modelWeightTemplateDigest: template
      ? hashProductionContainerQualificationValue(template)
      : null,
    modelWeightTemplateSummary: templateSummary,
    sourceInstallReviewRequired: Boolean(sourceInstall),
    sourceInstallPackageName: sourceInstall?.packageName ?? null,
    sourceInstallReason: sourceInstall?.reason ?? null,
    packageReleaseReviewRequired: true as const,
    reviewState: 'pending_human_review' as const,
  }
  return deepFreeze(toolReviewItemSchema.parse({
    ...payload,
    itemHash: hashProductionContainerQualificationValue(payload),
  }))
}

function inspectMatchingCleanSource(
  hostVerification: ProductionContainerQualificationHostVerification,
  sourceAdapter: ProductionContainerManualQualificationSourceAdapter,
): ProductionContainerQualificationSourceObservation {
  const source = assertProductionContainerQualificationSourceObservationIntegrity(
    sourceAdapter.inspectSource(),
  )
  if (
    !source.worktreeClean ||
    source.statusEntryCount !== 0 ||
    source.sourceCommitSha !== hostVerification.sourceCommitSha ||
    source.sourceTreeHash !== hostVerification.sourceTreeHash
  ) throw new Error('Manual qualification package requires the exact clean host-verification source.')
  return source
}

function sameValues(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index])
}

function validNow(now: () => Date): Date {
  const value = now()
  if (!Number.isFinite(value.getTime())) throw new Error('Manual qualification package clock is invalid.')
  return value
}

export function hashManualQualificationInput(value: string | Buffer): string {
  return hashBoundedHostObservation(value)
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const nested of Object.values(value as Record<string, unknown>)) deepFreeze(nested)
  }
  return value
}

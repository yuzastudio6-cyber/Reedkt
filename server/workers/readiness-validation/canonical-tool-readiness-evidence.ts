import {
  PRODUCTION_TOOL_IDS,
  isProductionToolId,
  type ProductionToolId,
} from '../../tool-registry'
import {
  getToolIdentityRecord,
  listProvenToolIdentityCatalog,
  PROVEN_TOOL_EVIDENCE_REVISION,
  PROVEN_TOOL_IDENTITY_CATALOG_VERSION,
} from '../../tool-execution/proven-tool-identity-catalog'
import {
  PRODUCTION_CONTAINER_QUALIFICATION_RECEIPT_VERSION,
  PRODUCTION_TOOL_DEPLOYMENT_RELEASE_RECEIPT_VERSION,
  type CanonicalPrivateToolReadinessEvidence,
  type DeployedToolReleaseQualificationEvidence,
  type ProductionImageQualificationEvidence,
  type ProductionReadinessEvidenceTierSummary,
} from './readiness-validation-types'

/**
 * Project the repository's retained private lifecycle proof without confusing
 * it with production image or deployed-release qualification.
 */
export function getCanonicalPrivateToolReadinessEvidence(
  toolId: ProductionToolId | string,
): CanonicalPrivateToolReadinessEvidence {
  if (!isProductionToolId(toolId)) {
    throw new Error(
      `${toolId} is not in the canonical 50-tool production registry.`,
    )
  }
  const record = getToolIdentityRecord(toolId)
  return Object.freeze({
    evidenceClass: 'canonical_private_single_host_lifecycle_evidence' as const,
    catalogVersion: record.schemaVersion,
    evidenceRevision: record.evidenceRevision,
    verificationState: record.verificationState,
    stableToolIdentity: record.stableToolIdentity,
    identityHash: record.identityHash,
    proofHash: record.proofHash,
    privateInternalRunnerReady: record.readiness.privateInternalRunnerReady,
    privateInternalEndToEndReady: record.readiness.privateInternalEndToEndReady,
    privateInternalJobAdapterReady: record.readiness.privateInternalJobAdapterReady,
    privateInternalBoundaryContractReady: record.readiness.privateInternalBoundaryContractReady,
    productReady: false as const,
    externalBetaReady: false as const,
    productionReady: false as const,
  })
}

export function buildMissingProductionImageQualificationEvidence(
): ProductionImageQualificationEvidence {
  return Object.freeze({
    evidenceClass: 'production_image_qualification_not_supplied' as const,
    requiredReceiptVersion: PRODUCTION_CONTAINER_QUALIFICATION_RECEIPT_VERSION,
    status: 'not_verified' as const,
    exactSourceCommitMatched: false as const,
    immutableImageDigestVerified: false as const,
    imageRoleVerified: false as const,
    requiredToolChecksVerified: false as const,
    forbiddenToolChecksVerified: false as const,
    licenseAndModelGatesVerified: false as const,
    qualified: false as const,
    productReady: false as const,
    productionReady: false as const,
  })
}

export function buildMissingDeployedToolReleaseQualificationEvidence(
): DeployedToolReleaseQualificationEvidence {
  return Object.freeze({
    evidenceClass: 'deployed_release_qualification_not_supplied' as const,
    requiredReceiptVersion: PRODUCTION_TOOL_DEPLOYMENT_RELEASE_RECEIPT_VERSION,
    status: 'not_verified' as const,
    sameQualifiedImageDigestDeployed: false as const,
    serviceIdentityVerified: false as const,
    privateStorageVerified: false as const,
    observabilityVerified: false as const,
    releaseApprovalVerified: false as const,
    qualified: false as const,
    externalBetaReady: false as const,
    productionReady: false as const,
  })
}

export function summarizeCanonicalToolReadinessEvidence(
): ProductionReadinessEvidenceTierSummary {
  const productionToolIds = new Set<string>(PRODUCTION_TOOL_IDS)
  const records = listProvenToolIdentityCatalog().filter((record) =>
    productionToolIds.has(record.canonicalToolId))
  const privateInternal = {
    evidenceClass: 'canonical_private_single_host_lifecycle_evidence' as const,
    runnerVerifiedToolIds: records
      .filter((record) => record.readiness.privateInternalRunnerReady)
      .map((record) => record.canonicalToolId),
    canonicalEndToEndVerifiedToolIds: records
      .filter((record) => record.readiness.privateInternalEndToEndReady)
      .map((record) => record.canonicalToolId),
    canonicalJobAdapterVerifiedToolIds: records
      .filter((record) => record.readiness.privateInternalJobAdapterReady)
      .map((record) => record.canonicalToolId),
    canonicalBoundaryContractVerifiedToolIds: records
      .filter((record) => record.readiness.privateInternalBoundaryContractReady)
      .map((record) => record.canonicalToolId),
    productReady: false as const,
    externalBetaReady: false as const,
    productionReady: false as const,
  }

  return deepFreeze({
    catalogVersion: PROVEN_TOOL_IDENTITY_CATALOG_VERSION,
    evidenceRevision: PROVEN_TOOL_EVIDENCE_REVISION,
    registryToolCount: records.length,
    privateInternal,
    productionImageQualification: {
      evidenceClass: 'production_image_qualification_not_supplied' as const,
      requiredReceiptVersion: PRODUCTION_CONTAINER_QUALIFICATION_RECEIPT_VERSION,
      qualifiedToolIds: [] as ProductionToolId[],
      sameSourceImageEvidenceSupplied: false as const,
      productReady: false as const,
      productionReady: false as const,
    },
    deployedReleaseQualification: {
      evidenceClass: 'deployed_release_qualification_not_supplied' as const,
      requiredReceiptVersion: PRODUCTION_TOOL_DEPLOYMENT_RELEASE_RECEIPT_VERSION,
      qualifiedToolIds: [] as ProductionToolId[],
      deployedSameImageEvidenceSupplied: false as const,
      externalBetaReady: false as const,
      productionReady: false as const,
    },
  })
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const entry of Object.values(value as Record<string, unknown>)) {
      deepFreeze(entry)
    }
  }
  return value
}

import {
  createEditReferenceProductionPlannerBindingAdapterReceipt,
  createEditReferenceProductionPlannerPreferenceApplicationBinding,
} from '../edit-references/edit-reference-production-planner-binding-adapter'
import {
  resolveEditReferenceProductionPlanningAuthority,
  type EditReferenceProductionPlanningAuthorityReader,
  type EditReferenceProductionPlanningAuthorityResolution,
} from '../edit-references/edit-reference-production-planning-authority'
import { ApiError } from '../errors/api-error'
import {
  PLANNING_PREFERENCE_APPLICATION_AUTHORITY_PORT_VERSION,
  validatePlanningPreferenceApplicationAuthorityResolution,
  type PlanningPreferenceApplicationAuthorityPort,
  type PlanningPreferenceApplicationAuthorityResolution,
  type PlanningPreferenceApplicationCanonicalLineage,
} from './planning-preference-application-authority-port'
import { sha256AuthorityValue } from './private-edit-authority-store'

export const EDIT_REFERENCE_PRODUCTION_PLANNING_AUTHORITY_PORT_ADAPTER_VERSION =
  'edit-reference-production-planning-authority-port-adapter-v1' as const

/**
 * Adapts the canonical Edit Reference planning reader to the one shared
 * PreferenceApplication authority port used by planning preparation and
 * revalidation.
 *
 * This factory is intentionally non-promotable. The handed-off reader and RPC
 * adapter are contract fixtures until a reviewed live repository, RLS, and
 * release-evidence boundary supplies a separately qualified production port.
 */
export function createUnreleasedEditReferenceProductionPlanningAuthorityPort(input: {
  readonly reader: EditReferenceProductionPlanningAuthorityReader
}): PlanningPreferenceApplicationAuthorityPort {
  if (!input.reader || typeof input.reader.readExactApplicationState !== 'function') {
    throw adapterBlocked('canonical_edit_reference_planning_reader_invalid')
  }
  const port: PlanningPreferenceApplicationAuthorityPort = {
    async readExactApplicationState(scope) {
      const resolution = await resolveEditReferenceProductionPlanningAuthority({
        reader: input.reader,
        scope: {
          actorUserId: scope.ownerUserId,
          workspaceId: scope.workspaceId,
          projectId: scope.projectId,
          editSessionId: scope.editSessionId,
        },
      })
      return projectUnreleasedEditReferenceProductionPlanningAuthority(resolution)
    },
  }
  return Object.freeze(port)
}

export function projectUnreleasedEditReferenceProductionPlanningAuthority(
  resolution: EditReferenceProductionPlanningAuthorityResolution,
): PlanningPreferenceApplicationAuthorityResolution {
  const adapterReceipt = resolution.status === 'applied'
    ? createEditReferenceProductionPlannerBindingAdapterReceipt(resolution)
    : null
  const preferenceApplication = adapterReceipt?.preferenceApplication
    ?? createEditReferenceProductionPlannerPreferenceApplicationBinding(resolution)
  const currentState = resolution.status === 'applied'
    ? 'connected' as const
    : resolution.status
  const canonicalLineage = projectCanonicalLineage(resolution, adapterReceipt)
  const payload = {
    schemaVersion: PLANNING_PREFERENCE_APPLICATION_AUTHORITY_PORT_VERSION,
    sourceAuthority: 'canonical_edit_reference_production_repository' as const,
    evidenceClass: 'canonical_contract_fixture_unreleased' as const,
    currentState,
    readRevision: resolution.readRevision,
    accessCheckReceiptId: resolution.accessCheckReceiptId,
    rlsPolicyVersion: resolution.rlsPolicyVersion,
    tenantIsolationVerified: true,
    noLegacyPreferenceIntelligenceStoreRead: true,
    noFallbackAfterAuthorityRead: true as const,
    browserSuppliedPlannerContextTrusted: false as const,
    rawReferenceMediaIncluded: false as const,
    rawProviderPayloadIncluded: false as const,
    productionAuthority: false,
    canonicalLineage,
    preferenceApplication,
  }
  return validatePlanningPreferenceApplicationAuthorityResolution({
    ...payload,
    authorityReceiptHash: sha256AuthorityValue(payload),
  })
}

function projectCanonicalLineage(
  resolution: EditReferenceProductionPlanningAuthorityResolution,
  adapterReceipt: ReturnType<
    typeof createEditReferenceProductionPlannerBindingAdapterReceipt
  > | null,
): PlanningPreferenceApplicationCanonicalLineage {
  if (resolution.status === 'not_selected') {
    return { state: 'not_selected' }
  }
  if (resolution.status === 'cleared') {
    return {
      state: 'cleared',
      applicationId: resolution.applicationId,
      applicationVersion: resolution.applicationVersion,
      applicationHash: resolution.applicationHash,
      lifecycleTransactionId: resolution.lifecycleTransactionId,
      lifecycleReceiptDigestSha256: resolution.lifecycleReceiptDigestSha256,
      committedPlanningInputRevision: resolution.committedPlanningInputRevision,
    }
  }
  if (!adapterReceipt) {
    throw adapterBlocked('canonical_edit_reference_planner_adapter_receipt_missing')
  }
  return {
    state: 'connected',
    applicationId: adapterReceipt.lineage.applicationId,
    applicationVersion: adapterReceipt.lineage.applicationVersionNumber,
    applicationHash: adapterReceipt.preferenceApplication.applicationHash,
    lifecycleTransactionId: adapterReceipt.lineage.lifecycleTransactionId,
    lifecycleReceiptDigestSha256:
      adapterReceipt.lineage.lifecycleReceiptDigestSha256,
    planningContextDigestSha256:
      adapterReceipt.lineage.planningContextDigestSha256,
    adapterDigestSha256: adapterReceipt.adapterDigestSha256,
  }
}

function adapterBlocked(reason: string): ApiError {
  return new ApiError(
    'JOB_DEPENDENCY_NOT_READY',
    'The canonical Edit Reference planning authority adapter is unavailable.',
    503,
    {
      reason,
      requiredGate:
        'server_only_application_and_planning_read_rpc_adapters_verified',
      productionReady: false,
    },
  )
}

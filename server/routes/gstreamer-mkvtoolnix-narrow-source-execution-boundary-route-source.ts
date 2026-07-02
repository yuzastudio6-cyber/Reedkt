export const GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_ROUTE_SOURCE_ID =
  'externalBeta.gstreamerMkvtoolnix.narrowAgent.sourceExecutionBoundaryRouteSource' as const

export const GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_ROUTE_PATH =
  '/api/external-beta/gstreamer-mkvtoolnix/narrow-agent/source-execution-boundary' as const

export const GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_ROUTE_CONFIRM_ENV =
  'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_SOURCE_IMPLEMENTATION' as const

export type GstreamerMkvtoolnixNarrowSourceExecutionRouteSourceStatus =
  | 'accepted_source_file_created_not_registered'
  | 'blocked_invalid_route_source_contract'
  | 'blocked_route_registration_or_execution_not_enabled'
  | 'blocked_unsafe_route_source_scope'
  | 'blocked_public_or_signed_artifact_attempt'
  | 'blocked_delivery_or_unlock_attempt'

export interface GstreamerMkvtoolnixNarrowSourceExecutionRouteSource {
  sourceId: typeof GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_ROUTE_SOURCE_ID
  method: 'POST'
  path: typeof GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_ROUTE_PATH
  routeOwner: 'backend_service_role_only'
  sourceClass: 'generated_fixture_only_narrow_controlled_worker_runtime_source'
  approvedSnapshotRequirement: 'required_before_future_runtime'
  confirmationGate: typeof GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_ROUTE_CONFIRM_ENV
  routeRegistrationMode: 'source_file_created_not_registered'
  routeRuntimeMode: 'disabled_source_contract_only'
  handlerExportedForFutureRegistration: false
  routeRegisteredAtRuntime: false
  productionRouteFileCreated: false
  routeExecution: false
  workerDispatch: false
  persistentJobQueueWrite: false
  serviceRoleSecretPayloadAccess: false
  frontendCredentialExposure: false
  broadServiceRoleHandler: false
  signedUrlCreation: false
  publicArtifactCreation: false
  finalRenderExport: false
  broadExternalBetaUnlock: false
  paidProductionUnlock: false
  productionUnlock: false
}

export interface GstreamerMkvtoolnixNarrowSourceExecutionRouteSourceValidation {
  ok: boolean
  status: GstreamerMkvtoolnixNarrowSourceExecutionRouteSourceStatus
  blockers: GstreamerMkvtoolnixNarrowSourceExecutionRouteSourceStatus[]
  sanitizedRouteSource: GstreamerMkvtoolnixNarrowSourceExecutionRouteSource
}

function pushOnce<T>(list: T[], value: T): void {
  if (!list.includes(value)) list.push(value)
}

export function buildGstreamerMkvtoolnixNarrowSourceExecutionRouteSource(
  overrides: Partial<GstreamerMkvtoolnixNarrowSourceExecutionRouteSource> = {},
): GstreamerMkvtoolnixNarrowSourceExecutionRouteSource {
  return {
    sourceId: GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_ROUTE_SOURCE_ID,
    method: 'POST',
    path: GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_ROUTE_PATH,
    routeOwner: 'backend_service_role_only',
    sourceClass: 'generated_fixture_only_narrow_controlled_worker_runtime_source',
    approvedSnapshotRequirement: 'required_before_future_runtime',
    confirmationGate: GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_ROUTE_CONFIRM_ENV,
    routeRegistrationMode: 'source_file_created_not_registered',
    routeRuntimeMode: 'disabled_source_contract_only',
    handlerExportedForFutureRegistration: false,
    routeRegisteredAtRuntime: false,
    productionRouteFileCreated: false,
    routeExecution: false,
    workerDispatch: false,
    persistentJobQueueWrite: false,
    serviceRoleSecretPayloadAccess: false,
    frontendCredentialExposure: false,
    broadServiceRoleHandler: false,
    signedUrlCreation: false,
    publicArtifactCreation: false,
    finalRenderExport: false,
    broadExternalBetaUnlock: false,
    paidProductionUnlock: false,
    productionUnlock: false,
    ...overrides,
  }
}

export function validateGstreamerMkvtoolnixNarrowSourceExecutionRouteSource(
  source: GstreamerMkvtoolnixNarrowSourceExecutionRouteSource,
): GstreamerMkvtoolnixNarrowSourceExecutionRouteSourceValidation {
  const blockers: GstreamerMkvtoolnixNarrowSourceExecutionRouteSourceStatus[] = []

  if (
    source.sourceId !== GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_ROUTE_SOURCE_ID ||
    source.method !== 'POST' ||
    source.path !== GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_ROUTE_PATH ||
    source.routeOwner !== 'backend_service_role_only' ||
    source.confirmationGate !== GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_ROUTE_CONFIRM_ENV
  ) {
    pushOnce(blockers, 'blocked_invalid_route_source_contract')
  }

  if (
    source.sourceClass !== 'generated_fixture_only_narrow_controlled_worker_runtime_source' ||
    source.approvedSnapshotRequirement !== 'required_before_future_runtime' ||
    source.routeRegistrationMode !== 'source_file_created_not_registered' ||
    source.routeRuntimeMode !== 'disabled_source_contract_only'
  ) {
    pushOnce(blockers, 'blocked_unsafe_route_source_scope')
  }

  if (
    source.handlerExportedForFutureRegistration ||
    source.routeRegisteredAtRuntime ||
    source.productionRouteFileCreated ||
    source.routeExecution ||
    source.workerDispatch ||
    source.persistentJobQueueWrite ||
    source.serviceRoleSecretPayloadAccess ||
    source.frontendCredentialExposure ||
    source.broadServiceRoleHandler
  ) {
    pushOnce(blockers, 'blocked_route_registration_or_execution_not_enabled')
  }

  if (source.signedUrlCreation || source.publicArtifactCreation) {
    pushOnce(blockers, 'blocked_public_or_signed_artifact_attempt')
  }

  if (
    source.finalRenderExport ||
    source.broadExternalBetaUnlock ||
    source.paidProductionUnlock ||
    source.productionUnlock
  ) {
    pushOnce(blockers, 'blocked_delivery_or_unlock_attempt')
  }

  const sanitizedRouteSource = buildGstreamerMkvtoolnixNarrowSourceExecutionRouteSource()
  return {
    ok: blockers.length === 0,
    status: blockers[0] ?? 'accepted_source_file_created_not_registered',
    blockers,
    sanitizedRouteSource,
  }
}

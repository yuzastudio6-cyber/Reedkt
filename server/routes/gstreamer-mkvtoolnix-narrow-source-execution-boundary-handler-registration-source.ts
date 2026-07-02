import {
  GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_ROUTE_CONFIRM_ENV,
  GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_ROUTE_PATH,
  GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_ROUTE_SOURCE_ID,
} from './gstreamer-mkvtoolnix-narrow-source-execution-boundary-route-source'
import {
  buildGstreamerMkvtoolnixNarrowSourceExecutionHandlerContractInput,
  GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_HANDLER_CONTRACT_ID,
  validateGstreamerMkvtoolnixNarrowSourceExecutionHandlerContractInput,
  type GstreamerMkvtoolnixNarrowSourceExecutionHandlerContractInput,
} from './gstreamer-mkvtoolnix-narrow-source-execution-boundary-handler-contract'

export const GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_HANDLER_REGISTRATION_SOURCE_ID =
  'externalBeta.gstreamerMkvtoolnix.narrowAgent.sourceExecutionBoundary.failClosedHandlerRegistrationSource' as const

export const GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_HANDLER_REGISTRATION_PACKET =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-FAIL-CLOSED-HANDLER-REGISTRATION-IMPLEMENTATION-1' as const

export const GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_HANDLER_REGISTRATION_DECISION =
  'completed_gstreamer_mkvtoolnix_narrow_fail_closed_handler_registration_source_metadata' as const

export const GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_HANDLER_REGISTRATION_EXECUTION =
  'completed_source_handler_registration_metadata_no_runtime_registration_or_execution' as const

export const GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_HANDLER_REGISTRATION_NEXT_MILESTONE =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-FAIL-CLOSED-HANDLER-REGISTRATION-QA-ROLLUP-1' as const

export type GstreamerMkvtoolnixNarrowSourceExecutionHandlerRegistrationStatus =
  | 'accepted_fail_closed_handler_registration_source_metadata'
  | 'blocked_missing_registration_confirmation'
  | 'blocked_invalid_handler_contract_reference'
  | 'blocked_invalid_route_source_reference'
  | 'blocked_runtime_handler_registration_not_enabled'
  | 'blocked_route_worker_or_tool_execution_not_enabled'
  | 'blocked_public_or_signed_artifact_attempt'
  | 'blocked_delivery_or_unlock_attempt'

export interface GstreamerMkvtoolnixNarrowSourceExecutionHandlerRegistrationInput {
  confirmation: boolean
  registrationSourceId?: string | null
  handlerContractId?: string | null
  routeId?: string | null
  method?: 'POST' | string | null
  path?: string | null
  routeRegistryStatus?: 'disabled' | 'backend_required' | 'mock_ready' | 'frontend_safe_ready' | string | null
  runtimeMode?: 'backend_required' | 'mock' | 'frontend_safe' | 'worker' | string | null
  registrationMode?: 'source_metadata_only_disabled_backend_required' | string | null
  futureHandlerName?: 'handleGstreamerMkvtoolnixNarrowSourceExecutionBoundary' | string | null
  handlerContractInput?: Partial<GstreamerMkvtoolnixNarrowSourceExecutionHandlerContractInput>
  handlerRuntimeRegistration?: boolean
  handlerRegisteredAtRuntime?: boolean
  routeEnabled?: boolean
  routeExecution?: boolean
  workerDispatch?: boolean
  workerExecution?: boolean
  workerProcessStart?: boolean
  workerLeaseClaim?: boolean
  persistentQueueWrite?: boolean
  gstreamerExecution?: boolean
  mkvtoolnixExecution?: boolean
  dockerExecution?: boolean
  ffmpegFfprobeExecution?: boolean
  remotionExecution?: boolean
  mediaProcessing?: boolean
  privateMediaProcessing?: boolean
  userMediaProcessing?: boolean
  supabaseMutation?: boolean
  sqlExecution?: boolean
  serviceRoleSecretPayloadAccess?: boolean
  frontendCredentialExposure?: boolean
  providerCall?: boolean
  modelCall?: boolean
  signedUrlCreation?: boolean
  publicArtifactCreation?: boolean
  finalRenderExport?: boolean
  broadExternalBetaUnlock?: boolean
  paidProductionUnlock?: boolean
  productionUnlock?: boolean
}

export interface GstreamerMkvtoolnixNarrowSourceExecutionHandlerRegistrationResult {
  packet: typeof GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_HANDLER_REGISTRATION_PACKET
  decision: typeof GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_HANDLER_REGISTRATION_DECISION
  execution: typeof GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_HANDLER_REGISTRATION_EXECUTION
  ok: boolean
  status: GstreamerMkvtoolnixNarrowSourceExecutionHandlerRegistrationStatus
  blockers: GstreamerMkvtoolnixNarrowSourceExecutionHandlerRegistrationStatus[]
  sanitizedRegistration: {
    registrationSourceId: typeof GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_HANDLER_REGISTRATION_SOURCE_ID
    handlerContractId: typeof GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_HANDLER_CONTRACT_ID
    routeId: typeof GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_ROUTE_SOURCE_ID
    method: 'POST'
    path: typeof GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_ROUTE_PATH
    routeRegistryStatus: 'disabled'
    runtimeMode: 'backend_required'
    registrationMode: 'source_metadata_only_disabled_backend_required'
    futureHandlerName: 'handleGstreamerMkvtoolnixNarrowSourceExecutionBoundary'
    confirmationGate: typeof GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_ROUTE_CONFIRM_ENV
    handlerContractAccepted: true
    handlerRuntimeRegistration: false
    handlerRegisteredAtRuntime: false
    routeEnabled: false
    routeExecution: false
    workerDispatch: false
    workerExecution: false
    gstreamerExecution: false
    mkvtoolnixExecution: false
    mediaProcessing: false
    publicArtifactCreation: false
    finalRenderExport: false
  }
  responseShape: {
    status: 'accepted_fail_closed_handler_registration_source_metadata'
    handlerRuntimeRegistration: false
    routeExecution: false
    workerDispatch: false
    workerExecution: false
    toolExecution: false
    nextMilestone: typeof GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_HANDLER_REGISTRATION_NEXT_MILESTONE
  }
  productReadyEndToEndLocalOssTools: 0
  nextMilestone: typeof GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_HANDLER_REGISTRATION_NEXT_MILESTONE
}

function pushOnce<T>(list: T[], value: T): void {
  if (!list.includes(value)) list.push(value)
}

function runtimeRequested(input: GstreamerMkvtoolnixNarrowSourceExecutionHandlerRegistrationInput): boolean {
  return [
    input.handlerRuntimeRegistration,
    input.handlerRegisteredAtRuntime,
    input.routeEnabled,
    input.routeExecution,
    input.workerDispatch,
    input.workerExecution,
    input.workerProcessStart,
    input.workerLeaseClaim,
    input.persistentQueueWrite,
    input.gstreamerExecution,
    input.mkvtoolnixExecution,
    input.dockerExecution,
    input.ffmpegFfprobeExecution,
    input.remotionExecution,
    input.mediaProcessing,
    input.privateMediaProcessing,
    input.userMediaProcessing,
    input.supabaseMutation,
    input.sqlExecution,
    input.serviceRoleSecretPayloadAccess,
    input.frontendCredentialExposure,
    input.providerCall,
    input.modelCall,
  ].some(Boolean)
}

export function buildGstreamerMkvtoolnixNarrowSourceExecutionHandlerRegistrationInput(
  overrides: Partial<GstreamerMkvtoolnixNarrowSourceExecutionHandlerRegistrationInput> = {},
): GstreamerMkvtoolnixNarrowSourceExecutionHandlerRegistrationInput {
  return {
    confirmation: true,
    registrationSourceId: GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_HANDLER_REGISTRATION_SOURCE_ID,
    handlerContractId: GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_HANDLER_CONTRACT_ID,
    routeId: GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_ROUTE_SOURCE_ID,
    method: 'POST',
    path: GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_ROUTE_PATH,
    routeRegistryStatus: 'disabled',
    runtimeMode: 'backend_required',
    registrationMode: 'source_metadata_only_disabled_backend_required',
    futureHandlerName: 'handleGstreamerMkvtoolnixNarrowSourceExecutionBoundary',
    handlerRuntimeRegistration: false,
    handlerRegisteredAtRuntime: false,
    routeEnabled: false,
    routeExecution: false,
    workerDispatch: false,
    workerExecution: false,
    workerProcessStart: false,
    workerLeaseClaim: false,
    persistentQueueWrite: false,
    gstreamerExecution: false,
    mkvtoolnixExecution: false,
    dockerExecution: false,
    ffmpegFfprobeExecution: false,
    remotionExecution: false,
    mediaProcessing: false,
    privateMediaProcessing: false,
    userMediaProcessing: false,
    supabaseMutation: false,
    sqlExecution: false,
    serviceRoleSecretPayloadAccess: false,
    frontendCredentialExposure: false,
    providerCall: false,
    modelCall: false,
    signedUrlCreation: false,
    publicArtifactCreation: false,
    finalRenderExport: false,
    broadExternalBetaUnlock: false,
    paidProductionUnlock: false,
    productionUnlock: false,
    ...overrides,
  }
}

export function validateGstreamerMkvtoolnixNarrowSourceExecutionHandlerRegistrationInput(
  input: GstreamerMkvtoolnixNarrowSourceExecutionHandlerRegistrationInput,
): GstreamerMkvtoolnixNarrowSourceExecutionHandlerRegistrationResult {
  const blockers: GstreamerMkvtoolnixNarrowSourceExecutionHandlerRegistrationStatus[] = []

  if (!input.confirmation) pushOnce(blockers, 'blocked_missing_registration_confirmation')

  if (
    input.registrationSourceId !== GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_HANDLER_REGISTRATION_SOURCE_ID ||
    input.handlerContractId !== GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_HANDLER_CONTRACT_ID
  ) {
    pushOnce(blockers, 'blocked_invalid_handler_contract_reference')
  }

  if (
    input.routeId !== GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_ROUTE_SOURCE_ID ||
    input.method !== 'POST' ||
    input.path !== GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_ROUTE_PATH ||
    input.routeRegistryStatus !== 'disabled' ||
    input.runtimeMode !== 'backend_required' ||
    input.registrationMode !== 'source_metadata_only_disabled_backend_required' ||
    input.futureHandlerName !== 'handleGstreamerMkvtoolnixNarrowSourceExecutionBoundary'
  ) {
    pushOnce(blockers, 'blocked_invalid_route_source_reference')
  }

  const handlerContract = validateGstreamerMkvtoolnixNarrowSourceExecutionHandlerContractInput(
    buildGstreamerMkvtoolnixNarrowSourceExecutionHandlerContractInput(input.handlerContractInput),
  )
  if (!handlerContract.ok) pushOnce(blockers, 'blocked_invalid_handler_contract_reference')

  if (input.handlerRuntimeRegistration || input.handlerRegisteredAtRuntime || input.routeEnabled) {
    pushOnce(blockers, 'blocked_runtime_handler_registration_not_enabled')
  }
  if (runtimeRequested(input)) pushOnce(blockers, 'blocked_route_worker_or_tool_execution_not_enabled')
  if (input.signedUrlCreation || input.publicArtifactCreation) {
    pushOnce(blockers, 'blocked_public_or_signed_artifact_attempt')
  }
  if (
    input.finalRenderExport ||
    input.broadExternalBetaUnlock ||
    input.paidProductionUnlock ||
    input.productionUnlock
  ) {
    pushOnce(blockers, 'blocked_delivery_or_unlock_attempt')
  }

  return {
    packet: GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_HANDLER_REGISTRATION_PACKET,
    decision: GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_HANDLER_REGISTRATION_DECISION,
    execution: GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_HANDLER_REGISTRATION_EXECUTION,
    ok: blockers.length === 0,
    status: blockers[0] ?? 'accepted_fail_closed_handler_registration_source_metadata',
    blockers,
    sanitizedRegistration: {
      registrationSourceId: GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_HANDLER_REGISTRATION_SOURCE_ID,
      handlerContractId: GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_HANDLER_CONTRACT_ID,
      routeId: GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_ROUTE_SOURCE_ID,
      method: 'POST',
      path: GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_ROUTE_PATH,
      routeRegistryStatus: 'disabled',
      runtimeMode: 'backend_required',
      registrationMode: 'source_metadata_only_disabled_backend_required',
      futureHandlerName: 'handleGstreamerMkvtoolnixNarrowSourceExecutionBoundary',
      confirmationGate: GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_ROUTE_CONFIRM_ENV,
      handlerContractAccepted: true,
      handlerRuntimeRegistration: false,
      handlerRegisteredAtRuntime: false,
      routeEnabled: false,
      routeExecution: false,
      workerDispatch: false,
      workerExecution: false,
      gstreamerExecution: false,
      mkvtoolnixExecution: false,
      mediaProcessing: false,
      publicArtifactCreation: false,
      finalRenderExport: false,
    },
    responseShape: {
      status: 'accepted_fail_closed_handler_registration_source_metadata',
      handlerRuntimeRegistration: false,
      routeExecution: false,
      workerDispatch: false,
      workerExecution: false,
      toolExecution: false,
      nextMilestone: GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_HANDLER_REGISTRATION_NEXT_MILESTONE,
    },
    productReadyEndToEndLocalOssTools: 0,
    nextMilestone: GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_HANDLER_REGISTRATION_NEXT_MILESTONE,
  }
}

export function createGstreamerMkvtoolnixNarrowSourceExecutionHandlerRegistrationDisabledResponse(
  input: GstreamerMkvtoolnixNarrowSourceExecutionHandlerRegistrationInput,
): GstreamerMkvtoolnixNarrowSourceExecutionHandlerRegistrationResult['responseShape'] {
  return validateGstreamerMkvtoolnixNarrowSourceExecutionHandlerRegistrationInput(input).responseShape
}

export function summarizeGstreamerMkvtoolnixNarrowSourceExecutionHandlerRegistrationBoundary(): string[] {
  return [
    'Fail-closed handler registration source metadata only; no handler is registered at runtime.',
    'Links the accepted handler contract and disabled/backend-required route metadata for future guarded registration work.',
    'Rejects runtime handler registration, route execution, worker dispatch, worker execution, GStreamer execution, MKVToolNix execution, media processing, Supabase mutation, SQL execution, signed/public artifacts, and unlock attempts.',
    `Confirmation gate: ${GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_ROUTE_CONFIRM_ENV}.`,
  ]
}

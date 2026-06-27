export const EXTERNAL_BETA_CONTROLLED_ENABLEMENT_PACKET =
  'RP-EXTERNAL-BETA-CONTROLLED-ENABLEMENT-1' as const

export const EXTERNAL_BETA_CONTROLLED_ENABLEMENT_SOURCE_DECISION =
  'approved_external_beta_release_go_no_go_source_chain_accepted' as const

export const EXTERNAL_BETA_CONTROLLED_ENABLEMENT_ENV = {
  ready: 'REEDITPRO_EXTERNAL_BETA_READY',
  targetRef: 'REEDITPRO_EXTERNAL_BETA_TARGET_REF',
  scope: 'REEDITPRO_EXTERNAL_BETA_SCOPE',
  rollbackMode: 'REEDITPRO_EXTERNAL_BETA_ROLLBACK_MODE',
} as const

export const EXTERNAL_BETA_CONTROLLED_ENABLEMENT_REQUIRED_VALUES = {
  ready: 'true',
  targetRef: 'wmyyttnynmteqgcdishd',
  scope: 'controlled_private_preview',
  rollbackMode: 'disable_REEDITPRO_EXTERNAL_BETA_READY',
} as const

export type ExternalBetaControlledEnablementStatus =
  | 'disabled_pending_explicit_external_beta_ready_flag'
  | 'enabled_controlled_external_beta_private_preview_only'
  | 'blocked_target_ref_mismatch'
  | 'blocked_scope_mismatch'
  | 'blocked_rollback_mode_missing'

export interface ExternalBetaControlledEnablementInput {
  env?: Record<string, string | undefined>
  sourceDecision?: string
}

export interface ExternalBetaControlledEnablementResult {
  packet: typeof EXTERNAL_BETA_CONTROLLED_ENABLEMENT_PACKET
  sourceDecision: typeof EXTERNAL_BETA_CONTROLLED_ENABLEMENT_SOURCE_DECISION
  ok: boolean
  status: ExternalBetaControlledEnablementStatus
  target: {
    projectName: 'Reeditpro'
    projectRef: 'wmyyttnynmteqgcdishd'
    environment: 'staging'
  }
  flagBoundary: {
    readyEnvName: typeof EXTERNAL_BETA_CONTROLLED_ENABLEMENT_ENV.ready
    targetRefEnvName: typeof EXTERNAL_BETA_CONTROLLED_ENABLEMENT_ENV.targetRef
    scopeEnvName: typeof EXTERNAL_BETA_CONTROLLED_ENABLEMENT_ENV.scope
    rollbackModeEnvName: typeof EXTERNAL_BETA_CONTROLLED_ENABLEMENT_ENV.rollbackMode
    requiredReadyValue: typeof EXTERNAL_BETA_CONTROLLED_ENABLEMENT_REQUIRED_VALUES.ready
    requiredTargetRef: typeof EXTERNAL_BETA_CONTROLLED_ENABLEMENT_REQUIRED_VALUES.targetRef
    requiredScope: typeof EXTERNAL_BETA_CONTROLLED_ENABLEMENT_REQUIRED_VALUES.scope
    requiredRollbackMode: typeof EXTERNAL_BETA_CONTROLLED_ENABLEMENT_REQUIRED_VALUES.rollbackMode
  }
  runtimeBoundary: {
    approvedSnapshotRequired: true
    creditReservationRequired: true
    privateArtifactsOnly: true
    providerModelCallsDisabledByDefault: true
    publicArtifactsAllowed: false
    signedUrlSourceOfTruthAllowed: false
    paidBillingAllowed: false
    finalDeliveryExportAllowed: false
    productionAllowed: false
    broadMediaAllowed: false
  }
  safety: {
    sourceOnlyContract: true
    environmentMutationPerformed: false
    deploymentPerformed: false
    routeExecution: false
    workerExecution: false
    workerDispatch: false
    providerCall: false
    modelCall: false
    supabaseMutation: false
    sqlExecution: false
    secretPayloadAccess: false
    signedUrlCreation: false
    publicArtifactCreation: false
    mediaProcessing: false
    remotionExecution: false
    ffmpegExecution: false
    ffprobeExecution: false
    internalBetaUnlock: false
    externalBetaUnlockAppliedToEnvironment: false
    productionUnlock: false
  }
  blockers: string[]
  nextMilestone: 'RP-EXTERNAL-BETA-STAGING-FLAG-APPLICATION-1'
}

export function evaluateExternalBetaControlledEnablement(
  input: ExternalBetaControlledEnablementInput = {},
): ExternalBetaControlledEnablementResult {
  const env = input.env ?? {}
  const ready = env[EXTERNAL_BETA_CONTROLLED_ENABLEMENT_ENV.ready] ===
    EXTERNAL_BETA_CONTROLLED_ENABLEMENT_REQUIRED_VALUES.ready
  const targetMatches = env[EXTERNAL_BETA_CONTROLLED_ENABLEMENT_ENV.targetRef] ===
    EXTERNAL_BETA_CONTROLLED_ENABLEMENT_REQUIRED_VALUES.targetRef
  const scopeMatches = env[EXTERNAL_BETA_CONTROLLED_ENABLEMENT_ENV.scope] ===
    EXTERNAL_BETA_CONTROLLED_ENABLEMENT_REQUIRED_VALUES.scope
  const rollbackMatches = env[EXTERNAL_BETA_CONTROLLED_ENABLEMENT_ENV.rollbackMode] ===
    EXTERNAL_BETA_CONTROLLED_ENABLEMENT_REQUIRED_VALUES.rollbackMode

  let status: ExternalBetaControlledEnablementStatus = 'disabled_pending_explicit_external_beta_ready_flag'
  const blockers: string[] = []

  if (!ready) {
    blockers.push('missing_REEDITPRO_EXTERNAL_BETA_READY_true')
  } else if (!targetMatches) {
    status = 'blocked_target_ref_mismatch'
    blockers.push('REEDITPRO_EXTERNAL_BETA_TARGET_REF_must_equal_wmyyttnynmteqgcdishd')
  } else if (!scopeMatches) {
    status = 'blocked_scope_mismatch'
    blockers.push('REEDITPRO_EXTERNAL_BETA_SCOPE_must_equal_controlled_private_preview')
  } else if (!rollbackMatches) {
    status = 'blocked_rollback_mode_missing'
    blockers.push('REEDITPRO_EXTERNAL_BETA_ROLLBACK_MODE_must_equal_disable_REEDITPRO_EXTERNAL_BETA_READY')
  } else {
    status = 'enabled_controlled_external_beta_private_preview_only'
  }

  return {
    packet: EXTERNAL_BETA_CONTROLLED_ENABLEMENT_PACKET,
    sourceDecision: EXTERNAL_BETA_CONTROLLED_ENABLEMENT_SOURCE_DECISION,
    ok: status === 'enabled_controlled_external_beta_private_preview_only',
    status,
    target: {
      projectName: 'Reeditpro',
      projectRef: EXTERNAL_BETA_CONTROLLED_ENABLEMENT_REQUIRED_VALUES.targetRef,
      environment: 'staging',
    },
    flagBoundary: {
      readyEnvName: EXTERNAL_BETA_CONTROLLED_ENABLEMENT_ENV.ready,
      targetRefEnvName: EXTERNAL_BETA_CONTROLLED_ENABLEMENT_ENV.targetRef,
      scopeEnvName: EXTERNAL_BETA_CONTROLLED_ENABLEMENT_ENV.scope,
      rollbackModeEnvName: EXTERNAL_BETA_CONTROLLED_ENABLEMENT_ENV.rollbackMode,
      requiredReadyValue: EXTERNAL_BETA_CONTROLLED_ENABLEMENT_REQUIRED_VALUES.ready,
      requiredTargetRef: EXTERNAL_BETA_CONTROLLED_ENABLEMENT_REQUIRED_VALUES.targetRef,
      requiredScope: EXTERNAL_BETA_CONTROLLED_ENABLEMENT_REQUIRED_VALUES.scope,
      requiredRollbackMode: EXTERNAL_BETA_CONTROLLED_ENABLEMENT_REQUIRED_VALUES.rollbackMode,
    },
    runtimeBoundary: {
      approvedSnapshotRequired: true,
      creditReservationRequired: true,
      privateArtifactsOnly: true,
      providerModelCallsDisabledByDefault: true,
      publicArtifactsAllowed: false,
      signedUrlSourceOfTruthAllowed: false,
      paidBillingAllowed: false,
      finalDeliveryExportAllowed: false,
      productionAllowed: false,
      broadMediaAllowed: false,
    },
    safety: {
      sourceOnlyContract: true,
      environmentMutationPerformed: false,
      deploymentPerformed: false,
      routeExecution: false,
      workerExecution: false,
      workerDispatch: false,
      providerCall: false,
      modelCall: false,
      supabaseMutation: false,
      sqlExecution: false,
      secretPayloadAccess: false,
      signedUrlCreation: false,
      publicArtifactCreation: false,
      mediaProcessing: false,
      remotionExecution: false,
      ffmpegExecution: false,
      ffprobeExecution: false,
      internalBetaUnlock: false,
      externalBetaUnlockAppliedToEnvironment: false,
      productionUnlock: false,
    },
    blockers,
    nextMilestone: 'RP-EXTERNAL-BETA-STAGING-FLAG-APPLICATION-1',
  }
}

export function assertExternalBetaControlledEnablementResult(
  result: ExternalBetaControlledEnablementResult,
): void {
  if (result.sourceDecision !== EXTERNAL_BETA_CONTROLLED_ENABLEMENT_SOURCE_DECISION) {
    throw new Error('External beta controlled enablement source decision mismatch.')
  }
  if (result.target.projectRef !== EXTERNAL_BETA_CONTROLLED_ENABLEMENT_REQUIRED_VALUES.targetRef) {
    throw new Error('External beta controlled enablement target mismatch.')
  }
  if (!result.runtimeBoundary.approvedSnapshotRequired) throw new Error('Approved snapshot gate is required.')
  if (!result.runtimeBoundary.creditReservationRequired) throw new Error('Credit reservation gate is required.')
  if (!result.runtimeBoundary.privateArtifactsOnly) throw new Error('Private artifact gate is required.')

  for (const [key, value] of Object.entries(result.runtimeBoundary)) {
    if (key.endsWith('Allowed') && value !== false) {
      throw new Error(`Runtime boundary ${key} must remain false.`)
    }
  }

  for (const [key, value] of Object.entries(result.safety)) {
    if (key === 'sourceOnlyContract') {
      if (value !== true) throw new Error('Source-only contract flag must be true.')
      continue
    }
    if (value !== false) throw new Error(`Safety flag ${key} must remain false.`)
  }
}

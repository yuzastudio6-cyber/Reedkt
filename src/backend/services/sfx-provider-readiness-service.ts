import { getSFXProviderConfig } from '../providers/sfx/sfx-provider-config'
import { assertSFXProviderCallAllowed } from '../providers/sfx/sfx-provider-safety-gates'
import type {
  SFXProviderConfig,
  SFXProviderExecutionReadinessInput,
  SFXProviderExecutionReadinessResult,
  SFXProviderKey,
  SFXProviderReadinessBlockReason,
  SFXProviderReadinessRuntimeMode,
  SFXProviderReadinessSafeNextStep,
} from '../providers/sfx/sfx-provider-contracts'
import { isMMAudioProviderKey, normalizeSFXProviderKey as normalizeProviderKeyValue } from '../providers/sfx/sfx-provider-contracts'

const FUTURE_BACKEND_CAPABILITIES = [
  'backend_worker_runtime_only',
  'secret_manager_reference_resolution',
  'provider_transport_adapter',
  'approved_plan_and_credit_gate_enforcement',
  'private_storage_output_target',
  'provider_provenance_review',
  'provider_failure_refund_path',
]

function nowIso(): string {
  return new Date().toISOString()
}

function readinessProviderKey(input: SFXProviderExecutionReadinessInput): SFXProviderKey {
  const provider = input.promptPlan?.provider ?? input.providerRoute?.recommendedProvider ?? 'no_sfx'
  return normalizeProviderKeyValue(provider)
}

function rawProviderValue(input: SFXProviderExecutionReadinessInput): string | undefined {
  return input.promptPlan?.provider ?? input.providerRoute?.recommendedProvider
}

function isSupportedProviderValue(provider: string | undefined): boolean {
  return !provider ||
    provider === 'mirelo_sfx_v1_5' ||
    provider === 'mmaudio_v2' ||
    provider === 'mmaudio_v' ||
    provider === 'reeditpro_internal_library' ||
    provider === 'no_sfx'
}

function mergeConfig(input: SFXProviderExecutionReadinessInput): SFXProviderConfig {
  const base = getSFXProviderConfig({
    mode: input.mode,
    mireloModelName: input.config?.mireloModelName,
    mmaudioModelName: input.config?.mmaudioModelName,
    outputFormat: input.config?.outputFormat,
  })
  const override = input.config

  return {
    mode: override?.mode ?? base.mode,
    mireloModelName: override?.mireloModelName ?? base.mireloModelName,
    mmaudioModelName: override?.mmaudioModelName ?? base.mmaudioModelName,
    outputFormat: override?.outputFormat ?? base.outputFormat,
    isBrowserRuntime: override?.isBrowserRuntime ?? base.isBrowserRuntime,
    hasMireloCredential: override?.hasMireloCredential ?? base.hasMireloCredential,
    hasMMAudioCredential: override?.hasMMAudioCredential ?? base.hasMMAudioCredential,
    mireloSecretReferenceName: override?.mireloSecretReferenceName ?? base.mireloSecretReferenceName,
    mmaudioSecretReferenceName: override?.mmaudioSecretReferenceName ?? base.mmaudioSecretReferenceName,
  }
}

function inferRuntimeMode(
  input: SFXProviderExecutionReadinessInput,
  config: SFXProviderConfig,
): SFXProviderReadinessRuntimeMode {
  if (input.runtimeMode) return input.runtimeMode
  if (input.forceBrowserRuntime || config.isBrowserRuntime) return 'browser_frontend'
  if (config.mode === 'mock') return 'mock_runtime'
  return 'backend_worker'
}

function addReason(
  reasons: SFXProviderReadinessBlockReason[],
  reason: SFXProviderReadinessBlockReason,
): void {
  if (!reasons.includes(reason)) reasons.push(reason)
}

function secretReferenceForProvider(config: SFXProviderConfig, providerKey: SFXProviderKey): string | undefined {
  if (providerKey === 'mirelo_sfx_v1_5') return config.mireloSecretReferenceName
  if (isMMAudioProviderKey(providerKey)) return config.mmaudioSecretReferenceName
  if (providerKey === 'reeditpro_internal_library') return 'internal-library-approved-assets'
  return undefined
}

function hasRawCredentialHint(config: SFXProviderConfig, providerKey: SFXProviderKey): boolean {
  if (providerKey === 'mirelo_sfx_v1_5') {
    return config.hasMireloCredential && !config.mireloSecretReferenceName
  }
  if (isMMAudioProviderKey(providerKey)) {
    return config.hasMMAudioCredential && !config.mmaudioSecretReferenceName
  }
  return false
}

function isBackendRuntime(runtimeMode: SFXProviderReadinessRuntimeMode): boolean {
  return runtimeMode === 'backend_worker' || runtimeMode === 'node_backend'
}

function selectSafeNextStep(
  reasons: SFXProviderReadinessBlockReason[],
  mode: SFXProviderConfig['mode'],
  providerKey: SFXProviderKey,
): SFXProviderReadinessSafeNextStep {
  if (providerKey === 'no_sfx' || reasons.includes('provider_route_no_sfx')) return 'do_not_generate_sfx'
  if (mode === 'mock' || reasons.includes('provider_mode_mock')) return 'stay_in_mock_mode'
  if (mode === 'disabled' || reasons.includes('provider_mode_disabled')) return 'keep_provider_disabled'
  if (reasons.includes('frontend_runtime_blocked')) return 'move_check_to_backend_worker'
  if (reasons.includes('secret_reference_missing')) return 'configure_secret_references'
  if (reasons.includes('provider_docs_not_reviewed')) return 'review_provider_docs'
  if (
    reasons.includes('edit_plan_not_approved') ||
    reasons.includes('credit_estimate_not_approved') ||
    reasons.includes('credit_reservation_missing')
  ) {
    return 'approve_plan_and_reserve_credits'
  }
  if (reasons.includes('generation_request_missing')) return 'create_generation_request'
  if (reasons.includes('worker_job_missing')) return 'queue_backend_worker_job'
  if (
    reasons.includes('storage_output_not_configured') ||
    reasons.includes('provenance_review_missing') ||
    reasons.includes('source_footage_not_approved')
  ) {
    return 'prepare_storage_and_provenance'
  }
  return 'implement_backend_transport'
}

function createSummary(input: {
  providerKey: SFXProviderKey
  mode: SFXProviderConfig['mode']
  ready: boolean
  reasons: SFXProviderReadinessBlockReason[]
  safeNextStep: SFXProviderReadinessSafeNextStep
}): string {
  if (input.providerKey === 'no_sfx') {
    return 'No real SFX provider execution is needed because the route intentionally chose no SFX.'
  }

  if (input.mode === 'mock') {
    return 'SFX provider readiness is in mock mode; ReeditPro can use mock clients but real provider transport stays disabled.'
  }

  if (input.mode === 'disabled') {
    return 'SFX provider execution is disabled by configuration.'
  }

  if (input.ready) {
    return 'Real SFX provider prerequisites are present for a future backend worker transport; no live provider call is implemented or attempted.'
  }

  return `Real SFX provider execution is blocked: ${input.reasons.join(', ')}. Next step: ${input.safeNextStep}.`
}

export function checkSFXProviderExecutionReadiness(
  input: SFXProviderExecutionReadinessInput,
): SFXProviderExecutionReadinessResult {
  const config = mergeConfig(input)
  const providerKey = readinessProviderKey(input)
  const rawProvider = rawProviderValue(input)
  const runtimeMode = inferRuntimeMode(input, config)
  const blockReasons: SFXProviderReadinessBlockReason[] = []
  const warnings: string[] = []
  const requiredBackendCapabilities = [
    ...FUTURE_BACKEND_CAPABILITIES,
    ...(input.requiredBackendCapabilities ?? []),
  ]

  if (providerKey === 'no_sfx') {
    addReason(blockReasons, 'provider_route_no_sfx')
  }

  if (!isSupportedProviderValue(rawProvider)) {
    addReason(blockReasons, 'unsupported_provider')
    warnings.push(`Unsupported SFX provider value "${rawProvider}" cannot be prepared for real execution.`)
  }

  if (config.mode === 'mock') {
    addReason(blockReasons, 'provider_mode_mock')
    warnings.push('Mock mode is allowed for local demos, but it is not real provider execution readiness.')
  }

  if (config.mode === 'disabled') {
    addReason(blockReasons, 'provider_mode_disabled')
  }

  if (config.mode === 'real' && !isBackendRuntime(runtimeMode)) {
    addReason(blockReasons, 'frontend_runtime_blocked')
  }

  if (
    config.mode === 'real' &&
    providerKey !== 'no_sfx' &&
    providerKey !== 'reeditpro_internal_library' &&
    !secretReferenceForProvider(config, providerKey)
  ) {
    addReason(blockReasons, 'secret_reference_missing')
  }

  if (config.mode === 'real' && hasRawCredentialHint(config, providerKey)) {
    warnings.push('A raw provider credential appears to be present without a Secret Manager reference; real execution must use backend secret references only.')
  }

  if (providerKey !== 'no_sfx' && providerKey !== 'reeditpro_internal_library' && input.providerDocsReviewed !== true) {
    addReason(blockReasons, 'provider_docs_not_reviewed')
  }

  if (!input.providerRoute) {
    addReason(blockReasons, 'provider_route_missing')
  }

  if (input.providerRoute?.recommendedProvider === 'no_sfx') {
    addReason(blockReasons, 'provider_route_no_sfx')
  }

  if (!input.promptPlan && providerKey !== 'no_sfx') {
    addReason(blockReasons, 'prompt_plan_missing')
  }

  if (!input.generationRequest && providerKey !== 'no_sfx') {
    addReason(blockReasons, 'generation_request_missing')
  }

  if (!input.workerJob && providerKey !== 'no_sfx') {
    addReason(blockReasons, 'worker_job_missing')
  }

  if (!input.editPlan && providerKey !== 'no_sfx') {
    addReason(blockReasons, 'edit_plan_not_approved')
  } else if (input.editPlan && (input.editPlan.status !== 'approved' || input.editPlan.approvalStatus !== 'approved')) {
    addReason(blockReasons, 'edit_plan_not_approved')
  }

  if (!input.creditEstimate && providerKey !== 'no_sfx') {
    addReason(blockReasons, 'credit_estimate_not_approved')
  } else if (input.creditEstimate && input.creditEstimate.status !== 'approved') {
    addReason(blockReasons, 'credit_estimate_not_approved')
  }

  if (!input.creditReservation && providerKey !== 'no_sfx') {
    addReason(blockReasons, 'credit_reservation_missing')
  } else if (input.creditReservation && input.creditReservation.status !== 'reserved') {
    addReason(blockReasons, 'credit_reservation_missing')
  }

  if (
    input.workerJob &&
    providerKey !== 'no_sfx' &&
    !['queued', 'waiting_dependency', 'running'].includes(input.workerJob.status)
  ) {
    addReason(blockReasons, 'worker_job_missing')
  }

  if (
    input.eventPlan?.targetLayer === 'source_footage_repair' &&
    input.sourceFootageApproved !== true
  ) {
    addReason(blockReasons, 'source_footage_not_approved')
  }

  if (providerKey !== 'no_sfx' && input.storageOutputConfigured !== true) {
    addReason(blockReasons, 'storage_output_not_configured')
  }

  if (providerKey !== 'no_sfx' && input.provenancePolicyReviewed !== true) {
    addReason(blockReasons, 'provenance_review_missing')
  }

  if (
    providerKey !== 'no_sfx' &&
    input.eventPlan &&
    input.providerRoute &&
    input.promptPlan &&
    input.generationRequest &&
    input.creditReservation
  ) {
    const safetyGate = assertSFXProviderCallAllowed({
      ...input,
      mode: 'mock',
    })
    warnings.push(...safetyGate.warnings)
    if (!safetyGate.ok) {
      addReason(blockReasons, 'safety_gate_blocked')
      warnings.push(safetyGate.message)
    }
  }

  const realPrerequisitesReady = config.mode === 'real' &&
    providerKey !== 'no_sfx' &&
    blockReasons.length === 0
  const safeNextStep = selectSafeNextStep(blockReasons, config.mode, providerKey)

  if (realPrerequisitesReady) {
    warnings.push('Real provider transport is intentionally not implemented; this readiness result is for a future backend worker transport only.')
  }

  return {
    readyForRealTransport: realPrerequisitesReady,
    providerKey,
    providerMode: config.mode,
    runtimeMode,
    blockReasons,
    warnings,
    requiredBackendCapabilities,
    safeNextStep,
    summary: createSummary({
      providerKey,
      mode: config.mode,
      ready: realPrerequisitesReady,
      reasons: blockReasons,
      safeNextStep,
    }),
    checkedAt: nowIso(),
    mockOnly: true,
  }
}

export function createSFXProviderReadinessSummary(
  readiness: SFXProviderExecutionReadinessResult,
): string[] {
  return [
    readiness.summary,
    `Provider: ${readiness.providerKey}. Mode: ${readiness.providerMode}. Runtime: ${readiness.runtimeMode}.`,
    readiness.readyForRealTransport
      ? 'Prerequisites are ready for a future backend transport implementation; no live request is made.'
      : `Blocked by: ${readiness.blockReasons.length ? readiness.blockReasons.join(', ') : 'readiness mode'}.`,
    `Safe next step: ${readiness.safeNextStep}.`,
  ]
}

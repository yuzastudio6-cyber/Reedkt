import type {
  CreditReservationRecord,
  EditPlanRecord,
  GenerationRequestRecord,
  SFXEventPlanRecord,
  SFXPromptPlanRecord,
  SFXProviderRouteRecord,
} from '../../types'
import type {
  SFXProviderIntegrationMode,
  SFXProviderKey,
  SFXProviderOutputFormat,
} from '../providers/sfx'
import { mockSFXWorkerScenarios } from './mock-sfx-worker-scenarios'

export interface MockSFXProviderIntegrationScenario {
  id: string
  label: string
  mode: SFXProviderIntegrationMode
  eventPlan?: SFXEventPlanRecord
  providerRoute?: SFXProviderRouteRecord
  promptPlan?: SFXPromptPlanRecord
  generationRequest?: GenerationRequestRecord
  creditReservation?: CreditReservationRecord
  editPlan?: EditPlanRecord
  providerKey?: SFXProviderKey
  outputFormat?: SFXProviderOutputFormat
  matchedLibraryAssetId?: string | null
  sourceFootageApproved?: boolean
  expectedResult: 'success' | 'blocked' | 'disabled' | 'real_mode_blocked'
  expectedWarning?: string
  expectedNextStep: 'run_sfx_worker_trim_mix_qa' | 'fix_provider_gate' | 'use_fallback_provider'
}

function workerScenario(id: string) {
  const scenario = mockSFXWorkerScenarios.find((item) => item.id === id)

  if (!scenario) {
    throw new Error(`Missing SFX worker scenario: ${id}`)
  }

  return scenario.records
}

function scenarioFromWorker(input: {
  id: string
  label: string
  workerScenarioId: string
  mode?: SFXProviderIntegrationMode
  providerKey?: SFXProviderKey
  outputFormat?: SFXProviderOutputFormat
  matchedLibraryAssetId?: string | null
  includeCreditReservation?: boolean
  sourceFootageApproved?: boolean
  eventOverride?: Partial<SFXEventPlanRecord>
  expectedResult?: MockSFXProviderIntegrationScenario['expectedResult']
  expectedWarning?: string
  expectedNextStep?: MockSFXProviderIntegrationScenario['expectedNextStep']
}): MockSFXProviderIntegrationScenario {
  const records = workerScenario(input.workerScenarioId)
  const eventPlan = records.sfxEventPlan
    ? { ...records.sfxEventPlan, ...input.eventOverride }
    : undefined

  return {
    id: input.id,
    label: input.label,
    mode: input.mode ?? 'mock',
    eventPlan,
    providerRoute: records.sfxProviderRoute,
    promptPlan: records.sfxPromptPlan,
    generationRequest: records.generationRequest,
    creditReservation: input.includeCreditReservation === false ? undefined : records.creditReservation,
    editPlan: records.editPlan,
    providerKey: input.providerKey,
    outputFormat: input.outputFormat,
    matchedLibraryAssetId: input.matchedLibraryAssetId === null
      ? undefined
      : input.matchedLibraryAssetId ?? records.approvedLibraryAssetId,
    sourceFootageApproved: input.sourceFootageApproved,
    expectedResult: input.expectedResult ?? 'success',
    expectedWarning: input.expectedWarning,
    expectedNextStep: input.expectedNextStep ?? 'run_sfx_worker_trim_mix_qa',
  }
}

export const mockSFXProviderIntegrationScenarios: MockSFXProviderIntegrationScenario[] = [
  scenarioFromWorker({ id: 'mirelo-mock-soft-premium-transition', label: 'Mirelo mock soft premium transition whoosh', workerScenarioId: 'mirelo-soft-transition-success' }),
  scenarioFromWorker({ id: 'mirelo-mock-stroke-motion-draw', label: 'Mirelo mock Stroke Motion draw', workerScenarioId: 'mirelo-stroke-draw-success' }),
  scenarioFromWorker({ id: 'mirelo-mock-graphic-design-reveal', label: 'Mirelo mock Graphic Design reveal', workerScenarioId: 'mirelo-graphic-reveal-success' }),
  scenarioFromWorker({ id: 'mirelo-mock-real-motion-settle', label: 'Mirelo mock Real Motion object settle', workerScenarioId: 'mirelo-real-motion-settle-success' }),
  scenarioFromWorker({ id: 'mmaudio-mock-transition-draft', label: 'MMAudio mock short transition draft', workerScenarioId: 'mmaudio-draft-transition-success' }),
  scenarioFromWorker({ id: 'mmaudio-mock-ambient-bridge', label: 'MMAudio mock ambient bridge draft', workerScenarioId: 'mmaudio-ambient-bridge-success' }),
  scenarioFromWorker({ id: 'internal-library-match-found', label: 'Internal library match found', workerScenarioId: 'internal-library-match-used', providerKey: 'reeditpro_internal_library', matchedLibraryAssetId: 'mock-approved-soft-whoosh-001' }),
  scenarioFromWorker({ id: 'internal-library-no-match-fallback-needed', label: 'Internal library no match fallback needed', workerScenarioId: 'internal-library-match-used', providerKey: 'reeditpro_internal_library', matchedLibraryAssetId: null, expectedResult: 'blocked', expectedWarning: 'No approved internal library match was supplied.', expectedNextStep: 'use_fallback_provider' }),
  scenarioFromWorker({ id: 'provider-mode-disabled', label: 'Provider mode disabled', workerScenarioId: 'mirelo-soft-transition-success', mode: 'disabled', expectedResult: 'disabled', expectedWarning: 'SFX provider integration disabled.', expectedNextStep: 'fix_provider_gate' }),
  scenarioFromWorker({ id: 'real-mode-blocked-without-runtime', label: 'Real mode blocked without credentials/runtime', workerScenarioId: 'mirelo-soft-transition-success', mode: 'real', expectedResult: 'real_mode_blocked', expectedWarning: 'Real SFX provider mode is blocked.', expectedNextStep: 'fix_provider_gate' }),
  scenarioFromWorker({ id: 'no-sfx-provider-route-blocked', label: 'No SFX provider route blocked', workerScenarioId: 'provider-route-no-sfx-blocked', expectedResult: 'blocked', expectedWarning: 'No SFX provider selected.', expectedNextStep: 'fix_provider_gate' }),
  scenarioFromWorker({ id: 'avoid-decision-blocked', label: 'Avoid decision blocked', workerScenarioId: 'sfx-decision-avoid-blocked', expectedResult: 'blocked', expectedWarning: 'SFX decision is avoid.', expectedNextStep: 'fix_provider_gate' }),
  scenarioFromWorker({ id: 'not-needed-decision-blocked', label: 'Not-needed decision blocked', workerScenarioId: 'sfx-decision-not-needed-blocked', expectedResult: 'blocked', expectedWarning: 'SFX decision is not needed.', expectedNextStep: 'fix_provider_gate' }),
  scenarioFromWorker({ id: 'missing-credit-reservation-blocked', label: 'Missing credit reservation blocked', workerScenarioId: 'missing-credit-reservation-blocked', includeCreditReservation: false, expectedResult: 'blocked', expectedWarning: 'Credit reservation is required.', expectedNextStep: 'fix_provider_gate' }),
  scenarioFromWorker({ id: 'source-footage-policy-conflict-blocked', label: 'Source-footage policy conflict blocked', workerScenarioId: 'mirelo-soft-transition-success', eventOverride: { targetLayer: 'source_footage_repair', sourceFootagePolicy: 'edit_layer_only_default' }, expectedResult: 'blocked', expectedWarning: 'Source-footage SFX policy is not approved.', expectedNextStep: 'fix_provider_gate' }),
  scenarioFromWorker({ id: 'lake-como-provider-flow', label: 'Lake Como provider flow', workerScenarioId: 'lake-como-lifestyle-flow' }),
  scenarioFromWorker({ id: 'signature-provider-flow', label: 'Signature provider flow', workerScenarioId: 'signature-sfx-flow' }),
]

export function getMockSFXProviderIntegrationScenarioById(id: string) {
  return mockSFXProviderIntegrationScenarios.find((scenario) => scenario.id === id)
}

export function getDefaultMockSFXProviderIntegrationScenario() {
  return mockSFXProviderIntegrationScenarios[0]
}

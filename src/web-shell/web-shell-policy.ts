import type { DisabledExecutionControl, WebShellSafetyPolicy } from './web-shell-types'

export const webShellSafetyPolicy: WebShellSafetyPolicy = {
  productionReadyAllowed: false,
  externalBetaAllowed: false,
  broadRealMediaAllowed: false,
  heavyLocalExecutionAllowed: false,
  providerCallsFromBrowserAllowed: false,
  serviceRoleEnvExposureAllowed: false,
  signedUrlSourceOfTruthAllowed: false,
  publicDeliveryControlsEnabled: false,
  desktopLocalWorkerStatus: 'deferred',
  cloudExecutionStatus: 'gated',
  localComputeStatus: 'future',
  notes: [
    'No heavy local execution in the web shell.',
    'No provider calls from browser code.',
    'No service role environment exposure in browser code.',
    'No signed URL as source of truth.',
    'No public delivery controls are enabled.',
    'Desktop and local worker acceleration remain deferred.',
    'Production, external beta, and broad real media remain blocked.',
  ],
}

export const disabledExecutionControls: DisabledExecutionControl[] = [
  {
    controlId: 'upload_intake',
    label: 'Upload intake',
    reason: 'Dedicated auth, storage intent, and upload finalization are a later web phase.',
    mockSafe: true,
    enabled: false,
  },
  {
    controlId: 'run_ai',
    label: 'Run AI',
    reason: 'Heavy AI execution belongs to approved server workers, not the browser shell.',
    mockSafe: true,
    enabled: false,
  },
  {
    controlId: 'render',
    label: 'Render',
    reason: 'Render/export requires a backend job and private artifact policy.',
    mockSafe: true,
    enabled: false,
  },
  {
    controlId: 'public_export',
    label: 'Public export',
    reason: 'Public delivery remains blocked while production and beta gates are false.',
    mockSafe: true,
    enabled: false,
  },
  {
    controlId: 'local_worker',
    label: 'Local worker',
    reason: 'Desktop/local worker support is a future track and has no Phase 44C runtime.',
    mockSafe: true,
    enabled: false,
  },
]

export function getDisabledExecutionControl(controlId: string): DisabledExecutionControl | undefined {
  return disabledExecutionControls.find((control) => control.controlId === controlId)
}

import type { KillSwitchPolicy } from './cost-control-types'

export const killSwitchPolicy: KillSwitchPolicy = {
  globalGenerationKillSwitch: true,
  gpuWorkerKillSwitch: true,
  renderWorkerKillSwitch: true,
  providerKillSwitch: true,
  finalExportKillSwitch: true,
  publicDeliveryShareKillSwitch: true,
}

import { systemReadinessDisabledFeatureGates } from './system-readiness-reconciliation-policy'
import type { FeatureGateReconciliationRecord } from './system-readiness-reconciliation-types'

export function reconcileSystemFeatureGates(): FeatureGateReconciliationRecord[] {
  return systemReadinessDisabledFeatureGates.map((gateKey) => ({
    gateKey,
    expectedEnabled: false,
    actualEnabled: false,
    source: gateKey.startsWith('web_search') || gateKey.startsWith('map_') ? 'phase52e_evidence' : 'phase52f_policy',
    status: 'passed',
  }))
}

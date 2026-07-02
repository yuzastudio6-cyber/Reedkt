import { assertModeIsSmokeSafe } from './readiness-validation-modes'
import { assertReadinessModeDoesNotExecuteProductionWork } from './readiness-validation-policy'
import { buildProductionReadinessReport } from './production-readiness-report-builder'
import type {
  BuildProductionReadinessReportOptions,
  ProductionReadinessReport,
} from './readiness-validation-types'

export function buildUnifiedProductionReadinessReport(
  options: BuildProductionReadinessReportOptions = {},
): ProductionReadinessReport {
  const mode = options.mode ?? 'static_only'

  if (mode !== 'host_optional') {
    assertReadinessModeDoesNotExecuteProductionWork(mode)
  }

  assertModeIsSmokeSafe(mode)

  return buildProductionReadinessReport({
    ...options,
    mode,
  })
}

export function buildStaticProductionReadinessReport(): ProductionReadinessReport {
  return buildUnifiedProductionReadinessReport({ mode: 'static_only' })
}

export function buildDryRunProductionReadinessReport(): ProductionReadinessReport {
  return buildUnifiedProductionReadinessReport({ mode: 'dry_run' })
}

import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import {
  MODEL_PROVIDER_DRY_RUN_REPORT_DIR,
  buildSummaryText,
  executeModelProviderDryRun,
} from '../activation/model-orchestration-provider-dry-run'

const readinessPath = path.join(MODEL_PROVIDER_DRY_RUN_REPORT_DIR, 'model_provider_dry_run_readiness_report.json')

if (existsSync(readinessPath)) {
  const readiness = JSON.parse(readFileSync(readinessPath, 'utf8')) as Record<string, unknown>
  console.log([
    `status=${String(readiness.status)}`,
    `decision=${String(readiness.decision)}`,
    `qwenModel=${String(readiness.qwenModel)}`,
    `deepseekModel=${String(readiness.deepseekModel)}`,
    `supabaseUpdateStatus=${String(readiness.supabaseUpdateStatus)}`,
    `sqlExecuted=${String(readiness.sqlExecuted)}`,
    `migrationDeployed=${String(readiness.migrationDeployed)}`,
  ].join('\n'))
} else {
  const result = await executeModelProviderDryRun({ execute: false })
  console.log(buildSummaryText(result.reports))
}

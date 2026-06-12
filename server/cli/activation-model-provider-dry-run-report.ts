import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import {
  MODEL_PROVIDER_DRY_RUN_REPORT_DIR,
  executeModelProviderDryRun,
} from '../activation/model-orchestration-provider-dry-run'

const readinessPath = path.join(MODEL_PROVIDER_DRY_RUN_REPORT_DIR, 'model_provider_dry_run_readiness_report.json')

if (existsSync(readinessPath)) {
  console.log(readFileSync(readinessPath, 'utf8').trim())
} else {
  const result = await executeModelProviderDryRun({ execute: false, writeArtifacts: false })
  console.log(JSON.stringify(result.reports.readinessReport, null, 2))
}

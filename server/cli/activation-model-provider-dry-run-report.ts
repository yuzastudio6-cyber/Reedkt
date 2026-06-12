import { executeModelProviderDryRun } from '../activation/model-orchestration-provider-dry-run'

const result = await executeModelProviderDryRun({ execute: false })
console.log(JSON.stringify(result.reports.readinessReport, null, 2))

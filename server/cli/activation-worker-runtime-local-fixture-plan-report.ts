import {
  buildWorkerRuntimeLocalFixturePlanReports,
  writeWorkerRuntimeLocalFixturePlanArtifacts,
} from '../activation/worker-runtime-local-fixture-plan'

const reports = buildWorkerRuntimeLocalFixturePlanReports()
await writeWorkerRuntimeLocalFixturePlanArtifacts(reports)
console.log(JSON.stringify(reports.decision, null, 2))

import {
  buildWorkerRuntimeFixtureHardeningArtifacts,
  buildWorkerRuntimeFixtureHardeningReports,
  writeWorkerRuntimeFixtureHardeningArtifacts,
} from '../activation/worker-runtime-fixture-hardening'

const fixtures = buildWorkerRuntimeFixtureHardeningArtifacts()
const reports = buildWorkerRuntimeFixtureHardeningReports()
await writeWorkerRuntimeFixtureHardeningArtifacts(reports, fixtures)
console.log(JSON.stringify(reports.decision, null, 2))

import {
  writeProviderOutputPlanSnapshotContractReport,
} from '../activation/provider-output-plan-snapshot-contract'

const bundle = await writeProviderOutputPlanSnapshotContractReport()
console.log(JSON.stringify(bundle.report, null, 2))

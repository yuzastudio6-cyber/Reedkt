import { writeOwnerLaneReconciliationArtifacts } from '../activation/open-source-tool-stack-owner-lane-reconciliation-after-batch-1-rollup'

const reports = writeOwnerLaneReconciliationArtifacts()

console.log(JSON.stringify(reports.decision, null, 2))

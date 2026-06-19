import { writeBatch2PlanningArtifacts } from '../activation/open-source-tool-stack-batch-2-planning-after-batch-1-rollup'

const reports = writeBatch2PlanningArtifacts()

console.log(JSON.stringify(reports.decision, null, 2))

import { writeStagedOwnerMergeArtifacts } from '../activation/open-source-tool-stack-staged-owner-merge-plan-after-batch-1-rollup'

const reports = writeStagedOwnerMergeArtifacts()

console.log(JSON.stringify(reports.decision, null, 2))

import { buildRuntimeUnlockReport } from '../activation/runtime-unlock-roadmap'

const report = buildRuntimeUnlockReport()
console.log('Runtime unlock roadmap summary')
console.log(`Phase: ${report.phase}`)
console.log(`Status: ${report.status}`)
console.log(`Unlock ladder stages: ${report.ladder.stages.length}`)
console.log(`Owner matrix rows: ${report.ownerAcceptanceMatrix.rows.length}`)
console.log(`Owner repo-audit prompts: ${report.ownerRepoAuditPrompts.length}`)
console.log(`Phase53B readiness: ${report.phase53BReadiness}`)
console.log('Production/external beta/broad media: blocked')
console.log('Runtime/provider/worker/model/tool execution: blocked')

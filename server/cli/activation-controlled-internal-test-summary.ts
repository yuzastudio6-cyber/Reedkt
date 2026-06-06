import { buildGoNoGoReport } from '../activation/controlled-internal-test-go-no-go'

const report = buildGoNoGoReport()
console.log('Controlled internal test go/no-go summary')
console.log(`Phase: ${report.phase}`)
console.log(`Status: ${report.status}`)
console.log(`Top-level decision: ${report.decisionPacket.topLevelDecision.positive.join(', ')} / ${report.decisionPacket.topLevelDecision.blocked.join(', ')}`)
console.log(`Workstream decisions: ${report.decisionPacket.workstreamDecisions.length}`)
console.log(`Owner prompt packets: ${report.ownerPromptPackets.length}`)
console.log(`Phase52H readiness: ${report.phase52HReadiness}`)
console.log('Production/external beta/broad media: blocked')
console.log('Tool/model/provider/runtime execution: blocked')

import { buildSharedAgentToolArchitectureCommandPlan } from '../activation/shared-agent-tool-architecture'

const plan = buildSharedAgentToolArchitectureCommandPlan()

console.log(`Phase 52A command plan: ${plan.planId}`)
console.log(`Default mode: ${plan.defaultMode}`)
console.log('Commands:')
for (const command of plan.commands) {
  console.log(`- ${command.commandId}: ${command.command} (${command.description})`)
}
console.log('Blocked always:')
for (const blocked of plan.blockedAlways) {
  console.log(`- ${blocked}`)
}

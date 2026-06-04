import { agentRoleRegistry, toolCapabilityManifestSchema, toolOwnershipMap } from '../activation/shared-agent-tool-architecture'

console.log('Shared agent/tool summary')
console.log(`Agents: ${agentRoleRegistry.length}`)
for (const agent of agentRoleRegistry) {
  console.log(`- ${agent.displayName}: ${agent.purpose}`)
}
console.log('')
console.log('Tool ownership:')
for (const group of toolOwnershipMap.groups) {
  console.log(`- ${group.displayName}: ${group.owns.slice(0, 8).join(', ')}${group.owns.length > 8 ? ', ...' : ''}`)
}
console.log('')
console.log('Capability manifest examples:')
for (const example of toolCapabilityManifestSchema.examples ?? []) {
  const record = example as { toolId?: string; status?: string; owner?: string }
  console.log(`- ${record.toolId}: owner=${record.owner}, status=${record.status}`)
}

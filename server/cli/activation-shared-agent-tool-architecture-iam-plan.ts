import { buildSharedAgentToolArchitectureIamPlan } from '../activation/shared-agent-tool-architecture'

const plan = buildSharedAgentToolArchitectureIamPlan()

console.log('Phase 52A IAM plan')
console.log(`Default mutation allowed: ${plan.defaultMutationAllowed}`)
console.log('Storage:')
for (const item of plan.storagePlan) {
  console.log(`- gs://${item.bucket}/${item.prefix}/ -> ${item.role} (${item.condition})`)
}
console.log('Supabase:')
console.log(`- milestone registry writes only: ${plan.supabasePlan.writesAllowedOnlyToMilestoneRegistry}`)
console.log(`- migrations allowed: ${plan.supabasePlan.migrationsAllowed}`)
console.log(`- historical backfill allowed: ${plan.supabasePlan.historicalBackfillAllowed}`)
console.log('Secrets:')
for (const item of plan.secretPlan) {
  console.log(`- ${item.secretName}: ${item.access}; mutation allowed by default=${item.mutationAllowedByDefault}`)
}
console.log('Blocked roles/principals:')
for (const blocked of plan.blockedRoles) {
  console.log(`- ${blocked}`)
}

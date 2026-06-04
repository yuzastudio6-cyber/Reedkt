import { buildMapGeospatialCommandPlans } from '../activation/map-geospatial-approval'

const plans = buildMapGeospatialCommandPlans()

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(plans, null, 2))
} else {
  console.log([
    'Phase 50A map/geospatial future command plan',
    ...plans.map((plan) => `- ${plan.commandId}: ${plan.commandText} (${plan.blockedReason})`),
  ].join('\n'))
}

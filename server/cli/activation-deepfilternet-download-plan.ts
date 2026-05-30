import {
  buildDeepFilterNetDownloadExecutionCommandPlans,
  validateDeepFilterNetDownloadStaticPlan,
} from '../activation/audio-ai-download'

const plan = {
  staticPlan: validateDeepFilterNetDownloadStaticPlan({
    projectId: 'reeditpro',
    region: 'us-central1',
    env: 'staging',
  }),
  commands: buildDeepFilterNetDownloadExecutionCommandPlans(),
}

if (process.argv.includes('--json')) console.log(JSON.stringify(plan, null, 2))
else {
  console.log('Phase 36B DeepFilterNet artifact download plan')
  console.log(`Static plan allowed: ${plan.staticPlan.allowed}`)
  console.log('Commands:')
  for (const command of plan.commands) {
    console.log(`- ${command.commandId}: ${command.phase}; confirmation required: ${command.requiresConfirmation}`)
  }
  console.log('No execution performed in plan mode.')
}

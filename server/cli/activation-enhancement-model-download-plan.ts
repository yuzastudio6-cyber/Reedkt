import {
  buildEnhancementModelDownloadExecutionCommandPlans,
  buildStaticEnhancementModelDownloadCommandPlans,
} from '../activation/enhancement-model-download'

const plan = {
  reportId: 'activation-phase-34b-enhancement-model-download-plan',
  executionMode: 'plan_report_only',
  staticCommandPlans: buildStaticEnhancementModelDownloadCommandPlans(),
  executionCommandPlans: buildEnhancementModelDownloadExecutionCommandPlans(),
  allowedSource: 'https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth',
  blocked: [
    'FILM download/execution',
    'alternate Real-ESRGAN models',
    'GFPGAN/facexlib weights',
    'enhancement inference',
    'slow motion',
    'GPU deploy/jobs',
    'providers',
    'public URLs',
    'production/external beta/broad real media',
  ],
}

if (process.argv.includes('--json')) console.log(JSON.stringify(plan, null, 2))
else {
  console.log(`Enhancement model download plan: ${plan.reportId}`)
  console.log(`Execution mode: ${plan.executionMode}`)
  console.log(`Allowed source: ${plan.allowedSource}`)
  console.log(`Static commands: ${plan.staticCommandPlans.length}`)
  console.log(`Execution command plan steps: ${plan.executionCommandPlans.length}`)
  console.log('')
  console.log('Blocked:')
  for (const item of plan.blocked) console.log(`- ${item}`)
}

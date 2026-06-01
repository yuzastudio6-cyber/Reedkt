import {
  buildOcrRuntimeCommandPlans,
  ocrRuntimeEvidenceToTypeScript,
  runOcrRuntimeDockerBuild,
  runOcrRuntimeVerification,
} from '../activation/ocr-runtime'

const execute = process.argv.includes('--execute')
const keepTemp = process.argv.includes('--keep-temp')
const emitEvidenceModule = process.argv.includes('--emit-approved-evidence-module')
const dockerBuild = process.argv.includes('--docker-build')
const dockerBuildPlan = process.argv.includes('--docker-build-plan')
const runIdArg = process.argv.find((arg) => arg.startsWith('--run-id='))
const runId = runIdArg?.split('=')[1]

if (dockerBuildPlan) {
  console.log('Phase 37C local OCR Docker fallback')
  console.log('No build performed.')
  console.log('Run only if the local macOS/Python runtime is blocked:')
  console.log('REEDITPRO_CONFIRM_OCR_RUNTIME_DOCKER_BUILD=true npm run activation:ocr-runtime -- --docker-build')
} else if (dockerBuild) {
  const output = await runOcrRuntimeDockerBuild({ execute: true })
  console.log(output)
} else if (!execute) {
  const plans = buildOcrRuntimeCommandPlans()
  console.log([
    'Phase 37C generated OCR runtime CLI',
    'No execution performed.',
    'Pass --execute with the Phase 37C confirmation env vars to copy verified private models, run generated fixtures, and upload private QA artifacts.',
    '',
    ...plans.map((plan) => `${plan.commandId}: ${plan.commandString}`),
  ].join('\n'))
} else {
  const result = await runOcrRuntimeVerification({
    execute: true,
    keepTemp,
    runId,
  })
  if (emitEvidenceModule) console.log(ocrRuntimeEvidenceToTypeScript(result.evidence))
  else console.log(JSON.stringify(result, null, 2))
}

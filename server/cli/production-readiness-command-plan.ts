import {
  buildReadinessCommandPlans,
  parseReadinessValidationMode,
} from '../workers/readiness-validation'

function argValue(name: string): string | undefined {
  const prefix = `--${name}=`
  const match = process.argv.find((arg) => arg.startsWith(prefix))
  return match?.slice(prefix.length)
}

const mode = parseReadinessValidationMode(argValue('mode') ?? 'container_command_plan')
if (mode === 'container_runtime' || mode === 'production_blocked') {
  throw new Error(`${mode} is not executable from the M12 command-plan CLI.`)
}

const plans = buildReadinessCommandPlans()
const output = argValue('output') ?? 'text'

if (output === 'json') {
  console.log(JSON.stringify(plans, null, 2))
} else {
  for (const plan of plans) {
    console.log(`# ${plan.label}`)
    console.log(plan.command)
    console.log(`requiredEnvVars=${plan.requiredEnvVars.join(',') || 'none'}`)
    console.log(`doesNotRun=${plan.doesNotRun.join('; ')}`)
    console.log('')
  }
}

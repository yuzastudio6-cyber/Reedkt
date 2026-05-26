import {
  buildUnifiedProductionReadinessReport,
  parseReadinessValidationMode,
  summarizeProductionReadinessReport,
} from '../workers/readiness-validation'

function argValue(name: string): string | undefined {
  const prefix = `--${name}=`
  const match = process.argv.find((arg) => arg.startsWith(prefix))
  return match?.slice(prefix.length)
}

const mode = parseReadinessValidationMode(argValue('mode') ?? process.env.REEDITPRO_READINESS_VALIDATION_MODE)
const output = argValue('output') ?? 'text'
const report = buildUnifiedProductionReadinessReport({ mode })

if (output === 'json') {
  console.log(JSON.stringify(report, null, 2))
} else {
  console.log(summarizeProductionReadinessReport(report))
}

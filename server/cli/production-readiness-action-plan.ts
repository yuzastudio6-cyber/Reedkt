import {
  buildUnifiedProductionReadinessReport,
  parseReadinessValidationMode,
} from '../workers/readiness-validation'

function argValue(name: string): string | undefined {
  const prefix = `--${name}=`
  const match = process.argv.find((arg) => arg.startsWith(prefix))
  return match?.slice(prefix.length)
}

const mode = parseReadinessValidationMode(argValue('mode') ?? process.env.REEDITPRO_READINESS_VALIDATION_MODE)
const output = argValue('output') ?? 'text'
const report = buildUnifiedProductionReadinessReport({ mode })
const { actionPlan } = report

if (output === 'json') {
  console.log(JSON.stringify(actionPlan, null, 2))
} else {
  console.log(`Production readiness action plan: ${actionPlan.status}`)
  console.log(`Current safe stage: ${actionPlan.currentSafeStage}`)
  for (const stage of actionPlan.stages) {
    console.log('')
    console.log(`# ${stage.title}`)
    console.log(`status=${stage.status}`)
    console.log(`tools=${stage.toolIds.length}`)
    console.log(`sourceDeclared=${stage.sourceDeclarationToolIds.length}`)
    console.log(`adapterContracts=${stage.adapterContractToolIds.length}`)
    console.log(`canonicalPrivateRunnerVerified=${stage.canonicalPrivateRunnerVerifiedToolIds.length}`)
    console.log(`canonicalPrivateEndToEndVerified=${stage.canonicalPrivateEndToEndVerifiedToolIds.length}`)
    console.log(`canonicalPrivateJobAdapterVerified=${stage.canonicalPrivateJobAdapterVerifiedToolIds.length}`)
    console.log(`canonicalPrivateBoundaryContractVerified=${stage.canonicalPrivateBoundaryContractVerifiedToolIds.length}`)
    console.log(`productionImageOrReleaseMissing=${stage.productionReadinessMissingToolIds.length}`)
    console.log(`blockers=${stage.blockerCount}`)
    if (stage.sourceDeclarationMissingToolIds.length > 0) {
      console.log(`sourceMissing=${stage.sourceDeclarationMissingToolIds.join(', ')}`)
    }
    if (stage.productionReadinessMissingToolIds.length > 0) {
      console.log(`productionImageOrReleaseMissingTools=${stage.productionReadinessMissingToolIds.join(', ')}`)
    }
    console.log(stage.summary)
    console.log(stage.transitionSummary)
    console.log(`safety=${stage.safetyBoundary}`)
    console.log('requiredEvidence:')
    for (const item of stage.requiredEvidence) console.log(`- ${item}`)
    console.log('nextActions:')
    for (const item of stage.nextActions) console.log(`- ${item}`)
  }
}

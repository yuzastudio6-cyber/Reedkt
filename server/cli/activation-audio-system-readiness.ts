import {
  runAudioSystemReadiness,
  buildAudioSystemReadinessReport,
  summarizeAudioSystemReadinessReport,
} from '../activation/audio-system-readiness'

const execute = process.argv.includes('--execute')
const runIdArg = process.argv.find((arg) => arg.startsWith('--run-id='))
const runId = runIdArg?.split('=')[1]

if (!execute) {
  console.log(summarizeAudioSystemReadinessReport(buildAudioSystemReadinessReport()))
  console.log('')
  console.log(JSON.stringify({
    phase: '36F',
    execute: false,
    message: 'No audio system readiness execution performed. Pass --execute with REEDITPRO_CONFIRM_AUDIO_SYSTEM_INTERNAL_BETA_READINESS=true to run.',
  }, null, 2))
} else {
  const result = await runAudioSystemReadiness({ execute, runId })
  console.log(JSON.stringify({
    phase: '36F',
    runId: result.executionReport.runId,
    status: result.executionReport.qa.status,
    audioSystemInternalFeatureTestingReady: result.executionReport.readiness.audioSystemInternalFeatureTestingReady,
    phase37AReady: result.executionReport.phase37AReadiness.readyForOcrApprovalWorkflow,
    betaScopeManifestUri: result.executionReport.audioBetaScopeManifestUri,
    qaReportUri: result.executionReport.uploadedReport?.gcsUri,
    localReportPath: result.localReportPath,
    localBetaScopePath: result.localBetaScopePath,
    blockers: result.executionReport.qa.blockers,
    warnings: result.executionReport.qa.warnings,
  }, null, 2))
}

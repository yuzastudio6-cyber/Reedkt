import {
  buildAudioStackDemucsReport,
  runAudioStackDemucs,
  summarizeAudioStackDemucsReport,
} from '../activation/audio-stack-demucs'

const execute = process.argv.includes('--execute')

if (!execute) {
  console.log(summarizeAudioStackDemucsReport(buildAudioStackDemucsReport()))
  console.log('')
  console.log(JSON.stringify({
    phase: '36G',
    execute: false,
    message: 'No Demucs download/runtime performed. Pass --execute with REEDITPRO_CONFIRM_AUDIO_STACK_DEMUCS_E2E=true to run the evidence gate.',
  }, null, 2))
} else {
  const report = await runAudioStackDemucs()
  console.log(JSON.stringify({
    phase: '36G',
    status: report.status,
    demucsBlocked: report.approvedEvidence.demucsBlocked,
    demucsDownloadAllowed: report.demucsDownloadAllowed,
    demucsRuntimeAllowed: report.demucsRuntimeAllowed,
    rnnoiseActiveProductFlowAllowed: report.rnnoiseActiveProductFlowAllowed,
    phase37AReady: report.phase37AReadiness.readyForOcrApprovalWorkflow,
    blockers: report.blockers,
    warnings: report.warnings,
  }, null, 2))
}

import { buildAudioStackDemucsReport } from './audio-stack-demucs-report-builder'
import { validateAudioStackDemucsExecutionEnv } from './audio-stack-demucs-policy'

export async function runAudioStackDemucs(): Promise<ReturnType<typeof buildAudioStackDemucsReport>> {
  const validation = validateAudioStackDemucsExecutionEnv()
  const report = buildAudioStackDemucsReport()
  if (!validation.allowed) {
    return {
      ...report,
      blockers: Array.from(new Set([...report.blockers, ...validation.blockers])),
      warnings: Array.from(new Set([...report.warnings, ...validation.warnings])),
      status: 'blocked',
      phase37AReadiness: {
        readyForOcrApprovalWorkflow: false,
        reason: 'Phase 36G execution environment validation failed; fix blockers before using this as the audio stack closure record.',
      },
    }
  }
  return {
    ...report,
    warnings: Array.from(new Set([...report.warnings, ...validation.warnings])),
  }
}

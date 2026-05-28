import { buildTextBehindSubjectFrameReport, summarizeTextBehindSubjectFrameReport } from '../activation/text-behind-subject-frame'

const modeArg = process.argv.find((arg) => arg.startsWith('--mode='))
const mode = modeArg?.split('=')[1] ?? 'report'

if (mode === 'execute') {
  const blockers: string[] = []
  if (process.env.REEDITPRO_ENV !== 'staging') blockers.push('REEDITPRO_ENV=staging is required.')
  if (process.env.REEDITPRO_CONFIRM_TEXT_BEHIND_SUBJECT_FRAME_PREVIEW !== 'true') blockers.push('REEDITPRO_CONFIRM_TEXT_BEHIND_SUBJECT_FRAME_PREVIEW=true is required.')
  if (blockers.length > 0) {
    console.error(`Phase 33E execution is blocked:\n${blockers.map((blocker) => `- ${blocker}`).join('\n')}`)
    process.exit(1)
  }
  console.log('Phase 33E execution is Cloud Run render-job only. Use the report command plan for the exact deploy/execute commands.')
  process.exit(0)
}

console.log(summarizeTextBehindSubjectFrameReport(buildTextBehindSubjectFrameReport()))

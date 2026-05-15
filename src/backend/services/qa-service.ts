import type { QAReportItem, QAReportRecord } from '../../types'
import type { MockDatabase } from '../mock/mock-database'
import { findMockRecord } from '../mock/mock-database'
import { createQAReport, createQAReportItems } from './render-preview-service'
import { fail, ok, type ServiceResult } from '../service-result'

export function runMockQA(
  db: MockDatabase,
  renderId: string,
): ServiceResult<{
  report: QAReportRecord
  items: QAReportItem[]
}> {
  const render = findMockRecord(db, 'renders', renderId)

  if (!render) {
    return fail('RENDER_NOT_FOUND', `Render ${renderId} was not found.`)
  }

  const reportResult = createQAReport(db, renderId)

  if (!reportResult.ok) {
    return reportResult
  }

  return ok({
    report: reportResult.data,
    items: createQAReportItems(reportResult.data),
  })
}

export function checkSpeechClarity(): QAReportItem {
  return createPassingItem('speech_clarity', 'Speech clarity is acceptable for preview.')
}

export function checkCutSmoothness(): QAReportItem {
  return createPassingItem('cut_smoothness', 'Cuts feel intentional and smooth.')
}

export function checkCaptionReadability(): QAReportItem {
  return createPassingItem('caption_readability', 'Captions are readable and avoid overlay collisions.')
}

export function checkMusicBalance(): QAReportItem {
  return createPassingItem('music_balance', 'Music is ducked under speech.')
}

export function checkSfxBalance(): QAReportItem {
  return createPassingItem('sfx_balance', 'SFX do not overpower voice.')
}

export function checkTransitionQuality(): QAReportItem {
  return createPassingItem('transition_quality', 'Transitions match story context.')
}

export function checkSignatureTiming(): QAReportItem {
  return createPassingItem('signature_timing', 'Signature overlay timing aligns to the segment.')
}

export function checkUserInstructionCompliance(): QAReportItem {
  return createPassingItem('user_instruction_compliance', 'User instructions are preserved.')
}

export function checkProfessionalStandard(): QAReportItem {
  return createPassingItem('professional_standard', 'Basic Edit meets a professional standard.')
}

function createPassingItem(checkType: QAReportItem['checkType'], summary: string): QAReportItem {
  return {
    id: `mock-check-${checkType}`,
    checkType,
    status: 'passed',
    score: 95,
    summary,
    blocker: false,
    requiresRetry: false,
  }
}

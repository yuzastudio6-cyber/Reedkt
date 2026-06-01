import type { OcrRuntimeExecutionReport } from './ocr-runtime-types'

export function parseOcrRuntimeExecutionReport(raw: string): OcrRuntimeExecutionReport {
  const parsed = JSON.parse(raw) as OcrRuntimeExecutionReport
  if (parsed.phase !== '37C') throw new Error('OCR runtime execution report is not Phase 37C.')
  if (!parsed.runId?.startsWith('phase37c-')) throw new Error(`OCR runtime execution report has unsafe runId: ${parsed.runId}`)
  if (!Array.isArray(parsed.fixtures) || parsed.fixtures.length === 0) throw new Error('OCR runtime execution report has no fixture results.')
  if (!parsed.safety?.generatedFixturesOnly) throw new Error('OCR runtime execution report did not preserve generated-fixtures-only safety.')
  if (parsed.safety.realMediaUsed || parsed.safety.realVideoInputUsed || parsed.safety.providerExecuted || parsed.safety.publicAccessEnabled || parsed.safety.trackATouched) {
    throw new Error('OCR runtime execution report indicates a blocked scope was used.')
  }
  return parsed
}

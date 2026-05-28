import type { FirstRealVideoRuntimeReport } from './first-real-video-types'

export function summarizeFirstRealVideoQa(report?: FirstRealVideoRuntimeReport): string[] {
  if (!report) return ['Phase 28 QA has not run.']
  return report.qa.gates.map((gate) => `${gate.gateId}: ${gate.status} - ${gate.summary}`)
}

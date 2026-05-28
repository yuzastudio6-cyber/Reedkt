import { validateRealVideoEnhancementSampleReport } from './real-video-enhancement-sample-policy'
import type { RealVideoEnhancementSampleExecutionReport } from './real-video-enhancement-sample-types'

export function buildRealVideoEnhancementSampleBlockers(input: {
  executionReport?: RealVideoEnhancementSampleExecutionReport
}): { blockers: string[]; warnings: string[] } {
  return {
    blockers: validateRealVideoEnhancementSampleReport(input.executionReport),
    warnings: [
      'Subjective enhancement quality risks remain warning-only until a reviewer compares the before/after sample.',
      'Full-frame enhancement and full-video enhancement remain blocked after Phase 34D.',
    ],
  }
}

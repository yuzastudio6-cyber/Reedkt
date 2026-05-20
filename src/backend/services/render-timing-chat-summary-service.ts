import type {
  RenderTimingValidationResult,
  RenderTimingWorkerInputRecord,
} from '../../types/storytiming'

export function createRenderTimingReadyChatSummary(): string {
  return 'The render timing manifest is ready for a mock preview worker. It includes coordinated cuts, captions, music, SFX, signature overlays, transitions, and QA markers.'
}

export function createRenderTimingBlockedChatSummary(validation: RenderTimingValidationResult): string {
  const issue = validation.issues[0]?.replaceAll('_', ' ') ?? 'timing readiness'
  return `The render manifest is not ready yet because ${issue} still blocks worker handoff.`
}

export function createRenderTimingWarningChatSummary(validation: RenderTimingValidationResult): string {
  const warning = validation.warnings[0] ?? 'future render workers still need final asset IDs.'
  return `This manifest is ready with warnings. Mock preview can continue, but ${warning}`
}

export function createRenderTimingWorkerInputSummary(workerInput: RenderTimingWorkerInputRecord): string {
  return `Worker input is mock-ready with ${workerInput.trackCount} track(s), ${workerInput.eventCount} event(s), and ${workerInput.requiredAssets.length} asset requirement type(s).`
}

export function createRenderTimingChatSummary(input: {
  validation: RenderTimingValidationResult
  workerInput?: RenderTimingWorkerInputRecord
}): string[] {
  const summary = input.validation.ok
    ? input.validation.warnings.length > 0
      ? createRenderTimingWarningChatSummary(input.validation)
      : createRenderTimingReadyChatSummary()
    : createRenderTimingBlockedChatSummary(input.validation)

  return [
    summary,
    input.workerInput ? createRenderTimingWorkerInputSummary(input.workerInput) : '',
    'This is a mock timing manifest only. No rendering, media processing, provider call, upload, or worker execution happens here.',
  ].filter(Boolean)
}

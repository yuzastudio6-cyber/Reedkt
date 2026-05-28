export function resolvePhase29PreviewStatus(): {
  status: 'skipped'
  reason: string
} {
  return {
    status: 'skipped',
    reason: 'Proxy preview is intentionally skipped in Phase 29; no existing staging-safe preview path is used and final export remains blocked.',
  }
}

export function buildFirstRealVideoCaptionPlan(): string[] {
  return [
    'Build deterministic caption segments from faster-whisper segment timing.',
    'Write private SRT, WebVTT, and ASS files.',
    'Keep caption line length bounded and strip unsafe ASS override braces.',
    'Do not burn captions into a rendered video in Phase 28.',
  ]
}

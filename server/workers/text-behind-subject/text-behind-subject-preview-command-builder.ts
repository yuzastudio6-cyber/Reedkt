import { validateTextBehindSubjectPolicy } from './text-behind-subject-policy'
import type { TextBehindSubjectExecutionInput, TextBehindSubjectPreviewCommandPlan } from './text-behind-subject-types'

export function buildTextBehindSubjectPreviewCommandPlan(input: TextBehindSubjectExecutionInput): TextBehindSubjectPreviewCommandPlan {
  const policy = validateTextBehindSubjectPolicy(input)
  if (!policy.allowed) {
    throw new Error(`Text-behind-subject preview is blocked: ${policy.blockingReasons.join(', ')}`)
  }
  return {
    command: 'ffmpeg',
    args: [
      '-hide_banner',
      '-nostdin',
      '-i',
      input.proxyVideoArtifactId ?? input.sourceVideoArtifactId ?? '[private-video-ref]',
      '-i',
      input.maskSequenceArtifactId ?? input.foregroundMaskArtifactId ?? '[private-mask-ref]',
      '-f',
      'null',
      '-',
    ],
    executes: false,
    previewOnly: true,
    summary: 'Metadata/preview-only command plan. M15C does not final render, run Revideo, or execute FFmpeg by default.',
  }
}

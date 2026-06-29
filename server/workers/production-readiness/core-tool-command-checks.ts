import type { ProductionToolId } from '../../tool-registry'

export interface CoreToolCommandCheckDefinition {
  toolId: Extract<ProductionToolId, 'ffmpeg' | 'ffprobe' | 'libass' | 'signalsmith_stretch'>
  checkName: string
  command: string
  args: string[]
  expectedPattern?: RegExp
  versionOnly: boolean
  optional: boolean
  manualReviewRequired: boolean
  notes: string[]
}

export const CORE_TOOL_COMMAND_CHECKS: CoreToolCommandCheckDefinition[] = [
  {
    toolId: 'ffmpeg',
    checkName: 'ffmpeg_version',
    command: 'ffmpeg',
    args: ['-version'],
    expectedPattern: /ffmpeg version/i,
    versionOnly: true,
    optional: false,
    manualReviewRequired: false,
    notes: [
      'Version check only; readiness must not process media.',
      'Commercial LGPL-safe build verification remains a separate manual review.',
    ],
  },
  {
    toolId: 'ffprobe',
    checkName: 'ffprobe_version',
    command: 'ffprobe',
    args: ['-version'],
    expectedPattern: /ffprobe version/i,
    versionOnly: true,
    optional: false,
    manualReviewRequired: false,
    notes: ['Version check only; readiness must not inspect user media.'],
  },
  {
    toolId: 'libass',
    checkName: 'ffmpeg_libass_filter_inspection',
    command: 'ffmpeg',
    args: ['-filters'],
    expectedPattern: /\bass\b|subtitle/i,
    versionOnly: false,
    optional: true,
    manualReviewRequired: true,
    notes: [
      'Safe filter-list inspection only; do not render subtitle previews in M10.',
      'Passing filter inspection does not prove font packaging or final caption burn-in readiness.',
    ],
  },
  {
    toolId: 'signalsmith_stretch',
    checkName: 'signalsmith_stretch_version_shape',
    command: 'signalsmith-stretch',
    args: ['-v'],
    expectedPattern: /^\d+\.\d+\.\d+/i,
    versionOnly: true,
    optional: false,
    manualReviewRequired: true,
    notes: [
      'Version-shape check only; readiness must not process audio.',
      'Passing this command check proves local bounded source-build availability only, not production runtime approval.',
    ],
  },
]

export function listCoreToolCommandChecks(): CoreToolCommandCheckDefinition[] {
  return [...CORE_TOOL_COMMAND_CHECKS]
}

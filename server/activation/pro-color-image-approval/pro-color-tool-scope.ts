import type { ProColorImageToolScopeOwner } from './pro-color-image-approval-types'

export const proColorImageToolScopeOwnership: ProColorImageToolScopeOwner[] = [
  {
    scopeId: 'opencolorio-color-management',
    ownerTool: 'opencolorio',
    owns: [
      'color management',
      'LUT/look transforms',
      'OCIO config validation',
      'color-space transforms',
      'ACES/config-aware validation',
      'reproducible professional color transforms',
    ],
    explicitlyDoesNotOwn: [
      'video stream decode',
      'frame extraction',
      'final delivery export',
      'provider calls',
      'Revideo rendering',
    ],
    phase40AStatus: 'planning_only',
  },
  {
    scopeId: 'openimageio-image-io-metadata',
    ownerTool: 'openimageio',
    owns: [
      'robust image/frame I/O',
      'metadata inspection',
      'frame decode/write validation',
      'image sequence validation',
      'image/color format compatibility checks',
    ],
    explicitlyDoesNotOwn: [
      'video stream probe',
      'approved source video extraction',
      'runtime color grading',
      'cloud execution',
      'public delivery',
    ],
    phase40AStatus: 'planning_only',
  },
  {
    scopeId: 'kornia-local-visual-qa',
    ownerTool: 'kornia',
    owns: [
      'local image-processing helpers',
      'image metrics',
      'frame-difference/quality helpers',
      'generated-fixture visual QA helpers',
    ],
    explicitlyDoesNotOwn: [
      'model download',
      'provider-style model execution',
      'real-video production processing',
      'final delivery export',
      'broad media testing',
    ],
    phase40AStatus: 'planning_only',
  },
  {
    scopeId: 'ffmpeg-ffprobe-existing-media-foundation',
    ownerTool: 'ffmpeg_ffprobe',
    owns: [
      'video stream probe/decode',
      'existing signalstats/media validation',
      'frame extraction where a later phase approves it',
      'export integrity checks',
    ],
    explicitlyDoesNotOwn: [
      'OCIO color config validation',
      'OpenImageIO metadata audits',
      'Kornia visual metrics',
      'new Phase 40 runtime work',
    ],
    phase40AStatus: 'existing_scope_preserved',
  },
]

import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { buildMediaArtifactRecord } from '../media/media-artifact-record-builder'
import { assertOutputPathInsideRoot, safeJoinStoragePath } from '../media/media-path-safety'
import { buildAssCaptionText } from './ass-caption-builder'
import { getCaptionStylePreset } from './caption-style-policy'
import { buildSrtCaptionText } from './srt-caption-builder'
import { buildWebVttCaptionText } from './webvtt-caption-builder'
import type { CaptionFileBuildResult, CaptionFileFormat, CaptionSegment, CaptionStylePresetId } from './caption-worker-types'

export function buildCaptionFileText(input: {
  format: CaptionFileFormat
  captions: CaptionSegment[]
  stylePresetId?: CaptionStylePresetId
}): string {
  switch (input.format) {
    case 'srt':
      return buildSrtCaptionText(input.captions)
    case 'webvtt':
      return buildWebVttCaptionText(input.captions)
    case 'ass':
      return buildAssCaptionText(input.captions, getCaptionStylePreset(input.stylePresetId))
  }
}

export async function buildCaptionFile(input: {
  workspaceId: string
  projectId: string
  mediaAssetId: string
  format: CaptionFileFormat
  captions: CaptionSegment[]
  stylePresetId?: CaptionStylePresetId
  mode: 'dry_run' | 'local_dev'
  outputRoot?: string
}): Promise<CaptionFileBuildResult> {
  const text = buildCaptionFileText(input)
  const extension = input.format === 'webvtt' ? 'vtt' : input.format
  const storageObjectPath = safeJoinStoragePath(
    'workspaces',
    input.workspaceId,
    'projects',
    input.projectId,
    'media',
    input.mediaAssetId,
    'captions',
    `captions.${extension}`,
  )
  const artifact = buildMediaArtifactRecord({
    id: `caption-${input.format}-${input.mediaAssetId}`,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    artifactType: 'caption_segments_json',
    storageBucketPurpose: 'transcripts',
    storageObjectPath,
    contentType: contentType(input.format),
    metadata: {
      milestone: 'production_runtime_m7',
      captionFormat: input.format,
      captionCount: input.captions.length,
    },
    previewAllowed: false,
    sourceOfTruth: true,
  })

  if (input.mode === 'local_dev' && input.outputRoot) {
    const outputPath = assertOutputPathInsideRoot(path.join(input.outputRoot, `captions.${extension}`), input.outputRoot)
    await mkdir(path.dirname(outputPath), { recursive: true })
    await writeFile(outputPath, text, 'utf8')
    return { format: input.format, text, artifact, localFilePath: outputPath }
  }

  return { format: input.format, text, artifact }
}

function contentType(format: CaptionFileFormat): string {
  if (format === 'srt') return 'application/x-subrip'
  if (format === 'webvtt') return 'text/vtt'
  return 'text/x-ssa'
}

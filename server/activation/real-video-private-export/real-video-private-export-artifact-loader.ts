import { execFile } from 'node:child_process'
import { mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import { resolvePhase30ApprovedArtifactUris } from './real-video-private-export-source-resolver'

const execFileAsync = promisify(execFile)

export interface Phase30LoadedArtifacts {
  smartCutPlan: Record<string, unknown>
  timelineManifest: Record<string, unknown>
  phase29Qa: Record<string, unknown>
  phase29Report: Record<string, unknown>
  captionSegments: Record<string, unknown>
  phase28CaptionQa: Record<string, unknown>
}

export async function loadPhase30Artifacts(input: { workDir: string }): Promise<Phase30LoadedArtifacts> {
  const uris = resolvePhase30ApprovedArtifactUris()
  await mkdir(input.workDir, { recursive: true })
  const downloads = {
    smartCutPlan: path.join(input.workDir, 'smart-cut-plan.json'),
    timelineManifest: path.join(input.workDir, 'timeline-manifest.json'),
    phase29Qa: path.join(input.workDir, 'smart-cut-caption-qa.json'),
    phase29Report: path.join(input.workDir, 'phase29-report.json'),
    captionSegments: path.join(input.workDir, 'caption-segments.json'),
    phase28CaptionQa: path.join(input.workDir, 'caption-qa.json'),
  }
  await Promise.all([
    downloadGcsJson(uris.smartCutPlan, downloads.smartCutPlan),
    downloadGcsJson(uris.timelineManifest, downloads.timelineManifest),
    downloadGcsJson(uris.phase29Qa, downloads.phase29Qa),
    downloadGcsJson(uris.phase29Report, downloads.phase29Report),
    downloadGcsJson(uris.phase28CaptionSegments, downloads.captionSegments),
    downloadGcsJson(uris.phase28CaptionQa, downloads.phase28CaptionQa),
  ])
  return {
    smartCutPlan: await readJson(downloads.smartCutPlan),
    timelineManifest: await readJson(downloads.timelineManifest),
    phase29Qa: await readJson(downloads.phase29Qa),
    phase29Report: await readJson(downloads.phase29Report),
    captionSegments: await readJson(downloads.captionSegments),
    phase28CaptionQa: await readJson(downloads.phase28CaptionQa),
  }
}

async function downloadGcsJson(uri: string, localPath: string): Promise<void> {
  await execFileAsync('gcloud', ['storage', 'cp', uri, localPath], {
    timeout: 2 * 60_000,
    maxBuffer: 8 * 1024 * 1024,
  })
}

async function readJson(localPath: string): Promise<Record<string, unknown>> {
  return JSON.parse(await readFile(localPath, 'utf8')) as Record<string, unknown>
}

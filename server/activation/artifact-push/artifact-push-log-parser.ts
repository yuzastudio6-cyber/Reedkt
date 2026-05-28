import { basename } from 'node:path'
import {
  artifactPushImageOrder,
  buildArtifactImageManifest,
} from './artifact-image-manifest'
import type {
  ArtifactPushImageId,
  ParsedArtifactPushLog,
  ParsedArtifactPushStatus,
} from './artifact-push-types'

const failurePatterns: Array<{ id: string; pattern: RegExp; message: string }> = [
  { id: 'unauthorized', pattern: /unauthorized|authentication required|unauthenticated/i, message: 'Artifact Registry authentication failed.' },
  { id: 'denied', pattern: /permission denied|access denied|denied:\s|denied requested access|requested access to the resource is denied|\b403 forbidden\b/i, message: 'Artifact Registry push permission denied.' },
  { id: 'not-found', pattern: /repository .*not found|name unknown|\b(?:error|status|code)\s*[:=]?\s*404\b|manifest unknown/i, message: 'Artifact Registry repository or image reference was not found.' },
  { id: 'missing-local-image', pattern: /No such image|image .* not found|An image does not exist locally/i, message: 'Local source image is missing.' },
  { id: 'network', pattern: /timeout|timed out|connection reset|TLS handshake|network/i, message: 'Network failure during push.' },
  { id: 'docker-daemon', pattern: /Cannot connect to the Docker daemon|docker daemon.*not running/i, message: 'Docker daemon is not running.' },
]

const forbiddenPatterns: Array<{ id: string; pattern: RegExp; message: string }> = [
  { id: 'gpu-push', pattern: /reeditpro-staging-gpu-worker|reeditpro-gpu-worker/i, message: 'GPU image push signal detected.' },
  { id: 'deploy', pattern: /\bgcloud\s+run\b|\bcloud\s+run\b|\bdeploy\b/i, message: 'Cloud Run/deployment signal detected.' },
  { id: 'provider', pattern: /\b(provider\s+call|runway|replicate|openai\s+api|gemini\s+api|stripe\s+charge)\b/i, message: 'Provider call signal detected.' },
  { id: 'model-download', pattern: /huggingface-cli|snapshot_download|from_pretrained|download\s+model|model\s+download/i, message: 'Model download signal detected.' },
  { id: 'media-processing', pattern: /\/uploads\/|user[-_\s]?media|\.mp4\b|\.mov\b|\.mkv\b|\.wav\b/i, message: 'Media processing signal detected.' },
  { id: 'secret-value', pattern: /\bsk-[A-Za-z0-9_-]{12,}|AIza[A-Za-z0-9_-]{20,}|secret\s+value|-----BEGIN/i, message: 'Secret-like value detected.' },
]

export function parseArtifactPushLog(logText: string, sourceName = ''): ParsedArtifactPushLog {
  const errors = failurePatterns
    .filter((item) => item.pattern.test(logText))
    .map((item) => `${item.id}: ${item.message}`)
  const forbiddenFindings = forbiddenPatterns
    .filter((item) => item.pattern.test(logText))
    .map((item) => `${item.id}: ${item.message}`)
  const detectedDigest = detectDigest(logText)
  const detectedImageName = detectImageName(logText)
  const imageId = inferArtifactPushImageId(sourceName, logText)
  const success = /pushing manifest for [^\s]+@sha256:[a-f0-9]{32,64}.*done/i.test(logText) ||
    /digest:\s*sha256:[a-f0-9]{32,64}/i.test(logText) ||
    /pushed|layer already exists/i.test(logText) && Boolean(detectedDigest)
  const warnings: string[] = []

  if (!imageId) warnings.push('Could not infer image from push log filename or contents.')
  if (/Layer already exists/i.test(logText)) warnings.push('Docker reported one or more existing layers.')

  return {
    parsedStatus: statusFromFindings(success, errors, forbiddenFindings),
    imageId,
    detectedDigest,
    detectedImageName,
    errors,
    warnings,
    forbiddenFindings,
    nextActions: nextActionsFor(success, errors, forbiddenFindings, imageId),
  }
}

export function inferArtifactPushImageId(sourceName: string, logText: string): ArtifactPushImageId | undefined {
  const haystacks = [basename(sourceName).toLowerCase(), logText.toLowerCase()]
  for (const haystack of haystacks) {
    for (const imageId of artifactPushImageOrder) {
      if (imageId === 'api' && /\bapi\b|reeditpro-staging-api|reeditpro-api/.test(haystack)) return imageId
      if (haystack.includes(imageId)) return imageId
    }

    const manifestMatch = buildArtifactImageManifest({
      project: 'reeditpro',
      artifactRegion: 'us-central1',
      repository: 'reeditpro-staging-workers',
      imageTag: 'staging-local-001',
    }).find((entry) => haystack.includes(entry.targetImageName) || entry.sourceImageNames.some((name) => haystack.includes(name.toLowerCase())))
    if (manifestMatch) return manifestMatch.imageId
  }
  return undefined
}

function statusFromFindings(
  success: boolean,
  errors: string[],
  forbiddenFindings: string[],
): ParsedArtifactPushStatus {
  if (forbiddenFindings.length > 0) return 'blocked'
  if (errors.length > 0) return 'failed'
  if (success) return 'pushed'
  return 'unknown'
}

function detectDigest(logText: string): string | undefined {
  return logText.match(/pushing manifest for [^\s]+@((?:sha256:)[a-f0-9]{32,64})/i)?.[1] ??
    logText.match(/digest:\s*((?:sha256:)[a-f0-9]{32,64})/i)?.[1] ??
    logText.match(/sha256:[a-f0-9]{32,64}/i)?.[0]
}

function detectImageName(logText: string): string | undefined {
  const buildxManifestMatch = logText.match(/pushing manifest for ([^\s@]+)@sha256:[a-f0-9]{32,64}/i)?.[1]
  if (buildxManifestMatch) return buildxManifestMatch
  return logText.match(/(?:repository \[|The push refers to repository \[)([^\]]+)/i)?.[1] ??
    logText.match(/([a-z0-9-]+-docker\.pkg\.dev\/[^\s]+):[A-Za-z0-9_.-]+/i)?.[1]
}

function nextActionsFor(
  success: boolean,
  errors: string[],
  forbiddenFindings: string[],
  imageId?: ArtifactPushImageId,
): string[] {
  if (forbiddenFindings.length > 0) return ['Stop Phase 23B and remove the forbidden push/deploy/provider/model/media/secret signal.']
  if (errors.length > 0) return ['Fix Docker auth, local image availability, repository permissions, or network issue before retrying push.']
  if (success && imageId) return ['Verify the pushed image digest in Artifact Registry and record it for Phase 24B.']
  if (success) return ['Attach this push log to the correct image before using it for Phase 24B readiness.']
  return ['Provide a complete docker push log containing a digest or failure signal.']
}

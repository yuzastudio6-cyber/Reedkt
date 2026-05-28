import { basename } from 'node:path'
import { containerImageBuildPlans } from './container-image-plan'
import type {
  ContainerBuildImageId,
  ParsedContainerBuildLog,
  ParsedContainerBuildStatus,
} from './container-build-types'

const successPatterns = [
  /successfully built\s+([a-f0-9]+)/i,
  /exporting layers/i,
  /naming to\s+(.+)/i,
  /writing image\s+(.+)/i,
  /image id[:\s]+([a-f0-9:]+)/i,
]

const failurePatterns: Array<{ id: string; pattern: RegExp; message: string }> = [
  { id: 'failed-to-solve', pattern: /failed to solve/i, message: 'Docker build failed to solve.' },
  { id: 'npm-error', pattern: /npm ERR!|npm error/i, message: 'npm error detected.' },
  { id: 'pip-error', pattern: /pip (subprocess )?error|ERROR:\s+Could not install|No matching distribution found/i, message: 'pip error detected.' },
  { id: 'apt-error', pattern: /E:\s+Unable to locate package|apt(-get)? .* error|Failed to fetch/i, message: 'apt error detected.' },
  { id: 'no-space', pattern: /no space left on device/i, message: 'No space left on device.' },
  { id: 'network-timeout', pattern: /network timeout|timed out|TLS handshake timeout|connection reset/i, message: 'Network or pull timeout detected.' },
  { id: 'package-not-found', pattern: /package not found|not found in package|No matching distribution found|Unable to locate package/i, message: 'Package not found.' },
  { id: 'permission-denied', pattern: /permission denied/i, message: 'Permission denied.' },
  { id: 'docker-daemon', pattern: /Cannot connect to the Docker daemon|docker daemon.*not running|Is the docker daemon running/i, message: 'Docker daemon is not running.' },
  { id: 'cuda-pull', pattern: /nvidia\/cuda.*(not found|pull access denied|manifest unknown|failed to resolve)/i, message: 'CUDA base image pull failure.' },
]

const forbiddenPatterns: Array<{ id: string; pattern: RegExp; message: string }> = [
  { id: 'model-download', pattern: /huggingface-cli|snapshot_download|from_pretrained|download\s+model|model\s+download/i, message: 'Model download attempt detected.' },
  { id: 'secret', pattern: /\bsk-[A-Za-z0-9_-]{12,}|AIza[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,}|service[_-]?role|secret\s+value|-----BEGIN/i, message: 'Secret-like text detected.' },
  { id: 'revideo-install', pattern: /(npm|pnpm|yarn|pip|apt-get|apt)\s+(install|add)[^\n\r]*(\brevideo\b)/i, message: 'Revideo install detected.' },
  { id: 'gcloud-deploy', pattern: /\bgcloud\b|\bcloud\s+run\b|\bdeploy\b/i, message: 'gcloud or deployment command detected.' },
  { id: 'provider', pattern: /\b(provider\s+call|stripe|runway|replicate|openai|gemini)\b/i, message: 'Provider call detected.' },
  { id: 'real-media', pattern: /\/uploads\/|user[-_\s]?media|\.mp4\b|\.mov\b|\.mkv\b|\.wav\b/i, message: 'Real media processing signal detected.' },
]

export function parseContainerBuildLog(logText: string, sourceName = ''): ParsedContainerBuildLog {
  const errors = failurePatterns
    .filter((item) => item.pattern.test(logText))
    .map((item) => `${item.id}: ${item.message}`)
  const forbiddenFindings = forbiddenPatterns
    .filter((item) => item.pattern.test(logText))
    .map((item) => `${item.id}: ${item.message}`)
  const warnings: string[] = []

  const detectedImageId = detectImageId(logText)
  const detectedDigest = detectDigest(logText)
  const imageId = inferImageId(sourceName, logText)
  const success = successPatterns.some((pattern) => pattern.test(logText))
  const parsedStatus = statusFromFindings(success, errors, forbiddenFindings)

  if (!imageId) warnings.push('Could not infer image from log filename or contents.')
  if (/image size|large image|exceeds.*size/i.test(logText)) warnings.push('Image size warning detected.')

  return {
    parsedStatus,
    imageId,
    detectedImageId,
    detectedDigest,
    errors,
    warnings,
    forbiddenFindings,
    nextActions: nextActionsFor(parsedStatus, errors, forbiddenFindings, imageId),
  }
}

function statusFromFindings(
  success: boolean,
  errors: string[],
  forbiddenFindings: string[],
): ParsedContainerBuildStatus {
  if (forbiddenFindings.length > 0) return 'blocked'
  if (errors.length > 0) return 'failed'
  if (success) return 'passed'
  return 'unknown'
}

function inferImageId(sourceName: string, logText: string): ContainerBuildImageId | undefined {
  const sourceHaystack = basename(sourceName).toLowerCase()
  const sourceMatch = matchImagePlan(sourceHaystack)
  if (sourceMatch) return sourceMatch.imageId

  const logHaystack = logText.toLowerCase()
  return matchImagePlan(logHaystack)?.imageId
}

function matchImagePlan(haystack: string) {
  return containerImageBuildPlans.find((plan) => {
    const imageName = plan.displayName.toLowerCase()
    return haystack.includes(plan.imageId) ||
      haystack.includes(imageName) ||
      haystack.includes(plan.dockerfilePath.toLowerCase())
  })
}

function detectImageId(logText: string): string | undefined {
  return logText.match(/(?:successfully built|image id[:\s]+)\s*([a-f0-9:]{8,})/i)?.[1]
}

function detectDigest(logText: string): string | undefined {
  return logText.match(/sha256:([a-f0-9]{32,64})/i)?.[0]
}

function nextActionsFor(
  status: ParsedContainerBuildStatus,
  errors: string[],
  forbiddenFindings: string[],
  imageId?: ContainerBuildImageId,
): string[] {
  if (forbiddenFindings.length > 0) return ['Stop Phase 20 for this image and remove forbidden behavior before rebuilding.']
  if (errors.length > 0) return ['Review the build log, fix the failing dependency/environment issue, and rerun the human build.']
  if (status === 'passed' && imageId) return ['Record the built image name/tag and continue collecting required image evidence.']
  if (status === 'passed') return ['Attach this log to the correct image before using it for Phase 21 readiness.']
  return ['Provide a complete build log containing a recognizable success or failure signal.']
}

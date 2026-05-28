import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { ContainerBuildCommandPlan, ContainerImageBuildPlan } from './container-build-types'

export const invalidContainerImageTags = new Set(['', 'manual-not-set', 'latest', 'prod', 'production'])

export interface ContainerBuildPolicyCheck {
  allowed: boolean
  blockers: string[]
  warnings: string[]
}

const forbiddenBuildCommandPatterns: Array<{ id: string; pattern: RegExp; summary: string }> = [
  { id: 'docker-push', pattern: /\bdocker\s+push\b/i, summary: 'Docker push belongs to a later phase.' },
  { id: 'gcloud', pattern: /\bgcloud\b/i, summary: 'gcloud is forbidden in Phase 20.' },
  { id: 'deploy', pattern: /\bdeploy\b|\bcloud\s+run\b/i, summary: 'Deployment is forbidden in Phase 20.' },
  { id: 'provider', pattern: /\b(provider\s+call|stripe|runway|replicate|openai|gemini)\b/i, summary: 'Provider calls are forbidden in Phase 20.' },
  { id: 'model-download', pattern: /huggingface-cli|snapshot_download|from_pretrained|download\s+model|model\s+download|wget\s+|curl\s+/i, summary: 'Model downloads are forbidden in Phase 20 build plans.' },
  { id: 'secret', pattern: /\bsk-[A-Za-z0-9_-]{12,}|AIza[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,}|service[_-]?role|secret\s+value|-----BEGIN/i, summary: 'Secrets are forbidden in Phase 20 build plans.' },
  { id: 'media', pattern: /\/media\/|\/uploads\/|user[-_\s]?media|\.mp4\b|\.mov\b|\.mkv\b|\.wav\b/i, summary: 'Build commands must not mount or process user media.' },
  { id: 'inference', pattern: /run\s+inference|torchrun|predict\.py|infer\.py/i, summary: 'Build commands must not run inference.' },
]

const forbiddenDockerfilePatterns: Array<{ id: string; pattern: RegExp; summary: string }> = [
  { id: 'model-download', pattern: /huggingface-cli|snapshot_download|from_pretrained|download\s+model|model\s+download|wget\s+https?:\/\/|curl\s+https?:\/\//i, summary: 'Dockerfile appears to download models or remote assets.' },
  { id: 'secret', pattern: /\bsk-[A-Za-z0-9_-]{12,}|AIza[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,}|secret\s+value|-----BEGIN/i, summary: 'Dockerfile contains secret-like text.' },
  { id: 'revideo', pattern: /(npm|pnpm|yarn|pip|apt-get|apt)\s+(install|add)[^\n\r]*(\brevideo\b)/i, summary: 'Dockerfile appears to install Revideo as a core dependency.' },
  { id: 'gcloud', pattern: /\bgcloud\b|\bcloud\s+run\b|\bdeploy\b/i, summary: 'Dockerfile must not deploy or use gcloud.' },
  { id: 'real-media', pattern: /\/uploads\/|user[-_\s]?media|sample-user-media|\.mp4\b|\.mov\b|\.mkv\b/i, summary: 'Dockerfile must not process real media.' },
  { id: 'rtx-default', pattern: /nvidia-rtx-pro-6000|RTX PRO 6000 default/i, summary: 'GPU Dockerfile must not make RTX PRO 6000 the default target.' },
]

export function validateContainerImageTag(imageTag: string | undefined): ContainerBuildPolicyCheck {
  const tag = imageTag?.trim() ?? ''
  const blockers: string[] = []

  if (invalidContainerImageTags.has(tag)) blockers.push(`Image tag "${tag || '(empty)'}" is not allowed.`)
  if (/\s/.test(tag)) blockers.push('Image tag must not contain whitespace.')
  if (!/^[A-Za-z0-9][A-Za-z0-9_.-]{0,127}$/.test(tag)) blockers.push('Image tag must be Docker-tag safe.')

  return { allowed: blockers.length === 0, blockers, warnings: [] }
}

export function validateContainerImagePlan(plan: ContainerImageBuildPlan, repoRoot = process.cwd()): ContainerBuildPolicyCheck {
  const blockers: string[] = []
  const warnings: string[] = []

  if (!plan.dockerfilePath.startsWith('docker/prod/')) blockers.push(`${plan.imageId} Dockerfile must be under docker/prod.`)
  if (plan.contextPath !== '.') blockers.push(`${plan.imageId} context path must be repo root ".".`)
  if (plan.modelDownloadsAllowed) blockers.push(`${plan.imageId} must not allow model downloads.`)
  if (plan.secretsAllowed) blockers.push(`${plan.imageId} must not allow secrets.`)
  if (plan.revideoAllowed) blockers.push(`${plan.imageId} must not allow Revideo.`)

  const dockerfilePath = join(repoRoot, plan.dockerfilePath)
  if (!existsSync(dockerfilePath)) {
    blockers.push(`${plan.imageId} Dockerfile is missing: ${plan.dockerfilePath}.`)
  } else {
    const dockerfileText = readFileSync(dockerfilePath, 'utf8')
    const dockerfileCheck = validateDockerfileText(dockerfileText, plan.imageId)
    blockers.push(...dockerfileCheck.blockers)
    warnings.push(...dockerfileCheck.warnings)
  }

  if (['api', 'cpu-worker', 'qa-worker', 'render-worker'].includes(plan.imageId)) {
    const forbiddenGpuOrModel = plan.forbiddenTools.filter((tool) => [
      'faster_whisper',
      'whisper_cpp',
      'birefnet',
      'sam2',
      'kornia',
      'deepfilternet',
      'demucs',
      'real_esrgan',
      'film',
      'transparent_background',
      'rembg',
    ].includes(tool))
    if (forbiddenGpuOrModel.length === 0) {
      blockers.push(`${plan.imageId} must forbid GPU/model-weight tools.`)
    }
  }

  if (!plan.forbiddenTools.includes('revideo')) blockers.push(`${plan.imageId} must forbid Revideo.`)
  if (plan.imageId === 'gpu-worker' && !plan.optionalForNonGpuStaging) blockers.push('GPU image must be optional for non-GPU staging.')
  if (plan.imageId === 'gpu-worker' && !plan.heavyBuild) blockers.push('GPU image must be marked as a heavy build.')

  return { allowed: blockers.length === 0, blockers, warnings }
}

export function validateContainerBuildCommandPlan(plan: ContainerBuildCommandPlan): ContainerBuildPolicyCheck {
  const blockers: string[] = []
  const warnings: string[] = []

  if (!plan.safeToRunManually) blockers.push(`${plan.commandId} must be manual-run safe.`)
  if (!plan.requiresHumanConfirmation) blockers.push(`${plan.commandId} must require human confirmation.`)
  for (const forbidden of forbiddenBuildCommandPatterns) {
    if (forbidden.pattern.test(plan.commandString)) blockers.push(`${forbidden.id}: ${forbidden.summary}`)
  }
  if (!plan.commandString.startsWith('docker build ')) blockers.push(`${plan.commandId} should be a Docker build command string.`)
  if (!plan.commandString.includes(' -f docker/prod/')) blockers.push(`${plan.commandId} must use a docker/prod Dockerfile.`)

  return { allowed: blockers.length === 0, blockers, warnings }
}

export function validateDockerfileText(dockerfileText: string, imageId = 'unknown'): ContainerBuildPolicyCheck {
  const executableText = dockerfileText
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('#'))
    .join('\n')
  const blockers = forbiddenDockerfilePatterns
    .filter((forbidden) => forbidden.pattern.test(executableText))
    .map((forbidden) => `${imageId}:${forbidden.id}: ${forbidden.summary}`)

  return { allowed: blockers.length === 0, blockers, warnings: [] }
}

export function validatePackageLockUnchanged(packageLockChanged?: boolean): ContainerBuildPolicyCheck {
  return packageLockChanged
    ? { allowed: false, blockers: ['package-lock.json changed unexpectedly during Phase 20.'], warnings: [] }
    : { allowed: true, blockers: [], warnings: [] }
}

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { containerImageBuildPlans, requiredNonGpuPhase21ImageIds } from './container-image-plan'
import {
  validateContainerImagePlan,
  validateContainerImageTag,
  validateDockerfileText,
  validatePackageLockUnchanged,
} from './container-build-policy'
import type {
  ContainerBuildBlocker,
  ContainerBuildImageId,
  ContainerBuildPhase21Readiness,
  ContainerBuildResult,
  ContainerBuildWarning,
} from './container-build-types'

const gpuModelPackagePatterns = /faster[-_]?whisper|birefnet|sam2|deepfilternet|demucs|real[-_]?esrgan|torchrun|snapshot_download|from_pretrained/i

export interface ContainerBuildBlockerEvaluation {
  blockers: ContainerBuildBlocker[]
  warnings: ContainerBuildWarning[]
  phase21Readiness: ContainerBuildPhase21Readiness
}

export function evaluateContainerBuildBlockers(input: {
  imageTag?: string
  buildResults: ContainerBuildResult[]
  repoRoot?: string
  packageLockChanged?: boolean
}): ContainerBuildBlockerEvaluation {
  const repoRoot = input.repoRoot ?? process.cwd()
  const blockers: ContainerBuildBlocker[] = []
  const warnings: ContainerBuildWarning[] = []

  const tagCheck = validateContainerImageTag(input.imageTag)
  for (const blocker of tagCheck.blockers) blockers.push({ id: 'invalid-image-tag', summary: blocker })

  const packageLockCheck = validatePackageLockUnchanged(input.packageLockChanged)
  for (const blocker of packageLockCheck.blockers) blockers.push({ id: 'package-lock-changed', summary: blocker })

  for (const plan of containerImageBuildPlans) {
    const planCheck = validateContainerImagePlan(plan, repoRoot)
    for (const blocker of planCheck.blockers) blockers.push({ id: `image-plan-${plan.imageId}`, imageId: plan.imageId, summary: blocker })
    for (const warning of planCheck.warnings) warnings.push({ id: `image-plan-warning-${plan.imageId}`, imageId: plan.imageId, summary: warning })

    const dockerfilePath = join(repoRoot, plan.dockerfilePath)
    if (existsSync(dockerfilePath)) {
      const dockerfileText = readFileSync(dockerfilePath, 'utf8')
      const contentBlockers = dockerfileContentBlockers(plan.imageId, dockerfileText)
      for (const blocker of contentBlockers) blockers.push(blocker)
    }
  }

  for (const result of input.buildResults) {
    if (result.imageId === 'unknown') {
      blockers.push({ id: 'unknown-build-log', imageId: 'unknown', summary: 'Build log could not be tied to a known image.' })
      continue
    }

    if (result.status === 'failed' || result.status === 'blocked') {
      blockers.push({ id: `build-result-${result.imageId}`, imageId: result.imageId, summary: `${result.imageId} build result is ${result.status}.` })
    }

    for (const forbidden of result.parsedLog?.forbiddenFindings ?? []) {
      blockers.push({ id: `forbidden-log-${result.imageId}`, imageId: result.imageId, summary: forbidden })
    }

    for (const warning of result.warnings) {
      warnings.push({ id: `build-result-warning-${result.imageId}`, imageId: result.imageId, summary: warning })
    }
  }

  const resultByImage = new Map(input.buildResults.map((result) => [result.imageId, result]))
  const requiredImages = requiredNonGpuPhase21ImageIds()
  const missingRequiredImages = requiredImages.filter((imageId) => resultByImage.get(imageId)?.status !== 'passed')
  for (const imageId of missingRequiredImages) {
    blockers.push({
      id: `missing-build-evidence-${imageId}`,
      imageId,
      summary: `${imageId} must have passing human build evidence before Phase 21 container readiness validation.`,
    })
  }

  const gpuResult = resultByImage.get('gpu-worker')
  const optionalImagesDeferred: ContainerBuildImageId[] = gpuResult?.status === 'passed' ? [] : ['gpu-worker']
  if (optionalImagesDeferred.includes('gpu-worker')) {
    warnings.push({
      id: 'gpu-build-deferred',
      imageId: 'gpu-worker',
      summary: 'GPU image build can be deferred for non-GPU staging, but remains required for the GPU phase.',
    })
  }

  const readinessBlockers = blockers.map((blocker) => blocker.summary)
  const readinessWarnings = warnings.map((warning) => warning.summary)
  const requiredImagesBuilt = requiredImages.filter((imageId) => resultByImage.get(imageId)?.status === 'passed')

  return {
    blockers,
    warnings,
    phase21Readiness: {
      readyForContainerReadinessValidation: readinessBlockers.length === 0,
      readyForNonGpuContainerReadinessValidation: missingRequiredImages.length === 0 &&
        blockers.filter((blocker) => blocker.imageId !== 'gpu-worker').length === 0,
      requiredImagesBuilt,
      optionalImagesDeferred,
      blockers: readinessBlockers,
      warnings: readinessWarnings,
    },
  }
}

function dockerfileContentBlockers(imageId: ContainerBuildImageId, dockerfileText: string): ContainerBuildBlocker[] {
  const blockers: ContainerBuildBlocker[] = []
  const executableText = dockerfileText
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('#'))
    .join('\n')
  const dockerfileCheck = validateDockerfileText(dockerfileText, imageId)
  for (const blocker of dockerfileCheck.blockers) blockers.push({ id: `dockerfile-${imageId}`, imageId, summary: blocker })

  if (imageId === 'api' && /ffmpeg|nvidia|cuda|torch|faster[-_]?whisper|sam2|birefnet|model-weights/i.test(executableText)) {
    blockers.push({ id: 'api-heavy-tools', imageId, summary: 'API Dockerfile appears to include heavy media, GPU, or model tooling.' })
  }

  if (['cpu-worker', 'qa-worker', 'render-worker'].includes(imageId) && gpuModelPackagePatterns.test(executableText)) {
    blockers.push({ id: `non-gpu-model-tools-${imageId}`, imageId, summary: `${imageId} Dockerfile appears to include GPU/model packages.` })
  }

  if (imageId === 'gpu-worker' && /nvidia-rtx-pro-6000/i.test(executableText)) {
    blockers.push({ id: 'gpu-rtx-default', imageId, summary: 'GPU image must not use RTX PRO 6000 as the default build target.' })
  }

  return blockers
}

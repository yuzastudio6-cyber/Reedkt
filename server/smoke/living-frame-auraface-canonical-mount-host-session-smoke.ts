import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import {
  chmod,
  lstat,
  mkdtemp,
  readFile,
  realpath,
  rm,
  writeFile,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawn } from 'node:child_process'

import {
  createLivingFrameControlledIllustrationSourceObservation,
} from '../../src/lib/living-frame/living-frame-controlled-illustration-source-observation-contract'
import {
  createLivingFrameControlledIllustrationSourceObservationFixtureDraft,
} from '../../src/lib/living-frame/living-frame-controlled-illustration-source-observation-fixtures'
import type {
  LivingFrameAuraFaceArtifactRequirement,
} from '../../src/types/living-frame-auraface-artifact-requirements'
import {
  CANONICAL_MODEL_ARTIFACT_DESCRIPTOR_VERSION,
  createCanonicalModelArtifactRepository,
  createCanonicalModelArtifactRepositoryRootAuthority,
  createCanonicalModelArtifactSourceReader,
  ingestCanonicalModelArtifact,
  type CanonicalModelArtifactDescriptor,
  type CanonicalModelArtifactLocator,
} from '../model-artifacts'
import {
  createLivingFrameAuraFaceArtifactRequirements,
} from '../living-frame/living-frame-auraface-artifact-requirements'
import {
  createLivingFrameAuraFacePrivateCanonicalMountHostSessionPort,
  createLivingFrameAuraFacePrivateMountedOfflineRunnerPort,
  type LivingFrameAuraFaceMountedOfflineRunnerInput,
  type LivingFrameAuraFaceMountedOfflineRunnerResult,
} from '../living-frame/living-frame-auraface-canonical-mount-host-session'
import {
  LIVING_FRAME_AURAFACE_ATOMIC_MOUNT_OFFLINE_RUNNER_PROTOCOL,
  LIVING_FRAME_AURAFACE_PREPROCESSING_SPEC_DIGEST,
} from '../living-frame/living-frame-auraface-offline-runner-protocol'

const RUNNER_IMAGE =
  process.env.REEDITPRO_AURAFACE_RUNNER_IMAGE
  ?? 'reeditpro-living-frame-auraface-cpu-candidate:local'

await main()

async function main(): Promise<void> {
  const sources = controlledSourcePaths()
  if (!sources) {
    console.log(JSON.stringify({
      suite:
        'living-frame-auraface-canonical-mount-host-session',
      disposition:
        'skipped_exact_private_artifacts_not_injected',
      requiredEnvironmentVariables: [
        'REEDITPRO_AURAFACE_EMBEDDING_MODEL_SOURCE',
        'REEDITPRO_AURAFACE_DETECTOR_MODEL_SOURCE',
        'REEDITPRO_AURAFACE_FICTIONAL_PORTRAIT_SOURCE',
      ],
      exactCanonicalRepositoryIngestExecuted: false,
      modelInferenceExecuted: false,
      productionReady: false,
    }))
    return
  }
  const {
    embeddingSource,
    detectorSource,
    portraitSource,
  } = sources
  const temporaryRoot = await mkdtemp(
    join(tmpdir(), 'reeditpro-lf-auraface-atomic-mount-'),
  )

  try {
    const { qualification, draft } =
      await createLivingFrameControlledIllustrationSourceObservationFixtureDraft()
    const sourceObservation =
      await createLivingFrameControlledIllustrationSourceObservation({
        qualification,
        draft,
      })
    const requirements =
      await createLivingFrameAuraFaceArtifactRequirements({
        qualification,
        sourceObservation,
      })
    const rootAuthority =
      await createCanonicalModelArtifactRepositoryRootAuthority({
        rootPath: temporaryRoot,
      })
    const repository = createCanonicalModelArtifactRepository({
      rootAuthority,
    })
    const sourcePaths =
      [embeddingSource, detectorSource] as const
    const locators: CanonicalModelArtifactLocator[] = []
    for (const [index, requirement] of
      requirements.artifacts.entries()) {
      const sourcePath = sourcePaths[index]!
      await assertExactSource(sourcePath, requirement)
      const descriptor = descriptorFor(
        requirement,
        requirements.sourceBindings
          .controlledSourceObservationDigestSha256,
        requirements.sourceBindings.licenseDocumentDigestSha256,
        requirements.sourceBindings.modelCardDigestSha256,
      )
      const reader = createCanonicalModelArtifactSourceReader({
        descriptor,
        openServerOwnedByteStream: async () =>
          createReadStream(sourcePath),
      })
      const receipt = await ingestCanonicalModelArtifact({
        repository,
        sourceReader: reader,
      })
      locators.push(receipt.locator)
    }

    const portrait =
      Uint8Array.from(await readFile(portraitSource))
    const portraitDigest = sha256(portrait)
    assert.equal(
      Buffer.from(portrait.subarray(0, 8)).toString('hex'),
      '89504e470d0a1a0a',
    )
    const runnerPort =
      createLivingFrameAuraFacePrivateMountedOfflineRunnerPort(
        runMountedContainer,
      )
    const sessionPort =
      createLivingFrameAuraFacePrivateCanonicalMountHostSessionPort({
        sessionId: 'lf.auraface.atomic.integration.001',
        artifactRequirements: requirements,
        repository,
        artifactLocators: locators as [
          CanonicalModelArtifactLocator,
          CanonicalModelArtifactLocator,
        ],
        runnerPort,
        leaseDurationMs: 120_000,
      })
    const result = await sessionPort.executeOne({
      artifactRequirementSetDigestSha256:
        requirements.requirementSetDigestSha256,
      referenceImage: {
        contentType: 'image/png',
        contentSha256: portraitDigest,
        contentBytes: portrait,
      },
      candidateImage: {
        contentType: 'image/png',
        contentSha256: portraitDigest,
        contentBytes: portrait,
      },
      preprocessingSpecDigestSha256:
        LIVING_FRAME_AURAFACE_PREPROCESSING_SPEC_DIGEST,
      callerThresholdAccepted: false,
      identityApprovalRequested: false,
      externalNetworkAllowed: false,
      runtimeDownloadsAllowed: false,
    })
    assert.equal(result.atomicMountAndInferenceCompleted, true)
    assert.equal(
      result.hostExecutionResult.terminalState,
      'completed',
    )
    assert.equal(
      result.hostExecutionResult.faceOutcome,
      'exactly_one_face_each',
    )
    assert.equal(
      result.hostExecutionResult.detectorInferenceExecuted,
      true,
    )
    assert.equal(
      result.hostExecutionResult.embeddingInferenceExecuted,
      true,
    )
    assert.equal(
      result.hostExecutionResult.referenceEmbedding?.length,
      512,
    )
    assert.equal(
      result.hostExecutionResult.candidateEmbedding?.length,
      512,
    )
    assert.equal(
      result.modelBindingPacket.bindings.every(
        (binding) =>
          binding.objectVerifiedBeforeConsumer
          && binding.objectVerifiedAfterConsumer,
      ),
      true,
    )
    const serialized = JSON.stringify(result)
    for (const forbidden of [
      ['temporary_repository_root', temporaryRoot],
      ['embedding_source_path', embeddingSource],
      ['detector_source_path', detectorSource],
      ['portrait_source_path', portraitSource],
      ['source_absolute_path_field', '"sourceAbsolutePath"'],
      ['container_mount_path_field', '"fixedContainerMountPath"'],
      ['file_url', 'file://'],
      ['network_url', 'https://'],
    ] as const) {
      assert.equal(
        serialized.includes(forbidden[1]),
        false,
        `safe result leaked ${forbidden[0]}`,
      )
    }

    const tamperingRunner =
      createLivingFrameAuraFacePrivateMountedOfflineRunnerPort(
        async (input) => {
          const response = await runMountedContainer(input)
          const detector =
            input.modelSources[1].sourceAbsolutePath
          await chmod(detector, 0o600)
          await writeFile(detector, Buffer.from('tamper'), {
            flag: 'a',
          })
          return response
        },
      )
    const tamperingSession =
      createLivingFrameAuraFacePrivateCanonicalMountHostSessionPort({
        sessionId: 'lf.auraface.atomic.integration.tamper',
        artifactRequirements: requirements,
        repository,
        artifactLocators: locators as [
          CanonicalModelArtifactLocator,
          CanonicalModelArtifactLocator,
        ],
        runnerPort: tamperingRunner,
        leaseDurationMs: 120_000,
      })
    await assert.rejects(
      () => tamperingSession.executeOne({
        artifactRequirementSetDigestSha256:
          requirements.requirementSetDigestSha256,
        referenceImage: {
          contentType: 'image/png',
          contentSha256: portraitDigest,
          contentBytes: portrait,
        },
        candidateImage: {
          contentType: 'image/png',
          contentSha256: portraitDigest,
          contentBytes: portrait,
        },
        preprocessingSpecDigestSha256:
          LIVING_FRAME_AURAFACE_PREPROCESSING_SPEC_DIGEST,
        callerThresholdAccepted: false,
        identityApprovalRequested: false,
        externalNetworkAllowed: false,
        runtimeDownloadsAllowed: false,
      }),
    )

    console.log(
      'Living Frame AuraFace canonical mount host session passed '
        + 'exact model ingest, nested before/after verification, '
        + 'network-isolated mounted inference, no path leakage, '
        + 'single-use session behavior, and post-inference tamper refusal.',
    )
  } finally {
    await rm(temporaryRoot, { force: true, recursive: true })
  }
}

function descriptorFor(
  requirement: LivingFrameAuraFaceArtifactRequirement,
  sourceObservationDigestSha256: string,
  sourceLicenseDocumentSha256: string,
  modelCardDocumentSha256: string,
): CanonicalModelArtifactDescriptor {
  return {
    descriptorVersion:
      CANONICAL_MODEL_ARTIFACT_DESCRIPTOR_VERSION,
    artifactId: requirement.artifactIdentityCode,
    revision: requirement.sourceRevision,
    artifactFormat: 'onnx',
    artifactRole: requirement.artifactRole,
    modelFamily: requirement.modelFamily,
    byteLength: requirement.byteLength,
    contentSha256: requirement.contentSha256,
    consumerScopes: [requirement.consumerScope],
    repositoryAdmission: 'controlled_internal_test',
    sourceObservationDigestSha256,
    reviewEvidenceDigestSha256:
      sha256(`review:${requirement.requirementDigestSha256}`),
    securityReviewDigestSha256:
      sha256(`security:${requirement.requirementDigestSha256}`),
    licensePolicy: {
      modelArtifactLicense: 'apache-2.0-source-label-observation',
      commercialUseStatus: 'needs_review',
      reviewStatus: 'evaluation_only',
      redistributionAllowed: false,
      requiresAttribution: false,
      paidProductionUseApproved: false,
      sourceLicenseDocumentSha256,
      modelCardDocumentSha256,
    },
    executionPolicy: {
      executionClass: 'cpu_permitted',
      requiredExecutionTarget: 'private_controlled_cpu',
      accelerator: 'none',
      cpuFallbackAllowed: false,
      runtimeDownloadAllowed: false,
      networkFetchAllowed: false,
    },
    callerBytesAccepted: false,
    callerPathAccepted: false,
    callerUrlAccepted: false,
  }
}

async function assertExactSource(
  sourcePath: string,
  requirement: LivingFrameAuraFaceArtifactRequirement,
): Promise<void> {
  const canonical = await realpath(sourcePath)
  assert.equal(canonical, sourcePath)
  const stat = await lstat(sourcePath)
  assert.equal(stat.isFile(), true)
  assert.equal(stat.isSymbolicLink(), false)
  assert.equal(stat.size, requirement.byteLength)
  assert.equal(
    await fileSha256(sourcePath),
    requirement.contentSha256,
  )
}

function fileSha256(path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256')
    const stream = createReadStream(path)
    stream.on('data', (chunk) => hash.update(chunk))
    stream.on('error', reject)
    stream.on('end', () => resolve(hash.digest('hex')))
  })
}

async function runMountedContainer(
  input: LivingFrameAuraFaceMountedOfflineRunnerInput,
): Promise<LivingFrameAuraFaceMountedOfflineRunnerResult> {
  const args = [
    'run',
    '--rm',
    '-i',
    '--platform',
    'linux/amd64',
    '--network',
    'none',
    '--read-only',
    '--cap-drop',
    'ALL',
    '--security-opt',
    'no-new-privileges',
    '--pids-limit',
    '64',
    '--memory',
    '4g',
    '--cpus',
    '4',
    '--tmpfs',
    '/tmp:rw,noexec,nosuid,nodev,size=64m',
  ]
  for (const source of input.modelSources) {
    args.push(
      '--mount',
      `type=bind,src=${source.sourceAbsolutePath},dst=${source.fixedContainerMountPath},readonly`,
    )
  }
  args.push(RUNNER_IMAGE)
  const responseJson = await spawnBounded(
    'docker',
    args,
    input.requestJson,
  )
  return {
    responseJson,
    requestEnvelopeSha256: input.requestEnvelopeSha256,
    externalNetworkPerformed: false,
    runtimeDownloadPerformed: false,
    productionQualified: false,
  }
}

function spawnBounded(
  command: string,
  args: readonly string[],
  stdin: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    const stdout: Buffer[] = []
    const stderr: Buffer[] = []
    let stdoutBytes = 0
    let stderrBytes = 0
    let settled = false
    const timeout = setTimeout(() => {
      child.kill('SIGKILL')
      settleReject(new Error('mounted_runner_timeout'))
    }, 120_000)
    child.stdout.on('data', (chunk: Buffer) => {
      stdoutBytes += chunk.length
      if (stdoutBytes > 128 * 1024) {
        child.kill('SIGKILL')
        settleReject(new Error('mounted_runner_stdout_ceiling'))
        return
      }
      stdout.push(chunk)
    })
    child.stderr.on('data', (chunk: Buffer) => {
      stderrBytes += chunk.length
      if (stderrBytes > 16 * 1024) {
        child.kill('SIGKILL')
        settleReject(new Error('mounted_runner_stderr_ceiling'))
      }
      stderr.push(chunk)
    })
    child.on('error', (error) => {
      settleReject(error)
    })
    child.stdin.on('error', (error) => {
      if ((error as NodeJS.ErrnoException).code !== 'EPIPE') {
        settleReject(error)
      }
    })
    child.on('close', (code) => {
      if (code !== 0) {
        settleReject(new Error('mounted_runner_failed'))
        return
      }
      settleResolve(Buffer.concat(stdout).toString('utf8'))
    })
    const request = JSON.parse(stdin) as {
      readonly schemaVersion?: unknown
    }
    assert.equal(
      request.schemaVersion,
      LIVING_FRAME_AURAFACE_ATOMIC_MOUNT_OFFLINE_RUNNER_PROTOCOL,
    )
    assert.equal(
      Buffer.byteLength(stdin, 'utf8') <= 24 * 1024 * 1024,
      true,
    )
    child.stdin.end(stdin)

    function settleReject(error: Error): void {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      reject(error)
    }
    function settleResolve(value: string): void {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      resolve(value)
    }
  })
}

function controlledSourcePaths(): {
  readonly embeddingSource: string
  readonly detectorSource: string
  readonly portraitSource: string
} | undefined {
  const values = {
    embeddingSource:
      process.env.REEDITPRO_AURAFACE_EMBEDDING_MODEL_SOURCE,
    detectorSource:
      process.env.REEDITPRO_AURAFACE_DETECTOR_MODEL_SOURCE,
    portraitSource:
      process.env.REEDITPRO_AURAFACE_FICTIONAL_PORTRAIT_SOURCE,
  }
  if (Object.values(values).some((value) => !value)) {
    return undefined
  }
  if (
    !values.embeddingSource!.startsWith('/')
    || !values.detectorSource!.startsWith('/')
    || !values.portraitSource!.startsWith('/')
  ) {
    throw new Error(
      'Controlled AuraFace fixture paths must be absolute.',
    )
  }
  return values as {
    readonly embeddingSource: string
    readonly detectorSource: string
    readonly portraitSource: string
  }
}

function sha256(value: Uint8Array | string): string {
  return createHash('sha256').update(value).digest('hex')
}

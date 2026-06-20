import {
  createHash,
} from 'node:crypto'
import {
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises'
import {
  tmpdir,
} from 'node:os'
import {
  join,
} from 'node:path'
import type {
  SyntheticFixtureDryRunArtifact,
  SyntheticFixtureDryRunResult,
} from './synthetic-fixture-dry-run-types'
import {
  generateBinaryFixtureArtifactBuffer,
} from './binary-fixture-generators'
import type {
  BinaryFixtureArtifactSummary,
  BinaryFixtureGenerationPlan,
  BinaryFixtureGenerationResult,
  BinaryFixtureGenerationRunSummary,
  BinaryFixtureGeneratorName,
  BinaryFixtureGenerationOptions,
} from './binary-fixture-generation-types'
import {
  validateBinaryFixtureGenerationResults,
} from './binary-fixture-generation-validator'

function sanitizeId(value: string): string {
  return value.replace(/[^a-z0-9_]+/gi, '_').replace(/^_+|_+$/g, '').toLowerCase()
}

function uniqueSorted<T extends string>(values: readonly T[]): T[] {
  return [...new Set(values)].sort()
}

function sha256Buffer(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex')
}

function generatorNameForFixture(artifact: SyntheticFixtureDryRunArtifact): BinaryFixtureGeneratorName {
  if (artifact.fixtureKind === 'synthetic_audio') return 'wav_pcm_generator'
  if (artifact.fixtureKind === 'synthetic_image' || artifact.fixtureKind === 'synthetic_mask') return 'png_rgba_generator'
  if (artifact.fixtureKind === 'synthetic_video') return 'video_descriptor_json_generator'

  return 'json_buffer_generator'
}

function fileExtensionForGenerator(generatorName: BinaryFixtureGeneratorName): string {
  if (generatorName === 'wav_pcm_generator') return 'wav'
  if (generatorName === 'png_rgba_generator') return 'png'

  return 'json'
}

export function buildBinaryFixtureGenerationPlan(
  dryRunResult: SyntheticFixtureDryRunResult,
): BinaryFixtureGenerationPlan {
  const hasVideo = dryRunResult.artifacts.some((artifact) => artifact.fixtureKind === 'synthetic_video')
  const allowedGenerators = uniqueSorted(dryRunResult.artifacts.map(generatorNameForFixture))

  return {
    generationPlanId: `binary_fixture_generation_plan_${sanitizeId(dryRunResult.dryRunId)}`,
    sourceDryRunId: dryRunResult.dryRunId,
    sourceFixturePlanId: dryRunResult.sourceFixturePlanId,
    toolId: dryRunResult.toolId,
    operationId: dryRunResult.operationId,
    commandIntentId: dryRunResult.commandIntentId,
    fixtureIds: dryRunResult.fixtureIds,
    sourceDryRunArtifacts: dryRunResult.artifacts,
    generationMode: hasVideo ? 'descriptor_only_video_deferred' : 'in_process_node_only',
    allowedGenerators,
    expectedArtifactTypes: uniqueSorted(dryRunResult.artifacts.map((artifact) => artifact.artifactType)),
    expectedStorageBucketPurposes: uniqueSorted(dryRunResult.artifacts.map((artifact) => artifact.storageBucketPurpose)),
    tempWorkspaceRequired: true,
    cleanupRequired: true,
    committedArtifactsAllowed: false,
    externalToolExecutionAllowed: false,
    shellExecutionAllowed: false,
    workerExecutionAllowed: false,
    mediaProcessingAllowed: false,
    providerCallsAllowed: false,
    supabaseMutationAllowed: false,
    sqlAllowed: false,
    signedUrlsAllowed: false,
    packageLockMutationAllowed: false,
    executesTools: false,
  }
}

export function buildBinaryFixtureGenerationPlans(
  dryRunResults: readonly SyntheticFixtureDryRunResult[],
): BinaryFixtureGenerationPlan[] {
  return dryRunResults.map(buildBinaryFixtureGenerationPlan)
}

async function writeAndSummarizeArtifact(
  plan: BinaryFixtureGenerationPlan,
  artifact: SyntheticFixtureDryRunArtifact,
  workspace: string,
): Promise<BinaryFixtureArtifactSummary> {
  const generated = generateBinaryFixtureArtifactBuffer(artifact)
  const extension = fileExtensionForGenerator(generated.generatorName)
  const filename = `${sanitizeId(artifact.dryRunArtifactId)}.${extension}`
  const filePath = join(workspace, filename)

  await writeFile(filePath, generated.contentBuffer)
  const readbackBuffer = await readFile(filePath)
  const readbackChecksum = sha256Buffer(readbackBuffer)
  const expectedChecksum = sha256Buffer(generated.contentBuffer)

  if (readbackChecksum !== expectedChecksum) {
    throw new Error(`Binary fixture readback checksum mismatch for ${artifact.dryRunArtifactId}.`)
  }

  return {
    artifactSummaryId: `binary_fixture_artifact_${sanitizeId(`${plan.generationPlanId}_${artifact.dryRunArtifactId}`)}`,
    sourceDryRunArtifactId: artifact.dryRunArtifactId,
    fixtureId: artifact.fixtureId,
    fixtureKind: artifact.fixtureKind,
    artifactType: artifact.artifactType,
    storageBucketPurpose: artifact.storageBucketPurpose,
    toolId: artifact.sourceToolId,
    operationId: artifact.sourceOperationId,
    commandIntentId: artifact.sourceCommandIntentId,
    contentType: generated.contentType,
    generatorName: generated.generatorName,
    payloadKind: generated.payloadKind,
    checksum: readbackChecksum,
    sizeBytes: readbackBuffer.byteLength,
    generatedBy: generated.generatedBy,
    generatedBinary: generated.generatedBinary,
    descriptorOnly: generated.descriptorOnly,
    videoBinaryDeferred: generated.videoBinaryDeferred,
    binaryMediaGenerated: generated.binaryMediaGenerated,
    privateByDefault: true,
    sourceOfTruth: true,
    signedUrlAllowed: false,
    tempPathExposed: false,
    committedToRepo: false,
    externalToolExecutionPerformed: false,
    shellExecutionPerformed: false,
    workerExecutionPerformed: false,
    mediaProcessingPerformed: false,
  }
}

export async function runBinaryFixtureGenerationPlan(
  plan: BinaryFixtureGenerationPlan,
  options: BinaryFixtureGenerationOptions = {},
): Promise<BinaryFixtureGenerationResult> {
  const unsafeOptions = options as {
    readonly allowExternalTools?: boolean
    readonly allowShellExecution?: boolean
  }

  if (unsafeOptions.allowExternalTools === true || unsafeOptions.allowShellExecution === true) {
    throw new Error('Binary fixture generation is Node-only and cannot enable external tool or shell execution.')
  }

  const cleanup = options.cleanup !== false || options.allowPersistForDebug !== true
  const workspacePrefix = join(options.tempRoot ?? tmpdir(), 'reeditpro-tool-calling-binary-fixtures-')
  const workspace = await mkdtemp(workspacePrefix)
  let tempWorkspaceCleanedUp = false

  try {
    const artifactSummaries: BinaryFixtureArtifactSummary[] = []

    for (const artifact of plan.sourceDryRunArtifacts) {
      artifactSummaries.push(await writeAndSummarizeArtifact(plan, artifact, workspace))
    }

    if (cleanup) {
      await rm(workspace, { recursive: true, force: true })
      tempWorkspaceCleanedUp = true
    }

    return {
      generationResultId: `binary_fixture_generation_result_${sanitizeId(plan.sourceDryRunId)}`,
      generationPlanId: plan.generationPlanId,
      sourceDryRunId: plan.sourceDryRunId,
      sourceFixturePlanId: plan.sourceFixturePlanId,
      toolId: plan.toolId,
      operationId: plan.operationId,
      commandIntentId: plan.commandIntentId,
      fixtureIds: plan.fixtureIds,
      artifactSummaries,
      tempWorkspaceCreated: true,
      tempWorkspaceCleanedUp,
      tempPathExposed: false,
      generatedFileCount: artifactSummaries.length,
      generatedBinaryCount: artifactSummaries.filter((artifact) => artifact.generatedBinary).length,
      generatedJsonCount: artifactSummaries.filter((artifact) => artifact.contentType === 'application/json').length,
      descriptorOnlyCount: artifactSummaries.filter((artifact) => artifact.descriptorOnly).length,
      videoBinaryDeferredCount: artifactSummaries.filter((artifact) => artifact.videoBinaryDeferred).length,
      writesCommittedArtifacts: false,
      externalToolExecutionPerformed: false,
      shellExecutionPerformed: false,
      workerExecutionPerformed: false,
      mediaProcessingPerformed: false,
      providerCallsPerformed: false,
      supabaseMutationPerformed: false,
      sqlExecuted: false,
      signedUrlsCreated: false,
      packageLockMutated: false,
      executesTools: false,
    }
  } finally {
    if (!tempWorkspaceCleanedUp && cleanup) {
      await rm(workspace, { recursive: true, force: true })
    }
  }
}

export async function runBinaryFixtureGenerationPlans(
  plans: readonly BinaryFixtureGenerationPlan[],
  options: BinaryFixtureGenerationOptions = {},
): Promise<BinaryFixtureGenerationResult[]> {
  const results: BinaryFixtureGenerationResult[] = []

  for (const plan of plans) {
    results.push(await runBinaryFixtureGenerationPlan(plan, options))
  }

  return results
}

export async function buildAndRunBinaryFixtureGenerationForDryRuns(
  dryRunResults: readonly SyntheticFixtureDryRunResult[],
  options: BinaryFixtureGenerationOptions = {},
): Promise<BinaryFixtureGenerationRunSummary> {
  const generationPlans = buildBinaryFixtureGenerationPlans(dryRunResults)
  const generationResults = await runBinaryFixtureGenerationPlans(generationPlans, options)
  const validationSummary = validateBinaryFixtureGenerationResults(generationResults, generationPlans)

  return {
    generationPlans,
    generationResults,
    validationSummary,
    sourceDryRunResults: dryRunResults,
    executesTools: false,
  }
}

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const inputPlanPath = path.join(
  repoRoot,
  'docs/worker-runtime-jobs-sound-cpu-phase82-caption-render-runtime-hook-proof-input-plan.md',
)
const targetRoot = '/private/tmp/reeditpro-sound-cpu-phase82-fixture-instance-proof'
const targetFile = path.join(targetRoot, 'fixture-instances.json')
const inputLabel = 'worker-runtime-jobs-sound-cpu-phase82-caption-render-runtime-hook-proof-input-plan'
const expectedSnapshotId = 'phase82-controlled-proof-plan-only'

function parseJsonBlock(markdown, label) {
  const pattern = new RegExp('```json\\s+' + label + '\\n([\\s\\S]*?)\\n```')
  const match = markdown.match(pattern)
  if (!match) throw new Error(`Missing JSON block ${label}`)
  return JSON.parse(match[1])
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function rejectUnsafeValue(value, fieldName) {
  assert(typeof value === 'string', `${fieldName} must be a string`)
  assert(!value.includes('://'), `${fieldName} must not contain a URL`)
  assert(!value.startsWith('/'), `${fieldName} must not be a filesystem path`)
  assert(!value.includes('..'), `${fieldName} must not contain relative traversal`)
}

function validateInputItem(item, index, seenIds, seenKeys) {
  for (const field of [
    'fixtureInstanceId',
    'sourceFixtureId',
    'privateMediaAssetId',
    'plannedPrivateArtifactId',
    'idempotencyKey',
    'approvedPlanSnapshotId',
  ]) {
    rejectUnsafeValue(item[field], `plannedProofInputs[${index}].${field}`)
  }
  assert(item.approvedPlanSnapshotId === expectedSnapshotId, `snapshot mismatch at input ${index}`)
  assert(!seenIds.has(item.fixtureInstanceId), `duplicate fixture instance id at input ${index}`)
  assert(!seenKeys.has(item.idempotencyKey), `duplicate idempotency key at input ${index}`)
  seenIds.add(item.fixtureInstanceId)
  seenKeys.add(item.idempotencyKey)
}

function buildFixtureInstance(item, index) {
  return {
    fixtureInstanceId: item.fixtureInstanceId,
    sourceFixtureId: item.sourceFixtureId,
    privateMediaAssetId: item.privateMediaAssetId,
    plannedPrivateArtifactId: item.plannedPrivateArtifactId,
    idempotencyKey: item.idempotencyKey,
    approvedPlanSnapshotId: item.approvedPlanSnapshotId,
    creationGate: 'phase84_source_created_future_controlled_proof_only',
    ordinal: index + 1,
  }
}

export async function runControlledFixtureInstanceCreationProofRunner() {
  const markdown = await fs.readFile(inputPlanPath, 'utf8')
  const inputPlan = parseJsonBlock(markdown, inputLabel)
  const inputs = inputPlan.plannedProofInputs

  assert(Array.isArray(inputs), 'plannedProofInputs must be an array')
  assert(inputs.length === 3, 'plannedProofInputs must contain exactly 3 items')
  assert(inputPlan.inputPolicy?.inputsContainNoFilesystemPaths === true, 'filesystem path policy missing')
  assert(inputPlan.inputPolicy?.inputsContainNoSignedUrls === true, 'signed URL policy missing')
  assert(inputPlan.inputPolicy?.inputsContainNoPublicArtifactUrls === true, 'public artifact URL policy missing')
  assert(inputPlan.inputPolicy?.inputsContainNoProviderOutputBlobs === true, 'provider output policy missing')
  assert(inputPlan.inputPolicy?.inputsContainNoSecrets === true, 'secret policy missing')

  const seenIds = new Set()
  const seenKeys = new Set()
  inputs.forEach((item, index) => validateInputItem(item, index, seenIds, seenKeys))

  const fixtureInstances = inputs.map(buildFixtureInstance)
  const manifest = {
    decision: 'worker_runtime_jobs_sound_cpu_controlled_fixture_instance_creation_proof_runner_local_manifest_created',
    sourceDecision:
      'worker_runtime_jobs_sound_cpu_phase84_caption_render_runtime_hook_proof_runner_source_created_with_warnings_ready_for_source_static_validation_no_execution',
    fixtureInstances,
    counts: {
      fixtureInstances: fixtureInstances.length,
      uniqueFixtureInstanceIds: seenIds.size,
      uniqueIdempotencyKeys: seenKeys.size,
    },
    executionState: {
      localDisposableManifestCreated: true,
      realMediaBytesUsed: false,
      mediaFileOpened: false,
      artifactCreated: false,
      workerDispatched: false,
      routeToolProviderExecuted: false,
      storageTransferCreated: false,
    },
    cleanupRequired: true,
  }

  await fs.rm(targetRoot, { recursive: true, force: true })
  await fs.mkdir(targetRoot, { recursive: true })
  await fs.writeFile(targetFile, `${JSON.stringify(manifest, null, 2)}\n`, { flag: 'wx' })
  const written = JSON.parse(await fs.readFile(targetFile, 'utf8'))
  assert(written.counts.fixtureInstances === 3, 'manifest count mismatch after write')
  await fs.rm(targetRoot, { recursive: true, force: true })

  return {
    status: 'passed',
    targetRoot,
    targetFile,
    fixtureInstanceCount: fixtureInstances.length,
    tempManifestRemoved: true,
    realMediaBytesUsed: false,
    mediaFileOpened: false,
    artifactCreated: false,
    workerDispatched: false,
    routeToolProviderExecuted: false,
    storageTransferCreated: false,
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runControlledFixtureInstanceCreationProofRunner()
    .then((result) => {
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
    })
    .catch((error) => {
      process.stderr.write(`${JSON.stringify({ status: 'failed', error: error.message }, null, 2)}\n`)
      process.exitCode = 1
    })
}

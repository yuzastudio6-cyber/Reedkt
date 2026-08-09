import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import {
  chmodSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '../..')
const launcher = join(
  root,
  'scripts/gcp/prod/53-build-sam31-production-capsule-twice.sh',
)
const work = mkdtempSync(join(tmpdir(), 'weeditpro-sam31-dual-build-'))
const bin = join(work, 'bin')
const cloud = join(work, 'cloud')
mkdirSync(bin)
mkdirSync(cloud)

try {
  executable('git', `#!/usr/bin/env bash
set -eu
if [[ "$1" = status ]]; then exit 0; fi
if [[ "$1" = rev-parse && "$2" = HEAD ]]; then
  printf '%s\\n' '${'a'.repeat(40)}'
  exit 0
fi
if [[ "$1" = rev-parse && "$2" = 'HEAD^{tree}' ]]; then
  printf '%s\\n' '${'b'.repeat(40)}'
  exit 0
fi
exit 1
`)
  executable('npm', `#!/usr/bin/env python3
import json
import os

qualification_hash = os.environ[
    'WEEDITPRO_SAM31_SOURCE_CHECKPOINT_QUALIFICATION_SHA256'
]
qualification_id = os.environ[
    'WEEDITPRO_SAM31_SOURCE_CHECKPOINT_QUALIFICATION_ID'
]
record = lambda name, digest: {
    'bucketName': 'reeditpro-production-reeditpro-control-plane-state',
    'objectName': name,
    'generation': '101',
    'etag': 'etag',
    'byteLength': 100,
    'sha256': digest,
}
print(json.dumps({
    'status': 'ready_for_two_independent_cloud_builds',
    'sourceCheckpointQualificationRef': {
        'id': qualification_id,
        'version': 2,
        'schemaVersion':
          'canonical-sam3_1-source-checkpoint-compatibility-qualification-v2',
        'contentHash': f'sha256:{qualification_hash}',
    },
    'sourceQualificationCapsuleManifestRef': {
        'id': 'source-capsule', 'version': 1,
        'contentHash': f"sha256:{'1' * 64}",
    },
    'artifactBindingRef': {
        'id': 'artifact-binding', 'version': 1,
        'contentHash': f"sha256:{'2' * 64}",
    },
    'sourceCapsuleManifestRecord': record(
        'private/sam3_1/qualification-image-build/v1/manifest/source.json',
        '3' * 64,
    ),
    'qualificationReleaseRecord': record(
        'private/sam3_1/source-checkpoint-qualification/v2/releases/release.json',
        '4' * 64,
    ),
    'artifactBindingRecord': record(
        'private/sam3_1/cloud-image-build/v2/artifact-bindings/binding.json',
        '5' * 64,
    ),
    'canonicalVertexReleaseManifestIngestAndBindingReread': True,
    'legacyBatchRequestResultOrReleaseCastOrRelabelUsed': False,
    'callerPathUrlCommandImageTagBuildArgumentOrGpuAccepted': False,
    'cloudBuildStarted': False,
    'imageBuildStarted': False,
    'modelExecuted': False,
    'customerCreditsMutated': False,
    'productionAuthorityGranted': False,
}))
`)
  executable('gcloud', fakeGcloudScript())

  const common = {
    ...process.env,
    PATH: `${bin}:${process.env.PATH ?? ''}`,
    FAKE_GCLOUD_ROOT: cloud,
    WEEDITPRO_CONFIRM_SAM31_PRODUCTION_CAPSULE_TWO_BUILDS:
      'start-two-independent-weeditpro-sam31-production-capsule-builds-v3',
    WEEDITPRO_SAM31_SOURCE_CHECKPOINT_QUALIFICATION_ID:
      'sam31-vertex-a100-qualified-source',
    WEEDITPRO_SAM31_SOURCE_CHECKPOINT_QUALIFICATION_SHA256: '6'.repeat(64),
  }

  const first = run(common)
  assert.equal(first.status, 0, first.stderr)
  assert.ok(first.stdout.trim(), JSON.stringify({
    status: first.status,
    stdout: first.stdout,
    stderr: first.stderr,
    error: first.error?.message,
  }))
  const firstResult = JSON.parse(first.stdout)
  assert.equal(firstResult.independentBuildCount, 2)
  assert.equal(firstResult.durableCreateOnlyConsumptionPerSlot, true)
  assert.equal(firstResult.automaticRetryAllowed, false)
  assert.equal(submitCount(), 2)

  const replay = run(common)
  assert.equal(replay.status, 0, replay.stderr)
  assert.deepEqual(JSON.parse(replay.stdout), firstResult)
  assert.equal(submitCount(), 2)

  const recoveredEnvironment = {
    ...common,
    WEEDITPRO_SAM31_SOURCE_CHECKPOINT_QUALIFICATION_SHA256: '7'.repeat(64),
    FAKE_UNCERTAIN_SLOT: 'primary',
    FAKE_UNCERTAIN_MODE: 'executed_response_lost',
  }
  const uncertain = run(recoveredEnvironment)
  assert.notEqual(uncertain.status, 0)
  assert.match(uncertain.stderr, /outcome is uncertain/u)
  assert.equal(submitCount(), 3)

  const recovered = run({
    ...recoveredEnvironment,
    FAKE_UNCERTAIN_MODE: '',
  })
  assert.equal(recovered.status, 0, recovered.stderr)
  const recoveredResult = JSON.parse(recovered.stdout)
  assert.equal(recoveredResult.independentBuildCount, 2)
  assert.equal(submitCount(), 4)

  const unknownEnvironment = {
    ...common,
    WEEDITPRO_SAM31_SOURCE_CHECKPOINT_QUALIFICATION_SHA256: '8'.repeat(64),
    FAKE_UNCERTAIN_SLOT: 'primary',
    FAKE_UNCERTAIN_MODE: 'not_observable',
  }
  const unknown = run(unknownEnvironment)
  assert.notEqual(unknown.status, 0)
  assert.equal(submitCount(), 5)
  const unknownReplay = run({ ...unknownEnvironment, FAKE_UNCERTAIN_MODE: '' })
  assert.notEqual(unknownReplay.status, 0)
  assert.match(unknownReplay.stderr, /automatic retry is forbidden/u)
  assert.equal(submitCount(), 5)

  console.log(JSON.stringify({
    smoke: 'canonical-sam3_1-production-capsule-dual-build-launcher',
    checks: 22,
    exactlyTwoIndependentSlots: true,
    durableReplayCreatedNoDuplicateBuild: true,
    executedResponseLostReconciledByExactSubstitutions: true,
    unobservableOutcomeDidNotRetry: true,
    customerCreditsMutated: false,
    modelOrCheckpointExecuted: false,
    productionReady: false,
  }, null, 2))
} finally {
  rmSync(work, { recursive: true, force: true })
}

function run(environment: NodeJS.ProcessEnv) {
  return spawnSync('bash', [launcher], {
    cwd: root,
    env: environment,
    encoding: 'utf8',
  })
}

function submitCount(): number {
  try {
    return Number(readFileSync(join(cloud, 'submit-count'), 'utf8'))
  } catch {
    return 0
  }
}

function executable(name: string, body: string): void {
  const path = join(bin, name)
  writeFileSync(path, body, 'utf8')
  chmodSync(path, 0o755)
}

function fakeGcloudScript(): string {
  return `#!/usr/bin/env python3
import json
import os
from pathlib import Path
import re
import shutil
import sys
import uuid

root = Path(os.environ['FAKE_GCLOUD_ROOT'])
root.mkdir(parents=True, exist_ok=True)
args = sys.argv[1:]

def cloud_path(uri):
    if not uri.startswith('gs://'):
        raise SystemExit('fake gcloud expected a GCS URI')
    return root / 'gcs' / uri[5:]

if args[:3] == ['config', 'get', 'project']:
    print('reeditpro')
    raise SystemExit(0)

if args[:2] == ['storage', 'cat']:
    path = cloud_path(args[-1])
    if not path.is_file():
        raise SystemExit(1)
    sys.stdout.buffer.write(path.read_bytes())
    raise SystemExit(0)

if args[:2] == ['storage', 'cp']:
    source, destination = args[-2:]
    target = cloud_path(destination)
    if target.exists() and '--if-generation-match=0' in args:
        raise SystemExit(1)
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(source, target)
    raise SystemExit(0)

if args[:2] == ['builds', 'list']:
    path = root / 'builds.json'
    print(path.read_text() if path.is_file() else '[]')
    raise SystemExit(0)

if args[:2] == ['builds', 'submit']:
    substitutions_arg = next(
        value for value in args if value.startswith('--substitutions=')
    ).split('=', 1)[1]
    substitutions = dict(
        item.split('=', 1) for item in substitutions_arg.split(',')
    )
    count_path = root / 'submit-count'
    count = int(count_path.read_text()) + 1 if count_path.is_file() else 1
    count_path.write_text(str(count))
    build_id = str(uuid.UUID(int=count, version=4))
    build = {
        'id': build_id,
        'substitutions': substitutions,
        'status': 'QUEUED',
    }
    builds_path = root / 'builds.json'
    builds = json.loads(builds_path.read_text()) if builds_path.is_file() else []
    mode = os.environ.get('FAKE_UNCERTAIN_MODE')
    slot = substitutions.get('_PRODUCTION_CAPSULE_BUILD_SLOT')
    uncertain = slot == os.environ.get('FAKE_UNCERTAIN_SLOT') and bool(mode)
    marker = root / (
        'uncertain-' + substitutions['_PRODUCTION_CAPSULE_PUBLICATION_ID']
        + '-' + slot
    )
    if uncertain and not marker.exists():
        marker.write_text('consumed')
        if mode == 'executed_response_lost':
            builds.append(build)
            builds_path.write_text(json.dumps(builds))
        raise SystemExit(1)
    builds.append(build)
    builds_path.write_text(json.dumps(builds))
    print(json.dumps(build))
    raise SystemExit(0)

raise SystemExit('unsupported fake gcloud call: ' + repr(args))
`
}

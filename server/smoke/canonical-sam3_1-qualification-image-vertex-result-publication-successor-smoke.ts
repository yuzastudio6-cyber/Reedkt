import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

import {
  createCanonicalSam31VertexQualificationGcsResultReadPort,
} from '../services/canonical-sam3_1-source-checkpoint-qualification-vertex-runtime'
import { stableAuthorityStringify } from
  '../services/private-edit-authority-store'
import {
  request,
  result,
} from './canonical-sam3_1-source-checkpoint-qualification-vertex-smoke'

const runnerPath =
  'docker/prod/gpu-worker/sam3_1/qualification_runner.py'
const runner = readFileSync(runnerPath, 'utf8')
const reproducibilityPublisher = readFileSync(
  'server/cli/publish-canonical-sam3_1-qualification-capsule-reproducibility.ts',
  'utf8',
)
const authorityPublisher = readFileSync(
  'server/cli/publish-canonical-sam3_1-qualification-image-build-vertex-result-publication-authority.ts',
  'utf8',
)
const buildStarter = readFileSync(
  'server/cli/start-canonical-sam3_1-qualification-image-build-vertex-result-publication.ts',
  'utf8',
)

for (const expected of [
  'def create_result_directory() -> None:',
  'result_directory.mkdir(mode=0o700, parents=False, exist_ok=False)',
  'qualification result directory is not empty',
  'os.O_EXCL',
  'qualification result changed during reread',
  'create_result_directory()\n    write_result(execute(request))',
] as const) assert.ok(runner.includes(expected), `result writer lost ${expected}`)
assert.doesNotMatch(
  runner,
  /RESULT_PATH\s*=\s*Path\(os\.environ|mkdir\([^\n]*parents=True/u,
)
for (const source of [
  reproducibilityPublisher,
  authorityPublisher,
  buildStarter,
] as const) assert.ok(
  source.includes('vertex-result-publication-corrected-v1')
    || source.includes('vertex_result_publication_corrected'),
  'result-publication successor lineage is absent',
)
for (const source of [authorityPublisher, buildStarter] as const) {
  assert.ok(source.includes('failedAttemptAutomaticallyRetried: false'))
  assert.doesNotMatch(source, /secretEnv|availableSecrets/u)
}

const python = String.raw`
import importlib.util
import os
from pathlib import Path
import shutil
import sys
import tempfile

os.environ["WEEDITPRO_GPU_INVOCATION_ID"] = "sam31-result-writer-smoke"
spec = importlib.util.spec_from_file_location("qualification_runner_smoke", sys.argv[1])
assert spec is not None and spec.loader is not None
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

temporary_root = Path(tempfile.mkdtemp(prefix="weeditpro-sam31-result-writer-"))
try:
    attempt_root = temporary_root / "attempt"
    attempt_root.mkdir(mode=0o700)
    module.QUALIFICATION_MOUNT = attempt_root
    module.RESULT_PATH = attempt_root / "result" / "result.json"
    module.create_result_directory()
    module.write_result({"z": 2, "a": 1})
    assert module.RESULT_PATH.read_bytes() == b'{"a":1,"z":2}'
    assert (module.RESULT_PATH.parent.stat().st_mode & 0o777) == 0o700

    try:
        module.create_result_directory()
        raise AssertionError("attempt replay directory was accepted")
    except RuntimeError as error:
        assert "could not be created" in str(error)

    try:
        module.write_result({"z": 2, "a": 1})
        raise AssertionError("result replay was accepted")
    except RuntimeError as error:
        assert "not empty" in str(error)

    shutil.rmtree(module.RESULT_PATH.parent)
    outside = temporary_root / "outside"
    outside.mkdir(mode=0o700)
    module.RESULT_PATH.parent.symlink_to(outside, target_is_directory=True)
    try:
        module.create_result_directory()
        raise AssertionError("symlinked result directory was accepted")
    except RuntimeError as error:
        assert "could not be created" in str(error)

    module.RESULT_PATH.parent.unlink()
    module.RESULT_PATH.parent.mkdir(mode=0o700)
    (module.RESULT_PATH.parent / "unexpected").write_bytes(b"x")
    try:
        module.write_result({"a": 1})
        raise AssertionError("non-empty result directory was accepted")
    except RuntimeError as error:
        assert "not empty" in str(error)
finally:
    shutil.rmtree(temporary_root)
`
const pythonResult = spawnSync('python3', ['-I', '-B', '-c', python, runnerPath], {
  cwd: process.cwd(),
  encoding: 'utf8',
  timeout: 30_000,
})
assert.equal(
  pythonResult.status,
  0,
  `${pythonResult.stdout}\n${pythonResult.stderr}`,
)

const body = Buffer.from(stableAuthorityStringify(result), 'utf8')
function storageWithContentType(contentType: string) {
  const metadata = {
    generation: '1786250000000001',
    etag: 'vertex-result-etag',
    size: String(body.byteLength),
    contentType,
  }
  return {
    bucket(name: string) {
      assert.equal(name, 'reeditpro-production-sam31-qualification-private')
      return {
        file(objectName: string, options?: { generation?: string }) {
          assert.equal(
            objectName,
            `private/sam3_1/source-checkpoint-qualification/v2/attempts/`
              + `${request.attemptDigestSha256}/result/result.json`,
          )
          if (options) assert.equal(options.generation, metadata.generation)
          return {
            async getMetadata() { return [structuredClone(metadata)] },
            async download() { return [Buffer.from(body)] },
          }
        },
      }
    },
  }
}

const fuseResult = await createCanonicalSam31VertexQualificationGcsResultReadPort({
  storage: storageWithContentType('application/octet-stream') as never,
}).rereadExact({ request })
assert.deepEqual(fuseResult, result)

await assert.rejects(
  createCanonicalSam31VertexQualificationGcsResultReadPort({
    storage: storageWithContentType('text/plain') as never,
  }).rereadExact({ request }),
  /metadata is invalid/u,
)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-qualification-image-vertex-result-publication-successor',
  missingFixedResultDirectoryCreated: true,
  callerResultPathAccepted: false,
  symlinkedOrNonemptyResultDirectoryAccepted: false,
  resultObjectCreateOnlyAndExactRereadVerified: true,
  cloudStorageFuseOctetStreamTransportAcceptedAfterStrictJsonValidation: true,
  unsupportedContentTypeAccepted: false,
  modelExecuted: false,
  gpuJobStarted: false,
  customerCreditsMutated: false,
  runtimeReleaseGranted: false,
  productionReady: false,
}, null, 2))

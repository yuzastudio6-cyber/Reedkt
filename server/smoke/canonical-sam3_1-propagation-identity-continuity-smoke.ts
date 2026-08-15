import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const runnerPath =
  'docker/prod/gpu-worker/sam3_1/runner.py'
const runner = readFileSync(runnerPath, 'utf8')

assert.match(
  runner,
  /def missing_prompt_object_identities\([\s\S]*?New, duplicated, or reordered[\s\S]*?raise RuntimeError\("SAM 3\.1 propagation object identities changed"\)/u,
)
assert.match(
  runner,
  /empty_absent_mask = torch\.zeros\([\s\S]*?dtype=torch\.bool,[\s\S]*?device="cuda"/u,
)
assert.match(
  runner,
  /for object_id in prompt_object_ids:[\s\S]*?box = \[0\.0, 0\.0, 0\.0, 0\.0\][\s\S]*?mask = empty_absent_mask/u,
)
assert.doesNotMatch(runner, /if object_ids != prompt_object_ids:/u)

const result = execFileSync('python3', ['-c', String.raw`
import importlib.util
from pathlib import Path

path = Path(${JSON.stringify(runnerPath)}).resolve()
spec = importlib.util.spec_from_file_location("weeditpro_sam31_runner", path)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

assert module.missing_prompt_object_identities([3, 7], [3, 7]) == []
assert module.missing_prompt_object_identities([3, 7], [3]) == [7]
assert module.missing_prompt_object_identities([3, 7], []) == [3, 7]

for invalid in ([7, 3], [3, 3], [3, 9]):
    try:
        module.missing_prompt_object_identities([3, 7], invalid)
    except RuntimeError as error:
        assert str(error) == "SAM 3.1 propagation object identities changed"
    else:
        raise AssertionError(f"invalid identity set accepted: {invalid}")

print("ok")
`], {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe'],
  timeout: 10_000,
})
assert.equal(result.trim(), 'ok')

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-propagation-identity-continuity',
  promptIdentityContinuityPreserved: true,
  temporarilyAbsentIdentityMaterializedAsEmptyMask: true,
  newDuplicateOrReorderedIdentityRejected: true,
  substantiveCpuMediaProcessingAllowed: false,
  customerCreditsMutated: false,
  productionReady: false,
}))

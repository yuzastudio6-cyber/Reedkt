import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const runnerPath =
  'docker/prod/gpu-worker/sam3_1/runner.py'
const runner = readFileSync(runnerPath, 'utf8')

assert.match(
  runner,
  /def validate_propagated_object_identities\([\s\S]*?official per-instance video identities[\s\S]*?emitted_object_ids != sorted\(emitted_object_ids\)[\s\S]*?len\(emitted_object_ids\) > maximum_objects/u,
)
assert.match(
  runner,
  /for object_id in object_ids:[\s\S]*?box, mask = observed_by_id\[object_id\]/u,
)
assert.match(
  runner,
  /set\(prompt_object_ids\)\.issubset\(distinct_object_ids\)/u,
)
assert.doesNotMatch(runner, /empty_absent_mask/u)

const result = execFileSync('python3', ['-c', String.raw`
import importlib.util
from pathlib import Path

path = Path(${JSON.stringify(runnerPath)}).resolve()
spec = importlib.util.spec_from_file_location("weeditpro_sam31_runner", path)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

assert module.validate_propagated_object_identities([3, 9], 16) == [3, 9]
assert module.validate_propagated_object_identities([3], 16) == [3]
assert module.validate_propagated_object_identities([], 16) == []

for invalid in ([7, 3], [3, 3]):
    try:
        module.validate_propagated_object_identities(invalid, 16)
    except RuntimeError as error:
        assert str(error) == "SAM 3.1 propagation object identities changed"
    else:
        raise AssertionError(f"invalid identity set accepted: {invalid}")

try:
    module.validate_propagated_object_identities(list(range(17)), 16)
except RuntimeError as error:
    assert str(error) == "SAM 3.1 exceeded the object product cap"
else:
    raise AssertionError("object product cap was not enforced")

print("ok")
`], {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe'],
  timeout: 10_000,
})
assert.equal(result.trim(), 'ok')

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-propagation-identity-continuity',
  officialPerInstanceIdentityPreserved: true,
  laterMatchingInstancesAccepted: true,
  absentInstancesNotManufacturedAsEmptyMasks: true,
  duplicateOrReorderedIdentityRejected: true,
  boundedObjectCapEnforced: true,
  substantiveCpuMediaProcessingAllowed: false,
  customerCreditsMutated: false,
  productionReady: false,
}))

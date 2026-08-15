import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import {
  assertCanonicalSam31L4CrossAcceleratorBaselineBinding,
} from '../services/canonical-sam3_1-l4-cross-accelerator-baseline-binding'

const exact = {
  a100ServingQualificationRef: {
    id: 'sam31-a100-v6-thirty-qualified-20260815-v1',
    version: 1 as const,
    contentHash:
      'sha256:c3a0351d3542be81f0dd6e4ac821b82db2196485d64c8253b482632fc01d0552',
  },
  a100ImmutableImageDigest:
    'sha256:953a883366f51350933bf4b7911b34e652e4edc30e4e81fdf57e661c675c055f',
  l4ImageSupplyChainReleaseRef: {
    id: 'sam31-production-image-supply-chain-release-1e538370613078300244ad49',
    version: 1 as const,
    contentHash:
      'sha256:50d2c190e6dd931a57f96a58a9320f8f0d4ea5b0f8c2be04f4028d453cdb4b34',
  },
  l4ImmutableImageDigest:
    'sha256:3868667afbfae195ff6f952ff418c6f94babbd2e447d796fd90000231079a85f',
}

const binding = assertCanonicalSam31L4CrossAcceleratorBaselineBinding(exact)
assert.equal(binding.status, 'exact_qualified_image_pair_bound')
assert.equal(binding.preflightMustCompleteBeforeGpuLaunch, true)
assert.equal(binding.successorImageRequiresOwnExactA100ProbeBaseline, true)

assert.throws(
  () => assertCanonicalSam31L4CrossAcceleratorBaselineBinding({
    ...exact,
    l4ImmutableImageDigest:
      'sha256:4e028b571f1f4d493ed884c031ec876961bbb2f66c6794cc26a10c31e705f7b4',
  }),
  /baseline_image_lineage_unqualified/u,
)
assert.throws(
  () => assertCanonicalSam31L4CrossAcceleratorBaselineBinding({
    ...exact,
    a100ServingQualificationRef: {
      ...exact.a100ServingQualificationRef,
      id: 'caller-selected-baseline',
    },
  }),
  /baseline_image_lineage_unqualified/u,
)
assert.throws(
  () => assertCanonicalSam31L4CrossAcceleratorBaselineBinding({
    ...exact,
    gpuJobDispatched: true,
  }),
)

const qualificationCli = readFileSync(
  'server/cli/qualify-canonical-sam3_1-l4-runtime.ts',
  'utf8',
)
const preflightIndex = qualificationCli.indexOf(
  'assertCanonicalSam31L4CrossAcceleratorBaselineBinding({',
)
const jobRereadIndex = qualificationCli.indexOf(
  'const job = assertCanonicalSam31L4QualificationJob',
)
assert.ok(preflightIndex > 0 && jobRereadIndex > preflightIndex)

process.stdout.write(`${JSON.stringify({
  ok: true,
  checks: 7,
  status: binding.status,
  successorRequiresOwnBaseline:
    binding.successorImageRequiresOwnExactA100ProbeBaseline,
  gpuJobDispatched: binding.gpuJobDispatched,
  productionAuthorityGranted: binding.productionAuthorityGranted,
})}\n`)

import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

import { z } from 'zod'

import {
  publishCanonicalSam31QualificationImageBuildAuthority,
} from '../services/canonical-sam3_1-qualification-image-authority-runtime'
import {
  createCanonicalSam31GcpQualificationImageBuildRuntime,
} from '../services/canonical-sam3_1-qualification-image-build-runtime'

const CONFIRMATION =
  'publish-sam31-qualification-image-rope-cache-derivation-authority-v1' as const
const REPRODUCIBILITY_ID =
  'sam31-qualification-capsule-reproducibility-rope-cache-derivation-corrected-v1' as const
const MANIFEST_ID =
  'sam31-qualification-image-capsule-rope-cache-derivation-corrected-v1' as const
const AUTHORITY_ID =
  'sam31-qualification-image-build-rope-cache-derivation-corrected-v1' as const
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)

if (
  process.env
    .WEEDITPRO_SAM31_QUALIFICATION_IMAGE_ROPE_CACHE_DERIVATION_AUTHORITY_CONFIRMATION
      !== CONFIRMATION
) throw new Error('SAM 3.1 RoPE-cache image authority confirmation is missing.')

const reproducibilityHash = rawSha256.parse(
  process.env
    .WEEDITPRO_SAM31_ROPE_CACHE_DERIVATION_REPRODUCIBILITY_SHA256,
)
const publication = await publishCanonicalSam31QualificationImageBuildAuthority({
  manifestId: MANIFEST_ID,
  authorityId: AUTHORITY_ID,
  ingestReceiptRef: {
    id: 'sam31-ingest-sam31-weeditpro-official-ingest-20260806-v12',
    version: 1,
    schemaVersion: 'canonical-sam3_1-private-artifact-ingest-receipt-v3',
    contentHash:
      'sha256:321dc704810497b92e63fa29cdbd168b903e9435fa24ba5b23903c3b6c919cf8',
  },
  reproducibilityReceiptRef: {
    id: REPRODUCIBILITY_ID,
    version: 1,
    contentHash: `sha256:${reproducibilityHash}`,
  },
  cloudBuildMachineType: 'E2_STANDARD_2',
})
const runtime = createCanonicalSam31GcpQualificationImageBuildRuntime()
const authority = await runtime.repository.rereadQualificationImageBuildAuthority({
  authorityRef: publication.authorityRef,
})
if (
  !authority
  || authority.buildClosure.dockerfileSha256 !== sourceHash(
    'docker/prod/gpu-worker/sam3_1/Dockerfile.qualification.candidate',
  )
  || authority.buildClosure.entrypointSha256 !== sourceHash(
    'docker/prod/gpu-worker/sam3_1/qualification_entrypoint.sh',
  )
  || authority.buildClosure.runnerSha256 !== sourceHash(
    'docker/prod/gpu-worker/sam3_1/qualification_runner.py',
  )
  || authority.buildClosure.sourceProvenanceLockSha256 !== sourceHash(
    'docker/prod/gpu-worker/sam3_1/source-provenance.lock',
  )
  || authority.cloudBuildPolicy.machineType !== 'E2_STANDARD_2'
) throw new Error('SAM 3.1 RoPE-cache image authority changed.')

console.log(JSON.stringify({
  ...publication,
  publicationSchemaVersion:
    'canonical-sam3_1-qualification-image-rope-cache-derivation-authority-publication-v1',
  correction:
    'derive_only_fixed_real_rope_runtime_caches_from_complex_checkpoint_buffers',
  sourceComplexRopeBufferCount: 32,
  derivedRuntimeBufferKeyCount: 64,
  learnedParameterOrCheckpointWeightSynthesized: false,
  sourceCheckpointFileMutated: false,
  failedAttemptAutomaticallyRetried: false,
  sourceCheckpointQualificationGranted: false,
  gpuQualificationJobDispatched: false,
  customerCreditsMutated: false,
  productionReady: false,
}, null, 2))

function sourceHash(path: string) {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
}

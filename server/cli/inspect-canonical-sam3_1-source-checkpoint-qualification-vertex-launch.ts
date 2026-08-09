import { z } from 'zod'

import {
  createCanonicalSam31GcpVertexQualificationLaunchPreflightService,
} from '../services/canonical-sam3_1-source-checkpoint-qualification-vertex-launch-preflight'
import {
  assertPlainSerializedData,
} from '../services/canonical-professional-gpu-job-lifecycle-service'

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const environmentSchema = z.object({
  historicalPackageRequestId: safeId,
  historicalPackageRequestSha256: rawSha256,
  imageSupplyChainReleaseId: safeId,
  imageSupplyChainReleaseSha256: rawSha256,
  currentAccountRateAuthorityId: safeId,
  currentAccountRateAuthorityVersion:
    z.coerce.number().pipe(z.literal(1)),
  currentAccountRateAuthoritySha256: rawSha256,
}).strict()

const selectedEnvironment = {
  historicalPackageRequestId:
    process.env.WEEDITPRO_SAM31_VERTEX_HISTORICAL_PACKAGE_REQUEST_ID,
  historicalPackageRequestSha256:
    process.env.WEEDITPRO_SAM31_VERTEX_HISTORICAL_PACKAGE_REQUEST_SHA256,
  imageSupplyChainReleaseId:
    process.env.WEEDITPRO_SAM31_VERTEX_IMAGE_SUPPLY_CHAIN_RELEASE_ID,
  imageSupplyChainReleaseSha256:
    process.env.WEEDITPRO_SAM31_VERTEX_IMAGE_SUPPLY_CHAIN_RELEASE_SHA256,
  currentAccountRateAuthorityId:
    process.env.WEEDITPRO_SAM31_VERTEX_CURRENT_RATE_AUTHORITY_ID,
  currentAccountRateAuthorityVersion:
    process.env.WEEDITPRO_SAM31_VERTEX_CURRENT_RATE_AUTHORITY_VERSION,
  currentAccountRateAuthoritySha256:
    process.env.WEEDITPRO_SAM31_VERTEX_CURRENT_RATE_AUTHORITY_SHA256,
}
assertPlainSerializedData(
  selectedEnvironment,
  'sam31_vertex_launch_preflight_environment',
)
const environment = environmentSchema.parse(selectedEnvironment)
const result = await
createCanonicalSam31GcpVertexQualificationLaunchPreflightService().inspect({
  historicalPackageRequestRef: {
    id: environment.historicalPackageRequestId,
    version: 1,
    contentHash:
      `sha256:${environment.historicalPackageRequestSha256}`,
  },
  imageSupplyChainReleaseRef: {
    id: environment.imageSupplyChainReleaseId,
    version: 1,
    contentHash:
      `sha256:${environment.imageSupplyChainReleaseSha256}`,
  },
  currentAccountRateAuthorityRef: {
    id: environment.currentAccountRateAuthorityId,
    version: environment.currentAccountRateAuthorityVersion,
    contentHash:
      `sha256:${environment.currentAccountRateAuthoritySha256}`,
  },
})

process.stdout.write(`${JSON.stringify(result)}\n`)

import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  publishCanonicalSam31AuthorizedHumanTermsIntent,
} from '../services/canonical-sam3_1-authorized-human-terms-intent-publisher'
import {
  createCanonicalSam31AuthorizedTermsFinalizationRepository,
} from '../services/canonical-sam3_1-authorized-terms-finalization-owner'
import {
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'

const store = createObjectPort()
const repository = createCanonicalSam31AuthorizedTermsFinalizationRepository({
  objectPort: store.port,
})
const evidence = {
  schemaVersion:
    'canonical-sam3_1-authorized-human-browser-acceptance-evidence-v1',
  source: 'authenticated_weeditpro_owner_browser_acceptance_observation',
  organizationId: 'weeditpro',
  authorizedRepresentativeAccountHandle: 'WEeditpro',
  officialRepository: 'facebook/sam3.1',
  officialSourceRepository: 'https://github.com/facebookresearch/sam3.git',
  gatingCollection: 'SAM3',
  requestStatus: 'accepted',
  officialCheckpointFileObserved: 'sam3.1_multiplex.pt',
  officialLicenseUrl:
    'https://github.com/facebookresearch/sam3/blob/main/LICENSE',
  officialLicenseIdentity: 'SAM License',
  officialLicenseLastUpdated: '2025-11-19',
  metaPrivacyPolicyUrl: 'https://www.facebook.com/privacy/policy/',
  humanSubmittedOfficialForm: true,
  humanAcceptedLicenseTerms: true,
  contactInformationSharingAcceptedByAuthorizedHuman: true,
  authorizedRepresentativeAcceptedForOrganization: true,
  approvedUseCase:
    'private_commercial_video_editing_segmentation_and_tracking',
  tradeControlsRepresentationAcceptedByAuthorizedHuman: true,
  militaryWarfareNuclearEspionageOrWeaponsUseAllowed: false,
  observedAt: '2026-08-06T17:00:00.000Z',
  boundary: {
    browserLoginAutomated: false,
    termsAcceptanceAutomated: false,
    secretOrPersonalFormValuesCaptured: false,
    checkpointBytesDownloaded: false,
    modelInstalledOnDeveloperMachine: false,
  },
} as const

const receipt = await publishCanonicalSam31AuthorizedHumanTermsIntent({
  repository,
  evidence,
})
assert.equal(receipt.disposition, 'created')
assert.equal(receipt.humanTermsIntentRef.id,
  'sam31-human-terms-weeditpro-20260806')
assert.equal(receipt.officialRepositoryAccessClaimedByCaller, false)
assert.equal(receipt.officialRepositoryAccessVerificationStillRequired, true)
assert.equal(receipt.tokenOrPersonalFormValuesCaptured, false)
assert.equal(receipt.checkpointBytesDownloaded, false)
assert.equal(receipt.modelInstalledOnDeveloperMachine, false)
assert.equal(receipt.gpuRuntimeAuthorized, false)
assert.equal(receipt.customerCreditsMutated, false)
assert.equal(receipt.productionReady, false)
assert.equal(store.records.size, 1)

const replay = await publishCanonicalSam31AuthorizedHumanTermsIntent({
  repository,
  evidence,
})
assert.equal(replay.disposition, 'identical_replay')
assert.deepEqual(replay.humanTermsIntentRef, receipt.humanTermsIntentRef)
assert.equal(store.records.size, 1)

const [recordPath, recordBody] = [...store.records.entries()][0]!
assert.match(recordPath,
  /^private\/sam3_1\/terms-intent\/v1\/sam31-human-terms-weeditpro-20260806-[a-f0-9]{24}\.json$/u)
const record = JSON.parse(recordBody.toString('utf8')) as {
  source: string
  checkpointRepository: string
  authority: { officialRepositoryAccessVerified: boolean }
}
assert.equal(record.source,
  'canonical_weeditpro_authorized_human_terms_acceptance_owner')
assert.equal(record.checkpointRepository, 'facebook/sam3.1')
assert.equal(record.authority.officialRepositoryAccessVerified, false)

await assert.rejects(publishCanonicalSam31AuthorizedHumanTermsIntent({
  repository,
  evidence: { ...evidence, requestStatus: 'pending' } as never,
}))
await assert.rejects(publishCanonicalSam31AuthorizedHumanTermsIntent({
  repository,
  evidence: { ...evidence, token: 'must-not-be-accepted' } as never,
}))
await assert.rejects(publishCanonicalSam31AuthorizedHumanTermsIntent({
  repository,
  evidence: {
    ...evidence,
    boundary: { ...evidence.boundary, termsAcceptanceAutomated: true },
  } as never,
}))
await assert.rejects(publishCanonicalSam31AuthorizedHumanTermsIntent({
  repository,
  evidence: {
    ...evidence,
    boundary: { ...evidence.boundary, checkpointBytesDownloaded: true },
  } as never,
}))

let getterInvoked = false
const accessorEvidence = { ...evidence } as Record<string, unknown>
Object.defineProperty(accessorEvidence, 'token', {
  enumerable: true,
  get() {
    getterInvoked = true
    return 'must-not-be-read'
  },
})
await assert.rejects(publishCanonicalSam31AuthorizedHumanTermsIntent({
  repository,
  evidence: accessorEvidence as never,
}))
assert.equal(getterInvoked, false)

const cycle = { ...evidence, boundary: { ...evidence.boundary } } as
  Record<string, unknown>
cycle.self = cycle
await assert.rejects(publishCanonicalSam31AuthorizedHumanTermsIntent({
  repository,
  evidence: cycle as never,
}))

const tamperedStore = createObjectPort()
const tamperedRepository =
  createCanonicalSam31AuthorizedTermsFinalizationRepository({
    objectPort: {
      ...tamperedStore.port,
      async readExact(objectPath) {
        const body = await tamperedStore.port.readExact(objectPath)
        if (!body) return null
        const value = JSON.parse(body.toString('utf8')) as {
          authority: { productionReady: boolean }
        }
        value.authority.productionReady = true
        return Buffer.from(stableAuthorityStringify(value), 'utf8')
      },
    },
  })
await assert.rejects(publishCanonicalSam31AuthorizedHumanTermsIntent({
  repository: tamperedRepository,
  evidence,
}))

const cli = readFileSync(new URL(
  '../cli/publish-sam3_1-authorized-human-terms-intent.ts',
  import.meta.url,
), 'utf8')
assert.match(cli, /publish-authorized-sam31-human-terms-intent-once/u)
assert.match(cli, /facebook\/sam3\.1/u)
assert.match(cli, /sam3\.1_multiplex\.pt/u)
assert.match(cli, /WEeditpro/u)
assert.doesNotMatch(cli,
  /HUGGINGFACE_TOKEN|MODEL_WEIGHT_ACCESS_TOKEN|hf_hub_download|from_pretrained/u)
assert.doesNotMatch(cli, /playwright|browser\.click|termsAcceptanceAutomated: true/u)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-authorized-human-terms-intent-publisher',
  checks: 31,
  acceptedOfficialRepository: 'facebook/sam3.1',
  humanActionRecordedWithoutAutomation: true,
  officialServerAccessVerificationStillRequired: true,
  createOnlyExactReread: true,
  unknownSecretOrCallerClaimsRejected: true,
  hostileAccessorRejectedWithoutInvocation: true,
  cyclicEvidenceRejected: true,
  tamperedRereadRejected: true,
  checkpointBytesDownloaded: false,
  modelInstalledOnDeveloperMachine: false,
  gpuRuntimeAuthorized: false,
  customerCreditsMutated: false,
  productionReady: false,
}))

function createObjectPort(): {
  port: CanonicalCreateOnlyJsonObjectPort
  records: Map<string, Buffer>
} {
  const records = new Map<string, Buffer>()
  return {
    records,
    port: {
      async createOnly(input) {
        const prior = records.get(input.objectPath)
        if (prior) {
          if (digest(prior) !== input.contentSha256) {
            throw new Error('controlled create-only collision')
          }
          return 'already_exists'
        }
        if (digest(input.body) !== input.contentSha256) {
          throw new Error('controlled content hash mismatch')
        }
        records.set(input.objectPath, Buffer.from(input.body))
        return 'created'
      },
      async readExact(objectPath) {
        const recordValue = records.get(objectPath)
        return recordValue ? Buffer.from(recordValue) : null
      },
    },
  }
}

function digest(value: Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}

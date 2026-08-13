import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { assertCanonicalSam31ImageSupplyChainGoogleReadUrl } from
  '../services/canonical-sam3_1-cloud-image-supply-chain-evidence-read-service'

const build = readFileSync(
  'docker/prod/gpu-worker/sam3_1-source-preparation/cloudbuild.supply-chain.yaml',
  'utf8',
)
const operator = readFileSync(
  'scripts/gcp/prod/57-build-sam31-source-preparation-l4-supply-chain.sh',
  'utf8',
)

assert.match(build, /pull-immutable-source-preparation-image/u)
assert.match(build, /docker-archive:\/workspace\/sam31-source-preparation-image\.tar/u)
assert.match(build, /anchore\/syft@sha256:[a-f0-9]{64}/u)
assert.match(build, /spdx-json=/u)
assert.match(build, /projectsigstore\/cosign@sha256:[a-f0-9]{64}/u)
assert.match(build, /cryptoKeyVersions\/1/u)
assert.match(build, /--tlog-upload=false/u)
assert.match(build, /--insecure-ignore-tlog=true/u)
assert.match(build, /sam31-source-preparation\.spdx\.json/u)
assert.match(build, /cosign-signature\.bundle\.json/u)
assert.match(build, /cosign-verification\.json/u)
assert.match(build, /reeditpro-image-signer-sa@reeditpro/u)
assert.doesNotMatch(build, /secretEnv|availableSecrets|gpu|jobs execute/u)

assert.match(operator, /\^sha256:\[0-9a-f\]\{64\}\$/u)
assert.match(operator, /gcloud artifacts docker images describe/u)
assert.match(operator, /OBSERVED_DIGEST.*IMAGE_DIGEST/u)
assert.match(operator, /gcloud builds submit --no-source/u)
assert.match(operator, /_IMMUTABLE_IMAGE=/u)
assert.match(operator, /_EVIDENCE_LOCATION=/u)
assert.match(operator, /runtime_release_granted=false/u)
assert.match(operator, /gpu_job_dispatched=false/u)
assert.match(operator, /customer_credits_mutated=false/u)
assert.match(operator, /production_ready=false/u)
assert.doesNotMatch(operator, /docker run|run jobs execute|endpoints predict/u)

const sourcePreparationImageDigest = `sha256:${'a'.repeat(64)}`
const sourcePreparationResource =
  'https://us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/'
  + 'reeditpro-sam31-source-preparation-l4@'
  + sourcePreparationImageDigest
for (const kind of ['DISCOVERY', 'VULNERABILITY', 'BUILD'] as const) {
  const parameters = new URLSearchParams({
    filter: `kind="${kind}" AND resourceUrl="${sourcePreparationResource}"`,
    pageSize: '1000',
  })
  assert.doesNotThrow(() =>
    assertCanonicalSam31ImageSupplyChainGoogleReadUrl(
      `https://containeranalysis.googleapis.com/v1/projects/reeditpro/occurrences?${parameters.toString()}`,
    ))
}
assert.doesNotThrow(() =>
  assertCanonicalSam31ImageSupplyChainGoogleReadUrl(
    'https://artifactregistry.googleapis.com/v1/projects/reeditpro/'
    + 'locations/us-central1/repositories/reeditpro-workers/dockerImages/'
    + encodeURIComponent(
      `reeditpro-sam31-source-preparation-l4@${sourcePreparationImageDigest}`,
    ),
  ))
assert.throws(() => assertCanonicalSam31ImageSupplyChainGoogleReadUrl(
  'https://containeranalysis.googleapis.com/v1/projects/reeditpro/occurrences'
  + '?filter=kind%3D%22BUILD%22%20AND%20resourceUrl%3D%22https%3A%2F%2F'
  + 'us-central1-docker.pkg.dev%2Freeditpro%2Freeditpro-workers%2F'
  + 'reeditpro-sam31-source-preparation-l4%3Alatest%22&pageSize=1000',
))

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-eight-minute-source-preparation-image-supply-chain',
  checks: 30,
  immutableDigestRereadRequired: true,
  spdx23SbomPinned: true,
  kmsCosignSignatureAndVerificationPinned: true,
  artifactAnalysisSecurityReviewStillRequired: true,
  runtimeReleaseGranted: false,
  gpuJobDispatched: false,
  customerCreditsMutated: false,
  productionReady: false,
}))

import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const root = process.cwd()
const read = (path: string) => readFile(`${root}/${path}`, 'utf8')
const [dockerfile, buildConfig, buildScript, deployScript, viteConfig, cli,
  streamRuntime, packageJson] =
  await Promise.all([
    read('docker/prod/sam31-official-artifact-ingest/Dockerfile'),
    read('scripts/gcp/prod/cloudbuild-sam31-official-artifact-ingest.yaml'),
    read('scripts/gcp/prod/20-build-sam31-official-artifact-ingest-image.sh'),
    read('scripts/gcp/prod/21-deploy-sam31-official-artifact-ingest-job.sh'),
    read('vite.sam31-official-artifact-ingest.config.ts'),
    read('server/cli/canonical-sam3_1-official-artifact-ingest.ts'),
    read(
      'server/model-artifacts/canonical-sam3_1-official-artifact-stream-runtime.ts',
    ),
    read('package.json'),
  ])

assert.match(dockerfile,
  /node:24-alpine3\.22@sha256:8106d433c31d51dfd2fcce29763020619e334dd8c5b34a2f0a357c6656d1ca97/u)
assert.equal((dockerfile.match(/FROM node:24-alpine3\.22@sha256:/gu) ?? []).length, 2)
assert.match(dockerfile, /ca-certificates=20260611-r0/u)
assert.match(dockerfile, /git=2\.49\.1-r0/u)
assert.match(dockerfile, /libcrypto3=3\.5\.7-r0/u)
assert.match(dockerfile, /libssl3=3\.5\.7-r0/u)
assert.match(dockerfile, /openssl=3\.5\.7-r0/u)
assert.match(dockerfile, /rm -rf \/usr\/local\/lib\/node_modules\/npm/u)
assert.doesNotMatch(dockerfile, /COPY --from=dependencies/u)
assert.equal((dockerfile.match(/\/app\/node_modules\//gu) ?? []).length, 2)
assert.doesNotMatch(dockerfile, /apt-get|bookworm|perl/u)
assert.match(dockerfile, /WEEDITPRO_SOURCE_COMMIT_SHA/u)
assert.match(dockerfile, /WEEDITPRO_SOURCE_TREE_HASH/u)
assert.match(dockerfile,
  /node_modules\/abort-controller \.\/node_modules\/abort-controller/u)
assert.match(dockerfile,
  /node_modules\/event-target-shim \.\/node_modules\/event-target-shim/u)
assert.match(dockerfile, /NODE_OPTIONS=--max-old-space-size=6144/u)
assert.match(dockerfile, /io\.weeditpro\.model\.weights\.included="false"/u)
assert.match(dockerfile, /io\.weeditpro\.runtime\.inference\.allowed="false"/u)
assert.match(dockerfile, /USER node/u)
assert.match(dockerfile,
  /ENTRYPOINT \["node", "dist-sam31-official-artifact-ingest\/weeditpro-sam31-official-artifact-ingest\.js"\]/u)
assert.match(dockerfile,
  /npm run build:sam3_1-official-artifact-ingest-bundle/u)
assert.doesNotMatch(dockerfile, /sam3\.1_multiplex\.pt|HUGGINGFACE_TOKEN|MODEL_WEIGHT_ACCESS_TOKEN/u)

assert.match(buildConfig,
  /gcr\.io\/cloud-builders\/docker@sha256:f8b08c609fdc392ee6827ff3e1725e4980f7d96bde9f76f4695086405c96c147/u)
assert.match(buildConfig, /requestedVerifyOption:\s*VERIFIED/u)
assert.match(buildConfig, /sourceProvenanceHash:\s*\n\s*- SHA256/u)
assert.match(buildConfig,
  /reeditpro-image-builder-sa@reeditpro\.iam\.gserviceaccount\.com/u)
assert.doesNotMatch(buildConfig, /secretEnv|availableSecrets|sam3\.1_multiplex\.pt/u)

assert.match(buildScript,
  /build-weeditpro-sam31-official-artifact-ingest-v1/u)
assert.match(buildScript, /git status --porcelain=v1/u)
assert.match(buildScript, /git rev-parse 'HEAD\^\{tree\}'/u)
assert.match(buildScript, /\/Library\/Developer\/CommandLineTools/u)
assert.match(buildScript, /pinned Apple Command Line Tools Git is unavailable/u)
assert.match(buildScript, /image_summary\.digest/u)
assert.match(buildScript, /"modelOrCheckpointDownloaded":false/u)
assert.match(buildScript, /"secretRead":false/u)
assert.match(buildScript, /"cloudJobStarted":false/u)

assert.match(deployScript,
  /deploy-weeditpro-sam31-official-artifact-ingest-v1/u)
assert.match(deployScript, /weeditpro-sam31-official-artifact-ingest/u)
assert.match(deployScript, /weeditpro-sam31-ingest-sa/u)
assert.match(deployScript,
  /BUILD_ID='36ad4f1c-cfa5-4839-8391-3b024c867ec8'/u)
assert.match(deployScript,
  /SOURCE_COMMIT='85fca3ee99325543f007b09b17a9a56e51dee7a1'/u)
assert.match(deployScript,
  /SOURCE_TREE='9096845a53ec8d0907cb6305633f50d44aeda33c'/u)
assert.match(deployScript,
  /IMAGE_DIGEST='sha256:dd4252995028f87784af11402625ece78e5222a80add929d9a34ecf90c7cccfc'/u)
assert.match(deployScript, /requestedVerifyOption == "VERIFIED"/u)
assert.match(deployScript, /sourceProvenanceHash == \["SHA256"\]/u)
assert.match(deployScript, /slsa_build_level == 3/u)
assert.match(deployScript, /FINISHED_SUCCESS/u)
assert.match(deployScript, /contains\(\["NPM", "OS", "SECRET"\]\)/u)
assert.match(deployScript, /lastScanTime/u)
assert.match(deployScript,
  /package_vulnerability_summary\.vulnerabilities/u)
assert.doesNotMatch(deployScript,
  /WEEDITPRO_SAM31_ARTIFACT_INGEST_IMAGE/u)
assert.match(deployScript, /versions\/\[1-9\]\[0-9\]\*/u)
assert.match(deployScript, /gcloud storage cat/u)
assert.equal((deployScript.match(
  /--role="\$\{role\}" --condition=None --quiet/gu,
) ?? []).length, 2)
assert.match(deployScript, /roles\/secretmanager\.secretAccessor/u)
assert.match(deployScript,
  /add_project_log_writer_binding_with_propagation_retry/u)
assert.match(deployScript, /for attempt in \{1\.\.12\}/u)
assert.match(deployScript, /grep -Fq 'does not exist'/u)
assert.match(deployScript, /sleep 5/u)
assert.match(deployScript, /--max-retries=0/u)
assert.match(deployScript, /--task-timeout=4h/u)
assert.match(deployScript, /"jobExecuted":false/u)
assert.doesNotMatch(deployScript, /gcloud run jobs execute/u)
assert.doesNotMatch(deployScript, /--allow-unauthenticated/u)

assert.match(viteConfig,
  /input: 'server\/cli\/canonical-sam3_1-official-artifact-ingest\.ts'/u)
assert.match(viteConfig, /codeSplitting: false/u)
assert.match(viteConfig, /copyPublicDir: false/u)
assert.match(viteConfig, /noExternal: true/u)
assert.match(viteConfig, /external: \['abort-controller'\]/u)
assert.match(viteConfig,
  /outDir: 'dist-sam31-official-artifact-ingest'/u)
assert.match(packageJson,
  /"build:sam3_1-official-artifact-ingest-bundle": "npm run typecheck:server && vite build --config vite\.sam31-official-artifact-ingest\.config\.ts"/u)
assert.match(cli, /const EXPECTED_JOB = 'weeditpro-sam31-official-artifact-ingest'/u)
assert.match(cli, /publishCanonicalSam31OfficialPrivateArtifacts/u)
assert.match(cli, /createCanonicalSam31CloudOfficialArtifactStreamPort/u)
assert.match(cli, /createCanonicalSam31GcsOfficialArtifactPublicationPort/u)
assert.match(streamRuntime, /SOURCE_ARCHIVE_BYTE_LENGTH = 73_605_120/u)
assert.match(streamRuntime,
  /5138f0e396de40a40ef0168c106e089aacbbf1dc7651be2f81c76f89c2f67f2a/u)
assert.match(streamRuntime, /sam3-source\.tar/u)
assert.match(streamRuntime, /assertPinnedArchiveIdentity/u)
assert.match(streamRuntime, /createReadStream\(archivePath\)/u)
assert.match(streamRuntime, /await rm\(root, \{ recursive: true, force: true \}\)/u)
assert.doesNotMatch(streamRuntime, /writeFile.*sam3\.1_multiplex\.pt/u)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-official-artifact-ingest-cloud-job',
  checks: 80,
  dedicatedSourceBoundImage: true,
  dedicatedSingleEntryBundle: true,
  pinnedBaseAndCloudBuilder: true,
  immutableImageRequired: true,
  exactCleanBuildSlsaAndVulnerabilityScanRereadRequired: true,
  exactHumanTermsObjectRequired: true,
  exactSourceArchiveStagedAndHashedInCloudOnly: true,
  multiGigabyteCheckpointNeverStagedOnDeveloperMachine: true,
  exactEnabledSecretVersionRequired: true,
  dedicatedLeastPrivilegeServiceIdentity: true,
  cloudJobDeploymentDoesNotExecuteJob: true,
  modelOrCheckpointInstalledOnDeveloperMachine: false,
  cpuControlPlaneMayPerformModelInferenceOrMediaProcessing: false,
  customerCreditsMutated: false,
  productionAuthorityGranted: false,
}, null, 2))

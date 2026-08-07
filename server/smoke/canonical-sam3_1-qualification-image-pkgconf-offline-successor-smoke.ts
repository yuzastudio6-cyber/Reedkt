import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const publication = readFileSync(
  'server/cli/publish-canonical-sam3_1-qualification-image-build-pkgconf-offline-successor-authority.ts',
  'utf8',
)
const start = readFileSync(
  'server/cli/start-canonical-sam3_1-qualification-image-build-pkgconf-offline-successor.ts',
  'utf8',
)
const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
  readonly scripts?: Readonly<Record<string, string>>
}

for (const source of [publication, start] as const) {
  for (const expected of [
    'sam31-qualification-image-terminal-70c8f5b159e1d0c6132c',
    'sha256:70c8f5b159e1d0c6132cc9cf77586a576750384a1e355c5cdd073755739d2fed',
    'e0fc4726-558a-4f63-bbbf-0e669836a646',
    '37414e55b778004e9f53ef51b1039f9c17d77d6c49753740fb81cb4a9da67fb0',
    '4b39c5a97eab3ba124ccb9e2ee8ab3884c022744c43d15c9f89c88e94dd2a639',
    'c1b6c9c262e59ea338043bdcde5d8ac23dbbebafc3d0a6dd7994d152e72cba50',
    'sam31-qualification-image-build-pkgconf-offline-successor-7',
    'pinned_cuda_builder_missing_pkg_config',
    'pinned_official_pkgconf_source_built_inside_private_offline_closure',
    'automaticRetryOfPredecessor: false',
    "cloudBuildPolicy.machineType !== 'E2_STANDARD_2'",
  ] as const) assert.ok(
    source.includes(expected),
    `pkgconf-offline successor lost ${expected}`,
  )
  assert.doesNotMatch(
    source,
    /sam31-qualification-image-terminal-a58415ac30a996876a2f|automaticRetryOfPredecessor: true|secretEnv|availableSecrets/u,
  )
}

for (const expected of [
  'sam31-qualification-image-capsule-pkgconf-offline-v1',
  'sam31-qualification-capsule-reproducibility-private-closure-offline-20260807',
  'fec35ab135e5e7ab05548870080f96b42d195aaefc206838db48270adfa9e092',
  "cloudBuildMachineType: 'E2_STANDARD_2'",
] as const) assert.ok(
  publication.includes(expected),
  `pkgconf-offline publication lost ${expected}`,
)

assert.equal(
  packageJson.scripts?.[
    'publish:sam3_1-qualification-image-pkgconf-offline-successor-authority'
  ],
  'tsx server/cli/publish-canonical-sam3_1-qualification-image-build-pkgconf-offline-successor-authority.ts',
)
assert.equal(
  packageJson.scripts?.[
    'start:sam3_1-qualification-image-pkgconf-offline-successor-build'
  ],
  'tsx server/cli/start-canonical-sam3_1-qualification-image-build-pkgconf-offline-successor.ts',
)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-qualification-image-pkgconf-offline-successor',
  predecessorTerminalRereadRequired: true,
  predecessorImageBuildKnownStarted: true,
  predecessorImagePushKnownCompleted: false,
  distinctCorrectedSuccessorAuthorityRequired: true,
  exactOfflineCapsuleReproducibilityReceiptRequired: true,
  officialPkgconfSourceRequired: true,
  automaticRetryAllowed: false,
  modelExecuted: false,
  developerMachineInstallPerformed: false,
  customerCreditsMutated: false,
  runtimeReleaseGranted: false,
  productionReady: false,
}, null, 2))

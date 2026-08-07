import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const publication = readFileSync(
  'server/cli/publish-canonical-sam3_1-qualification-image-build-security-remediation-pep668-successor-authority.ts',
  'utf8',
)
const start = readFileSync(
  'server/cli/start-canonical-sam3_1-qualification-image-build-security-remediation-pep668-successor.ts',
  'utf8',
)
const capsulePublisher = readFileSync(
  'server/cli/publish-canonical-sam3_1-qualification-capsule-reproducibility.ts',
  'utf8',
)
const qualificationDockerfile = readFileSync(
  'docker/prod/gpu-worker/sam3_1/Dockerfile.qualification.candidate',
  'utf8',
)
const authorityModel = readFileSync(
  'server/model-artifacts/canonical-sam3_1-qualification-image-build-authority.ts',
  'utf8',
)
const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
  readonly scripts?: Readonly<Record<string, string>>
}

for (const source of [publication, start] as const) {
  for (const expected of [
    'sam31-qualification-image-terminal-3849ccac361ed9a02315',
    'sha256:3849ccac361ed9a02315568dfebc0c9912b1fa63f54bccc004b6d3bb7ded38d2',
    'bb921ca6-b317-42d2-b4db-f26816ddbfed',
    'sam31-qualification-image-build-security-remediation-successor-13',
    'sha256:aa4c3787f4557afd7cdbdb03c2005887e02775b9fb8d31b9574c53e79e12391e',
    'sam31-qualification-image-build-security-remediation-pep668-successor-14',
    '34e2d4993b315185b169373c12ee70ddf31dbb702ba97be5734fae8de5786481',
    'pep668_guard_blocked_inherited_distribution_cleanup',
    'explicit_pep668_system_uninstall_permission_without_system_install',
    'pep668SystemInstallAllowed: false',
    'pep668SystemUninstallForPinnedCleanupOnly: true',
    'automaticRetryOfPredecessor: false',
  ] as const) assert.ok(
    source.includes(expected),
    `security-remediation PEP 668 successor lost ${expected}`,
  )
  assert.doesNotMatch(
    source,
    /automaticRetryOfPredecessor: true|pep668SystemInstallAllowed: true|secretEnv|availableSecrets/u,
  )
}

for (const expected of [
  'security_remediation_pep668_uninstall_corrected',
  'sam31-qualification-capsule-reproducibility-security-remediation-pep668-uninstall-corrected-20260807',
  '0c93a02b-1952-4520-a1a1-89cf0f181219',
  '1dbde314-c57a-4144-9b12-0981736a92c9',
] as const) assert.ok(
  capsulePublisher.includes(expected),
  `PEP 668 cleanup reproducibility publisher lost ${expected}`,
)

assert.ok(qualificationDockerfile.includes(
  'python -m pip uninstall --yes --break-system-packages',
))
assert.doesNotMatch(
  qualificationDockerfile,
  /pip install[^\n]*--break-system-packages/u,
)
assert.ok(authorityModel.includes(
  'SECURITY_REMEDIATION_PEP668_UNINSTALL_DOCKERFILE_SHA256',
))

assert.equal(
  packageJson.scripts?.[
    'publish:sam3_1-qualification-image-security-remediation-pep668-successor-authority'
  ],
  'tsx server/cli/publish-canonical-sam3_1-qualification-image-build-security-remediation-pep668-successor-authority.ts',
)
assert.equal(
  packageJson.scripts?.[
    'start:sam3_1-qualification-image-security-remediation-pep668-successor-build'
  ],
  'tsx server/cli/start-canonical-sam3_1-qualification-image-build-security-remediation-pep668-successor.ts',
)

console.log(JSON.stringify({
  smoke:
    'canonical-sam3_1-qualification-image-security-remediation-pep668-successor',
  failedPredecessorExactRereadRequired: true,
  correctionRestrictedToSystemDistributionRemoval: true,
  systemPackageInstallAllowed: false,
  exactOfflineCapsuleReproducibilityReceiptRequired: true,
  automaticRetryAllowed: false,
  modelExecuted: false,
  gpuJobStarted: false,
  customerCreditsMutated: false,
  runtimeReleaseGranted: false,
  productionReady: false,
}, null, 2))

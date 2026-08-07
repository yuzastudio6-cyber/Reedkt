import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const publication = readFileSync(
  'server/cli/publish-canonical-sam3_1-qualification-image-build-security-remediation-successor-authority.ts',
  'utf8',
)
const start = readFileSync(
  'server/cli/start-canonical-sam3_1-qualification-image-build-security-remediation-successor.ts',
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
const provenanceLock = readFileSync(
  'docker/prod/gpu-worker/sam3_1/source-provenance.lock',
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
    'sam31-qualification-image-terminal-fd08655aa05d2b79ba6b',
    'sha256:fd08655aa05d2b79ba6b43595d0f95b79ed3b0ac54d31167c997a9e8eafe1b78',
    '15e59e99-132c-482e-a6af-4ff5f27c1e76',
    'sam31-qualification-image-build-native-library-closure-successor-12',
    'sha256:ddaf008a6a3a125b58d299d2b081cc97bea1ee06086fccaf49095ece32775c0c',
    'sha256:6855921e10554e60ac197d6ae60e1f68d7e94d0470d1e34add38f94a881f11f3',
    'sam31-artifact-analysis-scan-5405f777ff3c9542f429aa55',
    'sha256:5405f777ff3c9542f429aa5597b7387c980fdca78558c105b2c5c0c5cac7701b',
    '5aa4c8914c1a9989a5764e7d5cf133ba4c32db0f1646d97b92701e974a009178',
    'd8ac47d0ee4598baa30060350dff35e68aed4fb578a88586d4fbbb880caa2ba1',
    'c26c5a090028c6fd0603b8f280cd119048bfc799552c1979659525bcc6308747',
    'c7b8b39acbb685bddc04ff4f30832a7ffd568a6b5954f973ca61d5e223ffbd3d',
    'sam31-qualification-image-build-security-remediation-successor-13',
    'predecessor_artifact_analysis_high_severity_vulnerabilities',
    'exact_pinned_openssl_pillow_urllib3_and_unused_package_manager_remediation',
    'automaticRetryOfPredecessor: false',
  ] as const) assert.ok(
    source.includes(expected),
    `security-remediation successor lost ${expected}`,
  )
  assert.doesNotMatch(
    source,
    /automaticRetryOfPredecessor: true|securityWaiverGranted: true|secretEnv|availableSecrets/u,
  )
}

for (const expected of [
  'security_remediation_corrected',
  'sam31-qualification-capsule-reproducibility-security-remediation-corrected-20260807',
  '3e29aa73-7307-454d-bd38-b911b67aeab1',
  '6c209bca-9563-4a5f-be3e-a6b927ac2d6f',
] as const) assert.ok(
  capsulePublisher.includes(expected),
  `security-remediation reproducibility publisher lost ${expected}`,
)

for (const expected of [
  'openssl_3.0.13-0ubuntu3.12_amd64.deb',
  'libssl3t64_3.0.13-0ubuntu3.12_amd64.deb',
  'libssl-dev_3.0.13-0ubuntu3.12_amd64.deb',
  'python -m pip uninstall --yes pillow urllib3 wheel',
  'dpkg --purge python3-pip python3-wheel',
  "m.version('pillow') == '12.3.0'",
  "m.version('urllib3') == '2.7.0'",
] as const) assert.ok(qualificationDockerfile.includes(expected))

for (const expected of [
  'qualification_image_offline_openssl_version=3.0.13-0ubuntu3.12',
  'qualification_image_urllib3_version=2.7.0',
  'qualification_image_unused_os_python3_pip_and_wheel_purged=true',
  'qualification_image_inherited_pillow_urllib3_wheel_distributions_purged=true',
  'qualification_image_successor_security_scan_required=true',
] as const) assert.ok(provenanceLock.includes(expected))

for (const expected of [
  'SECURITY_REMEDIATION_DOCKERFILE_SHA256',
  'SECURITY_REMEDIATION_SOURCE_PROVENANCE_LOCK_SHA256',
  'SECURITY_REMEDIATION_DEPENDENCY_LOCK_SHA256',
  'SECURITY_REMEDIATION_DEPENDENCY_CLOSURE_RECEIPT_SHA256',
  'SECURITY_REMEDIATION_WHEEL_MANIFEST_SHA256',
  'OPENSSL_SECURITY_DEB_SHA256',
  'LIBSSL3_SECURITY_DEB_SHA256',
  'LIBSSL_DEV_SECURITY_DEB_SHA256',
  'SECURITY_UPDATE_RECEIPT_SHA256',
  'URLLIB3_2_7_WHEEL_SHA256',
  'Qualification capsule security lineage crossed.',
  'Qualification capsule security closure changed.',
  'legacyUrllib3WheelPath',
] as const) assert.ok(
  authorityModel.includes(expected),
  `security-remediation manifest admission lost ${expected}`,
)

assert.equal(
  packageJson.scripts?.[
    'publish:sam3_1-qualification-image-security-remediation-successor-authority'
  ],
  'tsx server/cli/publish-canonical-sam3_1-qualification-image-build-security-remediation-successor-authority.ts',
)
assert.equal(
  packageJson.scripts?.[
    'start:sam3_1-qualification-image-security-remediation-successor-build'
  ],
  'tsx server/cli/start-canonical-sam3_1-qualification-image-build-security-remediation-successor.ts',
)

console.log(JSON.stringify({
  smoke:
    'canonical-sam3_1-qualification-image-security-remediation-successor',
  predecessorTerminalSuccessRereadRequired: true,
  predecessorHighVulnerabilityScanBound: true,
  predecessorHighCount: 7,
  predecessorSecurityWaiverGranted: false,
  distinctCorrectedSuccessorAuthorityRequired: true,
  exactOfflineCapsuleReproducibilityReceiptRequired: true,
  exactPinnedSecurityClosureRequired: true,
  successorVulnerabilityScanRequired: true,
  automaticRetryAllowed: false,
  modelExecuted: false,
  gpuJobStarted: false,
  customerCreditsMutated: false,
  runtimeReleaseGranted: false,
  productionReady: false,
}, null, 2))

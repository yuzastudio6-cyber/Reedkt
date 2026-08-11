import type { OfflineLibassCaptionRequest } from './offline-libass-caption-protocol'

export interface OfflineLibassImageEvidence {
  imageTag: `reeditpro-offline-libass-caption-execution:canonical-private-local-v2-${string}`
  imageId: string
  imageIdentityHash: string
  libassVersion: '0.17.5'
  libassSourceSha256: 'caab4b993dd7be6187c55623b789ed75dddefea6e65938af134637c732fe094a'
  sourceHashes: Readonly<Record<string, string>>
  sourceTreeSha256: string
  fontPackProfileId: 'reeditpro_reviewed_fonts_v2'
  fontPackReleaseId: 'reeditpro-reviewed-noto-caption-fonts-2026-08-04-v1'
  fontToolsVersion: '4.38.0'
  openTypeSanitizerVersion: '8.2.1'
  fontToolsSubsetRoundTripPassed: true
  malformedFontRejectedByOpenTypeSanitizer: true
  fontSha256: Readonly<{
    notoSans: '478c558ea716033cd60c03438f628dfa75694dcf6b5f6d505a2f05fd2b4f3823'
    notoSansArabic: 'bdff3e5659d67e67def05b33f749683b9376ae819d65d3dd62ac4640b3aaef48'
    notoSansDevanagari: 'da2d2135e978c6f68852cfd8201c3a067df1acf73232fe80c58f89e6302ee6e8'
    notoSansJp: 'dff723ba59d57d136764a04b9b2d03205544f7cd785a711442d6d2d085ac5073'
  }>
  colorEmojiIncluded: false
  runtimeFontDownloadAllowed: false
  callerFontPathAllowed: false
  imageUser: '10001:10001'
  imageEntrypoint: readonly ['/opt/reeditpro-caption-runner']
  imageEnvironmentNames: readonly string[]
  rootFilesystemLayerDigests: readonly string[]
  labels: Readonly<Record<string, string>>
}
export interface OfflineLibassConfinementEvidence {
  networkMode: 'none'; readOnlyRootFilesystem: true; capDropAll: true; noNewPrivileges: true; privileged: false
  pidsLimit: 64; memoryLimitBytes: 268435456; memoryAndSwapLimitBytes: 268435456; nanoCpus: 1000000000
  tmpfsPath: '/tmp'; tmpfsSizeBytes: 33554432; tmpfsNoExec: true; tmpfsNoSuid: true; tmpfsNoDevice: true
  user: '10001:10001'; callerBindsPresent: false; callerMountsPresent: false; callerEnvironmentPresent: false
  serverDerivedArgumentsOnly: true; secretLikeImageEnvironmentNames: readonly []
}
export interface OfflineLibassCaptionResult {
  schemaVersion: 'offline-libass-caption-execution-result-v1'
  request: OfflineLibassCaptionRequest
  imageArtifact: {
    mimeType: 'image/png'; bytes: Buffer; byteLength: number; sha256: string
    width: number; height: number; channels: 4; hasAlpha: true
    nonTransparentPixelCount: number; alphaBoundingBox: { left: number; top: number; width: number; height: number }
  }
  evidence: {
    toolId: 'libass'; operationId: 'tool.libass.render_approved_caption_track.v1'
    binaryName: 'libass'; binaryVersion: '0.17.5'; sourceSha256: string
    requestEnvelopeSha256: string; resultSha256: string
    semanticEvidence: Readonly<Record<string, unknown>>
    image: OfflineLibassImageEvidence; confinement: OfflineLibassConfinementEvidence
    containerExitCode: 0; oomKilled: false
  }
  attestation: {
    schemaVersion: 'offline-libass-caption-execution-attestation-v1'; recordId: string; completedAt: string
    imageIdentityHash: string; requestEnvelopeSha256: string; resultSha256: string; confinementHash: string; attestationHash: string
  }
  readiness: { privateInternalOnly: true; productReady: false; externalBetaReady: false; productionReady: false; fullTrackOrVideoBurnInReady: false }
}
export interface OfflineLibassRuntimeAuthority {
  schemaVersion: 'offline-libass-caption-runtime-authority-v1'; source: 'private_local_offline_libass_caption_runtime_authority'
  activatedAt: string; image: OfflineLibassImageEvidence
  supportedOperations: readonly [{ toolId: 'libass'; operationId: 'tool.libass.render_approved_caption_track.v1' }]
  readiness: { privateInternalExecutionReady: true; exactStructuredPayloadOnly: true; canonicalDispatchMayReference: true; productReady: false; externalBetaReady: false; productionReady: false; fullTrackOrVideoBurnInReady: false }
  blockers: readonly string[]; authorityHash: string
}

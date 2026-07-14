export interface OfflineMediaBinaryImageEvidence {
  imageTag: 'reeditpro/ffmpeg-lgpl-internal:8.1.2-local'
  imageId: string
  imageIdentityHash: string
  architecture: string
  os: 'linux'
  user: '65532:65532'
  sourceVersion: '8.1.2'
  sourceSha256: '464beb5e7bf0c311e68b45ae2f04e9cc2af88851abb4082231742a74d97b524c'
  productReady: false
  h264Encoding: 'blocked_not_compiled'
  sourcePolicyHashes: Readonly<Record<string, string>>
}

export interface OfflineMediaBinaryConfinementEvidence {
  networkMode: 'none'
  readOnlyRootFilesystem: true
  capDropAll: true
  noNewPrivileges: true
  privileged: false
  pidsLimit: 128
  memoryLimitBytes: 536870912
  memoryAndSwapLimitBytes: 536870912
  nanoCpus: 2000000000
  tmpfsPath: '/tmp'
  user: '65532:65532'
  callerBindsPresent: false
  callerMountsPresent: false
  callerEnvironmentPresent: false
  serverOwnedEntrypoint: '/opt/reeditpro-ffmpeg/bin/ffprobe' | '/opt/reeditpro-ffmpeg/bin/ffmpeg'
  serverDerivedArgumentsOnly: true
}

export interface OfflineFfprobeExecutionResult {
  resultJson: {
    mimeType: 'application/json'
    bytes: Buffer
    document: Readonly<Record<string, unknown>>
    sha256: string
    byteLength: number
  }
  evidence: {
    toolId: 'ffprobe'
    operationId: 'tool.ffprobe.inspect_approved_media.v1'
    binaryVersion: '8.1.2'
    requestEnvelopeSha256: string
    sourceSha256: string
    resultSha256: string
    semanticEvidence: Readonly<Record<string, unknown>>
    confinement: OfflineMediaBinaryConfinementEvidence
    containerExitCode: 0
    oomKilled: false
  }
  image: OfflineMediaBinaryImageEvidence
  attestation: {
    recordId: string
    completedAt: string
    attestationHash: string
  }
  readiness: {
    privateInternalOnly: true
    productReady: false
    externalBetaReady: false
    productionReady: false
  }
}

export interface OfflineFfmpegExecutionResult {
  resultArtifact: {
    mimeType: 'video/x-nut' | 'audio/wav'
    bytes: Buffer
    sha256: string
    byteLength: number
  }
  evidence: {
    toolId: 'ffmpeg'
    operationId: 'tool.ffmpeg.execute_approved_media_recipe.v1'
    binaryVersion: '8.1.2'
    requestEnvelopeSha256: string
    sourceSha256: string
    resultSha256: string
    semanticEvidence: Readonly<Record<string, unknown>>
    confinement: OfflineMediaBinaryConfinementEvidence
    containerExitCode: 0
    oomKilled: false
  }
  image: OfflineMediaBinaryImageEvidence
  attestation: { recordId: string; completedAt: string; attestationHash: string }
  readiness: {
    privateInternalOnly: true
    productReady: false
    externalBetaReady: false
    productionReady: false
  }
}

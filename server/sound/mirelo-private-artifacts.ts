import { createHash } from 'node:crypto'
import { rm } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
  readPrivateFileIfExistsWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
  writePrivateTextFileAtomicWithinRoot,
} from '../security/private-local-persistence'
import type { SoundArtifactRef } from './sound-contracts'
import {
  runSoundLocalAudioExecution,
  validateSoundAudioFile,
  type SoundLocalExecutionBinding,
} from './sound-local-audio-processor'
import type {
  MireloCarrierAudioExtractor,
  MireloPrivateOutputIngestor,
} from './mirelo-sfx-provider'

function safePart(value: string): string {
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(value) || value.includes('..')) {
    throw new Error('Private Mirelo artifact identity is unsafe.')
  }
  return value
}

export class PrivateMireloOutputIngestor implements MireloPrivateOutputIngestor {
  private readonly privateOutputRoot: string
  private readonly privateOutputScopeId: string

  constructor(privateOutputRoot: string, privateOutputScopeId: string) {
    this.privateOutputRoot = privateOutputRoot
    this.privateOutputScopeId = privateOutputScopeId
  }

  async ingest(input: {
    requestId: string
    attemptId: string
    candidateIndex: number
    bytes: Uint8Array
    contentType: string
    providerProfileKey: string
    sourceVisualHash?: string
    providerVisualRejected: boolean
  }): Promise<SoundArtifactRef> {
    const requestId = safePart(input.requestId)
    const attemptId = safePart(input.attemptId)
    if (!Number.isInteger(input.candidateIndex) || input.candidateIndex < 0 || input.candidateIndex > 3) {
      throw new Error('Mirelo candidate index is outside its approved range.')
    }
    if (!input.contentType.startsWith('audio/')) throw new Error('Private Mirelo ingest accepts audio only.')
    if (input.bytes.byteLength <= 0 || input.bytes.byteLength > 256 * 1024 * 1024) {
      throw new Error('Private Mirelo output exceeds its byte policy.')
    }
    const extension = input.contentType.includes('flac') ? 'flac' : 'wav'
    const artifactId = `mirelo.${attemptId}.candidate.${input.candidateIndex}`
    const relativePath = [
      'sound', safePart(this.privateOutputScopeId), 'providers', 'mirelo',
      requestId, attemptId, `candidate-${input.candidateIndex}.${extension}`,
    ].join('/')
    const committed = await writePrivateFileCreateOnlyWithinRoot({
      rootPath: this.privateOutputRoot,
      relativePath,
      content: input.bytes,
    })
    await validateSoundAudioFile(committed.absolutePath)
    const checksumSha256 = createHash('sha256').update(input.bytes).digest('hex')
    await writePrivateTextFileAtomicWithinRoot({
      rootPath: this.privateOutputRoot,
      relativePath: `${relativePath}.provenance.json`,
      content: JSON.stringify({
        schemaVersion: 'sound-provider-provenance-v1',
        artifactId,
        requestId,
        attemptId,
        candidateIndex: input.candidateIndex,
        providerProfileKey: input.providerProfileKey,
        sourceVisualHash: input.sourceVisualHash,
        providerVisualRejected: input.providerVisualRejected,
        checksumSha256,
        providerUrlPersisted: false,
        private: true,
      }),
    })
    return {
      artifactId,
      artifactType: 'candidate_sfx_asset',
      version: 1,
      checksumSha256,
      storageObjectId: relativePath.replaceAll('/', ':'),
      private: true,
      contentType: input.contentType,
    }
  }
}

export class PrivateMireloCarrierAudioExtractor implements MireloCarrierAudioExtractor {
  private readonly privateRoot: string
  private readonly binding: SoundLocalExecutionBinding

  constructor(privateRoot: string, binding: SoundLocalExecutionBinding) {
    this.privateRoot = privateRoot
    this.binding = binding
  }

  async extractAudio(input: {
    carrierBytes: Uint8Array
    carrierContentType: string
    attemptId: string
    candidateIndex: number
  }): Promise<{ audioBytes: Uint8Array; audioContentType: 'audio/wav' }> {
    if (!input.carrierContentType.startsWith('video/')) throw new Error('Mirelo carrier extractor accepts video carriers only.')
    const attemptId = safePart(input.attemptId)
    const base = `sound-carrier-${attemptId}-${input.candidateIndex}`
    const carrierRelative = `.mirelo-carrier/${base}.mp4`
    const outputRelative = `.mirelo-carrier/${base}.wav`
    const carrier = await writePrivateFileCreateOnlyWithinRoot({
      rootPath: this.privateRoot,
      relativePath: carrierRelative,
      content: input.carrierBytes,
    })
    const carrierChecksum = createHash('sha256').update(input.carrierBytes).digest('hex')
    try {
      await runSoundLocalAudioExecution({
        schemaVersion: 'sound-local-audio-execution-v1',
        executionId: `carrier-extract.${attemptId}.${input.candidateIndex}`,
        binding: this.binding,
        operation: 'extract',
        operationProfileKey: 'sound.extract.pcm.v1',
        sources: [{
          artifact: {
            artifactId: `carrier.${attemptId}.${input.candidateIndex}`,
            artifactType: 'provider_carrier_video',
            version: 1,
            checksumSha256: carrierChecksum,
            storageObjectId: carrierRelative.replaceAll('/', ':'),
            private: true,
            contentType: input.carrierContentType,
          },
          absolutePath: carrier.absolutePath,
        }],
        approvedInputRoot: this.privateRoot,
        privateOutputRoot: this.privateRoot,
        outputRelativePath: outputRelative,
        outputArtifactId: `carrier-audio.${attemptId}.${input.candidateIndex}`,
        outputArtifactType: 'candidate_sfx_asset',
        outputContentType: 'audio/wav',
        parameters: { sampleRate: 48_000, channels: 2 },
      })
      const bytes = await readPrivateFileIfExistsWithinRoot({
        rootPath: this.privateRoot,
        relativePath: outputRelative,
      })
      if (!bytes) throw new Error('Mirelo carrier audio extraction did not produce bytes.')
      return { audioBytes: bytes, audioContentType: 'audio/wav' }
    } finally {
      await rm(resolve(this.privateRoot, carrierRelative), { force: true }).catch(() => undefined)
      await rm(resolve(this.privateRoot, outputRelative), { force: true }).catch(() => undefined)
    }
  }
}

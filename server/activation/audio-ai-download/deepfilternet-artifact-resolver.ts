import {
  DEEPFILTERNET_CLI_FILE_NAME,
  DEEPFILTERNET_ONNX_ARCHIVE_FILE_NAME,
  selectedDeepFilterNetArtifacts,
} from './deepfilternet-download-policy'
import type { DeepFilterNetChecksumEntry, DeepFilterNetSelectedArtifact } from './audio-ai-download-types'

export function listSelectedDeepFilterNetArtifacts(): DeepFilterNetSelectedArtifact[] {
  return selectedDeepFilterNetArtifacts.map((artifact) => ({ ...artifact }))
}

export function findDeepFilterNetCliChecksum(entries: DeepFilterNetChecksumEntry[]): DeepFilterNetChecksumEntry | undefined {
  return entries.find((entry) => entry.relativePath === DEEPFILTERNET_CLI_FILE_NAME)
}

export function findDeepFilterNetModelArchiveChecksum(entries: DeepFilterNetChecksumEntry[]): DeepFilterNetChecksumEntry | undefined {
  return entries.find((entry) => entry.relativePath === DEEPFILTERNET_ONNX_ARCHIVE_FILE_NAME)
}

export function assertDeepFilterNetSelectedArtifactSet(fileNames: string[]): void {
  const expected = selectedDeepFilterNetArtifacts.map((artifact) => artifact.fileName).sort()
  const candidate = [...fileNames].sort()
  const missing = expected.filter((fileName) => !candidate.includes(fileName))
  const unexpected = candidate.filter((fileName) => !expected.includes(fileName))
  if (missing.length > 0 || unexpected.length > 0) {
    throw new Error(`DeepFilterNet selected artifact mismatch. Missing: ${missing.join(', ') || 'none'}; unexpected: ${unexpected.join(', ') || 'none'}.`)
  }
}

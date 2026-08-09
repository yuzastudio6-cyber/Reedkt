import assert from 'node:assert/strict'

import { resolveFfprobeFrameRate } from '../media/ffprobe'
import { privateSourceMediaMetadataSchema } from
  '../validation/private-upload-media-authority-schemas'

let checks = 0

function check(condition: unknown, message: string): void {
  assert.ok(condition, message)
  checks += 1
}

check(
  JSON.stringify(resolveFfprobeFrameRate('30000/1001', '30/1')) ===
    JSON.stringify({
      frameRateNumerator: 30000,
      frameRateDenominator: 1001,
    }),
  'FFprobe average frame rate must preserve the exact NTSC rational value.',
)
check(
  JSON.stringify(resolveFfprobeFrameRate('60000/2002', '30/1')) ===
    JSON.stringify({
      frameRateNumerator: 30000,
      frameRateDenominator: 1001,
    }),
  'Equivalent FFprobe rates must normalize to one stable rational identity.',
)
check(
  JSON.stringify(resolveFfprobeFrameRate('0/0', '25/1')) ===
    JSON.stringify({ frameRateNumerator: 25, frameRateDenominator: 1 }),
  'An unavailable average rate must fall back to the exact nominal rate.',
)
check(
  resolveFfprobeFrameRate('29.97', '0/0') === undefined,
  'Approximate decimal or zero frame rates must not become timing authority.',
)

const legacyMetadata = {
  probeStatus: 'probed' as const,
  source: 'local_ffprobe' as const,
  durationSeconds: 12,
  hasVideo: true,
  hasAudio: true,
}
check(
  privateSourceMediaMetadataSchema.safeParse(legacyMetadata).success,
  'Existing probed metadata without frame-rate fields must remain readable.',
)
check(
  privateSourceMediaMetadataSchema.safeParse({
    ...legacyMetadata,
    frameRateNumerator: 30000,
    frameRateDenominator: 1001,
  }).success,
  'New video metadata must accept an exact rational frame rate.',
)
check(
  !privateSourceMediaMetadataSchema.safeParse({
    ...legacyMetadata,
    frameRateNumerator: 30,
  }).success,
  'A partial frame-rate pair must fail closed.',
)
check(
  !privateSourceMediaMetadataSchema.safeParse({
    ...legacyMetadata,
    hasVideo: false,
    frameRateNumerator: 30,
    frameRateDenominator: 1,
  }).success,
  'Audio-only metadata must not carry video frame-rate authority.',
)

console.log(`Media FFprobe frame-rate smoke checks passed (${checks} checks).`)

export const VISUAL_CALIBRATION_REFERENCE_FRAME_FIXTURE = Object.freeze({
  schemaVersion: 'visual-calibration-reference-frame-fixture-v1' as const,
  firstFrameAssetId: 'storytelling-calibration-first-frame',
  firstFrameAssetVersionId: 'storytelling-calibration-first-frame-v1',
  lastFrameAssetId: 'storytelling-calibration-last-frame',
  lastFrameAssetVersionId: 'storytelling-calibration-last-frame-v1',
  sha256: '4e99a922e4da512bb639556361d28128a235ebffd7974a7c1b6674f346b5def8',
  byteLength: 476,
  pngBase64:
    'iVBORw0KGgoAAAANSUhEUgAAAUAAAAC0CAIAAABqhmJGAAAACXBIWXMAAAABAAAAAQBPJcTWAAABjklEQVR42u3TgQkAAAjDMPX/m4d3DJITCt0M0OokAAMDBgYMDAYGDAwYGDAwGBgwMGBgMDBgYMDAgIHBwICBAQMDBgYDAwYGDAwGBgwMGBgwMBgYMDBgYMDAYGDAwICBwcCAgQEDAwYGAwMGBgwMBgYMDBgYMDAYGDAwYGDAwGBgwMCAgcHAgIEBAwMGBgMDBgYMDBgYDAwYGDAwGBgwMGBgwMBgYMDAgIEBA4OBAQMDBgYDAwYGDAwYGAwMGBgwMBgYMDBgYMDAYGDAwICBAQODgQEDAwYGAwMGBgwMGBgMDBgYMDBgYDAwYGDAwGBgwMCAgQEDg4EBAwMGBgwMBgYMDBgYDAwYGDAwYGAwMGBgwMBgYMDAgIEBA4OBAQMDBgYMDAYGDAwYGAwMGBgwMGBgMDBgYMDAgIHBwICBAQODgQEDAwYGDAwGBgwMGBgMDBgYMDBgYDAwYGDAwICBwcCAgQEDg4EBAwMGBgwMBgYMDBgYMDAYGDAwYGAwMGBgwMCAgcHAgIEBAwMGhm4PbSICZkfQ5Y8AAAAASUVORK5CYII=',
})

export function visualCalibrationReferenceFrameBytes(): Buffer {
  const bytes = Buffer.from(
    VISUAL_CALIBRATION_REFERENCE_FRAME_FIXTURE.pngBase64,
    'base64',
  )
  if (bytes.byteLength !== VISUAL_CALIBRATION_REFERENCE_FRAME_FIXTURE.byteLength) {
    throw new Error('Visual-calibration reference fixture byte length changed.')
  }
  return bytes
}

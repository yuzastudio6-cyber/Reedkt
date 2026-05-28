import { resolvePhase33DArtifactUris } from './real-video-mask-source-resolver'

export function listExpectedRealVideoMaskArtifacts(runId: string) {
  const uris = resolvePhase33DArtifactUris(runId)
  return [
    { id: 'representative_frame', required: true, gcsUri: uris.representativeFrame },
    { id: 'frame_extraction_report', required: true, gcsUri: uris.frameExtractionReport },
    { id: 'mask_png', required: true, gcsUri: uris.mask },
    { id: 'rgba_cutout_png', required: true, gcsUri: uris.cutout },
    { id: 'mask_metadata_json', required: true, gcsUri: uris.maskMetadata },
    { id: 'mask_qa_report', required: true, gcsUri: uris.qaReport },
    { id: 'phase33d_report', required: true, gcsUri: uris.phase33dReport },
  ]
}

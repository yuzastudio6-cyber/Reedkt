import { readabilityExtractionConfig } from './readability-extraction-policy'
import type {
  ReadabilityExtractionArtifact,
  ReadabilityExtractionArtifactManifest,
} from './readability-extraction-types'

export function buildReadabilityExtractionArtifactManifest(input: {
  runId: string
  artifacts: ReadabilityExtractionArtifact[]
  warnings: string[]
  blockers: string[]
}): ReadabilityExtractionArtifactManifest {
  return {
    runId: input.runId,
    fixtureMode: readabilityExtractionConfig.fixtureMode,
    sourcePlan: 'generated_local_article_fixture',
    publicWebExtractionUsed: false,
    liveSearchUsed: false,
    paidProviderUsed: false,
    browserCaptureUsed: false,
    readabilityVersion: readabilityExtractionConfig.readabilityVersion,
    domImplementation: readabilityExtractionConfig.domImplementation,
    sanitizer: readabilityExtractionConfig.sanitizer,
    artifacts: input.artifacts,
    warnings: input.warnings,
    blockers: input.blockers,
  }
}

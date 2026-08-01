import assert from 'node:assert/strict'

import {
  compileLivingFrameRepresentativeSourceProvenanceAudit,
  verifyLivingFrameRepresentativeSourceProvenanceAudit,
} from '../living-frame/living-frame-representative-source-provenance-audit'

const audit = compileLivingFrameRepresentativeSourceProvenanceAudit()

assert.equal(
  verifyLivingFrameRepresentativeSourceProvenanceAudit(audit),
  true,
)
assert.equal(audit.sourceCount, 7)
assert.equal(audit.sources.length, 7)
assert.equal(
  audit.sources.every((entry, order) =>
    entry.order === order
    && entry.evidenceRefs.length >= 1
    && entry.evidenceRefs.every((ref) =>
      ref.checkedOnDate === '2026-08-01'
      && ref.canonicalRereadRequired
      && !ref.externalUrlSerialized)
    && entry.canonicalLicenseAttributionPublicityAndFactReviewPending
    && entry.privateInternalResearchUseOnly
    && !entry.customerOrPublicUseAuthorized
    && !entry.sourceMediaBytesFetched),
  true,
)

const interview = audit.sources[0]!
assert.equal(interview.evidenceRefs.length, 3)
assert.equal(
  interview.requiredRestrictions.includes(
    'identifiable_person_publicity_review_required',
  ),
  true,
)

const historicalMap = audit.sources[2]!
assert.equal(
  historicalMap.factualFreshnessClass,
  'historical_source_not_modern_data',
)
assert.equal(
  historicalMap.requiredRestrictions.includes(
    'historical_map_must_not_represent_modern_geography',
  ),
  true,
)

const eia = audit.sources[4]!
assert.equal(eia.sourcePageContentClass, 'external_analysis_html_page')
assert.equal(
  eia.futurePrivateArtifactClass,
  'canonical_derived_structured_data_snapshot',
)
assert.equal(eia.factualFreshnessClass, 'current_reread_required')
assert.equal(
  eia.requiredRestrictions.includes(
    'third_party_input_reuse_review_required',
  ),
  true,
)

assert.equal(audit.sourcePageResearchPerformed, true)
assert.equal(audit.exactExternalMediaBytesFetched, false)
assert.equal(audit.liveWebPageTreatedAsExecutableStructuredData, false)
assert.equal(audit.structuredDataRequiresCanonicalDerivedSnapshot, true)
assert.equal(audit.generatedFixturePresentedAsAuthenticArchive, false)
assert.equal(audit.pausedCharacterOrMechanicalAnimationAdmitted, false)
assert.equal(
  audit.canonicalSourcePageLicenseFactAndPublicityRereadPending,
  true,
)
assert.equal(audit.canonicalConsumptionPending, true)
assert.equal(audit.runtimeExecuted, false)
assert.equal(audit.productionReady, false)

let adversarialChecks = 0
const reject = (candidate: unknown) => {
  assert.equal(
    verifyLivingFrameRepresentativeSourceProvenanceAudit(candidate),
    false,
  )
  adversarialChecks += 1
}

reject({ ...audit, sourceCount: 6 })
reject({ ...audit, exactExternalMediaBytesFetched: true })
reject({ ...audit, liveWebPageTreatedAsExecutableStructuredData: true })
reject({ ...audit, generatedFixturePresentedAsAuthenticArchive: true })
reject({ ...audit, pausedCharacterOrMechanicalAnimationAdmitted: true })
reject({
  ...audit,
  canonicalSourcePageLicenseFactAndPublicityRereadPending: false,
})
reject({ ...audit, canonicalConsumptionPending: false })
reject({ ...audit, runtimeExecuted: true })
reject({ ...audit, productionReady: true })
reject({
  ...audit,
  sources: audit.sources.map((entry, order) => order === 0
    ? { ...entry, customerOrPublicUseAuthorized: true }
    : entry),
})
reject({
  ...audit,
  sources: audit.sources.map((entry, order) => order === 4
    ? { ...entry, futurePrivateArtifactClass: 'immutable_source_media_bytes' }
    : entry),
})
reject({
  ...audit,
  sources: audit.sources.map((entry, order) => order === 2
    ? { ...entry, factualFreshnessClass: 'fixed_source_media' }
    : entry),
})
reject({
  ...audit,
  sources: audit.sources.map((entry, order) => order === 6
    ? {
        ...entry,
        requiredRestrictions: entry.requiredRestrictions.filter(
          (restriction) => restriction !== 'mechanical_part_animation_paused',
        ),
      }
    : entry),
})
reject({
  ...audit,
  sources: audit.sources.map((entry, order) => order === 0
    ? {
        ...entry,
        evidenceRefs: entry.evidenceRefs.map((ref, refOrder) => refOrder === 0
          ? { ...ref, externalUrlSerialized: true }
          : ref),
      }
    : entry),
})
assert.equal(adversarialChecks, 14)

process.stdout.write(`${JSON.stringify({
  smoke: 'living_frame_representative_source_provenance_audit',
  status: 'passed_source_only_research_snapshot_canonical_reread_pending',
  contractVersion: audit.contractVersion,
  auditDigestSha256: audit.auditDigestSha256,
  sourceCount: audit.sourceCount,
  exactWikimediaRevisionRefsRecorded: 4,
  officialNasaSourceAndPolicyRefsRecorded: 2,
  officialEiaAnalysisAndReuseRefsRecorded: 2,
  structuredDataRequiresCanonicalDerivedSnapshot: true,
  canonicalRereadPending: true,
  externalMediaBytesFetched: false,
  runtimeExecuted: false,
  adversarialChecks,
  productionReady: false,
})}\n`)

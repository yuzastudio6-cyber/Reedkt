import assert from 'node:assert/strict'

import {
  REAL_USER_MEDIA_BETA_GATE_DECISION,
  buildApprovedRealUserMediaBetaGateFixture,
  buildRealUserMediaBetaGateReport,
} from '../beta-readiness'

const missingReport = buildRealUserMediaBetaGateReport()
assert.equal(missingReport.externalBetaWithRealUserMediaAllowed, false, 'missing evidence must block real-user-media beta')
assert.equal(missingReport.decision, 'blocked', 'missing evidence decision should be blocked')

const evidence = buildApprovedRealUserMediaBetaGateFixture()
const report = buildRealUserMediaBetaGateReport(evidence)
assert.equal(report.externalBetaWithRealUserMediaAllowed, true, 'complete evidence should allow approved-scope real-user-media beta')
assert.equal(report.decision, REAL_USER_MEDIA_BETA_GATE_DECISION, 'complete evidence should preserve Milestone 9 decision')
assert.equal(report.goNoGo.externalBetaAllowed, true, 'external beta prerequisite should pass for the approved scope')
assert.equal(report.goNoGo.realUserMediaBetaAllowed, true, 'real-user-media beta should pass for the approved scope')
assert.equal(report.goNoGo.paidProductionAllowed, false, 'paid production must remain blocked')
assert.equal(report.paidProductionAllowed, false, 'gate report must not allow paid production')
assert.equal(report.approvedScope.allowedToolIds.length, 16, 'approved pilot should cover the 16 Track B tools')
assert.equal(report.artifactPrivacySummary.totalArtifacts, 3, 'fixture should include source, analysis, and QA artifacts')
assert.equal(report.artifactPrivacySummary.privateArtifacts, 3, 'all artifacts should be private')
assert.equal(report.artifactPrivacySummary.publicArtifacts, 0, 'no public artifacts allowed')
assert.equal(report.artifactPrivacySummary.publicOrSignedUrlArtifacts, 0, 'no public or signed URL artifacts allowed')
assert.equal(report.artifactPrivacySummary.finalExportArtifactCount, 0, 'final export artifacts remain blocked')
assert.ok(report.checklist.every((item) => item.status === 'passed'), 'every Milestone 9 evidence checklist item should pass')
assert.equal(report.blockers.length, 0, 'complete Milestone 9 fixture should have no blockers')

const noConsent = buildRealUserMediaBetaGateReport({
  ...evidence,
  userConsentDisclosureCopy: {
    ...evidence.userConsentDisclosureCopy,
    consentCopyApproved: false,
  },
})
assert.equal(noConsent.externalBetaWithRealUserMediaAllowed, false, 'missing consent approval must block')
assert.ok(noConsent.blockers.some((blocker) => blocker.includes('Consent copy approval')), 'consent blocker should be explicit')

const publicArtifact = buildRealUserMediaBetaGateReport({
  ...evidence,
  artifactManifest: [{
    ...evidence.artifactManifest[0],
    isPrivate: false,
  }],
})
assert.equal(publicArtifact.externalBetaWithRealUserMediaAllowed, false, 'public artifact records must block')
assert.ok(publicArtifact.blockers.some((blocker) => blocker.includes('non-private')), 'public artifact blocker should be explicit')

const signedArtifact = buildRealUserMediaBetaGateReport({
  ...evidence,
  artifactManifest: [{
    ...evidence.artifactManifest[0],
    storageObjectPath: 'https://storage.example.com/source.mp4?X-Goog-Signature=abc',
  }],
})
assert.equal(signedArtifact.externalBetaWithRealUserMediaAllowed, false, 'signed URL source-of-truth artifacts must block')
assert.ok(signedArtifact.blockers.some((blocker) => blocker.includes('signed URL')), 'signed URL blocker should be explicit')

const overLimitPilot = buildRealUserMediaBetaGateReport({
  ...evidence,
  boundedPilot: {
    ...evidence.boundedPilot,
    pilotUploadReferences: [{
      ...evidence.boundedPilot.pilotUploadReferences[0],
      durationSeconds: 900,
    }],
  },
})
assert.equal(overLimitPilot.externalBetaWithRealUserMediaAllowed, false, 'over-limit media duration must block')
assert.ok(overLimitPilot.blockers.some((blocker) => blocker.includes('duration exceeds')), 'duration blocker should be explicit')

const missingExternalPrerequisite = buildRealUserMediaBetaGateReport({
  ...evidence,
  externalBetaPrerequisites: {
    ...evidence.externalBetaPrerequisites,
    deploymentApproved: false,
  },
})
assert.equal(missingExternalPrerequisite.externalBetaWithRealUserMediaAllowed, false, 'real-user-media beta cannot pass without external beta prerequisites')
assert.ok(missingExternalPrerequisite.blockers.some((blocker) => blocker.includes('Deployment approval')), 'external prerequisite blocker should be explicit')

const secretLikeEvidence = buildRealUserMediaBetaGateReport({
  ...evidence,
  storagePrivacyApproval: {
    ...evidence.storagePrivacyApproval,
    ownerNotes: ['Bearer secret-token-value'],
  },
})
assert.equal(secretLikeEvidence.externalBetaWithRealUserMediaAllowed, false, 'secret-like evidence must block')
assert.ok(secretLikeEvidence.blockers.some((blocker) => blocker.includes('Secret-like field')), 'secret-like blocker should be explicit')

const serialized = JSON.stringify(report)
assert.equal(/X-Goog-Signature|X-Amz-Signature/i.test(serialized), false, 'passing report must not contain signed URL material')
assert.equal(/service[_-]?role[_-]?key|api[_-]?key|secret\s*[:=]|token\s*[:=]/i.test(serialized), false, 'passing report must not leak credential-shaped secrets')

console.log(JSON.stringify({
  ok: true,
  decision: report.decision,
  externalBetaWithRealUserMediaAllowed: report.externalBetaWithRealUserMediaAllowed,
  realUserMediaBetaAllowed: report.goNoGo.realUserMediaBetaAllowed,
  paidProductionAllowed: report.goNoGo.paidProductionAllowed,
  checklistItems: report.checklist.map((item) => item.id),
  artifactPrivacySummary: report.artifactPrivacySummary,
  blockedCases: {
    noConsent: noConsent.blockers.length,
    publicArtifact: publicArtifact.blockers.length,
    signedArtifact: signedArtifact.blockers.length,
    overLimitPilot: overLimitPilot.blockers.length,
    missingExternalPrerequisite: missingExternalPrerequisite.blockers.length,
    secretLikeEvidence: secretLikeEvidence.blockers.length,
  },
}, null, 2))

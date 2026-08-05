import assert from 'node:assert/strict'

import {
  createCurrentTrackAllSam31V2RouteGateReport,
  TRACK_ALL_SAM31_V2_REQUIRED_GATE_KEYS,
  trackAllSam31V2RouteGateReportSchema,
} from '../edit-skills/track-all/private/sam3_1-v2-route-qualification-gate'
import { hashSkillValue } from '../edit-skills/core/skill-capability-manifest-hash'

const report = createCurrentTrackAllSam31V2RouteGateReport({
  generatedAt: '2026-08-04T16:00:00.000Z',
})
assert.equal(trackAllSam31V2RouteGateReportSchema.parse(report).reportHash,
  report.reportHash)
assert.equal(report.routeQualificationStatus, 'blocked')
assert.equal(report.internalExecutionAuthorized, false)
assert.equal(report.productionExecutionAuthorized, false)
assert.equal(report.actualCheckpointBytesObserved, false)
assert.equal(report.actualStrictLoadObserved, false)
assert.equal(report.actualA100InferenceObserved, false)
assert.equal(report.actualL4InferenceObserved, false)
assert.equal(report.actualSamRequestCount, 0)
assert.equal(report.checkpointSha256, null)
assert.equal(report.findings.length,
  TRACK_ALL_SAM31_V2_REQUIRED_GATE_KEYS.length)
assert.equal(report.findings.filter((finding) =>
  finding.disposition === 'passed').length, 1)
assert.equal(report.findings.filter((finding) =>
  finding.disposition === 'blocked').length, 10)
assert.equal(Object.isFrozen(report), true)
assert.equal(Object.isFrozen(report.findings), true)

const forged = structuredClone(report)
forged.routeQualificationStatus = 'internal_execution_qualified'
forged.internalExecutionAuthorized = true
const { reportHash: _forgedHash, ...forgedCore } = forged
void _forgedHash
forged.reportHash = hashSkillValue(forgedCore)
assert.throws(() => trackAllSam31V2RouteGateReportSchema.parse(forged))

const syntheticPass = structuredClone(report)
syntheticPass.findings[0]!.disposition = 'passed'
syntheticPass.findings[0]!.evidenceClass = 'missing_external_evidence'
syntheticPass.findings[0]!.evidenceHashes = [hashSkillValue('injected')]
const { reportHash: _syntheticHash, ...syntheticCore } = syntheticPass
void _syntheticHash
syntheticPass.reportHash = hashSkillValue(syntheticCore)
assert.throws(() => trackAllSam31V2RouteGateReportSchema.parse(syntheticPass))

const noL4 = createCurrentTrackAllSam31V2RouteGateReport({
  generatedAt: '2026-08-04T16:00:00.000Z',
  l4FallbackActive: false,
})
assert.equal(noL4.findings.find((finding) =>
  finding.gateKey === 'l4_private_runtime_and_quality_if_fallback_active')
  ?.disposition, 'not_applicable')
assert.equal(noL4.routeQualificationStatus, 'blocked')

console.log(JSON.stringify({
  status: 'ok',
  operationId: report.operationId,
  reportHash: report.reportHash,
  requiredGateCount: report.findings.length,
  passedGateCount: report.findings.filter((finding) =>
    finding.disposition === 'passed').length,
  blockedGateCount: report.findings.filter((finding) =>
    finding.disposition === 'blocked').length,
  checkpointBytesObserved: report.actualCheckpointBytesObserved,
  strictLoadObserved: report.actualStrictLoadObserved,
  a100InferenceObserved: report.actualA100InferenceObserved,
  l4InferenceObserved: report.actualL4InferenceObserved,
  actualSamRequestCount: report.actualSamRequestCount,
  routeQualificationStatus: report.routeQualificationStatus,
}))

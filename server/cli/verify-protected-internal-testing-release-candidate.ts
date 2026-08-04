import {
  evaluateProtectedInternalTestingReleaseCandidateAdmission,
  readProtectedInternalTestingReleaseCandidateSnapshot,
} from '../config/protected-internal-testing-release-candidate-admission'

const report = evaluateProtectedInternalTestingReleaseCandidateAdmission(
  readProtectedInternalTestingReleaseCandidateSnapshot(
    process.cwd(),
    process.env.REEDITPRO_INTERNAL_TESTING_SOURCE_REF?.trim() ?? '',
    process.env.REEDITPRO_INTERNAL_TESTING_SOURCE_SHA?.trim() ?? '',
  ),
)

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)

if (!report.ok) process.exitCode = 1

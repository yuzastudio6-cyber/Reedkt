import { createQwenLiveBetaDoctorReport } from '../../src/backend/qwen-runtime/qwen-live-beta-service'

const strict = process.argv.includes('--strict')
const report = await createQwenLiveBetaDoctorReport()

console.log(JSON.stringify({
  command: 'doctor:qwen-beta',
  status: report.status,
  ready: report.ready,
  checks: report.checks,
  config: report.config,
  secretDiagnostics: report.secretDiagnostics,
  flags: report.flags,
  nextStep: report.nextStep,
  generatedAt: report.generatedAt,
}, null, 2))

if (strict && !report.ready) process.exitCode = 1

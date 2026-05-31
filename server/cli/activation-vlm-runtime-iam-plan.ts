import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { buildVlmRuntimeIamPlan, runVlmRuntimeScopedIamUpdate } from '../activation/vlm-runtime'

const apply = process.argv.includes('--apply')
const writeReports = process.argv.includes('--write-reports')
const includeQaReadback = process.argv.includes('--include-qa-readback')
const reportDirArg = process.argv.find((arg) => arg.startsWith('--report-dir='))
const reportDir = reportDirArg?.split('=')[1] ?? 'docs/activation-phase-39c-generated-vlm-runtime-verification-reports'

if (!apply) {
  console.log(JSON.stringify(buildVlmRuntimeIamPlan(new Date().toISOString(), { includeQaReadback }), null, 2))
} else {
  const result = await runVlmRuntimeScopedIamUpdate({ includeQaReadback })
  if (writeReports) {
    await mkdir(reportDir, { recursive: true })
    await writeJson(path.join(reportDir, 'phase_39c_vlm_runtime_scoped_iam_plan.json'), result.plan)
    await writeJson(path.join(reportDir, 'phase_39c_vlm_runtime_iam_before.json'), result.before)
    await writeJson(path.join(reportDir, 'phase_39c_vlm_runtime_iam_after.json'), result.after)
    await writeJson(path.join(reportDir, 'phase_39c_vlm_runtime_iam_delta_report.json'), result.delta)
  }
  console.log(JSON.stringify(result.delta, null, 2))
  if (result.delta.blockers.length) process.exitCode = 1
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

import type {
  MockExportJob,
  MockExportOutput,
} from '../../types'

export function getLatestCompletedExportJob(jobs: MockExportJob[]) {
  return [...jobs].reverse().find((job) => job.status === 'completed') ?? null
}

export function getExportOutputsForJob(job: MockExportJob | null): MockExportOutput[] {
  return job?.outputs ?? []
}

export function summarizeExportHistory(outputs: MockExportOutput[], jobs: MockExportJob[]) {
  const completedJobs = jobs.filter((job) => job.status === 'completed').length
  const failedJobs = jobs.filter((job) => job.status === 'failed').length
  return `${outputs.length} private output record${outputs.length === 1 ? '' : 's'} across ${completedJobs} completed export rehearsal${completedJobs === 1 ? '' : 's'}${failedJobs ? `, ${failedJobs} failed` : ''}.`
}

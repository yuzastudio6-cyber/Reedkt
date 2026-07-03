import {
  buildNextControlledCandidateOrWorkerHandoffReports,
  summarizeNextControlledCandidateOrWorkerHandoffReview,
} from '../activation/next-controlled-candidate-or-worker-handoff-review'

console.log(summarizeNextControlledCandidateOrWorkerHandoffReview(buildNextControlledCandidateOrWorkerHandoffReports()))

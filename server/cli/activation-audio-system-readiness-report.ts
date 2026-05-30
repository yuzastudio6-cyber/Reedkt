import {
  buildAudioSystemReadinessReport,
  summarizeAudioSystemReadinessReport,
} from '../activation/audio-system-readiness'

console.log(summarizeAudioSystemReadinessReport(buildAudioSystemReadinessReport()))

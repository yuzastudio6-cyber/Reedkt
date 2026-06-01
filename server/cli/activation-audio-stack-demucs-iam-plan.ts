import { buildAudioStackDemucsIamPlan } from '../activation/audio-stack-demucs'

console.log(JSON.stringify({
  phase: '36G',
  mutationPlanned: false,
  iamPlan: buildAudioStackDemucsIamPlan(),
}, null, 2))

import { readDeepFilterNetRuntimeHardeningSummary } from '../activation/deepfilternet-runtime-hardening'

console.log(JSON.stringify(await readDeepFilterNetRuntimeHardeningSummary(), null, 2))

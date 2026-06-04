import { buildSupabaseDataPlaneIamPlan } from '../activation/supabase-data-plane-audit'

console.log(JSON.stringify(buildSupabaseDataPlaneIamPlan(), null, 2))

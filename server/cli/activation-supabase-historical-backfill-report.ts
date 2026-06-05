import { buildSupabaseHistoricalBackfillReport, summarizeSupabaseHistoricalBackfillReport } from '../activation/supabase-historical-backfill'

console.log(summarizeSupabaseHistoricalBackfillReport(buildSupabaseHistoricalBackfillReport()))

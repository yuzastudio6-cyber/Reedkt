import {
  buildControlledRealVideoOcrSafeZoneReport,
  summarizeControlledRealVideoOcrSafeZoneReport,
} from '../activation/controlled-real-video-ocr-safe-zone'

const report = buildControlledRealVideoOcrSafeZoneReport()

if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2))
else console.log(summarizeControlledRealVideoOcrSafeZoneReport(report))

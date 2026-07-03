import { buildOpenSourceToolStackPackageInstallScriptReviewReports } from '../activation/open-source-tool-stack-package-install-script-review'

const reports = buildOpenSourceToolStackPackageInstallScriptReviewReports()
console.log(JSON.stringify(reports.decision, null, 2))

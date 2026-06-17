import {
  forbiddenConfirmationFragments,
  requiredConfirmations,
  writeOpenSourceToolStackPackageInstallScriptReviewArtifacts,
} from '../activation/open-source-tool-stack-package-install-script-review'

const required = requiredConfirmations()
const missing = required.filter((name) => process.env[name] !== 'true')
const forbidden = Object.keys(process.env).filter(
  (name) => process.env[name] === 'true' && forbiddenConfirmationFragments().some((fragment) => name.includes(fragment)),
)

if (missing.length || forbidden.length) {
  console.error(
    JSON.stringify(
      {
        error: 'package_install_script_review_confirmation_gate_failed',
        missing,
        forbidden,
      },
      null,
      2,
    ),
  )
  process.exit(1)
}

const reports = writeOpenSourceToolStackPackageInstallScriptReviewArtifacts()
console.log(JSON.stringify(reports.decision, null, 2))

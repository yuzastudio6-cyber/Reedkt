# Production Tool Readiness Report Policy

`ProductionReadinessReport` is the M12 report object for API, CPU, GPU, render, QA, and tool-readiness worker readiness.

Report fields include worker summaries, tool summaries, image summaries, model-weight summaries, license summaries, blocker summaries, command plans, warnings, and next actions.

Statuses include `passed`, `warning`, `missing`, `blocked`, `not_checked`, `not_installed`, `future_only`, `evaluation_only`, `needs_license_review`, `needs_model_weight_review`, `model_weight_missing`, `model_weight_blocked`, `pending_manual_review`, and `source_install_review_required`.

Static and dry-run reports are allowed to show blockers. They do not prove local tools are installed; they prove the readiness contract can be evaluated without unsafe execution.

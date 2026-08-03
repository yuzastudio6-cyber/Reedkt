#!/usr/bin/env bash
set -euo pipefail

echo >&2 "Blocked: the historical CPU QA worker cannot be deployed for fresh WeEditPro media or visual QA."
echo >&2 "Use 10-deploy-gpu-worker-job.example.sh; admitted deterministic media QA runs on the scale-from-zero L4 standard lane."
exit 2

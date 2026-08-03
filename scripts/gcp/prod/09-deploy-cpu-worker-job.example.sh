#!/usr/bin/env bash
set -euo pipefail

echo >&2 "Blocked: reeditpro-cpu-analysis-worker is historical and cannot be deployed for fresh WeEditPro media or model work."
echo >&2 "Use 10-deploy-gpu-worker-job.example.sh for the L4 standard lane; heavy jobs are created on A100 80 GB by the canonical backend launch owner."
exit 2

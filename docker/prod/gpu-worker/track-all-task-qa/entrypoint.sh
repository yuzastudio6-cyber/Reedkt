#!/bin/sh
set -eu

if [ "${WEEDITPRO_GPU_ACCELERATOR_CLASS:-}" != "nvidia_l4" ]; then
  echo "Track All task QA requires WEEDITPRO_GPU_ACCELERATOR_CLASS=nvidia_l4" >&2
  exit 70
fi

driver_version_file=/proc/driver/nvidia/version
if [ ! -r "${driver_version_file}" ]; then
  echo "NVIDIA kernel driver version is unavailable" >&2
  exit 70
fi

driver_version="$({
  sed -n \
    's/.*Kernel Module[[:space:]]*\([0-9][0-9.]*\).*/\1/p' \
    "${driver_version_file}"
} | sed -n '1p')"
driver_major="${driver_version%%.*}"

case "${driver_version}" in
  ''|*[!0-9.]*)
    echo "NVIDIA kernel driver version is malformed" >&2
    exit 70
    ;;
esac
case "${driver_major}" in
  ''|*[!0-9]*)
    echo "NVIDIA kernel driver major version is malformed" >&2
    exit 70
    ;;
esac

host_driver_paths=/usr/local/nvidia/lib64:/usr/local/nvidia/lib
if [ "${driver_major}" -ge 535 ] && [ "${driver_major}" -lt 570 ]; then
  compatibility_path=/usr/local/cuda-12.8/compat
  if [ ! -r "${compatibility_path}/libcuda.so.1" ]; then
    echo "CUDA 12.8 forward-compatibility library is unavailable" >&2
    exit 70
  fi
  WEEDITPRO_CUDA_DRIVER_LIBRARY_MODE=cuda_compat_12_8
  LD_LIBRARY_PATH="${compatibility_path}:${host_driver_paths}"
elif [ "${driver_major}" -ge 570 ]; then
  WEEDITPRO_CUDA_DRIVER_LIBRARY_MODE=host_driver
  LD_LIBRARY_PATH="${host_driver_paths}"
else
  echo "NVIDIA driver is below the admitted CUDA 12.8 floor" >&2
  exit 70
fi

export LD_LIBRARY_PATH
export WEEDITPRO_CUDA_DRIVER_LIBRARY_MODE
export WEEDITPRO_OBSERVED_NVIDIA_DRIVER_VERSION="${driver_version}"

exec /usr/bin/python -s -B \
  /opt/weeditpro/track-all-task-qa/runner.py

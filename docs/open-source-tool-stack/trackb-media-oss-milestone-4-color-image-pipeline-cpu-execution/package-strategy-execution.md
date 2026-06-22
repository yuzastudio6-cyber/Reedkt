# Package Strategy Execution

Added exactly `OpenColorIO` and `OpenImageIO` to `docker/prod/cpu-worker/requirements.cpu.txt`.
The unpinned requirements style was preserved and `PyOpenColorIO` was not declared.
Package-lock and unrelated requirements files remain unmutated.

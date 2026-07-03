# Future Verification Command Plan

Future execution may run only the bounded version/import commands for OpenCV, PyAV, and PySceneDetect plus tiny synthetic fixture checks.

- OpenCV: `python -c "import cv2; print(cv2.__version__)"`
- PyAV: `python -c "import av; print(av.__version__)"`
- PySceneDetect: `python -c "import scenedetect; print(getattr(scenedetect, '__version__', 'unknown'))"`

These commands were not run in this approval phase. Fixture checks must remain synthetic, private, cleaned, and non-public.

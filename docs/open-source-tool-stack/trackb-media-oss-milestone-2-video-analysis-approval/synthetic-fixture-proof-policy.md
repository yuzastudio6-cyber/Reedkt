# Synthetic Fixture Proof Policy

Future execution must use only tiny synthetic fixtures.

OpenCV should prove import/version plus a deterministic synthetic image or array operation. PyAV should prove import/version first; container/frame proof may be deferred if it would require unsafe media or FFmpeg expansion. PySceneDetect should prove import/version first; tiny scene fixture proof may be deferred if no safe non-FFmpeg path exists.

No real user media, committed media fixtures, public artifacts, signed URLs, FFmpeg/FFprobe commands, render/export, or beta/production scope is approved.

# libgomp Presence Report

Image tag: `reeditpro-ocr-runtime:trackb-milestone3-cpu-libgomp-b17a20898d5c046447905e5a411a733133afa535`.

Command: `docker run --rm --network none --entrypoint python reeditpro-ocr-runtime:trackb-milestone3-cpu-libgomp-b17a20898d5c046447905e5a411a733133afa535 -c import ctypes.util, glob, json; resolved=ctypes.util.find_library('gomp'); paths=glob.glob('/usr/lib/**/libgomp.so.1', recursive=True); print(json.dumps({'library':'libgomp','resolved':resolved,'paths':paths[:5]}))`.

Exit code: `0`.

libgomp present: `true`.

Network disabled: `true`.

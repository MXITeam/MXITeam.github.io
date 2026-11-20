#!/usr/bin/env python3
"""Serve the static site locally, including byte ranges for video seeking."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import re


class SiteHandler(SimpleHTTPRequestHandler):
    def send_head(self):
        self.byte_range = None
        path = Path(self.translate_path(self.path))
        match = re.fullmatch(r"bytes=(\d*)-(\d*)", self.headers.get("Range", ""))
        if not match or not any(match.groups()) or not path.is_file():
            return super().send_head()

        size = path.stat().st_size
        first, last = match.groups()
        start = int(first) if first else max(0, size - int(last))
        end = min(int(last), size - 1) if first and last else size - 1
        if start > end or start >= size:
            self.send_response(416)
            self.send_header("Content-Range", f"bytes */{size}")
            self.send_header("Content-Length", "0")
            self.end_headers()
            return None

        source = path.open("rb")
        source.seek(start)
        self.byte_range = (start, end)
        self.send_response(206)
        self.send_header("Content-Type", self.guess_type(str(path)))
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.send_header("Content-Length", str(end - start + 1))
        self.end_headers()
        return source

    def copyfile(self, source, outputfile):
        if self.byte_range is None:
            return super().copyfile(source, outputfile)
        remaining = self.byte_range[1] - self.byte_range[0] + 1
        while remaining:
            chunk = source.read(min(64 * 1024, remaining))
            if not chunk:
                break
            outputfile.write(chunk)
            remaining -= len(chunk)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8000)
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    handler = partial(SiteHandler, directory=str(root))
    with ThreadingHTTPServer(("127.0.0.1", args.port), handler) as server:
        print(f"MXI: http://127.0.0.1:{args.port}/", flush=True)
        server.serve_forever()

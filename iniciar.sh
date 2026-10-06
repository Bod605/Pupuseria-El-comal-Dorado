#!/bin/sh
cd "$(dirname "$0")"
python3 -m pip install -q flask 2>/dev/null || pip3 install -q flask
(sleep 2; (xdg-open http://localhost:5000 || open http://localhost:5000) >/dev/null 2>&1) &
python3 app.py

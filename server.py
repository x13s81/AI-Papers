#!/usr/bin/env python3
"""
Simple HTTP server to run AI Papers Daily locally.

Usage:
    python server.py

Then open http://localhost:8000 in your browser.
"""

import http.server
import socketserver
import webbrowser
import os

PORT = 8000

# Change to script directory
os.chdir(os.path.dirname(os.path.abspath(__file__)))

Handler = http.server.SimpleHTTPRequestHandler

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"🔬 AI Papers Daily")
    print(f"   Server running at http://localhost:{PORT}")
    print(f"   Press Ctrl+C to stop")
    print()
    
    # Open browser
    webbrowser.open(f"http://localhost:{PORT}")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n   Server stopped.")

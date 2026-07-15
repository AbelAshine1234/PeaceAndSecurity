#!/bin/bash

# Simple HTTP server for serving markdown documentation
# This will start a local server to view your markdown files

PORT=${1:-8080}

echo "Starting documentation server on http://localhost:$PORT"
echo "Press Ctrl+C to stop"

# Try using Python's built-in HTTP server
if command -v python3 &> /dev/null; then
    python3 -m http.server $PORT
elif command -v python &> /dev/null; then
    python -m http.server $PORT
else
    echo "Python not found. Please install Python or use one of the following:"
    echo "  - npx serve ."
    echo "  - npx http-server ."
    echo "  - Or use VS Code's Live Preview extension"
fi


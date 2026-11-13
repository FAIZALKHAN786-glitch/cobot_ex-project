@echo off
start /b node server.js > server.log 2>&1
echo Server starting on http://localhost:4000

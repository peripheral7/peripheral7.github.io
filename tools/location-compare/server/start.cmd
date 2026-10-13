@echo off
chcp 65001 >nul
rem WhereTo compute server + Cloudflare tunnel (README section 11). Close window or Ctrl+C to stop.
cd /d "%~dp0.."
node server\analyze-server.mjs --tunnel
pause

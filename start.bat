@echo off
chcp 65001 >nul
start "" http://localhost:8899
node "%~dp0server.js"
pause
@echo off
setlocal
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0doctor-python.ps1" %*


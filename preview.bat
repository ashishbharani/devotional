@echo off
REM Double-click on Windows to preview the website at http://127.0.0.1:8000 (close this window to stop).
cd /d "%~dp0"
where uv >nul 2>nul || (echo uv is not installed yet. Open PowerShell and run: & echo   powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex" & pause & exit /b 1)
echo Building the website (the first time takes a minute or two)...
start "" cmd /c "timeout /t 8 >nul & start http://127.0.0.1:8000"
uv run mkdocs serve --dirtyreload

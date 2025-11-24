@echo off
echo ============================================
echo   Starting Ollama WebUI with Web Search
echo ============================================
echo.

REM Check if Ollama is already running
echo [1/4] Checking Ollama service...
curl -s http://localhost:11434/api/tags >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [✓] Ollama is already running
) else (
    echo [!] Starting Ollama service...
    start "Ollama Server" /MIN cmd /c "ollama serve"
    echo [~] Waiting for Ollama to start...
    timeout /t 3 /nobreak >nul
    echo [✓] Ollama started
)

echo.
echo [2/4] Starting DuckDuckGo Search Server...  
start "Search Server" /MIN cmd /c "node search-server.js"
timeout /t 2 /nobreak >nul
echo [✓] Search server started on port 8081

echo.
echo [3/4] Starting Web UI Server...
echo.
echo   Access your chat interface at:
echo   - Local:   http://localhost:8080
echo.
echo   Features:
echo   - Click the search icon to enable web search
echo   - Get real-time information from the internet
echo.
echo   Press Ctrl+C to stop all services
echo.
echo ============================================

REM Start the web server (this will block)
npx -y serve -l 8080

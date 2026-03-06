@echo off
echo Starting FACEIT Analyzer...
echo.

start "Backend" cmd /c "cd backend && go mod tidy && go run main.go"
timeout /t 3 /nobreak >nul
start "Frontend" cmd /c "cd frontend && npm install && npm run dev"

echo.
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:8080
echo.
pause

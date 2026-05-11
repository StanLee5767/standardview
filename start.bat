@echo off
chcp 65001 > nul
cd /d "%~dp0"

echo.
echo  DART 재무분석기 시작 중...
echo  ================================
echo.

:: 백엔드 실행 (FastAPI)
echo  [1/3] FastAPI 백엔드 시작 (포트 8002)...
start "DART-Backend" cmd /k "cd /d "%~dp0backend" && python -m uvicorn main:app --host 0.0.0.0 --port 8002 --reload"

timeout /t 2 /nobreak > nul

:: 프론트엔드 실행 (Vite)
echo  [2/3] Vite 프론트엔드 시작 (포트 5173)...
start "DART-Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

timeout /t 5 /nobreak > nul

:: 브라우저 열기
echo  [3/3] 브라우저 오픈...
start http://localhost:5173

echo.
echo  실행 완료!
echo  로컬:    http://localhost:5173
echo  API:     http://localhost:8002
echo.
echo  같은 WiFi PC에서: http://[이 PC의 IP]:5173
echo  (이 PC의 IP 확인: ipconfig 또는 ip addr)
echo.

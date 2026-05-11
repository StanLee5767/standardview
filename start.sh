#!/bin/bash
# macOS/Linux 실행 스크립트
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

PYTHON="/Library/Frameworks/Python.framework/Versions/3.14/bin/python3"
# Python이 없으면 기본 python3 사용
command -v "$PYTHON" &>/dev/null || PYTHON="python3"

echo ""
echo " DART 재무분석기 시작 중..."
echo " ================================"
echo ""

# 백엔드
echo " [1/3] FastAPI 백엔드 시작 (포트 8002)..."
cd "$SCRIPT_DIR/backend"
"$PYTHON" -m uvicorn main:app --host 0.0.0.0 --port 8002 &
BACKEND_PID=$!

sleep 2

# 프론트엔드
echo " [2/3] Vite 프론트엔드 시작 (포트 5173)..."
cd "$SCRIPT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!

sleep 4

# 브라우저
echo " [3/3] 브라우저 오픈..."
open http://localhost:5173 2>/dev/null || xdg-open http://localhost:5173 2>/dev/null

echo ""
echo " 실행 완료!"
echo " 로컬:    http://localhost:5173"
echo " API:     http://localhost:8002"
echo " 같은 WiFi: http://$(ipconfig getifaddr en0 2>/dev/null || hostname -I | awk '{print $1}'):5173"
echo ""
echo " 종료: Ctrl+C"
echo ""

# 두 프로세스 모두 종료될 때까지 대기
wait $BACKEND_PID $FRONTEND_PID

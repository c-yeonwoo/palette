#!/bin/bash

# Palette 서버 시작 스크립트

echo "🚀 Starting Palette Servers..."
echo ""

# 현재 디렉토리 확인
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

# Java 21 환경 설정
export JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home
export PATH="$JAVA_HOME/bin:$PATH"

echo "Java Version:"
java -version
echo ""

# 백엔드 서버 시작 (백그라운드)
echo "📦 Starting Backend (Spring Boot)..."
./gradlew bootRun > logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"
echo "Log: logs/backend.log"
echo ""

# 백엔드 시작 대기
echo "⏳ Waiting for backend to start..."
for i in {1..30}; do
    if curl -s http://localhost:8080/actuator/health > /dev/null 2>&1; then
        echo "✅ Backend is UP!"
        break
    fi
    sleep 1
    echo -n "."
done
echo ""

# 프론트엔드는 이미 실행 중일 수 있음
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend is already running"
else
    echo "📦 Starting Frontend (React)..."
    echo "Run manually: cd frontend && npm run dev"
fi
echo ""

echo "🎉 Servers Status:"
echo "  Backend:  http://localhost:8080  $(curl -s http://localhost:8080/actuator/health > /dev/null 2>&1 && echo '✅' || echo '❌')"
echo "  Frontend: http://localhost:3000  $(curl -s http://localhost:3000 > /dev/null 2>&1 && echo '✅' || echo '❌')"
echo ""
echo "📝 Next: Start LangGraph service"
echo "  cd langgraph-service && source venv/bin/activate && python main.py"
echo ""
echo "📄 Logs:"
echo "  Backend:  tail -f logs/backend.log"
echo ""
echo "🛑 Stop: pkill -f 'gradle.*bootRun'"

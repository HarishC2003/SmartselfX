#!/bin/bash
echo "🚀 Starting SmartShelfX..."

# Start Python forecast service
echo "🤖 Starting Forecast engine..."
cd forecast-service
# Try to find python/venv
if [ -d "venv" ]; then
    source venv/bin/activate
fi
nohup uvicorn main:app --host 0.0.0.0 --port 8000 > forecast.log 2>&1 &
PYTHON_PID=$!
echo "🤖 Forecast engine started (PID: $PYTHON_PID)"

# Start Node.js server
echo "⚙️ Starting Node.js server..."
cd ../server
npm run dev > server.log 2>&1 &
NODE_PID=$!
echo "⚙️ Node.js server started (PID: $NODE_PID)"

# Start React client
echo "🎨 Starting React client..."
cd ../client
npm run dev > client.log 2>&1 &
CLIENT_PID=$!
echo "🎨 React client started (PID: $CLIENT_PID)"

echo ""
echo "✅ SmartShelfX running!"
echo "   Frontend:  http://localhost:5173"
echo "   Backend:   http://localhost:5000"
echo "   Forecast:  http://localhost:8000"
echo "   API Docs:  http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all services"

# Handle termination
trap "kill $PYTHON_PID $NODE_PID $CLIENT_PID; echo '🛑 Services stopped.'; exit" INT TERM
wait

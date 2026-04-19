@echo off
echo 🚀 Starting SmartShelfX...

echo 🤖 Starting Forecast engine...
start cmd /k "cd forecast-service && (if exist venv\Scripts\activate.bat call venv\Scripts\activate.bat) && uvicorn main:app --host 0.0.0.0 --port 8000"

echo ⚙️ Starting Node.js server...
start cmd /k "cd server && npm run dev"

echo 🎨 Starting React client...
start cmd /k "cd client && npm run dev"

echo.
echo ✅ SmartShelfX running in new windows!
echo    Frontend:  http://localhost:5173
echo    Backend:   http://localhost:5000
echo    Forecast:  http://localhost:8000
echo    API Docs:  http://localhost:8000/docs
echo.
echo 🛑 To stop the platform, simply close the 3 new command prompt windows that appeared.

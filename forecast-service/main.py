from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import forecast
import uvicorn
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="SmartShelfX Forecast Engine", version="1.0.0")

# CORS middleware
origins = [os.getenv("ALLOWED_ORIGINS", "http://localhost:5000")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# Include routers
app.include_router(forecast.router, prefix="/forecast")

@app.get("/")
async def root():
    return {
        "status": "ok",
        "service": "SmartShelfX Forecast Engine",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "SmartShelfX Forecast Engine",
        "version": "1.0.0",
        "models": ["ensemble", "arima", "exponential_smoothing"]
    }

@app.on_event("startup")
async def startup_event():
    print("🤖 Forecast engine ready on port 8000")

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)

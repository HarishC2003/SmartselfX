from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
from utils.forecasting import calculate_forecast
import uvicorn

app = FastAPI(title="SmartShelfX Forecasting Service")

class TransactionItem(BaseModel):
    date: str
    quantity: int

class ForecastRequest(BaseModel):
    productId: str
    currentStock: int
    reorderLevel: int
    transactions: List[TransactionItem]
    leadTime: Optional[int] = 3

class ForecastResponse(BaseModel):
    dailyDemand: float
    recommendedReorderPoint: int
    safetyStock: int
    confidenceLevel: float
    nextRestockDate: Optional[str] = None
    lastCalculatedAt: str

@app.post("/forecast", response_model=ForecastResponse)
async def get_forecast(request: ForecastRequest):
    try:
        results = calculate_forecast(
            [t.model_dump() for t in request.transactions],
            request.currentStock,
            request.reorderLevel,
            request.leadTime
        )
        
        # Estimate next restock date
        # If demand > 0, days left = current stock / daily demand
        days_left = None
        next_restock = None
        if results["dailyDemand"] > 0:
            days_left = request.currentStock / results["dailyDemand"]
            next_restock = datetime.now() + timedelta(days=days_left)
            
        return {
            **results,
            "nextRestockDate": next_restock.isoformat() if next_restock else None,
            "lastCalculatedAt": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "forecasting-engine"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

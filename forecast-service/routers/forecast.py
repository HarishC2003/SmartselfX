from fastapi import APIRouter, HTTPException
from typing import List
from models.schemas import ForecastRequest, ForecastResponse, ForecastResult
from utils.data_prep import prepare_daily_demand, get_data_summary
from services.ensemble import run_ensemble_forecast

router = APIRouter()

@router.post("/predict", response_model=ForecastResponse)
async def predict_demand(request: ForecastRequest):
    """
    Main forecast endpoint. Called by Node.js after every transaction.
    """
    try:
        # 1. Prepare daily demand series from transactions (Filter for last 60 days)
        daily_demand = prepare_daily_demand(request.transactions, lookback_days=60)
        
        # 2. Build product_meta dict from request.product
        product_meta = request.product.model_dump()
        
        # 3. Run ensemble forecast
        result = run_ensemble_forecast(
            daily_demand=daily_demand,
            product_meta=product_meta,
            forecast_days=request.forecastDays
        )
        
        # Log summary for visibility
        stats = get_data_summary(daily_demand)
        print(f"📊 Forecast generated for {request.product.sku}: "
              f"{result.ensembleDemand:.2f} units/day, "
              f"confidence: {result.confidenceLabel} "
              f"({stats['data_points']} days analyzed)")
        
        # 4. Return ForecastResponse
        return {
            "success": True,
            "data": result,
            "message": f"Successfully generated {request.forecastDays}-day forecast for {request.product.sku}"
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Forecasting engine prediction error: {str(e)}"
        )

@router.get("/health")
async def health_check():
    return { "status": "ok", "engine": "WMA+SES+SafetyStock Ensemble" }

@router.post("/batch-predict")
async def batch_predict(requests: List[ForecastRequest]):
    """
    Predict for multiple products at once.
    Used for nightly full-catalog refresh (future use).
    """
    results = []
    failed = 0
    
    for req in requests:
        try:
            daily_demand = prepare_daily_demand(req.transactions, lookback_days=60)
            product_meta = req.product.model_dump()
            
            result = run_ensemble_forecast(
                daily_demand=daily_demand,
                product_meta=product_meta,
                forecast_days=req.forecastDays
            )
            results.append(result)
        except Exception as e:
            print(f"Failed to predict for {req.product.sku}: {str(e)}")
            failed += 1
            
    return {
        "success": True,
        "results": results,
        "total": len(requests),
        "failed": failed
    }

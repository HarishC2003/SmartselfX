"""
Ensemble Engine: Blends WMA and SES outputs into final demand estimate.
Weighting strategy:
  - If data_points >= 14: WMA=60%, SES=40% (enough data for WMA to shine)
  - If data_points >= 7:  WMA=50%, SES=50% (balanced)
  - If data_points < 7:   WMA=30%, SES=70% (SES handles sparse data better)
  
Then applies safety stock and reorder point calculations.
Generates confidence intervals for each forecast day.
"""

import numpy as np
from datetime import datetime, timedelta
from typing import List
from services.wma import calculate_wma, get_demand_std
from services.ses import calculate_ses
from services.safety_stock import (calculate_safety_stock, calculate_reorder_point,
                            calculate_days_until_stockout, calculate_stockout_risk,
                            calculate_confidence_score)
from models.schemas import ForecastResult, DailyForecast

def run_ensemble_forecast(daily_demand: List[float], product_meta: dict,
                           forecast_days: int = 7) -> ForecastResult:
    """
    Main ensemble function. Orchestrates all 3 algorithms.
    """
    data_points = len(daily_demand)
    
    # 1. Validate data points
    if data_points < 5:
        # Return minimal forecast with low confidence and warning
        avg_val = float(np.mean(daily_demand)) if daily_demand else 0.0
        warnings = [f"Limited data: forecast based on {data_points} data points only"]
        
        # Fallback empty forecast
        forecast_list = []
        today = datetime.utcnow()
        for i in range(1, forecast_days + 1):
            date_str = (today + timedelta(days=i)).strftime("%Y-%m-%d")
            forecast_list.append(DailyForecast(
                date=date_str,
                predictedDemand=avg_val,
                lower=max(0, avg_val * 0.5),
                upper=avg_val * 1.5
            ))
            
        return ForecastResult(
            productId=product_meta.get('productId', 'unknown'),
            sku=product_meta.get('sku', 'unknown'),
            avgDailyDemand=round(avg_val, 2),
            wmaDemand=round(avg_val, 2),
            sesDemand=round(avg_val, 2),
            ensembleDemand=round(avg_val, 2),
            safetyStock=round(product_meta.get('reorderLevel', 0) * 0.2, 2),
            reorderPoint=float(product_meta.get('reorderLevel', 0)),
            suggestedOrderQty=product_meta.get('reorderQuantity', 0),
            daysUntilStockout=calculate_days_until_stockout(product_meta.get('currentStock', 0), avg_val),
            stockoutRisk="MEDIUM",
            forecast=forecast_list,
            dataPointsUsed=data_points,
            confidenceScore=0.1,
            confidenceLabel="Low",
            method="WMA+SES+SafetyStock Ensemble",
            generatedAt=datetime.utcnow().isoformat() + "Z",
            warnings=warnings
        )

    # 2. Calculate individual model demands
    wma_demand = calculate_wma(daily_demand, window=7)
    ses_demand = calculate_ses(daily_demand)
    avg_demand = float(np.mean(daily_demand))
    demand_std = get_demand_std(daily_demand, window=14)
    
    # 3. Blending Logic
    if data_points >= 14:
        wma_weight, ses_weight = 0.6, 0.4
    elif data_points >= 7:
        wma_weight, ses_weight = 0.5, 0.5
    else:
        wma_weight, ses_weight = 0.3, 0.7
        
    ensemble_demand = (wma_weight * wma_demand) + (ses_weight * ses_demand)
    
    # 4. Inventory Metrics
    lead_time = product_meta.get('leadTimeDays', 3)
    current_stock = product_meta.get('currentStock', 0)
    
    safety_stock = calculate_safety_stock(demand_std, lead_time, z_score=1.65)
    reorder_point = calculate_reorder_point(avg_demand, lead_time, safety_stock)
    days_stockout = calculate_days_until_stockout(current_stock, ensemble_demand)
    stockout_risk = calculate_stockout_risk(days_stockout, lead_time)
    
    # 5. Confidence Score
    score, label = calculate_confidence_score(data_points, demand_std, avg_demand)
    
    # 6. Generate Daily Forecast array
    forecast_list = []
    today = datetime.utcnow()
    # variance_factor increases as confidence decreases
    variance_factor = (1.0 - score) * 0.4
    
    for i in range(1, forecast_days + 1):
        date_str = (today + timedelta(days=i)).strftime("%Y-%m-%d")
        # For ensemble simple projection, we use flat demand
        predicted = ensemble_demand
        lower = max(0.0, predicted * (1.0 - variance_factor))
        upper = predicted * (1.0 + variance_factor)
        
        forecast_list.append(DailyForecast(
            date=date_str,
            predictedDemand=round(predicted, 2),
            lower=round(lower, 2),
            upper=round(upper, 2)
        ))
        
    # 7. Build Warnings
    warnings = []
    if data_points < 7:
        warnings.append(f"Limited data: forecast based on {data_points} data points only")
    if days_stockout < lead_time:
        warnings.append("⚠️ Stock may run out before reorder arrives")
    if current_stock > product_meta.get('maxStockLevel', 99999):
        warnings.append("⚠️ Current stock exceeds maximum level")
    if product_meta.get('isPerishable') and product_meta.get('expiryDate'):
        # Just a simple check if expiry is present
        warnings.append("⚠️ Perishable item: Monitor expiry date closely")

    # 8. Return Final Result
    return ForecastResult(
        productId=product_meta.get('productId', 'unknown'),
        sku=product_meta.get('sku', 'unknown'),
        avgDailyDemand=round(avg_demand, 2),
        wmaDemand=round(wma_demand, 2),
        sesDemand=round(ses_demand, 2),
        ensembleDemand=round(ensemble_demand, 2),
        safetyStock=safety_stock,
        reorderPoint=reorder_point,
        suggestedOrderQty=product_meta.get('reorderQuantity', 0),
        daysUntilStockout=round(days_stockout, 2),
        stockoutRisk=stockout_risk,
        forecast=forecast_list,
        dataPointsUsed=data_points,
        confidenceScore=score,
        confidenceLabel=label,
        method="WMA+SES+SafetyStock Ensemble",
        generatedAt=datetime.utcnow().isoformat() + "Z",
        warnings=warnings
    )

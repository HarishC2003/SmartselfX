import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def calculate_forecast(transactions, current_stock, reorder_level, lead_time=3):
    """
    Transactions list format: [{'date': '2024-03-01', 'quantity': 5}, ...]
    Only 'OUT' type transactions (Sales/Usage) should be passed here.
    """
    if not transactions or len(transactions) < 2:
        # Not enough data for math, return conservative estimates based on reorder level
        return {
            "dailyDemand": 0.0,
            "recommendedReorderPoint": reorder_level,
            "safetyStock": int(reorder_level * 0.2),
            "confidenceLevel": 0.1
        }

    # Convert to DataFrame
    df = pd.DataFrame(transactions)
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values('date')

    # Aggregrate by day to handle multiple sales per day
    daily_sales = df.groupby(df['date'].dt.date)['quantity'].sum().reset_index()
    daily_sales.columns = ['date', 'quantity']
    
    # Fill missing dates with 0 to get true daily average
    daily_sales['date'] = pd.to_datetime(daily_sales['date'])
    min_date = daily_sales['date'].min()
    max_date = daily_sales['date'].max()
    
    # Create complete date range
    all_dates = pd.date_range(start=min_date, end=max_date, freq='D')
    daily_sales = daily_sales.set_index('date').reindex(all_dates, fill_value=0).reset_index()
    daily_sales.columns = ['date', 'quantity']
    
    values = daily_sales['quantity'].values
    n = len(values)

    # 1. Weighted Moving Average (WMA)
    # Use up to 14 days, more recent has more weight
    window = min(n, 14)
    wma_weights = np.arange(1, window + 1)
    wma_forecast = np.dot(values[-window:], wma_weights) / wma_weights.sum()

    # 2. Simple Exponential Smoothing (SES)
    # alpha = 0.3 (higher alpha = more reactive to recent changes)
    alpha = 0.3
    ses_forecast = values[0]
    for i in range(1, n):
        ses_forecast = alpha * values[i] + (1 - alpha) * ses_forecast
    
    # Ensemble Forecast
    final_demand = (wma_forecast + ses_forecast) / 2
    
    # Safety Stock (Z-score 1.645 for 95% service level)
    # Safety Stock = Z * Standard Deviation * sqrt(Lead Time)
    std_dev = np.std(values) if n > 1 else 0
    safety_stock = 1.645 * std_dev * np.sqrt(lead_time)
    
    # Reorder Point (ROP)
    # ROP = (Average Daily Demand * Lead Time) + Safety Stock
    avg_demand = np.mean(values)
    reorder_point = (avg_demand * lead_time) + safety_stock
    
    # Adjust reorder point if it's too low compared to business rules
    reorder_point = max(reorder_point, final_demand * lead_time)

    # Confidence calculation (heuristic)
    # High if we have > 14 days and low variance
    confidence = min(1.0, (n / 30.0) * (1.0 - (std_dev / (avg_demand + 1)))) if avg_demand > 0 else 0.1

    return {
        "dailyDemand": round(float(final_demand), 2),
        "recommendedReorderPoint": int(np.ceil(reorder_point)),
        "safetyStock": int(np.ceil(safety_stock)),
        "confidenceLevel": round(float(max(0.1, confidence)), 2),
        "dataPoints": n
    }

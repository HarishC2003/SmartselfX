"""
Weighted Moving Average (WMA)
Recent days are weighted more heavily than older days.
Weight pattern for N periods: N, N-1, N-2, ... 1
Example 5-day WMA: weights = [5,4,3,2,1] / sum(15)
"""

import numpy as np
from typing import List

def calculate_wma(daily_demand: List[float], window: int = 7) -> float:
    """
    Calculate WMA for the last `window` days of demand.
    
    Args:
        daily_demand: list of daily OUT quantities (oldest to newest)
        window: number of days to use (default 7)
    
    Returns:
        float: WMA demand estimate for next period
    """
    if not daily_demand:
        return 0.0
        
    n = len(daily_demand)
    actual_window = min(n, window)
    
    # Take the last 'n' values
    data = np.array(daily_demand[-actual_window:])
    
    # Generate linearly increasing weights: [1, 2, 3, ..., actual_window]
    # This gives highest weight (actual_window) to the most recent value
    weights = np.arange(1, actual_window + 1)
    
    # Normalize weights: weights / sum(weights)
    normalized_weights = weights / weights.sum()
    
    # WMA = dot product of last n demand values with normalized weights
    wma = np.dot(data, normalized_weights)
    
    return float(max(0.0, wma))

def calculate_wma_forecast(daily_demand: List[float], forecast_days: int = 7, 
                            window: int = 7) -> List[float]:
    """
    Generate multi-day WMA forecast using rolling window.
    Each forecasted day uses the previous WMA result as the next input.
    Returns list of forecasted demand values for each future day.
    """
    history = list(daily_demand)
    forecast = []
    
    for _ in range(forecast_days):
        next_val = calculate_wma(history, window)
        forecast.append(next_val)
        history.append(next_val)
        
    return forecast

def get_demand_std(daily_demand: List[float], window: int = 14) -> float:
    """
    Calculate standard deviation of demand over window.
    Used for safety stock calculation.
    Returns std dev, minimum 0.
    """
    if not daily_demand:
        return 0.0
        
    n = len(daily_demand)
    actual_window = min(n, window)
    data = daily_demand[-actual_window:]
    
    if len(data) < 2:
        return 0.0
        
    return float(np.std(data))

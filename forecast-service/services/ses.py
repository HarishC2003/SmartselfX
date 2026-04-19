"""
Simple Exponential Smoothing (SES)
Self-correcting model: each prediction = alpha × actual + (1-alpha) × previous_forecast
Alpha (smoothing factor): 0 < alpha < 1
High alpha = reacts fast to recent changes (good for volatile demand)
Low alpha = smoother, less reactive (good for stable demand)
We auto-optimize alpha using minimizing sum of squared errors.
"""

import numpy as np
from typing import List, Tuple

def optimize_alpha(daily_demand: List[float]) -> float:
    """
    Find optimal alpha by minimizing sum of squared forecast errors (SSE).
    Test alpha values from 0.1 to 0.9 in steps of 0.1.
    Return alpha with lowest SSE.
    Fallback: return 0.3 if insufficient data.
    """
    if len(daily_demand) < 3:
        return 0.3
        
    best_alpha = 0.3
    min_sse = float('inf')
    
    for alpha in np.arange(0.1, 1.0, 0.1):
        sse = 0
        forecast = daily_demand[0]
        for t in range(1, len(daily_demand)):
            error = daily_demand[t] - forecast
            sse += error ** 2
            forecast = alpha * daily_demand[t] + (1 - alpha) * forecast
            
        if sse < min_sse:
            min_sse = sse
            best_alpha = float(alpha)
            
    return best_alpha

def calculate_ses(daily_demand: List[float], alpha: float = None) -> float:
    """
    Run SES on historical demand.
    
    Args:
        daily_demand: list of daily OUT quantities
        alpha: smoothing factor (auto-optimized if None)
    
    Returns:
        float: SES forecast for next period
    """
    if not daily_demand:
        return 0.0
        
    if alpha is None:
        alpha = optimize_alpha(daily_demand)
        
    forecast = daily_demand[0]
    for t in range(1, len(daily_demand)):
        forecast = alpha * daily_demand[t] + (1 - alpha) * forecast
        
    return float(max(0.0, forecast))

def calculate_ses_forecast(daily_demand: List[float], forecast_days: int = 7,
                            alpha: float = None) -> Tuple[List[float], float]:
    """
    Generate multi-day SES forecast.
    Since SES produces flat forecast beyond 1 step, use the SES value
    for all forecast days (appropriate for short-term).
    Returns: (forecast_list, alpha_used)
    """
    if alpha is None:
        alpha = optimize_alpha(daily_demand)
        
    next_step = calculate_ses(daily_demand, alpha)
    forecast_list = [next_step] * forecast_days
    
    return forecast_list, alpha


"""
Safety Stock & Reorder Point Calculator
Industry standard inventory management formulas.

Safety Stock = Z × σ_demand × √(lead_time_days)
  Z = service level Z-score (1.65 for 95%, 1.28 for 90%, 2.05 for 98%)
  σ_demand = standard deviation of daily demand
  lead_time = days from order to delivery

Reorder Point = (avg_daily_demand × lead_time_days) + safety_stock

Days Until Stockout = current_stock / avg_daily_demand
"""

import math
from typing import List, Tuple

def calculate_safety_stock(demand_std: float, lead_time_days: int, 
                            z_score: float = 1.65) -> float:
    """
    Calculate safety stock using standard formula.
    safety_stock = z_score × demand_std × sqrt(lead_time_days)
    Return max(0, result) rounded to 2 decimals.
    """
    safety_stock = z_score * demand_std * math.sqrt(lead_time_days)
    return round(max(0.0, safety_stock), 2)

def calculate_reorder_point(avg_daily_demand: float, lead_time_days: int,
                             safety_stock: float) -> float:
    """
    Calculate reorder point.
    reorder_point = (avg_daily_demand × lead_time_days) + safety_stock
    Return rounded to 2 decimals.
    """
    rop = (avg_daily_demand * lead_time_days) + safety_stock
    return round(max(0.0, rop), 2)

def calculate_days_until_stockout(current_stock: int, 
                                   avg_daily_demand: float) -> float:
    """
    Calculate days until stock runs out at current demand rate.
    days = current_stock / avg_daily_demand
    Return: float days, or 999 if avg_daily_demand == 0 (no demand)
    """
    if avg_daily_demand <= 0:
        return 999.0
    return float(current_stock / avg_daily_demand)

def calculate_stockout_risk(days_until_stockout: float, 
                             lead_time_days: int) -> str:
    """
    Determine stockout risk level based on days until stockout vs lead time.
    """
    if days_until_stockout <= 0:
        return "CRITICAL"
    if days_until_stockout <= lead_time_days:
        return "HIGH"
    if days_until_stockout <= lead_time_days * 2:
        return "MEDIUM"
    return "LOW"

def calculate_confidence_score(data_points: int, demand_std: float,
                                avg_demand: float) -> Tuple[float, str]:
    """
    Score forecast confidence based on data quantity and volatility.
    """
    score = 0.3 # Base score
    
    # Data points contribution
    if data_points >= 30:
        score += 0.4
    elif data_points >= 14:
        score += 0.3
    elif data_points >= 7:
        score += 0.2
    elif data_points >= 3:
        score += 0.1
        
    # Coefficient of variation contribution
    if avg_demand > 0:
        cv = demand_std / avg_demand
        if cv <= 0.2:
            score += 0.3
        elif cv <= 0.5:
            score += 0.2
        elif cv <= 1.0:
            score += 0.1
            
    score = min(1.0, score)
    
    label = "Low"
    if score >= 0.8:
        label = "Very High"
    elif score >= 0.6:
        label = "High"
    elif score >= 0.4:
        label = "Moderate"
        
    return float(round(score, 2)), label

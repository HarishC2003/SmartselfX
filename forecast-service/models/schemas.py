from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# REQUEST SCHEMAS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class TransactionRecord(BaseModel):
    date: str  # ISO date string "2026-03-01T14:30:00Z"
    type: str  # "IN" or "OUT"
    quantity: int
    referenceType: str  # "SALES", "MANUAL", etc.

class ProductMeta(BaseModel):
    productId: str
    name: str
    sku: str
    currentStock: int
    reorderLevel: int
    reorderQuantity: int
    maxStockLevel: int
    unit: str
    leadTimeDays: int = 3  # default 3 days if not provided
    isPerishable: bool = False
    expiryDate: Optional[str] = None

class ForecastRequest(BaseModel):
    product: ProductMeta
    transactions: List[TransactionRecord]  # all OUT transactions (sales/usage)
    forecastDays: int = 7  # how many days to forecast ahead


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# RESPONSE SCHEMAS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class DailyForecast(BaseModel):
    date: str  # "2026-03-08"
    predictedDemand: float  # units expected to go out
    lower: float  # confidence lower bound
    upper: float  # confidence upper bound

class ForecastResult(BaseModel):
    productId: str
    sku: str
    
    # Core metrics
    avgDailyDemand: float  # average units per day
    wmaDemand: float  # WMA result (7-day)
    sesDemand: float  # SES result
    ensembleDemand: float  # final blended demand estimate
    
    # Inventory math
    safetyStock: float  # Z × σ × √leadTime
    reorderPoint: float  # avgDemand × leadTime + safetyStock
    suggestedOrderQty: int  # reorderQuantity from product settings
    
    # Risk metrics
    daysUntilStockout: float  # currentStock ÷ avgDailyDemand
    stockoutRisk: str  # "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
    
    # 7-day forecast array
    forecast: List[DailyForecast]
    
    # Meta
    dataPointsUsed: int  # how many OUT transactions were used
    confidenceScore: float  # 0.0 to 1.0
    confidenceLabel: str  # "Low" | "Moderate" | "High" | "Very High"
    method: str  # "WMA+SES+SafetyStock Ensemble"
    generatedAt: str  # ISO timestamp
    
    # Warnings
    warnings: List[str]  # e.g. ["Low data: only 8 data points used"]

class ForecastResponse(BaseModel):
    success: bool
    data: ForecastResult
    message: str

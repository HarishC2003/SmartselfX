import random
import json
from datetime import datetime, timedelta
from typing import List
import numpy as np

# Import our engine components
from services.ensemble import run_ensemble_forecast
from utils.data_prep import prepare_daily_demand
from models.schemas import TransactionRecord, ProductMeta

def generate_mock_data():
    """
    Generates mock transactions for a 'Test Widget'
    """
    product = ProductMeta(
        productId="test-12345",
        name="Test Widget",
        sku="TEST-001",
        currentStock=45,
        reorderLevel=15,
        reorderQuantity=50,
        maxStockLevel=200,
        unit="units",
        leadTimeDays=3,
        isPerishable=False
    )

    transactions = []
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=30)

    # Generate 30 days of OUT transactions
    for i in range(31):
        current_date = start_date + timedelta(days=i)
        
        # Decide if we have sales today
        is_weekend = current_date.weekday() >= 5
        
        if is_weekend:
            # Lower demand on weekends
            qty = random.randint(1, 3)
        else:
            # Normal demand on weekdays
            qty = random.randint(3, 8)
            
        transactions.append(TransactionRecord(
            date=current_date.isoformat() + "Z",
            type="OUT",
            quantity=qty,
            referenceType="SALES"
        ))

    # Generate 5 IN transactions (restocking)
    for i in range(5):
        restock_date = start_date + timedelta(days=random.randint(1, 28))
        transactions.append(TransactionRecord(
            date=restock_date.isoformat() + "Z",
            type="IN",
            quantity=50,
            referenceType="RESTOCK"
        ))

    return product, transactions

def run_test():
    print("═══════════════════════════════════════")
    print(" SmartShelfX Forecast Engine — Test Run ")
    print("═══════════════════════════════════════")
    
    # 1. Generate mocking data
    product, transactions = generate_mock_data()
    print(f"Product:          {product.name} ({product.sku})")
    print(f"Current Stock:    {product.currentStock} units")
    print("")

    # 2. Prep daily demand series
    daily_demand = prepare_daily_demand(transactions, lookback_days=30)
    
    # 3. Run ensemble
    result = run_ensemble_forecast(daily_demand, product.model_dump())

    # 4. Print Results
    print("📊 ALGORITHM RESULTS")
    print(f"WMA Demand:       {result.wmaDemand:.1f} units/day")
    print(f"SES Demand:       {result.sesDemand:.1f} units/day")
    print(f"Ensemble Demand:  {result.ensembleDemand:.1f} units/day")
    print("")

    print("📦 INVENTORY METRICS")
    print(f"Safety Stock:     {result.safetyStock:.1f} units")
    print(f"Reorder Point:    {result.reorderPoint:.1f} units")
    print(f"Days to Stockout: {result.daysUntilStockout:.1f} days")
    print(f"Stockout Risk:    {result.stockoutRisk}")
    print("")

    print("🎯 FORECAST CONFIDENCE")
    print(f"Data Points:      {result.dataPointsUsed}")
    print(f"Confidence Score: {result.confidenceScore:.2f}")
    print(f"Confidence Label: {result.confidenceLabel}")
    print("")

    print("📅 7-DAY FORECAST")
    print(f"{'Date':<12} {'Demand':<8} {'Lower':<8} {'Upper':<8}")
    for day in result.forecast:
        print(f"{day.date:<12} {day.predictedDemand:<8.1f} {day.lower:<8.1f} {day.upper:<8.1f}")
    
    print("")
    print("⚠️ WARNINGS")
    if not result.warnings:
        print("None")
    else:
        for w in result.warnings:
            print(f"- {w}")
            
    print("═══════════════════════════════════════")

if __name__ == "__main__":
    run_test()

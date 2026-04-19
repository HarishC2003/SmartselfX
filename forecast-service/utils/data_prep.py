"""
Transforms raw transaction records into daily demand series.
Only OUT transactions represent actual demand/consumption.
IN transactions are restocking — excluded from demand calculation.
"""

import pandas as pd
from datetime import datetime, timedelta
from typing import List
from models.schemas import TransactionRecord

def prepare_daily_demand(transactions: List[TransactionRecord],
                          lookback_days: int = 60) -> List[float]:
    """
    Convert transaction records to daily demand series.
    """
    # 1. Filter: keep only type == "OUT" transactions
    out_txs = [t for t in transactions if t.type == "OUT"]
    
    if not out_txs:
        return [0.0]

    # 2. Filter: keep only transactions within last lookback_days
    cutoff = datetime.utcnow() - timedelta(days=lookback_days)
    
    # 3. Parse dates and filter by cutoff
    parsed_data = []
    for tx in out_txs:
        try:
            # Handle ISO string or date only string
            dt = pd.to_datetime(tx.date)
            # Make sure we compare naive to naive or aware to aware
            if dt.tzinfo:
                dt = dt.tz_localize(None)
            
            if dt >= cutoff.replace(tzinfo=None):
                parsed_data.append({
                    'date': dt.date(),
                    'quantity': tx.quantity
                })
        except (ValueError, TypeError):
            continue
            
    if not parsed_data:
        return [0.0]

    # 4. Group by date
    df = pd.DataFrame(parsed_data)
    daily_grouped = df.groupby('date')['quantity'].sum().reset_index()
    daily_grouped['date'] = pd.to_datetime(daily_grouped['date'])
    
    # 5. Create complete date range from min_date to today
    min_date = daily_grouped['date'].min()
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Ensure end_date is at least today
    end_date = max(min_date, today)
    
    all_dates = pd.date_range(start=min_date, end=end_date, freq='D')
    
    # 6. Reindex to fill missing days with 0 and Sort ascending
    daily_series = daily_grouped.set_index('date').reindex(all_dates, fill_value=0).reset_index()
    
    # 7. Return as List[float]
    return [float(x) for x in daily_series['quantity'].tolist()]

def get_data_summary(daily_demand: List[float]) -> dict:
    """
    Return quick summary stats for logging/debugging.
    """
    if not daily_demand:
        return {}
    
    demand_array = [d for d in daily_demand if d > 0]
    
    return {
        "data_points": len(daily_demand),
        "total_demand": sum(daily_demand),
        "avg_daily": round(sum(daily_demand) / len(daily_demand), 2) if daily_demand else 0,
        "max_daily": max(daily_demand) if daily_demand else 0,
        "min_daily": min(daily_demand) if daily_demand else 0,
        "zero_demand_days": daily_demand.count(0.0),
        "non_zero_days": len(demand_array)
    }

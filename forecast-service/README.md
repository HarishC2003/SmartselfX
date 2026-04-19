# SmartShelfX Forecast Engine

Internal microservice for inventory demand forecasting.

## Setup
1. Create virtual environment:
   ```bash
   python -m venv venv
   ```
2. Activate virtual environment:
   - Windows: `venv\Scripts\activate`
   - Linux/Mac: `source venv/bin/activate`
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Running the Service
```bash
uvicorn main:app --reload --port 8000
```

## API Documentation
Once running, interactive API docs are available at:
[http://localhost:8000/docs](http://localhost:8000/docs)

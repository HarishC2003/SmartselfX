# SmartShelfX — AI-Based Inventory Forecast & Auto-Restock

## 🚀 Overview
SmartShelfX is an intelligent, scalable, and automated inventory management platform. Built to optimize warehouse operations, it completely removes guesswork by integrating a suite of machine learning algorithms to accurately predict product demand trajectories and instantly trigger automated procurement procedures. 

Key features across the suite include:
* **Module 1: Authentication & Roles** — Secure JWT infrastructure governing Admin, Manager, and restricted Vendor portal access.
* **Module 2: Product Cataloging** — Comprehensive inventory hierarchy mapped against dynamic metrics (SKUs, thresholds, perishability).
* **Module 3: Stock Transactions** — Accurate tracking of Stock In/Out movements directly driving the availability ledger.
* **Module 4: AI Demand Engine** — Python FastAPI microservice utilizing statistical time-series prediction models.
* **Module 5: Auto-Procurement** — Seamless generation of Purchase Orders executing automatically off high-confidence AI triggers.
* **Module 6: Deep Analytics** — Custom visualized KPI dashboards complete with multi-format scheduled export capabilities.
* **Module 7: Infrastructure Health** — Deep audit logs capturing atomic state modifications alongside integrated service latency tracking.

![Dashboard](docs/screenshots/dashboard.png)

## 🏗️ Architecture
```ascii
    React Client (Vite)
            ↕
    Nginx Reverse Proxy
            ↕
    Node.js (Express API)   ←→   MongoDB (Replica Set)
            ↕
    Python FastAPI 
 (Forecast Engine)
            ↓
  [ WMA + SES + Safety Stock Algorithm Pipeline ]
```

## 📦 Tech Stack
| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React + Vite + Tailwind CSS | Highly responsive, SPA interface featuring global state contexts. |
| Backend | Node.js + Express | Performant API router handling Auth, Models, scaling, and integrations. |
| Database | MongoDB 7.0 (Replica Set) | Provides ACID compliant transactions protecting data state atomic operations. |
| AI Engine | FastApi + Python 3.11 | High throughput microservice designated exclusively for executing numerical predictions. |
| DevOps | Docker + Nginx + PM2 | Complete container orchestration with internal routing and load balancing. |

## 🛠️ Prerequisites
- **Node.js**: 20+
- **Python**: 3.11+
- **MongoDB**: 7.0+ (Must be configured with a replica set `rs0` for transaction compatibility)
- **Node Package Manager**: npm 10+
- **Docker** (Optional but highly recommended)

## ⚡ Quick Start (Development)

### 1. Clone & Install
```bash
git clone https://github.com/your-repo/smartshelfx.git
cd smartshelfx

# Install server deps
cd server && npm install

# Install client deps
cd ../client && npm install

# Install Python deps
cd ../forecast-service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Environment Setup
```bash
cp .env.example server/.env
# Edit server/.env with your operational values
```

### 3. Start MongoDB (with replica set)
```bash
mongod --replSet rs0 --dbpath /data/db
# Then in another terminal, initialize the replica:
mongosh --eval "rs.initiate()"
```

### 4. Seed Database
```bash
cd server
node seeds/productSeed.js
node seeds/transactionSeed.js
node seeds/forecastSeed.js
node seeds/purchaseOrderSeed.js
```

### 5. Start All Services
```bash
cd ..
chmod +x start.sh
./start.sh
```

### Access Points
* **Frontend**: `http://localhost:5173`
* **API Server**: `http://localhost:5000`
* **API Docs (Swagger)**: `http://localhost:5000/api-docs`
* **Forecast Engine API**: `http://localhost:8000`
* **Forecast Docs**: `http://localhost:8000/docs`

## 🔐 Default Credentials
| Role | Email | Password |
|---|---|---|
| Admin | admin@smartshelfx.com | Admin@12345 |
| Manager | manager@smartshelfx.com | Manager@12345 |
| Vendor | vendor1@smartshelfx.com | Vendor@12345 |
| Vendor | vendor2@smartshelfx.com | Vendor@12345 |

## 🐳 Docker Deployment
For production deployment or isolated fast-tracking:
```bash
docker-compose up -d --build
```
Access the global UI via `http://localhost`.

## 📊 Modules Framework
| # | Module | Description |
|---|---|---|
| 1 | Auth | JWT session handling, role enforcement (Admin/Manager/Vendor), and email identity verification. |
| 2 | Products | Main product ledger holding catalogs, categories, CSV pipelines, and optimized asset uploads. |
| 3 | Transactions | In/out volume trackers managing the real-time inventory capacities mapped to low-stock alarms. |
| 4 | AI Forecast | Isolated Python microservice processing WMA+SES ensemble models against local histories. |
| 5 | Purchase Orders | AI-linked, life-cycle aware PO manager bridging Admin approvals with Vendor-directed execution emails. |
| 6 | Analytics | Broad BI metrics dashboard outputting dynamic charts and PDF/Excel bundles delivered via scheduled CRONs. |
| 7 | Settings | System configurations handling atomic audit logs, infrastructure health signals, and notification preferences. |

## 🤖 Forecasting Algorithm
At the core of the AI Engine is a combined **WMA + SES + Safety Stock** approach ensuring no demand spike is missed:

* **Weighted Moving Average (WMA)**: Prioritizes recent data heavily to capture emerging shifts. 
  * Formula: `∑ (Weight(n) * Demand(n)) / ∑ Weights`
* **Simple Exponential Smoothing (SES)**: Filters random noise using an alpha factor balancing memory decay against raw input.
  * Formula: `(α * Current Demand) + ((1 - α) * Previous Forecast)`
* **Safety Stock**: Statistically calculates buffer margins guarding against supply-chain delays.
  * Formula: `(Max Daily Use * Max Lead Time) - (Avg Daily Use * Avg Lead Time)`

The microservice blends these calculations dynamically mapped to the historical transaction volume of standard and perishable goods.

## 📁 Project Structure
```text
/smartshelfx
├── /client                ← React SPA + Vite + Tailwind
├── /server                ← Node.js + Express
├── /forecast-service      ← Python FastAPI
├── docker-compose.yml     ← Containerization definition
├── start.sh               ← Local run-script
└── README.md
```

## 🔌 API Reference
To access the complete Swagger/OpenAPI documentation schema map mapping the Node.js integrations, fire up the backend development environment and visit:
[http://localhost:5000/api-docs](http://localhost:5000/api-docs)

## 📄 License
MIT

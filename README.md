# SmartBudget

A personal finance web app that combines honest budget math with a machine learning model that predicts overspending risk based on spending patterns — mood, day of week, and spending trend — not just how much of your budget is gone.

## What it does
Set a monthly budget (optionally split by category)
Log expenses with amount, category, and mood
See real-time budget math: spent so far, % used, safe daily pace
Get an ML-predicted overspending risk (Low / Medium / High) based on behavioral patterns
View personal spending insights: average spend by mood, by day of week, and risk trend over time
Chat with a budget assistant that has real context on your spending

## Screenshots

### Landing Page
<img width="1645" height="857" alt="image" src="https://github.com/user-attachments/assets/447ab233-fdac-4321-8ac8-842c6b816a89" />

### Dashboard
<img width="1614" height="857" alt="image" src="https://github.com/user-attachments/assets/559c6f3a-0a60-4ceb-bbcc-8688637c899b" />

### Set Budget
<img width="877" height="782" alt="image" src="https://github.com/user-attachments/assets/cad0b563-d591-4334-b7a6-2181eb501a16" />

### Log Expense
<img width="686" height="857" alt="image" src="https://github.com/user-attachments/assets/8c83191f-eaf9-4d68-a951-8863c4307c88" />

### Expense History
<img width="1526" height="882" alt="image" src="https://github.com/user-attachments/assets/22a137e2-3869-4599-99a7-c53940fec3cb" />

### Insights
<img width="1573" height="868" alt="image" src="https://github.com/user-attachments/assets/39d2050f-c9ad-428b-adc6-c41905532d12" />


## Tech stack
Frontend: React + Vite + TypeScript, Tailwind CSS, Chart.js 
Backend: Node.js + Express + TypeScript 
ML Service: Python + FastAPI, scikit-learn (Random Forest classifier) 
Database / Auth: Firebase (Firestore + Authentication, including Google Sign-In) 
Chatbot: Groq API (Llama 3.3 70B)

## Project structure
SmartBudget/
├── frontend/       React app (pages, components, chat widget)
├── backend/        Express API (auth verification, risk endpoint, chat endpoint)
├── ml-service/      FastAPI service serving the trained Random Forest model
│   ├── data/        Generated synthetic training data
│   ├── notebooks/    EDA and model training notebooks
│   ├── src/          FastAPI app, prediction logic
│   └── models/       Saved model + feature columns (.pkl files)
└── README.md

## How the ML actually works
Two separate things are combined on purpose:
Plain math (no ML needed): budget vs. spent, days left, safe daily pace. This is just arithmetic and is always accurate.
ML prediction: a Random Forest classifier trained on features like mood while spending, day of week, percent of budget used, and recent spending trend. This is what predicts Low/Medium/High risk — catching patterns the simple math alone can't see (e.g., spending that spikes on weekends or during certain moods, even if the raw pace still looks fine).

The model was trained on synthetic data generated to simulate realistic spending behavior (see ml-service/src/generate_data.py), since a single user's real logged expenses aren't enough to train a model from scratch. Predictions become more personally grounded as more real data accumulates over time — this is a deliberate, common approach for personal ML projects with limited real data, not a shortcut being hidden.

## Setup

### Prerequisites

- Node.js (LTS)
- Python 3.10+
- A Firebase project (Firestore + Authentication enabled, Google Sign-In enabled)
- A Groq API key (https://console.groq.com/keys)

### 1. Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_API_BASE_URL=http://localhost:5000
```

Run the frontend:

```bash
npm run dev
```

---

### 2. Backend

```bash
cd backend
npm install
```

Add your Firebase service account key as:

```text
backend/serviceAccountKey.json
```

You can generate it from:

**Firebase Console → Project Settings → Service Accounts → Generate New Private Key**

Create `backend/.env`:

```env
PORT=5000
FIREBASE_PROJECT_ID=
ML_SERVICE_URL=http://localhost:8000
GROQ_API_KEY=
```

Run the backend:

```bash
npm run dev
```

---

### 3. ML Service

```bash
cd ml-service
python -m venv venv
```

Activate the virtual environment:

**Windows**

```bash
venv\Scripts\activate
```

**macOS / Linux**

```bash
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

If the model isn't already trained (`models/risk_model.pkl` doesn't exist), generate the synthetic data and train the model first. See the `notebooks/` directory for the complete pipeline:

- Data generation
- Exploratory Data Analysis (EDA)
- Feature engineering
- Model training
- Model evaluation
- Saving the trained model

Start the ML service:

```bash
cd src
uvicorn main:app --reload --port 8000
```

---

## Running Everything Together

Run all three services in separate terminals.

**Terminal 1 – ML Service**

```bash
cd ml-service/src
uvicorn main:app --reload --port 8000
```

**Terminal 2 – Backend**

```bash
cd backend
npm run dev
```

**Terminal 3 – Frontend**

```bash
cd frontend
npm run dev
```

Open the application at:

```text
http://localhost:5173
```

## Known limitations
The ML model is trained on synthetic data, not real user behavior. It's designed to mirror realistic patterns, but predictions will improve if retrained on accumulated real usage later.
Firestore composite indexes are required for a few queries (expenses by user + timestamp, riskSnapshots by user + date). If you see a FAILED_PRECONDITION error mentioning an index, click the link in the error — Firestore auto-generates the correct index configuration.
The chatbot's financial context is rebuilt fresh on every message (not cached), so responses always reflect current data, but this means each message re-queries Firestore.

## Future improvements
Retrain the model periodically on real logged user data as it accumulates
Expose the model's actual feature importances via a FastAPI endpoint for a more precise "why" explanation on the Insights page
Add category-level budget tracking to the risk model's features

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware # <--- This is the magic key
import pandas as pd
import os
from priority_engine import PriorityEngine

app = FastAPI()
engine = PriorityEngine()

# --- SECURITY FIX (CORS) ---
# This allows your HTML file to access the data
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

@app.get("/")
def home():
    return {"message": "Backend is running. Go to /analyze to see data."}

@app.get("/analyze")
def analyze_inbox():
    # 1. Safe File Path (Finds the CSV no matter where you run this from)
    current_folder = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(current_folder, "../data/sample_emails.csv")
    
    print(f"DEBUG: Reading file from {csv_path}")

    try:
        # 2. Read CSV (Skipping bad lines to prevent crashes)
        df = pd.read_csv(csv_path, on_bad_lines='skip')
        
        results = []
        for _, row in df.iterrows():
            # Analyze subject + body
            score, level, reasons = engine.analyze(str(row['subject']), str(row['body']))
            
            results.append({
                "id": int(row['id']),
                "sender": str(row['sender']),
                "subject": str(row['subject']),
                "body": str(row['body']),
                "score": score,
                "priority": level,
                "reasons": reasons
            })
            
        # Sort by score (Highest first)
        return sorted(results, key=lambda x: x['score'], reverse=True)
        
    except Exception as e:
        print(f"CRASH: {e}")
        return [{"error": "Server Error", "body": str(e), "priority": "High", "score": 0, "reasons": []}]
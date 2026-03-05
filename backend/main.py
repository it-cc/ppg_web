from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
import io
import json

app = FastAPI(title="PPG Analysis API")

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to PPG Analysis API"}

@app.post("/api/analyze")
async def analyze_ppg(file: UploadFile = File(...)):
    # Read uploaded file
    contents = await file.read()
    
    try:
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        elif file.filename.endswith('.json'):
            df = pd.read_json(io.BytesIO(contents))
        else:
            return {"error": "Unsupported file format. Please upload CSV or JSON."}
            
        # Extract the first column as the PPG signal (assuming a simple format)
        # In a real app, you would let the user select the column or have a standard format
        raw_signal = df.iloc[:, 0].dropna().tolist()
        
        # Mock filter
        filtered_signal = [float(x) * 0.9 for x in raw_signal] 
        
        # Find peaks using SciPy
        from scipy.signal import find_peaks
        # distance=50 assumes approx 100Hz sampling rate (50 points = 0.5s min HR gap)
        peaks_indices, _ = find_peaks(filtered_signal, distance=50)
        
        # Limit data to 5000 points for a good scrolling duration
        limit = min(len(raw_signal), 5000)
        peaks_list = [int(p) for p in peaks_indices if p < limit]
        
        return {
            "filename": file.filename,
            "data_length": len(raw_signal),
            "raw_signal": raw_signal[:limit],
            "filtered_signal": filtered_signal[:limit],
            "peaks": peaks_list,
            "features": {
                "HR": 75,
                "SpO2": 98,
                "RR": 16,
                "HRV_SDNN": 45.2
            }
        }
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

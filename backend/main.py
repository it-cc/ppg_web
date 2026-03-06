from fastapi import FastAPI, UploadFile, File
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import io

from models import BufferInput, FeaturesInput
from process_data import process_buffer, extract_morphology
from ai_service import get_ai_stream

app = FastAPI(title="PPG Analysis API")

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

@app.post("/api/analyze_buffer")
async def analyze_buffer(data: BufferInput):
    return process_buffer(data.signal, data.sample_rate)

@app.post("/api/analyze")
async def analyze_ppg(file: UploadFile = File(...)):
    contents = await file.read()
    try:
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        elif file.filename.endswith('.json'):
            df = pd.read_json(io.BytesIO(contents))
        else:
            return {"error": "Unsupported file format. Please upload CSV or JSON."}
        
        raw_signal = df.iloc[:, 0].dropna().tolist()
        result = process_buffer(raw_signal, fs=100)
        
        limit = min(len(raw_signal), 5000)
        result["filename"] = file.filename
        result["data_length"] = len(raw_signal)
        result["raw_signal"] = result["raw_signal"][:limit]
        result["filtered_signal"] = result["filtered_signal"][:limit]
        result["peaks"] = [p for p in result["peaks"] if p < limit]
        
        return result
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/ai_analysis")
async def get_ai_analysis(features: FeaturesInput):
    stream = get_ai_stream(features)
    return StreamingResponse(stream, media_type="text/plain")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

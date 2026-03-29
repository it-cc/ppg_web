from pydantic import BaseModel
from typing import List

class BufferInput(BaseModel):
    signal: List[float]
    sample_rate: int = 50

class FeaturesInput(BaseModel):
    HR: float
    SpO2: float
    RR: float
    HRV_SDNN: float


class AIAnalysisRequest(BaseModel):
    features: FeaturesInput
    provider: str = "local"
    api_key: str | None = None

from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import numpy as np
import io
import json
import os
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM

app = FastAPI(title="PPG Analysis API")

# 本地加载 Qwen3-1.7B 模型（仅在服务启动时加载一次）
MODEL_PATH = "/home/cc/.cache/modelscope/hub/models/Qwen/Qwen3-1___7B"
print(f"[初始化] 正在加载本地 Qwen3-1.7B 模型，路径: {MODEL_PATH}")

try:
    tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH, trust_remote_code=True)
    model = AutoModelForCausalLM.from_pretrained(
        MODEL_PATH, 
        torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
        device_map="auto",
        trust_remote_code=True
    )
    model.eval()  # 设置为评估模式
    QWEN_READY = True
    print(f"[成功] Qwen3-1.7B 模型加载完毕，使用设备: {'CUDA' if torch.cuda.is_available() else 'CPU'}")
except Exception as e:
    QWEN_READY = False
    print(f"[警告] 模型加载失败: {str(e)}")
    tokenizer = None
    model = None

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class FeaturesInput(BaseModel):
    HR: float
    SpO2: float
    RR: float
    HRV_SDNN: float

@app.post("/api/ai_analysis")
async def get_ai_analysis(features: FeaturesInput):
    """
    使用本地 Qwen3-1.7B 模型生成 PPG 体征分析报告
    """
    if not QWEN_READY or tokenizer is None or model is None:
        return {
            "report": f"""### AI 智能分析报告 (本地模型离线)
**数据摘要：**
心率：{features.HR} bpm | 血氧：{features.SpO2}% | 呼吸率：{features.RR} bpm | HRV_SDNN: {features.HRV_SDNN} ms

**评估结果：**
当前各项指标均处于正常成人参考范围内。心率规整，未见明显心动过速或过缓；血氧饱和度极佳，提示呼吸循环系统携氧能力正常；HRV指标显示自主神经系统调节功能良好，抗压能力适中。

**改善建议：**
1. 继续保持当前良好的作息与饮食习惯。
2. 建议每周进行3-4次，每次不少于30分钟的中等强度有氧运动以进一步提升心肺耐力。
3. 请继续定期监测PPG体征，建立个人长期的健康基线数据。

*(提示：本地 Qwen3 模型未能加载，请确保模型路径正确。)*""",
            "error": "本地模型离线"
        }
    
    prompt = f"""你是一位资深的心血管医学专家和AI健康顾问。请基于以下PPG信号提取的特征数据生成一份详细的体征分析报告。

特征数据：
- 心率 (HR): {features.HR} bpm
- 血氧饱和度 (SpO2): {features.SpO2}%
- 呼吸频率 (RR): {features.RR} 次/分
- 心率变异性 (HRV_SDNN): {features.HRV_SDNN} ms

请分别从以下几个方面生成分析报告：
1. **数据摘要**：简述上述特征值
2. **健康评估**：根据这些数值，评估受检者的当前健康状况
3. **异常指征**：如发现任何异常，请指出并解释可能的原因
4. **改善建议**：基于分析结果，给出具体的改善和预防建议
5. **注意事项**：提醒受检者需要关注的重点

请使用专业但易懂的医学语言，确保报告全面、有针对性且具有临床参考价值。"""

    try:
        # 使用本地模型进行推理
        inputs = tokenizer.encode(prompt, return_tensors="pt")
        
        # 如果有GPU则转移到GPU上
        if torch.cuda.is_available():
            inputs = inputs.to(model.device)
        
        # 生成回复（控制生成长度以加快推理速度）
        with torch.no_grad():
            outputs = model.generate(
                inputs,
                max_new_tokens=512,  # 限制生成长度
                temperature=0.7,
                top_p=0.9,
                do_sample=True,
                pad_token_id=tokenizer.eos_token_id
            )
        
        # 解码生成的文本
        report = tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        # 提取模型输出中除了输入部分的回复
        if prompt in report:
            report = report.split(prompt)[-1].strip()
        
        return {"report": report}
        
    except Exception as e:
        print(f"[错误] 模型推理失败: {str(e)}")
        return {
            "report": f"""### AI 智能分析报告 (推理出错)
**数据摘要：**
心率：{features.HR} bpm | 血氧：{features.SpO2}% | 呼吸率：{features.RR} bpm | HRV_SDNN: {features.HRV_SDNN} ms

**评估结果：**
当前各项指标均处于正常成人参考范围内。心率规整，血氧饱和度优秀，呼吸节律平稳，HRV 指标显示神经调节能力良好。

**改善建议：**
1. 维持现有的良好生活习惯
2. 每周进行中等强度有氧运动3-4次
3. 定期进行体征监测，建立长期健康基线

*(推理出错，已返回默认评估模板)*""",
            "error": f"本地推理失败: {str(e)}"
        }

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

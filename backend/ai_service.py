import torch
import threading
from transformers import AutoTokenizer, AutoModelForCausalLM, TextIteratorStreamer
import asyncio
import os

from openai import OpenAI

MODEL_PATH = "/home/cc/.cache/modelscope/hub/models/Qwen/Qwen3-1___7B"
QWEN_READY = False
tokenizer = None
model = None

try:
    tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH, trust_remote_code=True)
    model = AutoModelForCausalLM.from_pretrained(
        MODEL_PATH, 
        torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
        device_map="auto",
        trust_remote_code=True
    )
    model.eval()
    QWEN_READY = True
except Exception as e:
    print(f"Model init failed: {e}")

async def mock_streamer(features):
    mock_text = f"### AI 智能分析报告 (本地模型离线)\n\n**数据摘要：**\n心率：{features.HR} bpm | 血氧：{features.SpO2}% | 呼吸率：{features.RR} bpm | HRV_SDNN: {features.HRV_SDNN} ms\n\n**评估结果：**\n各项指标正常。\n*(模型未能加载，此为测试回复)*"
    for chunk in mock_text.split(" "):
        yield chunk + " "
        await asyncio.sleep(0.05)

async def stream_generator(streamer):
    iterator = iter(streamer)
    while True:
        def get_next():
            try: return next(iterator)
            except StopIteration: return None
        
        new_text = await asyncio.to_thread(get_next)
        if new_text is None: break

        clean_text = new_text.replace("<|im_end|>", "").replace("<|endoftext|>", "")
        clean_text = clean_text.replace("<think>", "").replace("</think>", "")
        if clean_text: yield clean_text


def _build_prompt(features):
    system_prompt = "你定位：中国医疗行业资深心血管专家和AI健康顾问。"
    user_prompt = f"""分析以下PPG体征数据：
HR: {features.HR} bpm, SpO2: {features.SpO2}%, RR: {features.RR}, HRV: {features.HRV_SDNN} ms
要求：1. Markdown格式。2. 包含结构：数据摘要、健康评估、异常指征、改善建议、注意事项。且不说废话。
"""
    return system_prompt, user_prompt


async def deepseek_streamer(features, api_key=None):
    key = api_key or os.getenv("DEEPSEEK_API_KEY")
    if not key:
        error_text = "DeepSeek API key 缺失。请在请求中传入 api_key，或在后端环境变量中设置 DEEPSEEK_API_KEY。"
        for chunk in error_text.split(" "):
            yield chunk + " "
            await asyncio.sleep(0.01)
        return

    system_prompt, user_prompt = _build_prompt(features)

    try:
        client = OpenAI(api_key=key, base_url="https://api.deepseek.com")
        completion = client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            stream=True,
            temperature=0.7,
            max_tokens=1200,
        )

        iterator = iter(completion)
        while True:
            def get_next():
                try:
                    return next(iterator)
                except StopIteration:
                    return None

            chunk = await asyncio.to_thread(get_next)
            if chunk is None:
                break
            delta = chunk.choices[0].delta.content if chunk.choices else None
            if delta:
                yield delta
    except Exception as e:
        msg = f"DeepSeek 调用失败：{e}"
        for chunk in msg.split(" "):
            yield chunk + " "
            await asyncio.sleep(0.01)


def get_ai_stream(features, provider="local", api_key=None):
    provider = (provider or "local").lower()
    if provider == "deepseek":
        return deepseek_streamer(features, api_key=api_key)

    if not QWEN_READY or tokenizer is None or model is None:
        return mock_streamer(features)

    system_prompt, user_prompt = _build_prompt(features)
    try:
        messages = [{"role": "system", "content": system_prompt}, {"role": "user", "content": user_prompt}]
        text = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
        inputs = tokenizer([text], return_tensors="pt")
        if torch.cuda.is_available():
            inputs = inputs.to(model.device)
            
        streamer = TextIteratorStreamer(tokenizer, skip_prompt=True, skip_special_tokens=False)
        generation_kwargs = dict(
            **inputs, streamer=streamer, max_new_tokens=2048,
            temperature=0.7, top_p=0.9, do_sample=True, pad_token_id=tokenizer.eos_token_id
        )
        threading.Thread(target=model.generate, kwargs=generation_kwargs).start()
        return stream_generator(streamer)
    except Exception as e:
        print(f"Model error: {e}")
        return mock_streamer(features)

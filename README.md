# PPG Web Analyzer (智能体征分析系统)

这是一个基于 Vue 3 和 FastAPI 开发的全栈 Web 应用，用于分析光电容积脉搏波（PPG）信号，并通过本地部署的大语言模型（Qwen3-1.7B）生成多维度的智能心血管健康报告。

## ✨ 核心特性

- **PPG 数据解析**：支持上传包含 PPG 信号的 CSV 或 JSON 文件，自动提取各项生理指标（心率 HR、血氧饱和度 SpO2、呼吸频率 RR、心率变异性 HRV_SDNN）。
- **高维可视化分析**：基于 ECharts 提供丰富的图表呈现，包括时域波形（动态波形）、频域功率谱密度（PSD），以及特征点检测（收缩峰值识别与标定）等视图。
- **本地 AI 体征报告**：集成纯本地推理的 Qwen3-1.7B 模型，以流式（Streaming）形式输出专业详实的医学报告（数据摘要、健康评估、异常指征、改善建议等）。

## 🛠️ 技术栈

### ⚡ Frontend (前端)
- **框架**：Vue 3 (Composition API) + Vite + TypeScript
- **图表**：ECharts 6
- **请求**：Axios

### 🚀 Backend (后端)
- **API 服务**：FastAPI + Uvicorn
- **数据处理**：Pandas, NumPy, SciPy
- **AI 与大模型**：PyTorch, Transformers (`TextIteratorStreamer` 动态流式输出)

## 📁 目录结构

```text
ppg_web/
├── backend/            # 后端 FastAPI 服务
│   ├── main.py         # 核心接口与大模型流式推理逻辑
│   ├── requirements.txt# 后端依赖配置
│   └── ...
├── frontend/           # 前端 Vue 3 + Vite 项目
│   ├── src/
│   │   ├── components/
│   │   │   └── PPGAnalyzer.vue # 分析与图表、AI交互核心组件
│   │   ├── App.vue
│   │   └── main.ts
│   ├── package.json    # 前端依赖配置
│   ├── vite.config.ts  # Vite 构建配置
│   └── ...
└── README.md           # 项目文档
```

## 🚀 快速启动

### 1. 后端服务部署

进入 `/backend` 目录，安装相关的 Python 依赖（推荐使用 Anaconda / Miniconda 这类虚拟环境）：

```bash
cd backend
pip install -r requirements.txt
pip install torch transformers accelerate pandas numpy scipy python-multipart
```

> **注意：** 运行 AI 推理需要本地已下载并配置好 Qwen3-1.7B 模型路径（在 `main.py` 的 `MODEL_PATH` 变量中设定）。

启动 FastAPI 服务：

```bash
python main.py
```

### 2. 前端界面启动

进入 `/frontend` 目录，安装 Node.js 依赖并运行开发服务器：

```bash
cd frontend
npm install
npm run dev
```

启动成功后，浏览器访问 Vite 提供的本地地址（如 `http://localhost:5173` 或随后的其他端口）即可使用系统的全部功能。

## 💡 使用步骤
1. 点击左侧工具栏，设置好需要采样的采样率和滤波器等算法参数。
2. 上传包含合法 PPG 连续信号数值的 `CSV`/`JSON` 数据文件。
3. 点击“开始分析”，系统将在图形界面渲染波形、频谱和特征点图表。
4. 切换到“AI 分析报告”面板并点击“生成最新报告”，本地 Qwen 模型将基于计算得到的各生理特征组分，实时、流式向你下发医学评估反馈。
<template>
  <div class="dashboard">
    <!-- 左侧控制面板 -->
    <aside class="sidebar">
      <div class="brand">
        <span class="icon-pulse">⚡</span>
        <h1>PPG Monitor</h1>
      </div>

      <div class="panel upload-panel">
        <h2><span class="panel-icon">📁</span> 数据源配置</h2>
        <div class="upload-box">
          <input
            type="file"
            id="file"
            @change="onFileChange"
            accept=".csv,.json"
            hidden
          />
          <label for="file" class="file-label">
            <span class="upload-icon">⇪</span>
            <span class="file-name">{{
              file ? file.name : "选择 CSV/JSON 文件"
            }}</span>
          </label>
          <button
            :disabled="!file || loading"
            class="btn-analyze"
            @click="uploadFile"
          >
            {{ loading ? "解析中..." : "开始分析" }}
          </button>
        </div>
        <div v-if="error" class="error-msg">{{ error }}</div>
      </div>

      <div class="panel settings-panel">
        <h2><span class="panel-icon">⚙️</span> 算法参数设置</h2>
        <div class="setting-item">
          <label>采样率 (Hz)</label>
          <input type="number" v-model="params.sampleRate" />
        </div>
        <div class="setting-item">
          <label>低通滤波截止 (Hz)</label>
          <input type="number" v-model="params.lowcut" step="0.1" />
        </div>
        <div class="setting-item">
          <label>高通滤波截止 (Hz)</label>
          <input type="number" v-model="params.highcut" step="0.1" />
        </div>
        <div class="setting-item">
          <label>分析窗口宽 (秒)</label>
          <input type="number" v-model="params.windowSize" />
        </div>
      </div>

      <div class="status-indicator">
        <span class="dot" :class="{ active: results }"></span>
        系统状态: {{ results ? "数据流就绪" : "等待信号接入" }}
      </div>
    </aside>

    <!-- 右侧主展示区 -->
    <main class="main-content">
      <div v-show="currentView === '数据分析'" class="main-charts-wrapper">
        <!-- 顶部实时数据追踪 -->
        <header class="top-stats">
          <div class="stat-card">
            <div class="stat-label">当前心率 (HR)</div>
            <div class="stat-value text-green">
              {{ results?.features?.HR || "--" }}
              <span class="unit">bpm</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-label">血氧预测估算 (SpO2)</div>
            <div class="stat-value text-cyan">
              {{ results?.features?.SpO2 || "--" }}
              <span class="unit">%</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-label">呼吸频率 (RR)</div>
            <div class="stat-value text-purple">
              {{ results?.features?.RR || "--" }}
              <span class="unit">cpm</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-label">心率变异性 (SDNN)</div>
            <div class="stat-value text-orange">
              {{ results?.features?.HRV_SDNN || "--" }}
              <span class="unit">ms</span>
            </div>
          </div>
        </header>

        <!-- 图表阵列 -->
        <div class="charts-area">
          <!-- 主图卡片：时域对比 -->
          <div class="chart-card time-domain">
            <div class="chart-header">
              <h3>时域波形追踪 (原始与滤波)</h3>
              <span class="chart-badge">Time Domain</span>
            </div>
            <div ref="chartTimeRef" class="echarts-container"></div>
          </div>

          <!-- 副图卡片：频域与特征标定 -->
          <div class="sub-charts">
            <div class="chart-card">
              <div class="chart-header">
                <h3>功率谱密度 (PSD) - HRV</h3>
                <span class="chart-badge">Freq Domain</span>
              </div>
              <div ref="chartFreqRef" class="echarts-container small"></div>
            </div>
            <div class="chart-card">
              <div class="chart-header">
                <h3>收缩峰值与特征点检测</h3>
                <span class="chart-badge">Feature Extraction</span>
              </div>
              <div ref="chartPeakRef" class="echarts-container small"></div>
            </div>
          </div>
        </div>
      </div>
      <!-- Close main-charts-wrapper -->

      <!-- 深入分析视图 -->
      <div
        v-show="currentView === '深入分析'"
        class="main-charts-wrapper"
        style="overflow-y: auto"
      >
        <PPGMorphology
          v-if="results?.morphology"
          :morphologyData="results.morphology"
        />
        <div v-else class="empty-state">
          <span class="empty-icon">📈</span>
          <p>请先在左侧上传PPG数据并等待系统收集完整的心动周期进行形态学分析</p>
        </div>
      </div>

      <!-- AI 分析报告视图 -->
      <div v-show="currentView === 'AI分析报告'" class="ai-report-wrapper">
        <div class="ai-report-header">
          <h2><span class="icon-pulse">✨</span> AI 智能体征分析</h2>
          <div class="ai-controls">
            <select v-model="aiProvider" class="ai-select">
              <option value="local">本地千问模型</option>
              <option value="deepseek">DeepSeek API</option>
            </select>
            <input
              v-if="aiProvider === 'deepseek'"
              v-model="deepseekApiKey"
              type="password"
              class="ai-key-input"
              placeholder="输入 DeepSeek API Key（可选，优先使用后端环境变量）"
            />
          </div>
          <button
            class="btn-analyze"
            @click="generateAIReport"
            :disabled="!results || aiLoading"
          >
            {{ aiLoading ? "正在思考中..." : "生成最新报告" }}
          </button>
        </div>

        <div class="ai-report-content">
          <div v-if="!results" class="empty-state">
            <span class="empty-icon">📂</span>
            <p>请先在左侧上传PPG数据并完成基础分析</p>
          </div>
          <div v-else-if="aiLoading" class="loading-state">
            <div class="spinner"></div>
            <p>
              {{
                aiProvider === "deepseek"
                  ? "DeepSeek 正在多维解析心血管指标，请稍候..."
                  : "本地千问模型正在多维解析心血管指标，请稍候..."
              }}
            </p>
          </div>
          <div
            v-else-if="aiReport"
            class="report-text"
            v-html="formattedReport"
          ></div>
          <div v-else class="empty-state">
            <span class="empty-icon">🤖</span>
            <p>数据已就绪，点击上方按钮开始获取 AI 心血管专家分析报告</p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  reactive,
  nextTick,
  onMounted,
  onUnmounted,
  computed,
  watch,
} from "vue";
import axios from "axios";
import * as echarts from "echarts";
import PPGMorphology from "./PPGMorphology.vue";

const props = defineProps<{
  currentView: string;
}>();

// AI 状态
const aiLoading = ref(false);
const aiReport = ref<string | null>(null);
const aiProvider = ref<"local" | "deepseek">("local");
const deepseekApiKey = ref("");

const formattedReport = computed(() => {
  if (!aiReport.value) return "";
  // 简单的 Markdown 转 HTML 处理
  return aiReport.value
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n(.*?)(\n|$)/g, "<p>$1</p>")
    .replace(/### (.*?)(<\/p>|$)/g, "<h3>$1</h3>")
    .replace(/## (.*?)(<\/p>|$)/g, "<h2>$1</h2>")
    .replace(/<p><\/p>/g, "") // 清理空段落
    .replace(/<p>\s*<\/p>/g, "");
});

const generateAIReport = async () => {
  if (!results.value || !results.value.features) return;
  aiLoading.value = true;
  error.value = null;
  aiReport.value = "";

  try {
    const payload: any = {
      features: results.value.features,
      provider: aiProvider.value,
    };
    if (aiProvider.value === "deepseek" && deepseekApiKey.value.trim()) {
      payload.api_key = deepseekApiKey.value.trim();
    }

    const response = await axios.post(
      "http://localhost:8000/api/ai_analysis",
      payload,
      {
        responseType: "text",
      },
    );
    aiReport.value =
      typeof response.data === "string"
        ? response.data
        : JSON.stringify(response.data);
  } catch (err: any) {
    aiReport.value = `<div class="error-msg">请求 AI 分析时发生错误: ${err.message}</div>`;
  } finally {
    aiLoading.value = false;
  }
};

watch(
  () => props.currentView,
  (newVal) => {
    if (newVal === "数据分析") {
      nextTick(() => {
        handleResize();
      });
    }
  },
);

// 状态管理
const file = ref<File | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const results = ref<any>(null);

const params = reactive({
  sampleRate: 100,
  lowcut: 0.5,
  highcut: 8.0,
  windowSize: 10,
});

// ECharts 实例引用
const chartTimeRef = ref<HTMLElement | null>(null);
const chartFreqRef = ref<HTMLElement | null>(null);
const chartPeakRef = ref<HTMLElement | null>(null);

let timeChart: echarts.ECharts | null = null;
let freqChart: echarts.ECharts | null = null;
let peakChart: echarts.ECharts | null = null;

let scrollTimer: any = null; // 用于波形滚动动画

// 通用科技暗黑主题背景色配置
const commonChartOptions = {
  backgroundColor: "transparent",
  tooltip: {
    trigger: "axis",
    backgroundColor: "rgba(15, 23, 42, 0.9)",
    borderColor: "#334155",
    textStyle: { color: "#e2e8f0" },
  },
  textStyle: { color: "#94a3b8" },
  grid: { top: 30, right: 20, bottom: 40, left: 50 },
  xAxis: {
    type: "category",
    axisLine: { lineStyle: { color: "#334155" } },
    splitLine: { show: false },
  },
  yAxis: {
    type: "value",
    axisLine: { show: false },
    splitLine: { lineStyle: { color: "#1e293b", type: "dashed" } },
  },
};

const handleResize = () => {
  timeChart?.resize();
  freqChart?.resize();
  peakChart?.resize();
};

onMounted(() => {
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  if (streamTimer) clearInterval(streamTimer);
  if (analysisTimer) clearInterval(analysisTimer);
  if (uiTimer) clearInterval(uiTimer);
  timeChart?.dispose();
  freqChart?.dispose();
  peakChart?.dispose();
});

const onFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    file.value = target.files[0] || null;
  }
};

let streamTimer: any = null;
let analysisTimer: any = null;
let uiTimer: any = null;

const streamData = reactive({
  raw: [] as number[],
  filtered: [] as number[],
  peaks: [] as number[],
  time: [] as string[],
});

const staticChartData = reactive({
  time: [] as string[],
  filtered: [] as number[],
  peaks: [] as number[],
  freqData: [] as number[],
});

const updateSubCharts = () => {
  if (peakChart) {
    const peakMarks = staticChartData.peaks.map((p: number) => ({
      name: "Peak",
      coord: [staticChartData.time[p], staticChartData.filtered[p]],
      itemStyle: { color: "#f43f5e" },
    }));

    peakChart.setOption({
      ...commonChartOptions,
      animation: true,
      title: {
        text: `检测到波峰: ${staticChartData.peaks.length} 个`,
        textStyle: { fontSize: 12, color: "#94a3b8" },
        top: 0,
        right: 0,
      },
      xAxis: { ...commonChartOptions.xAxis, data: staticChartData.time },
      yAxis: { ...commonChartOptions.yAxis, scale: true },
      series: [
        {
          name: "Peaks",
          type: "line",
          data: staticChartData.filtered,
          itemStyle: { color: "#10b981" },
          lineStyle: { width: 2 },
          showSymbol: false,
          markPoint: {
            symbol: "circle",
            symbolSize: 8,
            data: peakMarks,
          },
        },
      ],
    });
  }

  if (freqChart) {
    freqChart.setOption({
      ...commonChartOptions,
      animation: true,
      color: ["#8b5cf6"],
      grid: { top: 20, right: 10, bottom: 20, left: 40 },
      xAxis: {
        type: "category",
        data: Array.from({ length: 50 }, (_, i) => (i * 0.1).toFixed(1)),
      },
      yAxis: { ...commonChartOptions.yAxis, scale: true },
      series: [
        {
          name: "PSD",
          type: "bar",
          data: staticChartData.freqData,
          itemStyle: { borderRadius: [2, 2, 0, 0] },
        },
      ],
    });
  }
};

const uploadFile = async () => {
  if (!file.value) return;
  loading.value = true;
  error.value = null;

  try {
    const text = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file.value as File);
    });

    let allData: number[] = [];
    if (file.value.name.endsWith(".json")) {
      const json = JSON.parse(text);
      allData = Array.isArray(json)
        ? json
        : (Object.values(json).flat() as number[]);
    } else {
      allData = text
        .split("\n")
        .map((l) => parseFloat((l.split(",")[0] || "").trim()))
        .filter((n) => !isNaN(n));
    }

    if (allData.length === 0) throw new Error("没有有效数据");

    loading.value = false;
    startStreaming(allData);
  } catch (err: any) {
    error.value = err.message || "解析文件异常";
    loading.value = false;
  }
};

const startStreaming = (allData: number[]) => {
  let currentIndex = 0;
  streamData.raw = [];
  streamData.filtered = [];
  streamData.peaks = [];
  streamData.time = [];

  results.value = {
    features: { HR: "--", SpO2: "--", RR: "--", HRV_SDNN: "--" },
    morphology: null,
  };

  const BUFFER_SIZE = 1000; // 20s at 50Hz = 1000
  const TICK_MS = 20;

  if (streamTimer) clearInterval(streamTimer);
  if (analysisTimer) clearInterval(analysisTimer);
  if (uiTimer) clearInterval(uiTimer);
  if (scrollTimer) clearInterval(scrollTimer);

  streamTimer = setInterval(() => {
    if (currentIndex >= allData.length) {
      currentIndex = 0;
    }
    const val = allData[currentIndex];
    if (val !== undefined) {
      streamData.raw.push(val);
      streamData.time.push((currentIndex * (1 / 50)).toFixed(2));
    }

    if (streamData.raw.length > BUFFER_SIZE) {
      streamData.raw.shift();
      streamData.time.shift();
    }
    currentIndex++;
  }, TICK_MS);

  // Initialize charts empty
  nextTick(() => {
    initCharts();
  });

  uiTimer = setInterval(() => {
    updateCharts();
  }, 250); // UI updates 4 times a sec to reduce CPU load

  analysisTimer = setInterval(async () => {
    if (streamData.raw.length < 100) return;
    const currentRaw = [...streamData.raw];
    const currentTime = [...streamData.time];
    try {
      const res = await axios.post("http://localhost:8000/api/analyze_buffer", {
        signal: currentRaw,
        sample_rate: 50,
      });
      results.value.features = res.data.features;
      results.value.morphology = res.data.morphology;

      streamData.filtered = res.data.filtered_signal;
      streamData.peaks = res.data.peaks;

      // Update the static charts for slower refresh rate and no jumping
      staticChartData.filtered = res.data.filtered_signal;
      staticChartData.peaks = res.data.peaks;

      // align time axis to the actual filtered data length properly
      const startIdx = currentTime.length - res.data.filtered_signal.length;
      staticChartData.time = currentTime.slice(startIdx > 0 ? startIdx : 0);

      // Generate mock freq data once per second
      staticChartData.freqData = Array.from(
        { length: 50 },
        () => Math.random() * 10 * Math.exp(-Math.random() * 2),
      );
      updateSubCharts();
    } catch (e) {}
  }, 1000);
};

const initCharts = () => {
  if (chartTimeRef.value && !timeChart) {
    timeChart = echarts.init(chartTimeRef.value);
  }
  if (chartFreqRef.value && !freqChart) {
    freqChart = echarts.init(chartFreqRef.value);
  }
  if (chartPeakRef.value && !peakChart) {
    peakChart = echarts.init(chartPeakRef.value);
  }
};

const updateCharts = () => {
  if (!timeChart) return;

  // padding for filtered to match raw buffer
  let paddingLength = streamData.raw.length - streamData.filtered.length;
  let paddedFiltered = streamData.filtered.slice();
  if (paddingLength > 0) {
    paddedFiltered = [
      ...Array(paddingLength).fill(null),
      ...streamData.filtered,
    ];
  } else if (paddingLength < 0) {
    paddedFiltered = streamData.filtered.slice(-paddingLength);
  }

  timeChart.setOption({
    ...commonChartOptions,
    animation: false,
    legend: {
      data: ["Raw PPG", "Filtered PPG"],
      textStyle: { color: "#cbd5e1" },
      top: 0,
    },
    xAxis: { ...commonChartOptions.xAxis, data: streamData.time },
    yAxis: { ...commonChartOptions.yAxis, scale: true },
    series: [
      {
        name: "Raw PPG",
        type: "line",
        data: streamData.raw,
        itemStyle: { color: "rgba(148, 163, 184, 0.4)" },
        lineStyle: { width: 1 },
        showSymbol: false,
      },
      {
        name: "Filtered PPG",
        type: "line",
        data: paddedFiltered,
        itemStyle: { color: "#38bdf8" },
        lineStyle: { width: 2 },
        showSymbol: false,
      },
    ],
  });
};
</script>

<style scoped>
.dashboard {
  display: flex;
  height: 100%;
  width: 100%;
  overflow: hidden;
}

/* 侧边栏样式：减小宽度和内边距 */
.sidebar {
  width: 250px;
  background-color: #0f172a;
  border-right: 1px solid #1e293b;
  display: flex;
  flex-direction: column;
  padding: 15px;
  z-index: 10;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}
.icon-pulse {
  font-size: 20px;
  color: #10b981;
  text-shadow: 0 0 10px rgba(16, 185, 129, 0.6);
}
.brand h1 {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
  letter-spacing: 1px;
}

.panel {
  background: rgba(30, 41, 59, 0.4);
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 15px;
}
.panel h2 {
  font-size: 0.85rem;
  color: #94a3b8;
  margin: 0 0 10px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.upload-box {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.file-label {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: #1e293b;
  border: 1px dashed #475569;
  padding: 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}
.file-label:hover {
  border-color: #38bdf8;
  background: rgba(56, 189, 248, 0.05);
}
.file-name {
  font-size: 0.8rem;
  color: #cbd5e1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.btn-analyze {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #fff;
  border: none;
  padding: 8px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.85rem;
  box-shadow: 0 4px 10px rgba(16, 185, 129, 0.3);
}
.btn-analyze:disabled {
  background: #334155;
  color: #64748b;
  box-shadow: none;
  cursor: not-allowed;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.setting-item label {
  font-size: 0.75rem;
  color: #94a3b8;
}
.setting-item input {
  width: 60px;
  background: #0f172a;
  border: 1px solid #334155;
  color: #e2e8f0;
  padding: 3px 6px;
  border-radius: 4px;
  text-align: right;
  font-size: 0.75rem;
}

.status-indicator {
  margin-top: auto;
  font-size: 0.8rem;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: rgba(15, 23, 42, 0.5);
  border-radius: 6px;
}
.dot {
  width: 8px;
  height: 8px;
  background: #ef4444;
  border-radius: 50%;
}
.dot.active {
  background: #10b981;
  box-shadow: 0 0 8px #10b981;
}

/* 主内容区样式：取消滚动，让其紧凑地填满屏幕 */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 15px;
  gap: 15px;
  overflow: hidden; /* 防止溢出屏幕 */
}

/* 顶部状态面板 */
.top-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  height: 90px; /* 固定高度防止挤压下方图表 */
  flex-shrink: 0;
}
.stat-card {
  background: #111827;
  border: 1px solid #1f2937;
  border-radius: 8px;
  padding: 12px 15px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
}
.stat-label {
  font-size: 0.75rem;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.stat-value {
  font-size: 1.8rem;
  font-weight: 700;
  display: flex;
  align-items: baseline;
  gap: 4px;
  font-family: "Courier New", Courier, monospace;
}
.unit {
  font-size: 0.8rem;
  color: #6b7280;
  font-weight: 500;
  font-family: sans-serif;
}
.text-green {
  color: #10b981;
  text-shadow: 0 0 15px rgba(16, 185, 129, 0.4);
}
.text-cyan {
  color: #06b6d4;
  text-shadow: 0 0 15px rgba(6, 182, 212, 0.4);
}
.text-purple {
  color: #8b5cf6;
  text-shadow: 0 0 15px rgba(139, 92, 246, 0.4);
}
.text-orange {
  color: #f59e0b;
  text-shadow: 0 0 15px rgba(245, 158, 11, 0.4);
}

/* 核心图表区：利用 flex 使所有卡片贴合剩余屏幕空间 */
.charts-area {
  display: flex;
  flex-direction: column;
  gap: 15px;
  flex: 1;
  overflow: hidden;
}
.chart-card {
  background: #111827;
  border: 1px solid #1f2937;
  border-radius: 8px;
  padding: 12px 15px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.time-domain {
  flex: 1.2; /* 主图比例大一点 */
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  flex-shrink: 0;
}
.chart-header h3 {
  margin: 0;
  font-size: 0.9rem;
  color: #e5e7eb;
  font-weight: 500;
}
.chart-badge {
  font-size: 0.65rem;
  background: #1f2937;
  color: #9ca3af;
  padding: 2px 6px;
  border-radius: 4px;
}

/* 图表容器纯按flex缩放，不写死高度 */
.echarts-container,
.echarts-container.small {
  width: 100%;
  flex: 1;
  min-height: 0; /* 关键：允许 flex 子项缩小 */
}

.sub-charts {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  min-height: 0; /* 穿透 flex */
}

.error-msg {
  color: #ef4444;
  font-size: 0.8rem;
  margin-top: 8px;
  background: rgba(239, 68, 68, 0.1);
  padding: 6px;
  border-radius: 4px;
}

/* AI Report Styles */
.main-charts-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 15px;
  flex: 1;
}
.ai-report-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #111827;
  border: 1px solid #1f2937;
  border-radius: 8px;
  overflow: hidden;
}

.ai-report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #1f2937;
  background: rgba(15, 23, 42, 0.5);
}

.ai-report-header h2 {
  margin: 0;
  color: #3b82f6; /* Qwen Brand colorish */
  font-size: 1.4rem;
  display: flex;
  align-items: center;
  gap: 10px;
}

.ai-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
  margin-right: 12px;
}

.ai-select,
.ai-key-input {
  background: #0f172a;
  border: 1px solid #334155;
  color: #e2e8f0;
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 0.85rem;
}

.ai-key-input {
  width: 320px;
}

.ai-report-content {
  flex: 1;
  padding: 25px;
  overflow-y: auto;
  color: #e2e8f0;
  line-height: 1.8;
  font-size: 1.05rem;
}

.report-text h2,
.report-text h3 {
  color: #fff;
  margin-top: 1.2em;
  margin-bottom: 0.6em;
}

.report-text strong {
  color: #60a5fa;
  font-weight: 600;
}

.report-text p {
  margin-bottom: 1em;
}

.empty-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #64748b;
  font-size: 1.2rem;
  text-align: center;
}
.empty-state .empty-icon {
  font-size: 3rem;
  margin-bottom: 15px;
  opacity: 0.6;
}

.loading-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #3b82f6;
  gap: 20px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(59, 130, 246, 0.2);
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

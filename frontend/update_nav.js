const fs = require('fs');
const path = '/home/cc/workspace/ppg_web/frontend/src/components/PPGAnalyzer.vue';

let content = fs.readFileSync(path, 'utf8');

// 1. Extract the current script section
const scriptMatch = content.match(/<script setup lang="ts">([\s\S]*?)<\/script>/);
let scriptContent = scriptMatch ? scriptMatch[1] : '';

// 2. Adjust script content for new navigation
scriptContent = scriptContent.replace(/const activeTab = ref\(.*?\);/g, "const activeNav = ref('dashboard');");
scriptContent = scriptContent.replace(/const switchTab = async \(tab: string\) => \{[\s\S]*?\};/g, 
`const switchNav = async (nav: string) => {
  activeNav.value = nav;
  await nextTick();
  handleResize();
};`);

// Append window listener manual triggering for transition sizes
scriptContent = scriptContent + '\n';

// 3. New Template layout
const newTemplate = `
<div class="app-layout">
  <!-- 侧边栏导航 -->
  <aside class="sidebar-nav">
    <div class="brand">
      <span class="icon-pulse">⚡</span>
      <span class="brand-text">PPG Monitor</span>
    </div>
    
    <nav class="nav-list">
      <div class="nav-item" :class="{active: activeNav === 'dashboard'}" @click="switchNav('dashboard')">
        <span class="nav-icon">🎛️</span><span class="nav-text">Dashboard</span>
      </div>
      <div class="nav-item" :class="{active: activeNav === 'raw'}" @click="switchNav('raw')">
        <span class="nav-icon">📈</span><span class="nav-text">原始信号</span>
      </div>
      <div class="nav-item" :class="{active: activeNav === 'hrv'}" @click="switchNav('hrv')">
        <span class="nav-icon">🫀</span><span class="nav-text">HRV 深度分析</span>
      </div>
      <div class="nav-item" :class="{active: activeNav === 'apg'}" @click="switchNav('apg')">
        <span class="nav-icon">🩸</span><span class="nav-text">血管弹性研究</span>
      </div>
      <div class="nav-item" :class="{active: activeNav === 'resp'}" @click="switchNav('resp')">
        <span class="nav-icon">🫁</span><span class="nav-text">呼吸率提取</span>
      </div>
      <div class="nav-item" :class="{active: activeNav === 'history'}" @click="switchNav('history')">
        <span class="nav-icon">📋</span><span class="nav-text">历史报告</span>
      </div>
    </nav>
    
    <div class="sidebar-footer">
      <div class="status-indicator">
        <span class="dot" :class="{ 'active': results }"></span>
        <span class="status-text">系统引擎: {{ results ? 'Online' : 'Standby' }}</span>
      </div>
    </div>
  </aside>

  <!-- 右侧主内容区 -->
  <main class="page-content">
      <!-- 1. Dashboard -->
      <div class="view-pane fade-view" v-show="activeNav === 'dashboard'">
        <div class="view-header"><h2>工作台总览</h2></div>
        
        <div class="top-stats">
          <div class="stat-card">
            <div class="stat-label">当前心率 (HR)</div>
            <div class="stat-value text-green">{{ results?.features?.HR || '--' }} <span class="unit">bpm</span></div>
          </div>
          <div class="stat-card">
            <div class="stat-label">血氧预测估算 (SpO2)</div>
            <div class="stat-value text-cyan">{{ results?.features?.SpO2 || '--' }} <span class="unit">%</span></div>
          </div>
          <div class="stat-card">
            <div class="stat-label">呼吸频率 (RR)</div>
            <div class="stat-value text-purple">{{ results?.features?.RR || '--' }} <span class="unit">cpm</span></div>
          </div>
          <div class="stat-card">
            <div class="stat-label">心率变异性 (SDNN)</div>
            <div class="stat-value text-orange">{{ results?.features?.HRV_SDNN || '--' }} <span class="unit">ms</span></div>
          </div>
        </div>

        <div class="control-panels">
          <div class="panel upload-panel">
            <h2><span class="panel-icon">📁</span> 数据源接入</h2>
            <div class="upload-box">
              <input type="file" id="file" @change="onFileChange" accept=".csv,.json" hidden />
              <label for="file" class="file-label">
                <span class="upload-icon">⇪</span>
                <span class="file-name">{{ file ? file.name : '选择 CSV/JSON 信号文件' }}</span>
              </label>
              <button :disabled="!file || loading" class="btn-analyze" @click="uploadFile">
                {{ loading ? '解析计算中...' : '启动分析与算法引擎' }}
              </button>
            </div>
            <div v-if="error" class="error-msg">{{ error }}</div>
          </div>

          <div class="panel settings-panel">
            <h2><span class="panel-icon">⚙️</span> 全局算法参数</h2>
            <div class="settings-grid">
              <div class="setting-item">
                <label>采样率 (Hz)</label>
                <input type="number" v-model="params.sampleRate" />
              </div>
              <div class="setting-item">
                <label>低通截止 (Hz)</label>
                <input type="number" v-model="params.lowcut" step="0.1" />
              </div>
              <div class="setting-item">
                <label>高通截止 (Hz)</label>
                <input type="number" v-model="params.highcut" step="0.1" />
              </div>
              <div class="setting-item">
                <label>分析窗宽 (秒)</label>
                <input type="number" v-model="params.windowSize" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. 原始信号 -->
      <div class="view-pane fade-view" v-show="activeNav === 'raw'">
        <div class="view-header"><h2>原始信号追踪与去噪滤波</h2></div>
        <div class="chart-card time-domain">
          <div ref="chartTimeRef" class="echarts-container"></div>
        </div>
      </div>

      <!-- 3. HRV -->
      <div class="view-pane fade-view" v-show="activeNav === 'hrv'">
        <div class="view-header"><h2>自主神经系统 (HRV) 深度分析</h2></div>
        <div class="dual-layout">
          <div class="chart-card">
            <div class="chart-header"><h3>Poincaré 散点轨迹图</h3></div>
            <div ref="chartPoincareRef" class="echarts-container"></div>
          </div>
          <div class="chart-card">
            <div class="chart-header"><h3>频域功率谱密度 (PSD)</h3></div>
            <div ref="chartFreqRef" class="echarts-container"></div>
          </div>
        </div>
      </div>

      <!-- 4. 血管动力学 APG -->
      <div class="view-pane fade-view" v-show="activeNav === 'apg'">
        <div class="view-header"><h2>血管动力学与弹性研究 (APG)</h2></div>
        <div class="ratio-layout">
          <div class="chart-card apg-main">
            <div class="chart-header"><h3>APG 二阶导数与特征点分布</h3></div>
            <div ref="chartApgRef" class="echarts-container"></div>
          </div>
          <div class="chart-card gauge-side">
            <div class="chart-header"><h3>血管老化评估指数</h3></div>
            <div ref="chartGaugeRef" class="echarts-container"></div>
          </div>
        </div>
      </div>
      
      <!-- 5. 呼吸率 Resp -->
      <div class="view-pane fade-view" v-show="activeNav === 'resp'">
        <div class="view-header"><h2>基于 PPG 的呼吸率联合提取 (EDR)</h2></div>
        <div class="chart-card time-domain">
            <div class="chart-header"><h3>呼吸频带波形重构与分离</h3></div>
            <div class="echarts-container empty-placeholder">等待呼吸调制算法解析图层...</div>
        </div>
      </div>

      <!-- 6. 异常历史报告 -->
      <div class="view-pane fade-view" v-show="activeNav === 'history'">
        <div class="view-header"><h2>全周期健康历史报告报告与异常追踪</h2></div>
        <div class="list-layout">
            <div class="chart-card header-chart">
              <div class="chart-header"><h3>信号质量评价与连续异常活动标识</h3></div>
              <div ref="chartAnomalyRef" class="echarts-container"></div>
            </div>
            <div class="data-table-container">
              <table class="ant-table">
                <thead>
                  <tr><th>事件时间戳</th><th>异常判别类型</th><th>连续持续时长 (s)</th><th>医疗算法置信度</th></tr>
                </thead>
                <tbody>
                  <tr class="table-empty"><td colspan="4">暂无异常检测事件报告</td></tr>
                </tbody>
              </table>
            </div>
        </div>
      </div>
  </main>
</div>
`;

// 4. New Global and Scoped Styles for Sidebar Navigation Structure
const newStyle = `
/* 整体应用框架 */
.app-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background-color: #0B0E14;
}

/* 极简侧边导航栏 */
.sidebar-nav {
  width: 250px;
  background: #0F172A;
  border-right: 1px solid #1E293B;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 10px rgba(0,0,0,0.2);
  z-index: 100;
  transition: all 0.3s ease;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 24px 20px;
  margin-bottom: 10px;
  border-bottom: 1px solid rgba(255,255,255,0.02);
}
.icon-pulse {
  font-size: 22px;
  color: #10B981;
  text-shadow: 0 0 12px rgba(16, 185, 129, 0.5);
}
.brand-text {
  font-size: 1.1rem;
  font-weight: 600;
  color: #F8FAFC;
  letter-spacing: 0.5px;
}

/* 导航项微交互与特效 */
.nav-list {
  display: flex;
  flex-direction: column;
  flex: 1;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  color: #64748B;
  cursor: pointer;
  border-left: 3px solid transparent;
  transition: all 0.2s ease-in-out;
  font-size: 0.95rem;
  font-weight: 500;
}
.nav-item:hover {
  background: rgba(30, 41, 59, 0.4);
  color: #E2E8F0;
}
.nav-item.active {
  background: linear-gradient(90deg, rgba(56, 189, 248, 0.1) 0%, transparent 100%);
  color: #38BDF8;
  border-left-color: #38BDF8;
  text-shadow: 0 0 1px rgba(56, 189, 248, 0.2);
}
.nav-icon {
  font-size: 1.2rem;
  opacity: 0.8;
}
.nav-item.active .nav-icon {
  opacity: 1;
}

/* 侧栏底部系统状态 */
.sidebar-footer {
  padding: 20px;
  border-top: 1px solid #1E293B;
  background: rgba(11, 14, 20, 0.5);
}
.status-indicator {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #111827;
  padding: 10px 14px;
  border-radius: 6px;
  border: 1px solid #1E293B;
}
.status-text {
  font-size: 0.75rem;
  color: #94A3B8;
  letter-spacing: 0.5px;
}
.dot { width: 8px; height: 8px; background: #ef4444; border-radius: 50%; display: inline-block; }
.dot.active { background: #10B981; box-shadow: 0 0 8px #10B981; }

/* 主内容工作区 */
.page-content {
  flex: 1;
  position: relative;
  overflow-y: auto;
  background-color: #0B0E14;
  display: flex;
  flex-direction: column;
}

.view-pane {
  flex: 1;
  padding: 20px 25px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-height: 100%;
}
.fade-view {
  animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateX(10px); }
  to { opacity: 1; transform: translateX(0); }
}
.view-header {
  margin-bottom: 5px;
}
.view-header h2 {
  font-size: 1.2rem;
  color: #E2E8F0;
  margin: 0;
  font-weight: 500;
  letter-spacing: 0.5px;
}

/* Dashbaord 内部卡片重构 */
.top-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  flex-shrink: 0;
}
.stat-card {
  background: #111827;
  border: 1px solid #1F2937;
  border-radius: 10px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.02);
  transition: transform 0.2s;
}
.stat-card:hover { transform: translateY(-2px); }
.stat-label { font-size: 0.75rem; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.5px; }
.stat-value { font-size: 1.8rem; font-weight: 700; display: flex; align-items: baseline; gap: 4px; font-family: 'Courier New', Courier, monospace; }
.unit { font-size: 0.8rem; color: #6B7280; font-weight: 500; font-family: sans-serif; }
.text-green { color: #10B981; text-shadow: 0 0 15px rgba(16, 185, 129, 0.4); }
.text-cyan { color: #06B6D4; text-shadow: 0 0 15px rgba(6, 182, 212, 0.4); }
.text-purple { color: #8B5CF6; text-shadow: 0 0 15px rgba(139, 92, 246, 0.4); }
.text-orange { color: #F59E0B; text-shadow: 0 0 15px rgba(245, 158, 11, 0.4); }

.control-panels {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}
.panel {
  background: rgba(30, 41, 59, 0.4);
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.panel h2 { font-size: 0.9rem; color: #94A3B8; margin: 0 0 15px 0; display: flex; align-items: center; gap: 8px; }
.upload-box { display: flex; flex-direction: column; gap: 10px; }
.file-label {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  background: #1E293B; border: 1px dashed #475569; padding: 12px; border-radius: 6px; cursor: pointer; transition: all 0.3s;
}
.file-label:hover { border-color: #38BDF8; background: rgba(56, 189, 248, 0.05); color: #38BDF8; }
.file-name { font-size: 0.85rem; color: #CBD5E1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.btn-analyze {
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  color: #fff; border: none; padding: 10px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 0.85rem; box-shadow: 0 4px 10px rgba(16, 185, 129, 0.3);
}
.btn-analyze:disabled { background: #334155; color: #64748B; box-shadow: none; cursor: not-allowed; }
.settings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.setting-item { display: flex; justify-content: space-between; align-items: center; background: #0F172A; padding: 6px 10px; border-radius: 6px; border: 1px solid #1E293B; }
.setting-item label { font-size: 0.75rem; color: #94A3B8; }
.setting-item input { width: 50px; background: transparent; border: none; color: #E2E8F0; text-align: right; font-size: 0.8rem; outline: none; }

/* Chart 卡片通用样式 */
.chart-card {
  background: #111827;
  border: 1px solid #1F2937;
  border-radius: 8px;
  padding: 15px 20px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.time-domain { flex: 1; }
.dual-layout { display: flex; gap: 15px; flex: 1; }
.dual-layout .chart-card { flex: 1; width: 50%; }
.ratio-layout { display: flex; gap: 15px; flex: 1; }
.apg-main { flex: 2; }
.gauge-side { flex: 1; }
.list-layout { display: flex; flex-direction: column; gap: 15px; flex: 1; }
.header-chart { flex: 1; min-height: 250px; }

.chart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-shrink: 0; }
.chart-header h3 { margin: 0; font-size: 0.9rem; color: #E5E7EB; font-weight: 500; font-family: inherit;}
.echarts-container { width: 100%; flex: 1; min-height: 0; }
.empty-placeholder { display:flex; align-items:center; justify-content:center; color: #475569; font-size: 0.9rem; border: 1px dashed #1E293B; border-radius: 6px; margin-top: 10px; }

/* Table 样式保留 */
.data-table-container { flex: 1; background: #111827; border: 1px solid #1F2937; border-radius: 8px; overflow: auto; }
.ant-table { width: 100%; border-collapse: collapse; text-align: left; color: #CBD5E1; }
.ant-table th { background: #1F2937; padding: 12px 15px; font-weight: 600; color: #9CA3AF; font-size: 0.85rem; border-bottom: 2px solid #334155; }
.ant-table td { padding: 12px 15px; border-bottom: 1px solid #1E293B; font-size: 0.85rem; }
.table-empty td { text-align: center; color: #64748B; padding: 40px; }
.error-msg { color: #EF4444; font-size: 0.8rem; margin-top: 8px; padding: 6px; border-radius: 4px; border: 1px solid rgba(239, 68, 68, 0.3);}
`;

const finalFileStr = \`<template>\n\${newTemplate}\n</template>\n\n<script setup lang="ts">\n\${scriptContent}\n</script>\n\n<style scoped>\n\${newStyle}\n</style>\`;

fs.writeFileSync(path, finalFileStr);
console.log('Navigation sidebar injected.');

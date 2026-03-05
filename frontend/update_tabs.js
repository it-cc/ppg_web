const fs = require('fs');
const path = '/home/cc/workspace/ppg_web/frontend/src/components/PPGAnalyzer.vue';

let content = fs.readFileSync(path, 'utf-8');

// 1. 替换 template 中的 charts-area
const newTemplate = `
      <!-- Ant Design 风格的 Tabs 结构 -->
      <div class="ant-tabs">
        <div class="ant-tabs-nav">
          <div class="ant-tabs-tab" :class="{ 'ant-tabs-tab-active': activeTab === 'time' }" @click="switchTab('time')">时域概览</div>
          <div class="ant-tabs-tab" :class="{ 'ant-tabs-tab-active': activeTab === 'hrv' }" @click="switchTab('hrv')">自主神经系统 (HRV)</div>
          <div class="ant-tabs-tab" :class="{ 'ant-tabs-tab-active': activeTab === 'apg' }" @click="switchTab('apg')">血管动力学</div>
          <div class="ant-tabs-tab" :class="{ 'ant-tabs-tab-active': activeTab === 'anomaly' }" @click="switchTab('anomaly')">异常检测报告</div>
        </div>
        
        <div class="ant-tabs-content">
          <!-- 1. 时域概览 -->
          <div v-show="activeTab === 'time'" class="tab-pane">
             <div class="chart-card time-domain">
               <div ref="chartTimeRef" class="echarts-container"></div>
             </div>
          </div>

          <!-- 2. HRV 分析 -->
          <div v-show="activeTab === 'hrv'" class="tab-pane dual-layout">
             <div class="chart-card">
               <div class="chart-header"><h3>Poincaré 散点图</h3></div>
               <div ref="chartPoincareRef" class="echarts-container"></div>
             </div>
             <div class="chart-card">
               <div class="chart-header"><h3>频域功率谱 (PSD)</h3></div>
               <div ref="chartFreqRef" class="echarts-container"></div>
             </div>
          </div>

          <!-- 3. 血管动力学 (APG) -->
          <div v-show="activeTab === 'apg'" class="tab-pane ratio-layout">
             <div class="chart-card apg-main">
               <div class="chart-header"><h3>APG 二阶导数与特征点 (a, b, c, d, e)</h3></div>
               <div ref="chartApgRef" class="echarts-container"></div>
             </div>
             <div class="chart-card gauge-side">
               <div class="chart-header"><h3>血管老化指数</h3></div>
               <div ref="chartGaugeRef" class="echarts-container"></div>
             </div>
          </div>

          <!-- 4. 异常检测 -->
          <div v-show="activeTab === 'anomaly'" class="tab-pane list-layout">
             <div class="chart-card header-chart">
               <div class="chart-header"><h3>信号质量与异常打标带</h3></div>
               <div ref="chartAnomalyRef" class="echarts-container"></div>
             </div>
             <div class="data-table-container">
               <table class="ant-table">
                 <thead>
                   <tr><th>发生时间</th><th>异常类型</th><th>持续时间</th><th>置信度</th></tr>
                 </thead>
                 <tbody>
                   <tr class="table-empty"><td colspan="4">暂无数据接入，等待算法分析...</td></tr>
                 </tbody>
               </table>
             </div>
          </div>
        </div>
      </div>
`;
content = content.replace(/<div class="charts-area">[\s\S]*?<\/div>\s*<\/main>/, newTemplate + '\n    </main>');

// 2. 更新 script 逻辑
const newScriptVars = `// 状态管理
const activeTab = ref('time');

const switchTab = async (tab: string) => {
  activeTab.value = tab;
  await nextTick();
  renderCharts();
};`;
content = content.replace(/\/\/ 状态管理/, newScriptVars);

const newRefs = `// ECharts 实例引用
const chartTimeRef = ref<HTMLElement | null>(null);
const chartFreqRef = ref<HTMLElement | null>(null);
const chartPoincareRef = ref<HTMLElement | null>(null);
const chartApgRef = ref<HTMLElement | null>(null);
const chartGaugeRef = ref<HTMLElement | null>(null);
const chartAnomalyRef = ref<HTMLElement | null>(null);

let timeChart: echarts.ECharts | null = null;
let freqChart: echarts.ECharts | null = null;
let poincartChart: echarts.ECharts | null = null;
let apgChart: echarts.ECharts | null = null;
let gaugeChart: echarts.ECharts | null = null;
let anomalyChart: echarts.ECharts | null = null;
let scrollTimer: any = null;`;

content = content.replace(/\/\/ ECharts 实例引用[\s\S]*?let scrollTimer: any = null;/m, newRefs);

const newResizeUnmount = `const handleResize = () => {
  timeChart?.resize();
  freqChart?.resize();
  poincartChart?.resize();
  apgChart?.resize();
  gaugeChart?.resize();
  anomalyChart?.resize();
};

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  if (scrollTimer) clearInterval(scrollTimer);
  timeChart?.dispose();
  freqChart?.dispose();
  poincartChart?.dispose();
  apgChart?.dispose();
  gaugeChart?.dispose();
  anomalyChart?.dispose();
});`;

content = content.replace(/const handleResize = \(\) => {[\s\S]*?}\);/m, newResizeUnmount);

fs.writeFileSync(path, content, 'utf-8');
console.log('Template and Scripts updated');

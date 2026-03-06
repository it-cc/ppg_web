<template>
  <div class="morphology-container">
    <div class="morphology-header">
      <h2><span class="icon">🔬</span> PPG 波形特征分析 (Morphology)</h2>
      <p>高分辨率单周期形态学分析与二阶导数 (APG) 自动标定</p>
    </div>

    <div class="charts-card">
      <div ref="chartRef" class="echarts-main"></div>
    </div>

    <div class="metrics-card">
      <h3>血流动力学评估指标 (Hemodynamics Metrics)</h3>
      <div class="table-wrapper">
        <table class="metrics-table">
          <thead>
            <tr>
              <th>指 标</th>
              <th>缩 写</th>
              <th>意 义</th>
              <th>提取公式</th>
              <th>计算值</th>
              <th>参考范围</th>
              <th>健康状态</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>硬度指数</td>
              <td>SI (Stiffness Index)</td>
              <td>大动脉血管硬度与扩张性</td>
              <td>h / ΔT (m/s)</td>
              <td class="value highlight">{{ metrics.SI.toFixed(2) }}</td>
              <td>&lt; 7.0 m/s</td>
              <td><span class="badge normal">良好</span></td>
            </tr>
            <tr>
              <td>反射指数</td>
              <td>RI (Reflection Index)</td>
              <td>小动脉/微血管阻力</td>
              <td>b / a × 100%</td>
              <td class="value highlight">{{ metrics.RI.toFixed(2) }} %</td>
              <td>40% - 60%</td>
              <td><span class="badge normal">良好</span></td>
            </tr>
            <tr>
              <td>衰减波幅度比</td>
              <td>d/a</td>
              <td>外周血管阻力与弹性</td>
              <td>d / a</td>
              <td class="value">{{ metrics.daRatio.toFixed(2) }}</td>
              <td>&lt; 0.4</td>
              <td><span class="badge normal">良好</span></td>
            </tr>
            <tr>
              <td>APG 综合指数</td>
              <td>(b-c-d-e)/a</td>
              <td>血管综合老化程度评估</td>
              <td>(b-c-d-e) / a</td>
              <td class="value">{{ metrics.apgAge.toFixed(2) }}</td>
              <td>&gt; -0.2</td>
              <td><span class="badge warning">轻度老化</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import * as echarts from 'echarts';

const props = defineProps<{
  morphologyData: any;
}>();

const chartRef = ref<HTMLElement | null>(null);
let echartInstance: echarts.ECharts | null = null;

// 使用传入的数据更新表单
const metrics = ref({
  SI: 0,
  RI: 0,
  daRatio: 0,
  apgAge: 0
});

const renderChart = () => {
  if (!chartRef.value || !props.morphologyData) return;
  
  if (!echartInstance) {
    echartInstance = echarts.init(chartRef.value);
  }

  const data = props.morphologyData;
  metrics.value = data.metrics;

  const apgMarks = data.apgMarks.map((m: any) => ({
    name: m.name + '波',
    coord: [String(data.time[m.idx].toFixed(3)), data.apg[m.idx]],
    value: m.val
  }));

  const ppgMarks = data.ppgMarks.map((m: any) => ({
    name: m.name,
    coord: [String(data.time[m.idx].toFixed(3)), data.ppg[m.idx]]
  }));

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    legend: {
      data: ['原始 PPG 波形 (标准化)', '二阶导数 APG (标准化)'],
      textStyle: { color: '#E2E8F0' },
      top: 10
    },
    grid: [{
      top: 60,
      bottom: 60,
      left: 60,
      right: 40
    }],
    xAxis: {
      type: 'category',
      data: data.time.map((t: number) => t.toFixed(3)),
      name: 'Time (s)',
      axisLine: { lineStyle: { color: '#64748B' } },
      splitLine: { show: false },
      axisLabel: {
        formatter: (value: string, index: number) => index % 20 === 0 ? value : ''
      }
    },
    yAxis: [{
      type: 'value',
      name: 'PPG Amplitude',
      position: 'left',
      axisLine: { show: true, lineStyle: { color: '#38BDF8' } },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } }
    }, {
      type: 'value',
      name: 'APG Amplitude',
      position: 'right',
      axisLine: { show: true, lineStyle: { color: '#A78BFA' } },
      splitLine: { show: false }
    }],
    series: [
      {
        name: '原始 PPG 波形 (标准化)',
        type: 'line',
        yAxisIndex: 0,
        data: data.ppg,
        smooth: true,
        symbol: 'none',
        lineStyle: { color: '#38BDF8', width: 3 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(56, 189, 248, 0.3)' },
            { offset: 1, color: 'rgba(56, 189, 248, 0)' }
          ])
        },
        markPoint: {
          symbol: 'circle',
          symbolSize: 8,
          label: {
            position: 'top',
            color: '#38BDF8',
            formatter: '{b}'
          },
          itemStyle: { color: '#0EA5E9' },
          data: ppgMarks
        }
      },
      {
        name: '二阶导数 APG (标准化)',
        type: 'line',
        yAxisIndex: 1,
        data: data.apg,
        smooth: true,
        symbol: 'none',
        lineStyle: { color: '#A78BFA', width: 2, type: 'dashed' },
        markPoint: {
          symbol: 'circle',
          symbolSize: 10,
          label: {
            show: true,
            position: 'top',
            color: '#fff',
            fontSize: 10,
            formatter: '{b}'
          },
          data: apgMarks.map((m: any, i: number) => {
            const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'];
            return {
              ...m,
              itemStyle: { color: colors[i] }
            };
          })
        }
      }
    ]
  };

  echartInstance.setOption(option);
};

watch(() => props.morphologyData, () => {
  renderChart();
}, { deep: true });

onMounted(() => {
  renderChart();
  
  // 监听窗口大小改变或组件显示状态从而调整 ECharts 尺寸
  const resizeObserver = new ResizeObserver(() => {
    if (echartInstance) {
      echartInstance.resize();
    }
  });
  
  if (chartRef.value) {
    resizeObserver.observe(chartRef.value);
  }
});

onUnmounted(() => {
  if (echartInstance) {
    echartInstance.dispose();
  }
});
</script>

<style scoped>
.morphology-container {
  padding: 24px 32px;
  height: 100%;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  gap: 24px;
  background-color: transparent;
  color: #E2E8F0;
}

.morphology-header h2 {
  font-size: 1.5rem;
  color: #F8FAFC;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.morphology-header p {
  color: #94A3B8;
  margin: 0;
  font-size: 0.95rem;
}

.charts-card {
  background: rgba(30, 41, 59, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 20px;
  flex: 1;
  min-height: 450px;
}

.echarts-main {
  width: 100%;
  height: 100%;
}

.metrics-card {
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 24px;
}

.metrics-card h3 {
  margin: 0 0 16px 0;
  font-size: 1.1rem;
  color: #F8FAFC;
  border-left: 4px solid #38BDF8;
  padding-left: 12px;
}

.table-wrapper {
  overflow-x: auto;
}

.metrics-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.metrics-table th {
  padding: 12px 16px;
  color: #94A3B8;
  font-weight: 500;
  font-size: 0.9rem;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  background: rgba(0,0,0,0.2);
}

.metrics-table td {
  padding: 14px 16px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  font-size: 0.95rem;
}

.metrics-table tbody tr:hover {
  background: rgba(255,255,255,0.02);
}

.metrics-table .value {
  font-family: 'JetBrains Mono', Consolas, monospace;
}

.metrics-table .highlight {
  color: #38BDF8;
  font-weight: 600;
}

.badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
}

.badge.normal {
  background: rgba(16, 185, 129, 0.15);
  color: #10B981;
}

.badge.warning {
  background: rgba(245, 158, 11, 0.15);
  color: #F59E0B;
}
</style>
const fs = require('fs');
const path = '/home/cc/workspace/ppg_web/frontend/src/components/PPGAnalyzer.vue';

let content = fs.readFileSync(path, 'utf-8');

const newStyles = `
/* Ant Design 模块化 Tabs 样式 (深色科技风) */
.ant-tabs {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  margin-top: 5px;
}
.ant-tabs-nav {
  display: flex;
  border-bottom: 1px solid #1E293B;
  margin-bottom: 15px;
  gap: 30px;
  padding: 0 10px;
  flex-shrink: 0;
}
.ant-tabs-tab {
  padding: 10px 0;
  cursor: pointer;
  color: #94A3B8;
  font-size: 0.95rem;
  font-weight: 500;
  transition: all 0.3s;
  position: relative;
}
.ant-tabs-tab:hover {
  color: #E2E8F0;
}
.ant-tabs-tab-active {
  color: #38BDF8;
}
.ant-tabs-tab-active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background-color: #38BDF8;
  box-shadow: 0 0 8px rgba(56, 189, 248, 0.6);
}

/* Tabs 内容区流式容器 */
.ant-tabs-content {
  flex: 1;
  position: relative;
  overflow: hidden;
}
.tab-pane {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 15px;
  animation: fadeIn 0.4s ease-in-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 各种排版布局类型 */
.dual-layout {
  flex-direction: row;
}
.dual-layout .chart-card {
  flex: 1;
  width: 50%;
}
.ratio-layout {
  flex-direction: row;
}
.apg-main { flex: 2; }
.gauge-side { flex: 1; }

.list-layout {
  flex-direction: column;
}
.header-chart { flex: 1; min-height: 200px; }
.data-table-container {
  flex: 1;
  background: #111827;
  border: 1px solid #1F2937;
  border-radius: 8px;
  overflow: auto;
}
.ant-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  color: #CBD5E1;
}
.ant-table th {
  background: #1F2937;
  padding: 12px 15px;
  font-weight: 600;
  color: #9CA3AF;
  font-size: 0.85rem;
  border-bottom: 2px solid #334155;
}
.ant-table td {
  padding: 12px 15px;
  border-bottom: 1px solid #1E293B;
  font-size: 0.85rem;
}
.table-empty td {
  text-align: center;
  color: #64748B;
  padding: 30px;
}
`;

content = content.replace(/\/\* 核心图表区：利用 flex 使所有卡片贴合剩余屏幕空间 \*\/[\s\S]*?\.sub-charts \{[\s\S]*?\}/, newStyles);
fs.writeFileSync(path, content, 'utf-8');
console.log('Styles updated');

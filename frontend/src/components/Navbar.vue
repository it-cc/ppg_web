<template>
  <nav :class="['kunpeng-navbar', { 'scrolled': isScrolled }]">
    <div class="nav-container">
      <!-- 左侧：Logo 和名称 -->
      <div class="nav-left">
        <div class="logo-box">
          <svg class="logo-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <span class="brand-name">PPG Vision</span>
      </div>

      <!-- 中间：主菜单 -->
      <div class="nav-center hidden-mobile">
        <a v-for="link in navLinks" :key="link.name" :href="link.href" class="nav-link">
          {{ link.name }}
          <span class="hover-underline"></span>
        </a>
      </div>

      <!-- 右侧：搜索框、通知、头像 -->
      <div class="nav-right hidden-mobile">
        <div class="search-box text-box">
          <svg class="search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" placeholder="搜索..." class="search-input" />
        </div>

        <button class="icon-btn notification-btn">
          <span class="notif-dot"></span>
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>

        <button class="avatar-btn">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=1e293b" alt="User avatar" class="avatar-img" />
        </button>
      </div>

      <!-- 移动端汉堡菜单按钮 -->
      <div class="mobile-toggle">
        <button @click="isMobileMenuOpen = !isMobileMenuOpen" class="icon-btn">
          <svg v-if="!isMobileMenuOpen" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <svg v-else fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- 移动端下拉菜单 -->
    <div :class="['mobile-menu', { 'open': isMobileMenuOpen }]">
      <div class="mobile-menu-content">
        <a v-for="link in navLinks" :key="link.name" :href="link.href" class="mobile-link">
          {{ link.name }}
        </a>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const isScrolled = ref(false);
const isMobileMenuOpen = ref(false);

const navLinks = [
  { name: '实时监测', href: '#' },
  { name: '波形分析', href: '#' },
  { name: '深层指标', href: '#' },
  { name: '健康报告', href: '#' },
  { name: '数据管理', href: '#' },
];

const handleScroll = () => {
  isScrolled.value = window.scrollY > 20;
};

onMounted(() => {
  window.addEventListener('scroll', handleScroll);
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<style scoped>
/* 华为鲲鹏风格顶部常驻导航栏 */
.kunpeng-navbar {
  position: sticky;
  top: 0;
  z-index: 50;
  width: 100%;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: rgba(15, 23, 42, 0.7); /* 深色背景 #0f172a */
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-bottom: 1px solid transparent;
  color: #cbd5e1;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

.kunpeng-navbar.scrolled {
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(51, 65, 85, 0.8);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
}

.nav-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
}

/* 左侧 Logo */
.nav-left {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  flex-shrink: 0;
}
.logo-box {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: linear-gradient(135deg, #3b82f6, #4f46e5);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}
.logo-icon {
  width: 20px;
  height: 20px;
  color: #fff;
}
.brand-name {
  color: #fff;
  font-weight: 700;
  font-size: 1.125rem;
  letter-spacing: 0.05em;
}

/* 中间导航链接 */
.nav-center {
  display: flex;
  align-items: center;
  gap: 4px;
}
.nav-link {
  position: relative;
  padding: 8px 16px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #cbd5e1;
  text-decoration: none;
  transition: color 0.3s ease;
}
.nav-link:hover {
  color: #fff;
}
/* 悬浮底边高亮 */
.hover-underline {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: #3b82f6;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.nav-link:hover .hover-underline {
  transform: scaleX(1);
}

/* 右侧工具栏 */
.nav-right {
  display: flex;
  align-items: center;
  gap: 20px;
}
.search-box {
  position: relative;
  display: flex;
  align-items: center;
}
.search-icon {
  position: absolute;
  left: 12px;
  width: 16px;
  height: 16px;
  color: #94a3b8;
  pointer-events: none;
  transition: color 0.3s;
}
.search-box:focus-within .search-icon {
  color: #3b82f6;
}
.search-input {
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid #334155;
  color: #e2e8f0;
  font-size: 0.875rem;
  border-radius: 9999px;
  padding: 6px 16px 6px 36px;
  width: 180px;
  outline: none;
  transition: all 0.3s ease;
}
.search-input:focus {
  width: 240px;
  background: #1e293b;
  border-color: #3b82f6;
  box-shadow: 0 0 0 1px #3b82f6;
}
.search-input::placeholder {
  color: #64748b;
}

.icon-btn {
  position: relative;
  background: transparent;
  border: none;
  padding: 4px;
  border-radius: 9999px;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.icon-btn svg {
  width: 24px;
  height: 24px;
}
.icon-btn:hover {
  color: #fff;
  background: #1e293b;
}
.notif-dot {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 8px;
  height: 8px;
  background-color: #ef4444;
  border-radius: 50%;
  border: 2px solid #0f172a;
}

.avatar-btn {
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  border-radius: 50%;
  outline: none;
  transition: box-shadow 0.3s;
}
.avatar-btn:focus {
  box-shadow: 0 0 0 2px #0f172a, 0 0 0 4px #3b82f6;
}
.avatar-img {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid #334155;
}

/* 移动端 */
.hidden-mobile {
  display: flex;
}
.mobile-toggle {
  display: none;
}
.mobile-menu {
  display: none;
  overflow: hidden;
  max-height: 0;
  opacity: 0;
  transition: all 0.3s ease-in-out;
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(12px);
  border-top: 1px solid #1e293b;
  position: absolute;
  top: 64px;
  left: 0;
  width: 100%;
}
.mobile-menu.open {
  max-height: 400px;
  opacity: 1;
}
.mobile-menu-content {
  padding: 10px 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.mobile-link {
  display: block;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  color: #cbd5e1;
  text-decoration: none;
  transition: all 0.2s;
}
.mobile-link:hover {
  color: #fff;
  background: #1e293b;
}

@media (max-width: 768px) {
  .hidden-mobile {
    display: none;
  }
  .mobile-toggle {
    display: flex;
  }
  .mobile-menu {
    display: block;
  }
}
</style>
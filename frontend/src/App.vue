<script setup lang="ts">
import PPGAnalyzer from './components/PPGAnalyzer.vue';
import Navbar from './components/Navbar.vue';
</script>

<template>
  <div class="app-layout">
    <Navbar />
    <div class="main-wrapper">
      <PPGAnalyzer />
    </div>
  </div>
</template>

<style>
body, html {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  background-color: #0B0E14; /* 极暗科技感背景 */
  color: #E2E8F0;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  overflow: hidden;
}

#app {
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.app-layout {
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
}

.main-wrapper {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

* {
  box-sizing: border-box;
}
</style>

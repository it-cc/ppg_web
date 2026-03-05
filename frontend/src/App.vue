<script setup lang="ts">
import PPGAnalyzer from './components/PPGAnalyzer.vue';
</script>

<template>
  <PPGAnalyzer />
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
  justify-content: center;
  align-items: center;
}

* {
  box-sizing: border-box;
}
</style>

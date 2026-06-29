<script setup lang="ts">
import { NConfigProvider, NMessageProvider } from 'naive-ui';
</script>

<template>
  <!-- 全局 Naive UI 配置和消息容器，后续主题和暗色模式会在这里集中接入。 -->
  <NConfigProvider>
    <NMessageProvider>
      <RouterView />
    </NMessageProvider>
  </NConfigProvider>
</template>

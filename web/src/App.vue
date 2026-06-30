<script setup lang="ts">
import { NConfigProvider, NMessageProvider } from 'naive-ui';
import { useThemeScheme } from '@/theme/use-theme-scheme';

const { activeThemeOverrides } = useThemeScheme();
</script>

<template>
  <!-- 全局 Naive UI 配置和消息容器，主题覆盖变量从统一主题方案中读取。 -->
  <NConfigProvider :theme-overrides="activeThemeOverrides">
    <NMessageProvider>
      <RouterView />
    </NMessageProvider>
  </NConfigProvider>
</template>

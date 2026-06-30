<script setup lang="ts">
import { computed } from 'vue';
import { NConfigProvider, NMessageProvider, darkTheme } from 'naive-ui';
import { useThemeScheme } from '@/theme/use-theme-scheme';

const { activeThemeKey, activeThemeOverrides } = useThemeScheme();

/** 暗色主题使用 Naive UI 内置 darkTheme，保证弹窗、抽屉、输入框等组件颜色一致。 */
const activeNaiveTheme = computed(() => (activeThemeKey.value === 'dark-tech' ? darkTheme : undefined));
</script>

<template>
  <!-- 全局 Naive UI 配置和消息容器，主题覆盖变量从统一主题方案中读取。 -->
  <NConfigProvider :theme="activeNaiveTheme" :theme-overrides="activeThemeOverrides">
    <NMessageProvider>
      <RouterView />
    </NMessageProvider>
  </NConfigProvider>
</template>

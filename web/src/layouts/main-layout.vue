<script setup lang="ts">
import { h } from 'vue';
import type { Component } from 'vue';
import { NIcon } from 'naive-ui';
import type { MenuOption } from 'naive-ui';
import { GitBranch, LayoutDashboard, Settings, TableProperties } from 'lucide-vue-next';
import { useThemeScheme } from '@/theme/use-theme-scheme';

const { activeThemeKey, themeOptions } = useThemeScheme();

/**
 * 将 lucide 图标包装为 Naive UI 菜单可识别的渲染函数。
 *
 * @param icon Vue 图标组件
 * @returns Naive UI 菜单图标渲染函数
 */
function renderIcon(icon: Component) {
  return () => h(NIcon, null, { default: () => h(icon) });
}

/**
 * 阶段 0 的静态菜单。
 *
 * 后续会替换为后端返回的平台菜单和应用菜单。
 */
const menuOptions: MenuOption[] = [
  { label: '工作台', key: 'dashboard', icon: renderIcon(LayoutDashboard) },
  { label: '应用管理', key: 'app', icon: renderIcon(TableProperties), disabled: true },
  { label: '流程管理', key: 'workflow', icon: renderIcon(GitBranch), disabled: true },
  { label: '系统管理', key: 'system', icon: renderIcon(Settings), disabled: true }
];
</script>

<template>
  <!-- 主平台统一布局：左侧菜单、顶部标题和中间业务路由出口。 -->
  <NLayout has-sider class="app-shell">
    <NLayoutSider bordered collapse-mode="width" :collapsed-width="64" :width="232">
      <div class="brand">smart-code</div>
      <NMenu :options="menuOptions" :default-value="'dashboard'" />
    </NLayoutSider>
    <NLayout>
      <NLayoutHeader bordered class="app-header">
        <span>低代码 SaaS 工作流平台</span>
        <NSelect
          v-model:value="activeThemeKey"
          class="theme-select"
          size="small"
          :options="themeOptions"
          aria-label="后台主题方案"
        />
      </NLayoutHeader>
      <NLayoutContent class="app-content">
        <RouterView />
      </NLayoutContent>
    </NLayout>
  </NLayout>
</template>

<script setup lang="ts">
import { computed, h, ref, watch } from 'vue';
import type { Component } from 'vue';
import { NIcon } from 'naive-ui';
import type { MenuOption } from 'naive-ui';
import {
  Bell,
  GitBranch,
  Languages,
  LayoutDashboard,
  Maximize,
  Moon,
  Palette,
  RefreshCw,
  Search,
  Settings,
  Sun,
  TableProperties,
  UserCircle
} from 'lucide-vue-next';
import { useThemeScheme } from '@/theme/use-theme-scheme';
import type { ThemeSchemeKey } from '@/theme/theme-schemes';
import { StorageKey } from '@/constants/storage-keys';

type LayoutMode = 'side' | 'top';

const { activeThemeKey, activeThemeScheme, themeOptions, setThemeScheme } = useThemeScheme();

/** 全局搜索弹窗是否显示。 */
const searchModalVisible = ref(false);
/** 主题配置抽屉是否显示。 */
const themeDrawerVisible = ref(false);
/** 主题配置抽屉当前分组。 */
const themeDrawerTab = ref('appearance');
/** 全局搜索关键字。 */
const searchKeyword = ref('');
/** 当前语言展示值，阶段 0 先作为前端偏好占位。 */
const currentLanguage = ref('中文');
/** 是否处于浏览器全屏状态。 */
const fullscreenActive = ref(false);
/** 是否显示标签栏，后续会和个人偏好同步。 */
const tabVisible = ref(true);
/** 是否启用标签页缓存，后续会和个人偏好同步。 */
const tabCacheEnabled = ref(true);
/** 是否显示多语言按钮，后续会和个人偏好同步。 */
const multilingualVisible = ref(true);
/** 是否显示全局搜索按钮，后续会和个人偏好同步。 */
const globalSearchVisible = ref(true);
/** 是否显示水印，阶段 0 先保留配置入口。 */
const watermarkVisible = ref(false);
/** 当前布局模式，阶段 0 先保存到本地，后续同步到个人偏好。 */
const layoutMode = ref<LayoutMode>(loadStoredLayoutMode());

/**
 * 顶部消息提醒数据，后续会替换为消息中心接口返回。
 */
const notificationItems = [
  { title: '流程待办提醒', content: '你有 4 条审批任务需要处理' },
  { title: '系统通知', content: '阶段 0 工程骨架已完成验收' },
  { title: '消息中心', content: '消息提醒入口已预留，可接入站内信' }
];

/**
 * 全局搜索候选项，后续会从动态路由和权限菜单生成。
 */
const searchMenus = [
  { title: '工作台', path: '/', description: '阶段 0 初始化状态和服务健康检查' },
  { title: '应用管理', path: '/app', description: '低代码应用、菜单和发布配置' },
  { title: '流程管理', path: '/workflow', description: '流程设计、任务中心和审批记录' },
  { title: '系统管理', path: '/system', description: '租户、用户、角色和平台权限' }
];

/**
 * 主题预设卡片，和全局主题方案保持同步。
 */
const themePresetCards = computed(() =>
  themeOptions.map(option => ({
    key: option.value,
    label: option.label,
    description: option.value === 'dark-tech' ? '适合夜间办公和监控场景' : '适合日常后台管理和流程操作'
  }))
);

/** 当前主题按钮图标，暗色主题显示月亮，否则显示太阳。 */
const themeModeIcon = computed(() => (activeThemeKey.value === 'dark-tech' ? Moon : Sun));

/** 当前主布局样式类，用于切换左侧菜单和顶部菜单。 */
const shellClass = computed(() => ({
  'app-shell': true,
  'layout-side': layoutMode.value === 'side',
  'layout-top': layoutMode.value === 'top'
}));

/** 根据关键字过滤全局搜索结果。 */
const filteredSearchMenus = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase();
  if (!keyword) {
    return searchMenus;
  }

  return searchMenus.filter(item => item.title.toLowerCase().includes(keyword));
});

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
 * 读取本地布局偏好。
 *
 * @returns 合法布局模式；不存在或非法时返回左侧菜单模式
 */
function loadStoredLayoutMode(): LayoutMode {
  const storedMode = localStorage.getItem(StorageKey.LAYOUT_MODE);
  return storedMode === 'top' ? 'top' : 'side';
}

/**
 * 切换布局模式。
 *
 * @param mode 目标布局模式
 */
function setLayoutMode(mode: LayoutMode) {
  layoutMode.value = mode;
}

/**
 * 切换浏览器全屏。
 *
 * @throws DOMException 当浏览器拒绝全屏请求时抛出
 */
async function toggleFullscreen() {
  if (document.fullscreenElement) {
    await document.exitFullscreen();
    fullscreenActive.value = false;
    return;
  }

  await document.documentElement.requestFullscreen();
  fullscreenActive.value = true;
}

/**
 * 在常规主题和暗夜主题之间切换。
 */
function toggleThemeMode() {
  setThemeScheme(activeThemeKey.value === 'dark-tech' ? 'deep-blue' : 'dark-tech');
}

/**
 * 应用指定主题预设。
 *
 * @param key 主题编码
 */
function applyThemePreset(key: ThemeSchemeKey) {
  setThemeScheme(key);
}

/**
 * 关闭全局搜索弹窗并清空关键字。
 */
function closeSearchModal() {
  searchModalVisible.value = false;
  searchKeyword.value = '';
}

/**
 * 刷新当前页面，阶段 0 使用浏览器刷新，后续可替换为路由页签刷新。
 */
function reloadPage() {
  window.location.reload();
}

watch(layoutMode, mode => {
  localStorage.setItem(StorageKey.LAYOUT_MODE, mode);
});

/**
 * 阶段 0 的静态菜单。
 *
 * 后续会替换为后端返回的平台菜单和应用菜单。
 */
const menuOptions: MenuOption[] = [
  { label: '工作台', key: 'dashboard', icon: renderIcon(LayoutDashboard) },
  { label: '应用管理', key: 'app', icon: renderIcon(TableProperties) },
  { label: '流程管理', key: 'workflow', icon: renderIcon(GitBranch) },
  { label: '系统管理', key: 'system', icon: renderIcon(Settings) }
];
</script>

<template>
  <!-- 主平台统一布局：左侧菜单、顶部标题和中间业务路由出口。 -->
  <NLayout :has-sider="layoutMode === 'side'" :class="shellClass">
    <NLayoutSider v-if="layoutMode === 'side'" bordered collapse-mode="width" :collapsed-width="64" :width="232">
      <div class="brand">smart-code</div>
      <NMenu :options="menuOptions" :default-value="'dashboard'" />
    </NLayoutSider>
    <NLayout>
      <NLayoutHeader bordered class="app-header">
        <div class="header-left">
          <span v-if="layoutMode === 'top'" class="brand top-brand">smart-code</span>
          <span class="header-title">低代码 SaaS 工作流平台</span>
          <NMenu
            v-if="layoutMode === 'top'"
            mode="horizontal"
            :options="menuOptions"
            :default-value="'dashboard'"
            class="top-menu"
          />
        </div>
        <div class="header-actions">
          <NTooltip v-if="globalSearchVisible">
            <template #trigger>
              <NButton quaternary circle aria-label="全局搜索" @click="searchModalVisible = true">
                <template #icon>
                  <component :is="Search" />
                </template>
              </NButton>
            </template>
            全局搜索
          </NTooltip>

          <NTooltip>
            <template #trigger>
              <NButton quaternary circle aria-label="全屏" @click="toggleFullscreen">
                <template #icon>
                  <component :is="Maximize" />
                </template>
              </NButton>
            </template>
            {{ fullscreenActive ? '退出全屏' : '进入全屏' }}
          </NTooltip>

          <NPopover v-if="multilingualVisible" trigger="click" placement="bottom">
            <template #trigger>
              <NButton quaternary circle aria-label="切换语言">
                <template #icon>
                  <component :is="Languages" />
                </template>
              </NButton>
            </template>
            <NList hoverable clickable class="language-menu">
              <NListItem @click="currentLanguage = '中文'">中文</NListItem>
              <NListItem @click="currentLanguage = 'English'">English</NListItem>
            </NList>
          </NPopover>

          <NTooltip>
            <template #trigger>
              <NButton quaternary circle aria-label="主题模式" @click="toggleThemeMode">
                <template #icon>
                  <component :is="themeModeIcon" />
                </template>
              </NButton>
            </template>
            主题模式：{{ activeThemeScheme.label }}
          </NTooltip>

          <NTooltip>
            <template #trigger>
              <NButton quaternary circle aria-label="主题配置" @click="themeDrawerVisible = true">
                <template #icon>
                  <component :is="Palette" />
                </template>
              </NButton>
            </template>
            主题配置
          </NTooltip>

          <NPopover trigger="click" placement="bottom-end">
            <template #trigger>
              <NBadge :value="12" :max="99">
                <NButton quaternary circle aria-label="消息提醒">
                  <template #icon>
                    <component :is="Bell" />
                  </template>
                </NButton>
              </NBadge>
            </template>
            <NList class="notification-list">
              <NListItem v-for="item in notificationItems" :key="item.title">
                <NThing :title="item.title" :description="item.content" />
              </NListItem>
            </NList>
          </NPopover>

          <NTooltip>
            <template #trigger>
              <NButton quaternary circle aria-label="刷新页面" @click="reloadPage">
                <template #icon>
                  <component :is="RefreshCw" />
                </template>
              </NButton>
            </template>
            刷新页面
          </NTooltip>

          <NButton quaternary class="user-entry" aria-label="用户中心">
            <template #icon>
              <component :is="UserCircle" />
            </template>
            管理员
          </NButton>
        </div>
      </NLayoutHeader>
      <NLayoutContent class="app-content">
        <RouterView />
      </NLayoutContent>
    </NLayout>

    <NDrawer v-model:show="themeDrawerVisible" :width="420" placement="right">
      <NDrawerContent title="主题配置" closable>
        <NSpace vertical size="large">
          <NAlert type="info" :show-icon="false">
            当前主题偏好会先保存到本地缓存，后续登录后同步到个人偏好。
          </NAlert>

          <NTabs v-model:value="themeDrawerTab" type="segment" animated>
            <NTabPane name="appearance" tab="外观">
              <NSpace vertical size="large">
                <NDivider title-placement="center">主题模式</NDivider>
                <NRadioGroup v-model:value="activeThemeKey" name="theme-mode">
                  <NSpace>
                    <NRadioButton value="deep-blue">深海蓝</NRadioButton>
                    <NRadioButton value="cyber-cyan">赛博青</NRadioButton>
                    <NRadioButton value="dark-tech">暗夜黑</NRadioButton>
                  </NSpace>
                </NRadioGroup>
              </NSpace>
            </NTabPane>

            <NTabPane name="layout" tab="布局">
              <NSpace vertical size="large">
                <NDivider title-placement="center">布局模式</NDivider>
                <div class="layout-mode-grid">
                  <button
                    class="layout-mode-card"
                    :class="{ active: layoutMode === 'side' }"
                    type="button"
                    @click="setLayoutMode('side')"
                  >
                    <span class="layout-sider" />
                    <span class="layout-main" />
                    <strong>左侧菜单模式</strong>
                  </button>
                  <button
                    class="layout-mode-card"
                    :class="{ active: layoutMode === 'top' }"
                    type="button"
                    @click="setLayoutMode('top')"
                  >
                    <span class="layout-preview-top" />
                    <span class="layout-main full" />
                    <strong>顶部菜单模式</strong>
                  </button>
                </div>

                <NDivider title-placement="center">标签栏设置</NDivider>
                <div class="setting-row">
                  <span>显示标签栏</span>
                  <NSwitch v-model:value="tabVisible" />
                </div>
                <div class="setting-row">
                  <span>标签栏信息缓存</span>
                  <NSwitch v-model:value="tabCacheEnabled" />
                </div>
              </NSpace>
            </NTabPane>

            <NTabPane name="general" tab="通用">
              <NSpace vertical size="large">
                <NDivider title-placement="center">通用设置</NDivider>
                <div class="setting-row">
                  <span>显示多语言按钮</span>
                  <NSwitch v-model:value="multilingualVisible" />
                </div>
                <div class="setting-row">
                  <span>显示全局搜索按钮</span>
                  <NSwitch v-model:value="globalSearchVisible" />
                </div>

                <NDivider title-placement="center">水印设置</NDivider>
                <div class="setting-row">
                  <span>显示全屏水印</span>
                  <NSwitch v-model:value="watermarkVisible" />
                </div>
              </NSpace>
            </NTabPane>

            <NTabPane name="preset" tab="预设">
              <div class="theme-preset-list">
                <button
                  v-for="preset in themePresetCards"
                  :key="preset.key"
                  class="theme-preset-card"
                  :class="{ active: preset.key === activeThemeKey }"
                  type="button"
                  @click="applyThemePreset(preset.key)"
                >
                  <span class="preset-title">{{ preset.label }}</span>
                  <span class="preset-desc">{{ preset.description }}</span>
                  <span class="preset-swatches">
                    <span />
                    <span />
                    <span />
                  </span>
                </button>
              </div>
            </NTabPane>
          </NTabs>
        </NSpace>
      </NDrawerContent>
    </NDrawer>

    <NModal v-model:show="searchModalVisible" preset="card" :closable="false" class="global-search-modal">
      <NInput v-model:value="searchKeyword" clearable placeholder="搜索菜单、页面或功能">
        <template #prefix>
          <NIcon>
            <Search />
          </NIcon>
        </template>
      </NInput>

      <div class="search-result-list">
        <NEmpty v-if="filteredSearchMenus.length === 0" description="没有搜索结果" />
        <button
          v-for="item in filteredSearchMenus"
          v-else
          :key="item.path"
          class="search-result-item"
          type="button"
          @click="closeSearchModal"
        >
          <span>{{ item.title }}</span>
          <small>{{ item.description }}</small>
        </button>
      </div>

      <template #footer>
        <div class="search-footer">
          <span>Enter 确认</span>
          <span>Esc 关闭</span>
          <span>↑↓ 切换</span>
        </div>
      </template>
    </NModal>
  </NLayout>
</template>

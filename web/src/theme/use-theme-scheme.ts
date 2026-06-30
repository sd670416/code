import { computed, ref, watch } from 'vue';
import { StorageKey } from '@/constants/storage-keys';
import {
  DEFAULT_THEME_SCHEME,
  THEME_SCHEME_MAP,
  THEME_SCHEME_OPTIONS,
  type ThemeSchemeKey
} from './theme-schemes';

/**
 * 从本地缓存读取主题偏好。
 *
 * @returns 合法主题编码；不存在或非法时返回默认主题
 */
function loadStoredThemeKey(): ThemeSchemeKey {
  const storedThemeKey = localStorage.getItem(StorageKey.THEME_SCHEME);
  if (storedThemeKey && storedThemeKey in THEME_SCHEME_MAP) {
    return storedThemeKey as ThemeSchemeKey;
  }
  return DEFAULT_THEME_SCHEME;
}

/** 当前启用的主题编码，全局单例保证布局和 App 使用同一份状态。 */
const activeThemeKey = ref<ThemeSchemeKey>(loadStoredThemeKey());

/**
 * 后台主题组合式函数，集中管理主题选择、Naive UI 覆盖变量和 CSS data-theme。
 *
 * @returns 当前主题状态、主题选项和切换方法
 */
export function useThemeScheme() {
  /** 当前主题完整配置。 */
  const activeThemeScheme = computed(() => THEME_SCHEME_MAP[activeThemeKey.value]);
  /** 当前主题的 Naive UI 覆盖变量。 */
  const activeThemeOverrides = computed(() => activeThemeScheme.value.overrides);

  /**
   * 切换后台主题。
   *
   * @param key 目标主题编码
   */
  function setThemeScheme(key: ThemeSchemeKey) {
    activeThemeKey.value = key;
  }

  watch(
    activeThemeScheme,
    themeScheme => {
      document.documentElement.dataset.theme = themeScheme.dataTheme;
      localStorage.setItem(StorageKey.THEME_SCHEME, themeScheme.key);
    },
    { immediate: true }
  );

  /**
   * 后续登录态接入后端个人偏好接口时，在这里用服务端值覆盖本地缓存。
   *
   * @param key 服务端返回的主题编码
   */
  function applyUserPreferenceTheme(key: ThemeSchemeKey) {
    setThemeScheme(key);
  }

  return {
    activeThemeKey,
    activeThemeScheme,
    activeThemeOverrides,
    themeOptions: THEME_SCHEME_OPTIONS,
    setThemeScheme,
    applyUserPreferenceTheme
  };
}

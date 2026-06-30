import type { GlobalThemeOverrides } from 'naive-ui';

/**
 * 后台主题编码，作为全局固定取值集中管理。
 */
export type ThemeSchemeKey = 'deep-blue' | 'cyber-cyan';

/**
 * 后台主题方案定义。
 */
export interface ThemeScheme {
  /** 主题编码。 */
  key: ThemeSchemeKey;
  /** 主题名称，用于下拉切换展示。 */
  label: string;
  /** CSS data-theme 值，用于驱动自定义布局样式。 */
  dataTheme: string;
  /** Naive UI 主题覆盖变量。 */
  overrides: GlobalThemeOverrides;
}

/**
 * 默认主题，保持后台第一眼科技感和较好的长时间可读性。
 */
export const DEFAULT_THEME_SCHEME: ThemeSchemeKey = 'deep-blue';

/**
 * 可选主题下拉项。
 */
export const THEME_SCHEME_OPTIONS = [
  { label: '深海蓝', value: 'deep-blue' },
  { label: '赛博青', value: 'cyber-cyan' }
] satisfies Array<{ label: string; value: ThemeSchemeKey }>;

/**
 * 后台主题方案映射。
 *
 * 色彩要求：
 * - 深海蓝：适合默认后台管理，沉稳、清晰、科技感克制。
 * - 赛博青：适合工作流设计、监控大屏等更强调状态感的页面。
 */
export const THEME_SCHEME_MAP: Record<ThemeSchemeKey, ThemeScheme> = {
  'deep-blue': {
    key: 'deep-blue',
    label: '深海蓝',
    dataTheme: 'deep-blue',
    overrides: {
      common: {
        primaryColor: '#2563eb',
        primaryColorHover: '#3b82f6',
        primaryColorPressed: '#1d4ed8',
        primaryColorSuppl: '#60a5fa',
        borderRadius: '8px',
        fontWeightStrong: '700'
      },
      Card: {
        borderRadius: '8px',
        boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)'
      },
      Menu: {
        itemTextColorActive: '#dbeafe',
        itemIconColorActive: '#93c5fd',
        itemColorActive: 'rgba(37, 99, 235, 0.18)',
        itemColorActiveHover: 'rgba(37, 99, 235, 0.24)'
      }
    }
  },
  'cyber-cyan': {
    key: 'cyber-cyan',
    label: '赛博青',
    dataTheme: 'cyber-cyan',
    overrides: {
      common: {
        primaryColor: '#0891b2',
        primaryColorHover: '#06b6d4',
        primaryColorPressed: '#0e7490',
        primaryColorSuppl: '#67e8f9',
        borderRadius: '8px',
        fontWeightStrong: '700'
      },
      Card: {
        borderRadius: '8px',
        boxShadow: '0 10px 30px rgba(8, 145, 178, 0.1)'
      },
      Menu: {
        itemTextColorActive: '#cffafe',
        itemIconColorActive: '#67e8f9',
        itemColorActive: 'rgba(8, 145, 178, 0.2)',
        itemColorActiveHover: 'rgba(8, 145, 178, 0.28)'
      }
    }
  }
};

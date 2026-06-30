import type { GlobalThemeOverrides } from 'naive-ui';

/**
 * 后台主题编码，作为全局固定取值集中管理。
 */
export type ThemeSchemeKey = 'deep-blue' | 'cyber-cyan' | 'dark-tech';

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
  { label: '赛博青', value: 'cyber-cyan' },
  { label: '暗夜黑', value: 'dark-tech' }
] satisfies Array<{ label: string; value: ThemeSchemeKey }>;

/**
 * 后台主题方案映射。
 *
 * 色彩要求：
 * - 深海蓝：适合默认后台管理，沉稳、清晰、科技感克制。
 * - 赛博青：适合工作流设计、监控大屏等更强调状态感的页面。
 * - 暗夜黑：适合夜间办公、流程监控和大屏场景。
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
        itemTextColor: '#cbd5e1',
        itemIconColor: '#93a4bf',
        itemTextColorHover: '#f8fafc',
        itemIconColorHover: '#bfdbfe',
        itemTextColorActive: '#dbeafe',
        itemIconColorActive: '#93c5fd',
        itemColorHover: 'rgba(96, 165, 250, 0.12)',
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
        itemTextColor: '#c5e4ea',
        itemIconColor: '#8bd2dc',
        itemTextColorHover: '#f0fdff',
        itemIconColorHover: '#67e8f9',
        itemTextColorActive: '#cffafe',
        itemIconColorActive: '#67e8f9',
        itemColorHover: 'rgba(34, 211, 238, 0.13)',
        itemColorActive: 'rgba(8, 145, 178, 0.2)',
        itemColorActiveHover: 'rgba(8, 145, 178, 0.28)'
      }
    }
  },
  'dark-tech': {
    key: 'dark-tech',
    label: '暗夜黑',
    dataTheme: 'dark-tech',
    overrides: {
      common: {
        primaryColor: '#818cf8',
        primaryColorHover: '#a5b4fc',
        primaryColorPressed: '#6366f1',
        primaryColorSuppl: '#38bdf8',
        bodyColor: '#101114',
        cardColor: '#16181d',
        modalColor: '#181a20',
        popoverColor: '#1f222a',
        textColorBase: '#e5e7eb',
        textColor1: '#f8fafc',
        textColor2: '#cbd5e1',
        textColor3: '#94a3b8',
        borderColor: '#2d3340',
        dividerColor: '#2d3340',
        borderRadius: '8px',
        fontWeightStrong: '700'
      },
      Card: {
        color: '#16181d',
        borderColor: '#242936',
        borderRadius: '8px',
        boxShadow: '0 14px 40px rgba(0, 0, 0, 0.26)'
      },
      Menu: {
        itemTextColor: '#cbd5e1',
        itemIconColor: '#94a3b8',
        itemTextColorActive: '#e0e7ff',
        itemIconColorActive: '#a5b4fc',
        itemColorActive: 'rgba(99, 102, 241, 0.22)',
        itemColorActiveHover: 'rgba(99, 102, 241, 0.3)'
      }
    }
  }
};

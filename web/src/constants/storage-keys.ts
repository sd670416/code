/**
 * 浏览器本地存储 Key，集中管理避免在页面和组件里散落硬编码字符串。
 */
export const StorageKey = {
  /** 当前用户主题偏好，本地仅作为未接入后端偏好接口前的过渡缓存。 */
  THEME_SCHEME: 'smart-code:theme-scheme',
  /** 当前用户布局模式偏好，后续会同步到用户偏好接口。 */
  LAYOUT_MODE: 'smart-code:layout-mode'
} as const;

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import naive from 'naive-ui';
import App from './App.vue';
import { router } from './router';
import './styles/global.css';

/**
 * 前端应用启动入口，统一注册 Pinia、路由和 Naive UI。
 */
createApp(App).use(createPinia()).use(router).use(naive).mount('#app');

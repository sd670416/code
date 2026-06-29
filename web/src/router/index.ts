import { createRouter, createWebHistory } from 'vue-router';
import MainLayout from '@/layouts/main-layout.vue';
import DashboardView from '@/views/dashboard/index.vue';

/**
 * 主平台路由实例。
 *
 * 当前阶段只开放工作台，后续平台菜单和应用菜单会通过权限动态扩展。
 */
export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: MainLayout,
      children: [
        {
          path: '',
          name: 'dashboard',
          component: DashboardView
        }
      ]
    }
  ]
});

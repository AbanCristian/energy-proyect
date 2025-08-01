
import { createRouter, createWebHistory } from 'vue-router';
import DashboardView from '../views/DashboardView.vue';
import DeviceView from '../views/DeviceView.vue';
import DeviceActivityView from '@/views/DeviceActivityView.vue';
import LoginView from '../views/LoginView.vue';
import RegistroView from '../views/RegistroView.vue';

const routes = [
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { public: true }
  },
  {
    path: '/registro',
    name: 'registro',
    component: RegistroView,
    meta: { public: true }
  },
  {
    path: '/',
    name: 'dashboard',
    component: DashboardView
  },
  {
    path: '/devices',
    name: 'devices',
    component: DeviceView
  },
  {
    path: '/actividad-dispositivo',
    name: 'actividad-dispositivo',
    component: DeviceActivityView,
    props: true
  },

];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

// Guard global para proteger rutas
import { useAuthStore } from '../stores/auth';
router.beforeEach((to, from, next) => {
  const auth = useAuthStore();
  if (!to.meta.public && !auth.isAuthenticated) {
    return next('/login');
  }
  next();
});

export default router;

import { createRouter, createWebHashHistory } from 'vue-router'

const OverlayView = () => import('../views/OverlayView.vue')
const ControlPanel = () => import('../views/ControlPanel.vue')

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/overlay' },
    { path: '/overlay', component: OverlayView },
    { path: '/control', component: ControlPanel },
  ],
})

export default router


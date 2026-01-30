import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes: RouteRecordRaw[] = [
    {
        path: '/',
        name: 'Home',
        component: () => import('../pages/HomePage.vue')
    },
    {
        path: '/track/:artist/:track',
        name: 'TrackDetails',
        component: () => import('../pages/TrackDetailsPage.vue')
    },
    {
        path: '/portfolio',
        name: 'Portfolio',
        component: () => import('../pages/PortfolioPage.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/auth',
        name: 'Auth',
        component: () => import('../pages/AuthPage.vue')
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

router.beforeEach((to, from, next) => {
    const authStore = useAuthStore()
    
    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
        next('/auth')
    } else if (to.path === '/auth' && authStore.isAuthenticated) {
        next('/portfolio')
    } else {
        next()
    }
})

export default router

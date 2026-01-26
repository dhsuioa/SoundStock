import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'

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
        component: () => import('../pages/PortfolioPage.vue')
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router

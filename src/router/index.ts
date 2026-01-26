import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            name: 'home',
            redirect: '/clients',
        },
        {
            path: '/clients',
            name: 'clients',
            component: () => import('@/views/ClientsView.vue'),
        },
        {
            path: '/clients/:id',
            name: 'client-detail',
            component: () => import('@/views/ClientDetailView.vue'),
        },
        {
            path: '/wallets/:id',
            name: 'wallet-detail',
            component: () => import('@/views/WalletDetailView.vue'),
        },
        {
            path: '/reports',
            name: 'reports',
            component: () => import('@/views/ReportsView.vue'),
        },
        {
            path: '/tags',
            name: 'tags',
            component: () => import('@/views/TagsView.vue'),
        },
    ],
});

export default router;

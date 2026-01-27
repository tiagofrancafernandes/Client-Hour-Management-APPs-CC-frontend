import { createRouter, createWebHistory } from 'vue-router';
import type { RouteLocationNormalized, NavigationGuardNext } from 'vue-router';
import { useAuth } from '@/composables/useAuth';

const APP_TITLE = 'Hours Ledger';

declare module 'vue-router' {
    interface RouteMeta {
        title?: string;
        requiresAuth?: boolean;
        requiresGuest?: boolean;
        permissions?: string[];
    }
}

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/login',
            name: 'login',
            component: () => import('@/views/LoginView.vue'),
            meta: {
                title: 'Login',
                requiresGuest: true,
            },
        },
        {
            path: '/',
            name: 'home',
            redirect: '/clients',
        },
        {
            path: '/clients',
            name: 'clients',
            component: () => import('@/views/ClientsView.vue'),
            meta: {
                title: 'Clients',
                requiresAuth: true,
            },
        },
        {
            path: '/clients/:id',
            name: 'client-detail',
            component: () => import('@/views/ClientDetailView.vue'),
            meta: {
                title: 'Client Details',
                requiresAuth: true,
            },
        },
        {
            path: '/wallets/:id',
            name: 'wallet-detail',
            component: () => import('@/views/WalletDetailView.vue'),
            meta: {
                title: 'Wallet Details',
                requiresAuth: true,
            },
        },
        {
            path: '/reports',
            name: 'reports',
            component: () => import('@/views/ReportsView.vue'),
            meta: {
                title: 'Reports',
                requiresAuth: true,
            },
        },
        {
            path: '/tags',
            name: 'tags',
            component: () => import('@/views/TagsView.vue'),
            meta: {
                title: 'Tags',
                requiresAuth: true,
            },
        },
    ],
});

router.beforeEach(async (to: RouteLocationNormalized, _from: RouteLocationNormalized, next: NavigationGuardNext) => {
    const auth = useAuth();

    if (!auth.initialized.value) {
        await auth.initialize();
    }

    const isAuthenticated = auth.isAuthenticated.value;

    if (to.meta.requiresAuth && !isAuthenticated) {
        next({
            name: 'login',
            query: { redirect: to.fullPath },
        });

        return;
    }

    if (to.meta.requiresGuest && isAuthenticated) {
        next({ name: 'home' });

        return;
    }

    if (to.meta.permissions && to.meta.permissions.length > 0) {
        const hasPermission = auth.hasAnyPermission(to.meta.permissions);

        if (!hasPermission) {
            next({ name: 'home' });

            return;
        }
    }

    next();
});

router.afterEach((to: RouteLocationNormalized) => {
    const pageTitle = to.meta.title;

    if (pageTitle) {
        document.title = `${pageTitle} - ${APP_TITLE}`;
    } else {
        document.title = APP_TITLE;
    }
});

export default router;

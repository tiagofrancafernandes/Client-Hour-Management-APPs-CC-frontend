<script setup lang="ts">
import { RouterLink, RouterView, useRouter, useRoute } from 'vue-router';
import { computed } from 'vue';
import { useAuth } from '@/composables/useAuth';
import { usePermissions } from '@/composables/usePermissions';

const router = useRouter();
const route = useRoute();
const { user, isAuthenticated, logout, loading } = useAuth();
const { canViewClients, canViewReports, canViewTags } = usePermissions();

const showNavigation = computed(() => {
    return isAuthenticated.value && route.name !== 'login';
});

async function handleLogout() {
    await logout();
    router.push({ name: 'login' });
}
</script>

<template>
    <div class="min-h-screen bg-gray-100">
        <nav v-if="showNavigation" class="bg-white shadow">
            <div class="container mx-auto px-4">
                <div class="flex h-16 items-center justify-between">
                    <div class="flex items-center gap-8">
                        <span class="text-xl font-bold text-gray-900">Hours Ledger</span>
                        <div class="flex gap-4">
                            <RouterLink
                                v-if="canViewClients"
                                to="/clients"
                                class="text-gray-600 hover:text-gray-900"
                                active-class="text-blue-600 font-medium"
                            >
                                Clients
                            </RouterLink>
                            <RouterLink
                                v-if="canViewReports"
                                to="/reports"
                                class="text-gray-600 hover:text-gray-900"
                                active-class="text-blue-600 font-medium"
                            >
                                Reports
                            </RouterLink>
                            <RouterLink
                                v-if="canViewTags"
                                to="/tags"
                                class="text-gray-600 hover:text-gray-900"
                                active-class="text-blue-600 font-medium"
                            >
                                Tags
                            </RouterLink>
                        </div>
                    </div>

                    <div class="flex items-center gap-4">
                        <span class="text-sm text-gray-600">{{ user?.name }}</span>
                        <button
                            :disabled="loading"
                            class="rounded-lg bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                            @click="handleLogout"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </nav>

        <main>
            <RouterView />
        </main>
    </div>
</template>

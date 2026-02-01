<script setup lang="ts">
import { RouterLink, RouterView, useRouter, useRoute } from 'vue-router';
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useAuth } from '@/composables/useAuth';
import { usePermissions } from '@/composables/usePermissions';
import { useTimerStore } from '@/stores/timer';
import { useConfirm } from '@/composables/useConfirm';
import TimerFloatingBalloon from '@/components/TimerFloatingBalloon.vue';
import TimerActiveModal from '@/components/TimerActiveModal.vue';
import ConfirmModal from '@/components/ConfirmModal.vue';

const router = useRouter();
const route = useRoute();
const { user, isAuthenticated, logout, loading } = useAuth();
const { canViewClients, canViewReports, canViewTags } = usePermissions();
const timerStore = useTimerStore();
const eventTimerStore = ref(null);
const { state: confirmState, handleConfirm, handleCancel } = useConfirm();

const showUserMenu = ref(false);
const showTimerModal = ref(false);
const userMenuRef = ref<HTMLElement | null>(null);
const canViewTimers = computed(() => {
    return (
        isAuthenticated.value &&
        (usePermissions().hasPermission('timer.view') || usePermissions().hasPermission('timer.view_any'))
    );
});

const canViewImports = computed(() => {
    return (
        isAuthenticated.value &&
        (usePermissions().hasPermission('import.view') || usePermissions().hasPermission('import.view_any'))
    );
});

const showNavigation = computed(() => {
    return isAuthenticated.value && route.name !== 'login';
});

function toggleUserMenu() {
    showUserMenu.value = !showUserMenu.value;
}

function closeUserMenu() {
    showUserMenu.value = false;
}

function handleClickOutside(event: MouseEvent) {
    if (userMenuRef.value && !userMenuRef.value.contains(event.target as Node)) {
        closeUserMenu();
    }
}

function goToProfile() {
    closeUserMenu();
    router.push({ name: 'profile' });
}

async function handleLogout() {
    closeUserMenu();
    await logout();
    router.push({ name: 'login' });
}

function openTimerModal(eventData: any) {
    console.log('eventData', eventData);
    eventTimerStore.value = eventData?.timerStore || null;
    showTimerModal.value = true;
}

function closeTimerModal() {
    showTimerModal.value = false;
}

onMounted(async () => {
    document.addEventListener('click', handleClickOutside);

    if (isAuthenticated.value) {
        await timerStore.initialize();
        // await timerStore.fetchActiveTimer();
        // await timerStore.fetchTimers();
    }
});

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
    timerStore.cleanup();
});
</script>

<template>
    <div class="min-h-screen bg-gray-100">
        <div v-if="showNavigation" class="pt-12 w-full"></div>
        <nav v-if="showNavigation" class="bg-white shadow fixed w-full top-0">
            <div class="container mx-auto px-4">
                <div class="flex h-16 items-center justify-between">
                    <div class="flex items-center gap-8">
                        <RouterLink to="/">
                            <span class="text-xl font-bold text-gray-900">Hours Ledger</span>
                        </RouterLink>

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
                            <RouterLink
                                v-if="canViewTimers"
                                to="/timers"
                                class="text-gray-600 hover:text-gray-900"
                                active-class="text-blue-600 font-medium"
                            >
                                Timers
                            </RouterLink>
                            <RouterLink
                                v-if="canViewImports"
                                to="/imports"
                                class="text-gray-600 hover:text-gray-900"
                                active-class="text-blue-600 font-medium"
                            >
                                Importações
                            </RouterLink>
                        </div>
                    </div>

                    <div ref="userMenuRef" class="relative">
                        <button
                            class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            @click="toggleUserMenu"
                        >
                            <span>{{ user?.name }}</span>
                            <svg
                                class="h-4 w-4 transition-transform"
                                :class="{ 'rotate-180': showUserMenu }"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M19 9l-7 7-7-7"
                                />
                            </svg>
                        </button>

                        <div
                            v-if="showUserMenu"
                            class="absolute right-0 mt-2 w-48 rounded-lg bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5"
                        >
                            <button
                                class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                                @click="goToProfile"
                            >
                                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                    />
                                </svg>
                                Profile
                            </button>
                            <button
                                :disabled="loading"
                                class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                                @click="handleLogout"
                            >
                                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                    />
                                </svg>
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </nav>

        <main>
            <RouterView />
        </main>

        <!-- Timer Floating Balloon -->
        <TimerFloatingBalloon v-if="isAuthenticated" :timerStore="timerStore" @open-modal="openTimerModal" />

        <!-- Timer Active Modal -->
        <TimerActiveModal
            av-if="isAuthenticated"
            v-if="showTimerModal"
            v-bind="{
                isAuthenticated: 'aa=' + isAuthenticated,
                showTimerModal: 'aa=' + showTimerModal,
            }"
            :show="true"
            :timerStore="eventTimerStore || timerStore"
            @close="closeTimerModal"
        />

        <!-- Global Confirm Modal -->
        <ConfirmModal
            v-model:is-open="confirmState.isOpen"
            :title="confirmState.title"
            :message="confirmState.message"
            :confirm-text="confirmState.confirmText"
            :cancel-text="confirmState.cancelText"
            :variant="confirmState.variant"
            @confirm="handleConfirm"
            @cancel="handleCancel"
        />
    </div>
</template>

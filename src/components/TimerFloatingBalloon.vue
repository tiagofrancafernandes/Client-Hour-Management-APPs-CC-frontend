<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useTimerStore } from '@/stores/timer';
import { useConfirm } from '@/composables/useConfirm';

const timerStore = useTimerStore();
const { confirm } = useConfirm();

const expanded = ref(true);
const localTime = ref(0);
const intervalId = ref<number | null>(null);

const hasTimer = computed(() => timerStore.hasActiveTimer);
const timer = computed(() => timerStore.activeTimer);
const isRunning = computed(() => timerStore.isRunning);
const isPaused = computed(() => timerStore.isPaused);

const formattedTime = computed(() => {
    const totalSeconds = localTime.value;

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
});

function toggleExpanded(): void {
    expanded.value = !expanded.value;
}

async function togglePlayPause(): Promise<void> {
    if (isRunning.value) {
        await timerStore.pauseTimer();
    } else if (isPaused.value) {
        await timerStore.resumeTimer();
    }
}

async function stopTimer(): Promise<void> {
    const confirmed = await confirm({
        title: 'Parar Timer',
        message: 'Tem certeza que deseja parar este timer?',
        confirmText: 'Sim, Parar',
        cancelText: 'Cancelar',
        variant: 'warning',
    });

    if (confirmed) {
        await timerStore.stopTimer();
        stopLocalTimer();
    }
}

function updateLocalTime(): void {
    if (!timer.value) {
        return;
    }

    localTime.value = timer.value.total_seconds;

    if (isRunning.value) {
        localTime.value += 1;
    }
}

function startLocalTimer(): void {
    if (intervalId.value !== null) {
        return;
    }

    updateLocalTime();

    intervalId.value = window.setInterval(() => {
        if (isRunning.value) {
            localTime.value += 1;
        }
    }, 1000);
}

function stopLocalTimer(): void {
    if (intervalId.value !== null) {
        clearInterval(intervalId.value);
        intervalId.value = null;
    }
}

onMounted(() => {
    if (hasTimer.value) {
        startLocalTimer();
    }
});

onUnmounted(() => {
    stopLocalTimer();
});

// Restart local timer when timer becomes active
if (hasTimer.value && !intervalId.value) {
    startLocalTimer();
}

// Stop local timer when timer is no longer active
if (!hasTimer.value && intervalId.value) {
    stopLocalTimer();
}
</script>

<template>
    <div
        v-if="hasTimer"
        :class="[
            'fixed bottom-4 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg transition-all duration-300',
            {
                'w-80': expanded,
                'w-16 h-16': !expanded,
            },
        ]"
    >
        <!-- Minimized State -->
        <div v-if="!expanded" class="flex items-center justify-center h-full cursor-pointer" @click="toggleExpanded">
            <div class="flex flex-col items-center">
                <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
                <span class="text-xs text-gray-600 mt-1">{{ formattedTime }}</span>
            </div>
        </div>

        <!-- Expanded State -->
        <div v-else class="p-4">
            <!-- Header -->
            <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                    <div
                        :class="[
                            'w-2 h-2 rounded-full',
                            {
                                'bg-green-500 animate-pulse': isRunning,
                                'bg-yellow-500': isPaused,
                            },
                        ]"
                    ></div>
                    <span class="text-sm font-medium text-gray-700">
                        {{ isRunning ? 'Running' : 'Paused' }}
                    </span>
                </div>
                <button class="text-gray-400 hover:text-gray-600 transition-colors" @click="toggleExpanded">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
            </div>

            <!-- Timer Display -->
            <div class="text-center mb-4">
                <div class="text-3xl font-bold text-gray-900 font-mono">
                    {{ formattedTime }}
                </div>
                <div v-if="timer?.wallet" class="text-sm text-gray-500 mt-1">
                    {{ timer.wallet.client?.name }} - {{ timer.wallet.name }}
                </div>
                <div v-if="timer?.title" class="text-sm text-gray-700 mt-1">
                    {{ timer.title }}
                </div>
            </div>

            <!-- Controls -->
            <div class="flex gap-2">
                <button
                    :class="[
                        'flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors',
                        {
                            'bg-red-600 hover:bg-red-700 text-white': isRunning,
                            'bg-green-600 hover:bg-green-700 text-white': isPaused,
                        },
                    ]"
                    @click="togglePlayPause"
                >
                    <span v-if="isRunning">Pause</span>
                    <span v-else>Resume</span>
                </button>
                <button
                    class="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium text-sm transition-colors"
                    @click="stopTimer"
                >
                    Stop
                </button>
            </div>
        </div>
    </div>
</template>

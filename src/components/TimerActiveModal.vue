<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue';
import { useTimerStore } from '@/stores/timer';
import { useConfirm } from '@/composables/useConfirm';
import { Icon } from '@iconify/vue';

const props = defineProps<{
    show: boolean;
}>();

const emit = defineEmits<{
    close: [];
}>();

const timerStore = useTimerStore();
const { confirm } = useConfirm();

const localTime = ref(0);
const intervalId = ref<number | null>(null);

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

async function togglePlayPause(): Promise<void> {
    if (isRunning.value) {
        await timerStore.pauseTimer();
    } else if (isPaused.value) {
        await timerStore.resumeTimer();
    }
}

async function handleStop(): Promise<void> {
    const confirmed = await confirm({
        title: 'Parar Timer',
        message: 'Tem certeza que deseja parar este timer? Você poderá confirmar ou editar os ciclos depois.',
        confirmText: 'Sim, Parar',
        cancelText: 'Cancelar',
        variant: 'warning',
    });

    if (confirmed) {
        await timerStore.stopTimer();
        emit('close');
    }
}

async function handleCancel(): Promise<void> {
    const confirmed = await confirm({
        title: 'Cancelar Timer',
        message: 'Tem certeza que deseja cancelar este timer? Todos os dados serão perdidos.',
        confirmText: 'Sim, Cancelar',
        cancelText: 'Não',
        variant: 'danger',
    });

    if (confirmed) {
        await timerStore.cancelTimer();
        emit('close');
    }
}

function handleClose(): void {
    emit('close');
}

watch(
    () => props.show,
    (newValue) => {
        if (newValue && timer.value) {
            startLocalTimer();
        } else {
            stopLocalTimer();
        }
    }
);

watch(timer, (newTimer) => {
    if (newTimer) {
        localTime.value = newTimer.total_seconds;
    } else {
        localTime.value = 0;
        emit('close');
    }
}, { deep: true });

onMounted(() => {
    if (props.show && timer.value) {
        startLocalTimer();
    }
});

onUnmounted(() => {
    stopLocalTimer();
});
</script>

<template>
    <div
        v-if="show && timer"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="handleClose"
    >
        <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <!-- Header -->
            <div class="flex items-center justify-between p-6 border-b border-gray-200">
                <div class="flex items-center gap-3">
                    <div
                        :class="[
                            'w-3 h-3 rounded-full',
                            {
                                'bg-green-500 animate-pulse': isRunning,
                                'bg-yellow-500': isPaused,
                            },
                        ]"
                    ></div>
                    <h2 class="text-xl font-semibold text-gray-900">
                        {{ isRunning ? 'Timer Running' : 'Timer Paused' }}
                    </h2>
                </div>
                <button
                    class="text-gray-400 hover:text-gray-600 transition-colors"
                    @click="handleClose"
                >
                    <Icon icon="mdi:close" class="w-6 h-6" />
                </button>
            </div>

            <!-- Body -->
            <div class="p-6 space-y-6">
                <!-- Timer Display -->
                <div class="text-center">
                    <div class="text-5xl font-bold text-gray-900 font-mono mb-2">
                        {{ formattedTime }}
                    </div>
                    <div class="text-sm text-gray-500">
                        {{ timer.total_hours.toFixed(2) }} hours
                    </div>
                </div>

                <!-- Timer Info -->
                <div class="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div>
                        <p class="text-xs text-gray-600 mb-1">Wallet</p>
                        <p class="font-medium text-gray-900">
                            {{ timer.wallet?.client?.name }} - {{ timer.wallet?.name }}
                        </p>
                    </div>
                    <div v-if="timer.title">
                        <p class="text-xs text-gray-600 mb-1">Title</p>
                        <p class="font-medium text-gray-900">{{ timer.title }}</p>
                    </div>
                    <div v-if="timer.description">
                        <p class="text-xs text-gray-600 mb-1">Description</p>
                        <p class="text-gray-900">{{ timer.description }}</p>
                    </div>
                    <div v-if="timer.tags && timer.tags.length > 0">
                        <p class="text-xs text-gray-600 mb-2">Tags</p>
                        <div class="flex flex-wrap gap-2">
                            <span
                                v-for="tag in timer.tags"
                                :key="tag.id"
                                class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                            >
                                {{ tag.name }}
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Cycles -->
                <div v-if="timer.cycles && timer.cycles.length > 0">
                    <p class="text-sm font-medium text-gray-900 mb-2">Cycles ({{ timer.cycles.length }})</p>
                    <div class="space-y-2 max-h-32 overflow-y-auto">
                        <div
                            v-for="(cycle, index) in timer.cycles"
                            :key="cycle.id"
                            class="flex items-center justify-between p-2 bg-gray-50 rounded text-xs"
                        >
                            <span class="text-gray-600">Cycle {{ index + 1 }}</span>
                            <span class="font-mono text-gray-900">
                                {{ new Date(cycle.started_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }}
                                -
                                {{ cycle.ended_at ? new Date(cycle.ended_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Running' }}
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Controls -->
                <div class="grid grid-cols-2 gap-3">
                    <CButton
                        :preset="isRunning ? 'yellow-md' : 'green-md'"
                        class="w-full"
                        @click="togglePlayPause"
                    >
                        <Icon :icon="isRunning ? 'mdi:pause' : 'mdi:play'" class="w-5 h-5 mr-2" />
                        {{ isRunning ? 'Pause' : 'Resume' }}
                    </CButton>
                    <CButton preset="orange-md" class="w-full" @click="handleStop">
                        <Icon icon="mdi:stop" class="w-5 h-5 mr-2" />
                        Stop
                    </CButton>
                </div>

                <!-- Cancel Button -->
                <CButton preset="outlined-red" class="w-full" @click="handleCancel">
                    <Icon icon="mdi:cancel" class="w-5 h-5 mr-2" />
                    Cancel Timer
                </CButton>
            </div>
        </div>
    </div>
</template>

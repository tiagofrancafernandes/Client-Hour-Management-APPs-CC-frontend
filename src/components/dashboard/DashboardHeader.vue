<script setup lang="ts">
import { computed } from 'vue';
import { Icon } from '@iconify/vue';
import CButton from '@/components/CButton.vue';

const props = defineProps<{
    cachedAt?: string | null;
    loading: boolean;
}>();

const emit = defineEmits<{
    (e: 'refresh-all'): void;
}>();

const formattedCachedTime = computed(() => {
    if (!props.cachedAt) {
        return null;
    }

    try {
        const date = new Date(props.cachedAt);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
        return null;
    }
});
</script>

<template>
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 pb-4 sm:pb-6 border-b border-gray-200 dark:border-gray-800">
        <div>
            <h1 class="text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
                Dashboard
            </h1>
            <p class="mt-0.5 sm:mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                System activity overview, resource counts, and latest operations
            </p>
        </div>

        <div class="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 flex-wrap">
            <span
                v-if="formattedCachedTime"
                class="inline-flex items-center gap-1.5 text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg border border-gray-200/60 dark:border-gray-700/60"
                title="Data served from cache"
            >
                <Icon icon="heroicons:clock" class="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span>Cached at {{ formattedCachedTime }}</span>
            </span>

            <CButton
                preset="white"
                :disabled="loading"
                class="text-xs font-medium border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 shadow-xs cursor-pointer"
                @click="emit('refresh-all')"
            >
                <Icon
                    icon="heroicons:arrow-path"
                    :class="[
                        'w-3.5 h-3.5 mr-1.5 text-gray-600 dark:text-gray-300 transition-transform',
                        { 'animate-spin': loading },
                    ]"
                />
                <span>{{ loading ? 'Reloading...' : 'Clear Cache & Reload' }}</span>
            </CButton>
        </div>
    </div>
</template>


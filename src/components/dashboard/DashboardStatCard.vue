<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { RouterLink } from 'vue-router';

defineProps<{
    title: string;
    value: string | number;
    secondaryLabel?: string;
    secondaryType?: 'positive' | 'negative' | 'neutral' | 'info';
    icon: string;
    iconColor?: string;
    to: string;
    loading?: boolean;
}>();

const emit = defineEmits<{
    (e: 'clear-cache'): void;
}>();
</script>

<template>
    <div
        class="relative flex flex-col justify-between p-5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200/80 dark:border-gray-700/80 shadow-xs hover:shadow-sm transition-all duration-200 group"
    >
        <!-- Header: Title, Icon & Individual Clear Cache Button -->
        <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-3">
                <div
                    :class="[
                        'w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border border-black/5 dark:border-white/5',
                        iconColor || 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
                    ]"
                >
                    <Icon :icon="icon" class="w-5 h-5" />
                </div>
                <div>
                    <h2 class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        {{ title }}
                    </h2>
                    <div class="mt-1 flex items-baseline gap-2">
                        <span class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                            {{ value }}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Top-Right Clear Cache Action Button -->
            <button
                type="button"
                :disabled="loading"
                class="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                title="Clear cache and refresh this metric"
                @click.stop.prevent="emit('clear-cache')"
            >
                <Icon
                    icon="heroicons:arrow-path"
                    :class="[
                        'w-4 h-4 transition-transform',
                        { 'animate-spin text-blue-600 dark:text-blue-400': loading },
                    ]"
                />
            </button>
        </div>

        <!-- Bottom row: Secondary indicator & Link to View -->
        <div class="mt-4 pt-3 flex items-center justify-between border-t border-gray-100 dark:border-gray-700/60 text-xs">
            <span
                v-if="secondaryLabel"
                :class="[
                    'font-medium inline-flex items-center gap-1',
                    {
                        'text-emerald-600 dark:text-emerald-400': secondaryType === 'positive',
                        'text-rose-600 dark:text-rose-400': secondaryType === 'negative',
                        'text-blue-600 dark:text-blue-400': secondaryType === 'info',
                        'text-gray-500 dark:text-gray-400': !secondaryType || secondaryType === 'neutral',
                    },
                ]"
            >
                <Icon
                    v-if="secondaryType === 'positive'"
                    icon="heroicons:arrow-trending-up"
                    class="w-3.5 h-3.5"
                />
                <Icon
                    v-else-if="secondaryType === 'negative'"
                    icon="heroicons:arrow-trending-down"
                    class="w-3.5 h-3.5"
                />
                {{ secondaryLabel }}
            </span>
            <span v-else class="text-gray-400">Total active</span>

            <RouterLink
                :to="to"
                class="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline"
            >
                <span>View</span>
                <Icon icon="heroicons:chevron-right" class="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </RouterLink>
        </div>
    </div>
</template>

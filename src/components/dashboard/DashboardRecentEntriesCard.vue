<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { RouterLink } from 'vue-router';
import type { DashboardRecentEntry } from '@/types/dashboard';
import { formatHoursDisplay } from '@/utils/timeFormatters';

const props = defineProps<{
    entries: DashboardRecentEntry[];
    loading: boolean;
    orderBy: 'created_at' | 'reference_date' | 'hours';
    orderDirection: 'asc' | 'desc';
}>();

const emit = defineEmits<{
    (e: 'update:orderBy', value: 'created_at' | 'reference_date' | 'hours'): void;
    (e: 'update:orderDirection', value: 'asc' | 'desc'): void;
    (e: 'clear-cache'): void;
}>();

function toggleDirection(): void {
    emit('update:orderDirection', props.orderDirection === 'asc' ? 'desc' : 'asc');
}

function formatDate(dateStr: string | null): string {
    if (!dateStr) {
        return '-';
    }

    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
        return dateStr;
    }
}
</script>

<template>
    <div class="flex flex-col h-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200/80 dark:border-gray-700/80 shadow-xs">
        <!-- Card Header -->
        <div class="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-700/60 flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Icon icon="heroicons:clock" class="w-4 h-4" />
                </div>
                <div>
                    <h2 class="text-sm font-semibold text-gray-900 dark:text-white">
                        Recent Ledger Entries
                    </h2>
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                        Latest hour credits and debits logged
                    </p>
                </div>
            </div>

            <!-- Sorting & Refresh Actions -->
            <div class="flex items-center gap-2">
                <!-- Sort Field Dropdown -->
                <select
                    :value="orderBy"
                    class="text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-36"
                    aria-label="Order entries by"
                    @change="emit('update:orderBy', ($event.target as HTMLSelectElement).value as any)"
                >
                    <option value="created_at">Order: Created</option>
                    <option value="reference_date">Order: Ref Date</option>
                    <option value="hours">Order: Hours</option>
                </select>

                <!-- Direction Toggle -->
                <button
                    type="button"
                    class="p-1.5 text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                    :title="orderDirection === 'asc' ? 'Ascending (click for descending)' : 'Descending (click for ascending)'"
                    @click="toggleDirection"
                >
                    <Icon
                        :icon="orderDirection === 'asc' ? 'heroicons:bars-arrow-up' : 'heroicons:bars-arrow-down'"
                        class="w-4 h-4"
                    />
                </button>

                <!-- Clear Cache Button -->
                <button
                    type="button"
                    :disabled="loading"
                    class="p-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                    title="Clear cache and refresh entries"
                    @click="emit('clear-cache')"
                >
                    <Icon
                        icon="heroicons:arrow-path"
                        :class="['w-4 h-4 transition-transform', { 'animate-spin text-blue-600': loading }]"
                    />
                </button>
            </div>
        </div>

        <!-- Table / List Content -->
        <div class="flex-1 overflow-x-auto">
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-900/30 text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        <th class="py-2.5 px-4 font-medium">Date</th>
                        <th class="py-2.5 px-4 font-medium">Client & Wallet</th>
                        <th class="py-2.5 px-4 font-medium">Description</th>
                        <th class="py-2.5 px-4 font-medium text-right">Hours</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-gray-800 text-xs text-gray-700 dark:text-gray-300">
                    <tr v-if="loading && entries.length === 0">
                        <td colspan="4" class="py-8 text-center text-gray-400">
                            <Icon icon="heroicons:arrow-path" class="w-5 h-5 mx-auto animate-spin mb-1 text-blue-500" />
                            Loading entries...
                        </td>
                    </tr>
                    <tr v-else-if="entries.length === 0">
                        <td colspan="4" class="py-8 text-center text-gray-400">
                            No ledger entries found.
                        </td>
                    </tr>
                    <tr
                        v-for="entry in entries"
                        :key="entry.id"
                        class="hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition-colors"
                    >
                        <td class="py-2.5 px-4 whitespace-nowrap text-gray-500 dark:text-gray-400 font-mono text-[11px]">
                            {{ formatDate(entry.reference_date || entry.created_at) }}
                        </td>
                        <td class="py-2.5 px-4">
                            <div class="font-medium text-gray-900 dark:text-white truncate max-w-[160px]">
                                {{ entry.client.name }}
                            </div>
                            <div class="text-[11px] text-gray-500 dark:text-gray-400 truncate max-w-[160px]">
                                {{ entry.wallet.name }}
                            </div>
                        </td>
                        <td class="py-2.5 px-4">
                            <div class="truncate max-w-[200px]" :title="entry.title || entry.description || ''">
                                {{ entry.title || entry.description || 'Ledger Entry' }}
                            </div>
                            <div v-if="entry.tags && entry.tags.length > 0" class="flex flex-wrap gap-1 mt-1">
                                <span
                                    v-for="tag in entry.tags"
                                    :key="tag.id"
                                    class="inline-block px-1.5 py-0.5 text-[10px] rounded font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                                >
                                    {{ tag.name }}
                                </span>
                            </div>
                        </td>
                        <td class="py-2.5 px-4 text-right whitespace-nowrap">
                            <span
                                :class="[
                                    'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold font-mono',
                                    entry.hours >= 0
                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                                        : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300',
                                ]"
                            >
                                {{ formatHoursDisplay(entry.hours, true) }}
                            </span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Card Footer: View More Link -->
        <div class="p-3 border-t border-gray-100 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-900/20 text-center">
            <RouterLink
                to="/reports"
                class="inline-flex items-center justify-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition"
            >
                <span>View all entries & reports</span>
                <Icon icon="heroicons:arrow-right" class="w-3.5 h-3.5" />
            </RouterLink>
        </div>
    </div>
</template>

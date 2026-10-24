<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { RouterLink } from 'vue-router';
import type { DashboardRecentInvoice } from '@/types/dashboard';

const props = defineProps<{
    invoices: DashboardRecentInvoice[];
    loading: boolean;
    orderBy: 'created_at' | 'issue_date' | 'total';
    orderDirection: 'asc' | 'desc';
}>();

const emit = defineEmits<{
    (e: 'update:orderBy', value: 'created_at' | 'issue_date' | 'total'): void;
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

function formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: currency || 'USD',
    }).format(amount);
}
</script>

<template>
    <div class="flex flex-col h-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200/80 dark:border-gray-700/80 shadow-xs">
        <!-- Card Header -->
        <div class="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-700/60 flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Icon icon="heroicons:document-text" class="w-4 h-4" />
                </div>
                <div>
                    <h2 class="text-sm font-semibold text-gray-900 dark:text-white">
                        Recent Invoices
                    </h2>
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                        Latest client billings and payment statuses
                    </p>
                </div>
            </div>

            <!-- Sorting & Refresh Actions -->
            <div class="flex items-center gap-2">
                <!-- Sort Field Dropdown -->
                <select
                    :value="orderBy"
                    class="text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    aria-label="Order invoices by"
                    @change="emit('update:orderBy', ($event.target as HTMLSelectElement).value as any)"
                >
                    <option value="created_at">Order: Created</option>
                    <option value="issue_date">Order: Issue Date</option>
                    <option value="total">Order: Total Amount</option>
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
                    title="Clear cache and refresh invoices"
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
                        <th class="py-2.5 px-4 font-medium">Invoice</th>
                        <th class="py-2.5 px-4 font-medium">Client</th>
                        <th class="py-2.5 px-4 font-medium">Status</th>
                        <th class="py-2.5 px-4 font-medium text-right">Amount</th>
                        <th class="py-2.5 px-4 font-medium text-right">Date</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-gray-800 text-xs text-gray-700 dark:text-gray-300">
                    <tr v-if="loading && invoices.length === 0">
                        <td colspan="5" class="py-8 text-center text-gray-400">
                            <Icon icon="heroicons:arrow-path" class="w-5 h-5 mx-auto animate-spin mb-1 text-blue-500" />
                            Loading invoices...
                        </td>
                    </tr>
                    <tr v-else-if="invoices.length === 0">
                        <td colspan="5" class="py-8 text-center text-gray-400">
                            No invoices found.
                        </td>
                    </tr>
                    <tr
                        v-for="invoice in invoices"
                        :key="invoice.id"
                        class="hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition-colors"
                    >
                        <td class="py-2.5 px-4 whitespace-nowrap">
                            <RouterLink
                                :to="`/invoices/${invoice.id}`"
                                class="font-mono font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                {{ invoice.formatted_code || `#${invoice.code}` }}
                            </RouterLink>
                        </td>
                        <td class="py-2.5 px-4">
                            <div class="font-medium text-gray-900 dark:text-white truncate max-w-[140px]">
                                {{ invoice.client.name }}
                            </div>
                        </td>
                        <td class="py-2.5 px-4 whitespace-nowrap">
                            <span
                                :class="[
                                    'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium capitalize',
                                    {
                                        'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300': invoice.status === 'paid',
                                        'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300': invoice.status === 'sent',
                                        'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300': invoice.status === 'draft',
                                        'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300': invoice.status === 'overdue' || invoice.status === 'cancelled',
                                    },
                                ]"
                            >
                                {{ invoice.status }}
                            </span>
                        </td>
                        <td class="py-2.5 px-4 text-right font-mono font-medium text-gray-900 dark:text-white whitespace-nowrap">
                            {{ formatCurrency(invoice.total, invoice.currency) }}
                        </td>
                        <td class="py-2.5 px-4 text-right whitespace-nowrap text-gray-500 dark:text-gray-400 font-mono text-[11px]">
                            {{ formatDate(invoice.issue_date || invoice.created_at) }}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Card Footer: View More Link -->
        <div class="p-3 border-t border-gray-100 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-900/20 text-center">
            <RouterLink
                to="/invoices"
                class="inline-flex items-center justify-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition"
            >
                <span>View all invoices</span>
                <Icon icon="heroicons:arrow-right" class="w-3.5 h-3.5" />
            </RouterLink>
        </div>
    </div>
</template>


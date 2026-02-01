<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue';
import { useReports } from '@/composables/useReports';
import { useClients } from '@/composables/useClients';
import { useWallets } from '@/composables/useWallets';
import { useTags } from '@/composables/useTags';
import api from '@/services/api';
import type { ReportFilters } from '@/types';
import CButton from '@/components/CButton.vue';

const { summary, entries, groupedData, loading, error, pagination, fetchReport } = useReports();
const { clients, fetchClients } = useClients();
const { wallets, fetchWallets } = useWallets();
const { tags, fetchTags } = useTags();

const filters = ref<ReportFilters>({
    client_id: null,
    wallet_id: null,
    date_from: '',
    date_to: '',
    tags: [],
    type: null,
    group_by: null,
});

const hasAppliedFilters = ref(false);

const filteredWallets = computed(() => {
    if (!filters.value.client_id) {
        return wallets.value;
    }

    return wallets.value.filter((wallet) => wallet.client_id === filters.value.client_id);
});

function getWalletLabel(wallet: any): string {
    const clientName = wallet.client?.name || 'Unknown Client';

    return `${wallet.name} (${clientName})`;
}

watch(
    () => filters.value.client_id,
    (newClientId, oldClientId) => {
        if (newClientId !== oldClientId && filters.value.wallet_id) {
            const selectedWallet = wallets.value.find((w) => w.id === filters.value.wallet_id);

            if (selectedWallet && selectedWallet.client_id !== newClientId) {
                filters.value.wallet_id = null;
            }
        }
    }
);

onMounted(async () => {
    await Promise.all([fetchClients(1, ''), fetchWallets(), fetchTags()]);
});

async function handleFilter() {
    const activeFilters: ReportFilters = {};

    if (filters.value.client_id) {
        activeFilters.client_id = filters.value.client_id;
    }

    if (filters.value.wallet_id) {
        activeFilters.wallet_id = filters.value.wallet_id;
    }

    if (filters.value.date_from) {
        activeFilters.date_from = filters.value.date_from;
    }

    if (filters.value.date_to) {
        activeFilters.date_to = filters.value.date_to;
    }

    if (filters.value.tags && filters.value.tags.length > 0) {
        activeFilters.tags = filters.value.tags;
    }

    if (filters.value.type) {
        activeFilters.type = filters.value.type;
    }

    if (filters.value.group_by) {
        activeFilters.group_by = filters.value.group_by;
    }

    hasAppliedFilters.value = true;

    await fetchReport(activeFilters);
}

function clearFilters() {
    filters.value = {
        client_id: null,
        wallet_id: null,
        date_from: '',
        date_to: '',
        tags: [],
        type: null,
        group_by: null,
    };

    hasAppliedFilters.value = false;
}

function formatHours(hours: string): string {
    const num = parseFloat(hours);

    if (num > 0) {
        return `+${hours}h`;
    }

    return `${hours}h`;
}

function getHoursColor(hours: string): string {
    const num = parseFloat(hours);

    if (num > 0) {
        return 'text-green-600';
    }

    if (num < 0) {
        return 'text-red-600';
    }

    return 'text-gray-600';
}

function formatDate(date: string | null): string {
    if (!date) {
        return '-';
    }

    return new Date(date).toLocaleDateString();
}

const exporting = ref(false);
const exportError = ref<string | null>(null);

async function exportReport(format: 'pdf' | 'excel') {
    exporting.value = true;
    exportError.value = null;

    try {
        const params = new URLSearchParams();

        params.append('format', format);

        if (filters.value.client_id) {
            params.append('client_id', String(filters.value.client_id));
        }

        if (filters.value.wallet_id) {
            params.append('wallet_id', String(filters.value.wallet_id));
        }

        if (filters.value.date_from) {
            params.append('date_from', filters.value.date_from);
        }

        if (filters.value.date_to) {
            params.append('date_to', filters.value.date_to);
        }

        if (filters.value.tags && filters.value.tags.length > 0) {
            filters.value.tags.forEach((tag) => {
                params.append('tags[]', String(tag));
            });
        }

        if (filters.value.type) {
            params.append('type', filters.value.type);
        }

        await api.download(`/reports/export?${params.toString()}`);
    } catch (err) {
        exportError.value = err instanceof Error ? err.message : 'Export failed';
    } finally {
        exporting.value = false;
    }
}
</script>

<template>
    <div class="container mx-auto px-4 py-8">
        <h1 class="mb-6 text-2xl font-bold text-gray-900">Reports</h1>

        <!-- Filters -->
        <div class="mb-6 rounded-lg bg-white p-4 shadow">
            <h2 class="mb-4 text-lg font-semibold">Filters</h2>
            <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <CSelect label="Client" v-model="filters.client_id">
                    <option :value="null">All Clients</option>
                    <option v-for="client in clients" :key="client.id" :value="client.id">
                        {{ client.name }}
                    </option>
                </CSelect>

                <CSelect label="Wallet" v-model="filters.wallet_id">
                    <option :value="null">All Wallets</option>
                    <option v-for="wallet in filteredWallets" :key="wallet.id" :value="wallet.id">
                        {{ getWalletLabel(wallet) }}
                    </option>
                </CSelect>

                <CInput label="Date From" v-model="filters.date_from" type="date" />

                <CInput label="Date To" v-model="filters.date_to" type="date" />

                <CSelect label="Type" v-model="filters.type">
                    <option :value="null">All Types</option>
                    <option value="credit">Credits Only</option>
                    <option value="debit">Debits Only</option>
                </CSelect>

                <CSelect label="Group By" v-model="filters.group_by">
                    <option :value="null">No Grouping</option>
                    <option value="wallet">By Wallet</option>
                    <option value="client">By Client</option>
                </CSelect>

                <div class="lg:col-span-2">
                    <label class="mb-1 block text-sm font-medium text-gray-700">Tags</label>
                    <div
                        class="flex gap-2 overflow-x-auto whitespace-nowrap pb-2 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200"
                    >
                        <label
                            v-for="tag in tags"
                            :key="tag.id"
                            class="flex cursor-pointer items-center gap-1 rounded-full border px-2 py-1 text-sm select-none"
                            :class="{
                                'border-blue-500 bg-blue-50': filters.tags?.includes(tag.id),
                                'border-gray-300': !filters.tags?.includes(tag.id),
                            }"
                        >
                            <input v-model="filters.tags" type="checkbox" :value="tag.id" class="hidden" />
                            {{ tag.name }}
                        </label>
                    </div>
                </div>
            </div>

            <div class="mt-4 flex flex-wrap items-center gap-2">
                <div class="flex gap-2">
                    <CButton preset="blue" @click="handleFilter">Apply Filters</CButton>
                    <CButton preset="outlined-black" @click="clearFilters">Clear</CButton>
                </div>

                <div class="ml-auto flex gap-2">
                    <CButton
                        preset="outlined-green-sm"
                        :disabled="exporting"
                        class="flex items-center gap-2 rounded-lg border border-green-600 px-4 py-2 text-green-600 hover:bg-green-50 disabled:opacity-50"
                        @click="exportReport('excel')"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                            <path
                                d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4zM8.5 18H7v-5h1.5v5zm3.5 0h-2v-5h2v5zm4 0h-2.5v-5H16v5z"
                            />
                        </svg>
                        <span v-if="!exporting">Excel</span>
                        <span v-else>Exporting...</span>
                    </CButton>
                    <CButton
                        preset="outlined-red-sm"
                        :disabled="exporting"
                        class="flex items-center gap-2 rounded-lg border border-red-600 px-4 py-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                        @click="exportReport('pdf')"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                            <path
                                d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4zM8 15h2v2H8v-2zm0-3h2v2H8v-2zm4 3h4v2h-4v-2zm0-3h4v2h-4v-2z"
                            />
                        </svg>
                        <span v-if="!exporting">PDF</span>
                        <span v-else>Exporting...</span>
                    </CButton>
                </div>
            </div>

            <div v-if="exportError" class="mt-2 rounded-lg bg-red-100 p-2 text-sm text-red-700">
                {{ exportError }}
            </div>
        </div>

        <div v-if="error" class="mb-4 rounded-lg bg-red-100 p-4 text-red-700">
            {{ error }}
        </div>

        <!-- Initial Message -->
        <div v-if="!hasAppliedFilters" class="rounded-lg bg-blue-50 border border-blue-200 p-8 text-center">
            <svg class="mx-auto h-16 w-16 text-blue-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
            </svg>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">No Reports to Display</h3>
            <p class="text-gray-600 mb-4">Select your filters above and click "Apply Filters" to view reports.</p>
        </div>

        <!-- Summary -->
        <div v-else-if="summary" class="mb-6 grid gap-4 md:grid-cols-4">
            <div class="rounded-lg bg-white p-4 shadow">
                <p class="text-sm text-gray-500">Total Credits</p>
                <p class="text-2xl font-bold text-green-600">+{{ summary.total_credits }}h</p>
            </div>
            <div class="rounded-lg bg-white p-4 shadow">
                <p class="text-sm text-gray-500">Total Debits</p>
                <p class="text-2xl font-bold text-red-600">{{ summary.total_debits }}h</p>
            </div>
            <div class="rounded-lg bg-white p-4 shadow">
                <p class="text-sm text-gray-500">Net Balance</p>
                <p class="text-2xl font-bold" :class="getHoursColor(summary.net_balance)">
                    {{ formatHours(summary.net_balance) }}
                </p>
            </div>
            <div class="rounded-lg bg-white p-4 shadow">
                <p class="text-sm text-gray-500">Total Entries</p>
                <p class="text-2xl font-bold text-gray-900">{{ summary.entry_count }}</p>
            </div>
        </div>

        <div v-else-if="loading" class="py-8 text-center">Loading...</div>

        <!-- Grouped Data -->
        <div v-else-if="hasAppliedFilters && groupedData.length > 0" class="overflow-hidden rounded-lg bg-white shadow">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            {{ filters.group_by === 'client' ? 'Client' : 'Wallet' }}
                        </th>
                        <th class="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                            Credits
                        </th>
                        <th class="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                            Debits
                        </th>
                        <th class="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                            Balance
                        </th>
                        <th class="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                            Entries
                        </th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 bg-white">
                    <tr v-for="(item, index) in groupedData" :key="index">
                        <td class="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                            {{ item.client_name || item.wallet_name }}
                        </td>
                        <td class="whitespace-nowrap px-6 py-4 text-right text-sm text-green-600">
                            +{{ item.total_credits }}h
                        </td>
                        <td class="whitespace-nowrap px-6 py-4 text-right text-sm text-red-600">
                            {{ item.total_debits }}h
                        </td>
                        <td
                            class="whitespace-nowrap px-6 py-4 text-right text-sm font-medium"
                            :class="getHoursColor(item.net_balance)"
                        >
                            {{ formatHours(item.net_balance) }}
                        </td>
                        <td class="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-500">
                            {{ item.entry_count }}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Entries Table -->
        <div v-else-if="hasAppliedFilters && entries.length > 0" class="overflow-hidden rounded-lg bg-white shadow">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Date
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Client / Wallet
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Title
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Tags
                        </th>
                        <th class="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                            Hours
                        </th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 bg-white">
                    <tr v-for="entry in entries" :key="entry.id">
                        <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                            {{ formatDate(entry.reference_date) }}
                        </td>
                        <td class="px-6 py-4 text-sm">
                            <div class="font-medium text-gray-900">
                                {{ entry.wallet?.client?.name }}
                            </div>
                            <div class="text-gray-500">{{ entry.wallet?.name }}</div>
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-900">
                            {{ entry.title || '-' }}
                        </td>
                        <td class="px-6 py-4 text-sm">
                            <div class="flex flex-wrap gap-1">
                                <span
                                    v-for="tag in entry.tags"
                                    :key="tag.id"
                                    class="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                                >
                                    {{ tag.name }}
                                </span>
                            </div>
                        </td>
                        <td
                            class="whitespace-nowrap px-6 py-4 text-right text-sm font-medium"
                            :class="getHoursColor(entry.hours)"
                        >
                            {{ formatHours(entry.hours) }}
                        </td>
                    </tr>
                </tbody>
            </table>

            <div v-if="pagination.lastPage > 1" class="flex justify-center gap-2 border-t p-4">
                <CButton
                    preset="none-sm"
                    :disabled="pagination.currentPage === 1"
                    class="rounded px-3 py-1 disabled:opacity-50"
                    :class="{
                        'bg-gray-200': pagination.currentPage === 1,
                        'bg-blue-600 text-white': pagination.currentPage !== 1,
                    }"
                >
                    Previous
                </CButton>
                <span class="px-3 py-1">Page {{ pagination.currentPage }} of {{ pagination.lastPage }}</span>
                <CButton
                    preset="none-sm"
                    :disabled="pagination.currentPage === pagination.lastPage"
                    class="rounded px-3 py-1 disabled:opacity-50"
                    :class="{
                        'bg-gray-200': pagination.currentPage === pagination.lastPage,
                        'bg-blue-600 text-white': pagination.currentPage !== pagination.lastPage,
                    }"
                >
                    Next
                </CButton>
            </div>
        </div>

        <div v-else-if="hasAppliedFilters" class="rounded-lg bg-white border border-gray-200 p-8 text-center">
            <svg class="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
            </svg>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">No Entries Found</h3>
            <p class="text-gray-500">No entries match the selected filters. Try adjusting your filter criteria.</p>
        </div>
    </div>
</template>

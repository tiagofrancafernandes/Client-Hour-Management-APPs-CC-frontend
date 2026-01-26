<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useReports } from '@/composables/useReports';
import { useClients } from '@/composables/useClients';
import { useWallets } from '@/composables/useWallets';
import { useTags } from '@/composables/useTags';
import type { ReportFilters } from '@/types';

const { summary, entries, groupedData, loading, error, pagination, fetchReport } = useReports();
const { clients, fetchClients } = useClients();
const { wallets, fetchWallets } = useWallets();
const { tags, fetchTags } = useTags();

const filters = ref<ReportFilters>({
    client_id: undefined,
    wallet_id: undefined,
    date_from: '',
    date_to: '',
    tags: [],
    type: undefined,
    group_by: undefined,
});

onMounted(async () => {
    await Promise.all([fetchClients(1, ''), fetchWallets(), fetchTags(), fetchReport()]);
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

    await fetchReport(activeFilters);
}

function clearFilters() {
    filters.value = {
        client_id: undefined,
        wallet_id: undefined,
        date_from: '',
        date_to: '',
        tags: [],
        type: undefined,
        group_by: undefined,
    };

    fetchReport();
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
</script>

<template>
    <div class="container mx-auto px-4 py-8">
        <h1 class="mb-6 text-2xl font-bold text-gray-900">Reports</h1>

        <!-- Filters -->
        <div class="mb-6 rounded-lg bg-white p-4 shadow">
            <h2 class="mb-4 text-lg font-semibold">Filters</h2>
            <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div>
                    <label class="mb-1 block text-sm font-medium text-gray-700">Client</label>
                    <select
                        v-model="filters.client_id"
                        class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                    >
                        <option :value="undefined">All Clients</option>
                        <option v-for="client in clients" :key="client.id" :value="client.id">
                            {{ client.name }}
                        </option>
                    </select>
                </div>

                <div>
                    <label class="mb-1 block text-sm font-medium text-gray-700">Wallet</label>
                    <select
                        v-model="filters.wallet_id"
                        class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                    >
                        <option :value="undefined">All Wallets</option>
                        <option v-for="wallet in wallets" :key="wallet.id" :value="wallet.id">
                            {{ wallet.name }}
                        </option>
                    </select>
                </div>

                <div>
                    <label class="mb-1 block text-sm font-medium text-gray-700">Date From</label>
                    <input
                        v-model="filters.date_from"
                        type="date"
                        class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                    />
                </div>

                <div>
                    <label class="mb-1 block text-sm font-medium text-gray-700">Date To</label>
                    <input
                        v-model="filters.date_to"
                        type="date"
                        class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                    />
                </div>

                <div>
                    <label class="mb-1 block text-sm font-medium text-gray-700">Type</label>
                    <select
                        v-model="filters.type"
                        class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                    >
                        <option :value="undefined">All Types</option>
                        <option value="credit">Credits Only</option>
                        <option value="debit">Debits Only</option>
                    </select>
                </div>

                <div>
                    <label class="mb-1 block text-sm font-medium text-gray-700">Group By</label>
                    <select
                        v-model="filters.group_by"
                        class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                    >
                        <option :value="undefined">No Grouping</option>
                        <option value="wallet">By Wallet</option>
                        <option value="client">By Client</option>
                    </select>
                </div>

                <div class="lg:col-span-2">
                    <label class="mb-1 block text-sm font-medium text-gray-700">Tags</label>
                    <div class="flex flex-wrap gap-2">
                        <label
                            v-for="tag in tags"
                            :key="tag.id"
                            class="flex cursor-pointer items-center gap-1 rounded-full border px-2 py-1 text-sm"
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

            <div class="mt-4 flex gap-2">
                <button class="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700" @click="handleFilter">
                    Apply Filters
                </button>
                <button class="rounded-lg bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200" @click="clearFilters">
                    Clear
                </button>
            </div>
        </div>

        <div v-if="error" class="mb-4 rounded-lg bg-red-100 p-4 text-red-700">
            {{ error }}
        </div>

        <!-- Summary -->
        <div v-if="summary" class="mb-6 grid gap-4 md:grid-cols-4">
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

        <div v-if="loading" class="py-8 text-center">Loading...</div>

        <!-- Grouped Data -->
        <div v-else-if="groupedData.length > 0" class="overflow-hidden rounded-lg bg-white shadow">
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
        <div v-else-if="entries.length > 0" class="overflow-hidden rounded-lg bg-white shadow">
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
                <button
                    :disabled="pagination.currentPage === 1"
                    class="rounded px-3 py-1 disabled:opacity-50"
                    :class="{
                        'bg-gray-200': pagination.currentPage === 1,
                        'bg-blue-600 text-white': pagination.currentPage !== 1,
                    }"
                >
                    Previous
                </button>
                <span class="px-3 py-1">Page {{ pagination.currentPage }} of {{ pagination.lastPage }}</span>
                <button
                    :disabled="pagination.currentPage === pagination.lastPage"
                    class="rounded px-3 py-1 disabled:opacity-50"
                    :class="{
                        'bg-gray-200': pagination.currentPage === pagination.lastPage,
                        'bg-blue-600 text-white': pagination.currentPage !== pagination.lastPage,
                    }"
                >
                    Next
                </button>
            </div>
        </div>

        <div v-else class="py-8 text-center text-gray-500">No entries found matching the filters.</div>
    </div>
</template>

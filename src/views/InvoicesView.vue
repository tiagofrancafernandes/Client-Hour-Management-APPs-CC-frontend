<template>
    <div class="container mx-auto px-4 py-8">
        <div class="mb-6 flex items-center justify-between">
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Invoices</h1>
            <router-link
                v-if="canCreate"
                :to="{ name: 'invoice-create' }"
                class="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
            >
                <span>New Invoice</span>
            </router-link>
        </div>

        <div class="mb-6 rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div v-if="canViewAny">
                    <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Client
                    </label>
                    <select
                        v-model="filters.client_id"
                        class="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                    >
                        <option :value="undefined">All Clients</option>
                        <option v-for="client in clients" :key="client.id" :value="client.id">
                            {{ client.name }}
                        </option>
                    </select>
                </div>

                <div>
                    <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Status
                    </label>
                    <select
                        v-model="filters.status"
                        class="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                    >
                        <option :value="undefined">All Status</option>
                        <option value="draft">Draft</option>
                        <option value="sent">Sent</option>
                        <option value="paid">Paid</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>

                <div>
                    <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        From Date
                    </label>
                    <input
                        v-model="filters.from_date"
                        type="date"
                        class="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                    />
                </div>

                <div>
                    <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        To Date
                    </label>
                    <input
                        v-model="filters.to_date"
                        type="date"
                        class="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                    />
                </div>
            </div>

            <div class="mt-4 flex gap-2">
                <button
                    type="button"
                    class="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                    @click="handleSearch"
                >
                    Search
                </button>
                <button
                    type="button"
                    class="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                    @click="handleClearFilters"
                >
                    Clear
                </button>
            </div>
        </div>

        <div v-if="loading" class="text-center">
            <p class="text-gray-600 dark:text-gray-400">Loading invoices...</p>
        </div>

        <div v-else-if="error" class="rounded-lg bg-red-50 p-4 text-red-800 dark:bg-red-900 dark:text-red-200">
            {{ error }}
        </div>

        <div v-else-if="invoices.length === 0" class="rounded-lg bg-gray-50 p-8 text-center dark:bg-gray-800">
            <p class="text-gray-600 dark:text-gray-400">No invoices found</p>
        </div>

        <div v-else class="overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800">
            <table class="w-full">
                <thead class="bg-gray-50 dark:bg-gray-700">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-700 dark:text-gray-300">
                            Invoice #
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-700 dark:text-gray-300">
                            Client
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-700 dark:text-gray-300">
                            Date
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-700 dark:text-gray-300">
                            Total
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium uppercase text-gray-700 dark:text-gray-300">
                            Status
                        </th>
                        <th class="px-6 py-3 text-right text-xs font-medium uppercase text-gray-700 dark:text-gray-300">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                    <tr
                        v-for="invoice in invoices"
                        :key="invoice.id"
                        class="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                        <td class="whitespace-nowrap px-6 py-4">
                            <span class="font-medium text-gray-900 dark:text-white">
                                #{{ invoice.invoice_number }}
                            </span>
                        </td>
                        <td class="px-6 py-4">
                            <span class="text-gray-900 dark:text-white">
                                {{ invoice.client?.name || 'N/A' }}
                            </span>
                        </td>
                        <td class="whitespace-nowrap px-6 py-4">
                            <span class="text-gray-600 dark:text-gray-400">
                                {{ formatDate(invoice.issue_date) }}
                            </span>
                        </td>
                        <td class="whitespace-nowrap px-6 py-4">
                            <span class="font-medium text-gray-900 dark:text-white">
                                {{ invoice.currency }} {{ invoice.total }}
                            </span>
                        </td>
                        <td class="whitespace-nowrap px-6 py-4">
                            <span
                                :class="[
                                    'inline-flex rounded-full px-2 py-1 text-xs font-semibold',
                                    {
                                        'bg-gray-100 text-gray-800': invoice.status === 'draft',
                                        'bg-blue-100 text-blue-800': invoice.status === 'sent',
                                        'bg-green-100 text-green-800': invoice.status === 'paid',
                                        'bg-red-100 text-red-800': invoice.status === 'cancelled',
                                    },
                                ]"
                            >
                                {{ invoice.status }}
                            </span>
                        </td>
                        <td class="whitespace-nowrap px-6 py-4 text-right">
                            <router-link
                                :to="{ name: 'invoice-detail', params: { id: invoice.id } }"
                                class="text-red-600 hover:text-red-800"
                            >
                                View
                            </router-link>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div v-if="pagination.lastPage > 1" class="mt-6 flex items-center justify-between">
            <p class="text-sm text-gray-600 dark:text-gray-400">
                Showing {{ (pagination.currentPage - 1) * pagination.perPage + 1 }} to
                {{ Math.min(pagination.currentPage * pagination.perPage, pagination.total) }} of
                {{ pagination.total }} results
            </p>
            <div class="flex gap-2">
                <button
                    type="button"
                    :disabled="pagination.currentPage === 1"
                    class="rounded-lg border border-gray-300 px-4 py-2 disabled:opacity-50"
                    @click="goToPage(pagination.currentPage - 1)"
                >
                    Previous
                </button>
                <button
                    type="button"
                    :disabled="pagination.currentPage === pagination.lastPage"
                    class="rounded-lg border border-gray-300 px-4 py-2 disabled:opacity-50"
                    @click="goToPage(pagination.currentPage + 1)"
                >
                    Next
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useInvoices } from '@/composables/useInvoices';
import { useClients } from '@/composables/useClients';

const { invoices, loading, error, pagination, canViewAny, canCreate, fetchInvoices } = useInvoices();
const { clients, fetchClients } = useClients();

const filters = ref({
    client_id: undefined as number | undefined,
    status: undefined as string | undefined,
    from_date: undefined as string | undefined,
    to_date: undefined as string | undefined,
});

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

async function handleSearch() {
    await fetchInvoices({
        client_id: filters.value.client_id,
        status: filters.value.status,
        from_date: filters.value.from_date,
        to_date: filters.value.to_date,
        page: 1,
    });
}

function handleClearFilters() {
    filters.value = {
        client_id: undefined,
        status: undefined,
        from_date: undefined,
        to_date: undefined,
    };
    handleSearch();
}

async function goToPage(page: number) {
    await fetchInvoices({
        client_id: filters.value.client_id,
        status: filters.value.status,
        from_date: filters.value.from_date,
        to_date: filters.value.to_date,
        page,
    });
}

onMounted(async () => {
    await fetchInvoices();

    if (canViewAny.value) {
        await fetchClients();
    }
});
</script>

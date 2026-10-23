<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';
import { useInvoices } from '@composables/useInvoices';
import { useClients } from '@composables/useClients';
import { useToast } from '@composables/useToast';
import type { Invoice } from '@/types';
import {
    formatInvoiceCode,
    getInvoiceStatusBadgeClass,
    formatInvoiceDate,
    getInvoiceDownloadFilename,
} from '@utils/invoice-helpers';
import { formatCurrency } from '@utils/payment-helpers';
import InvoicePrintModal from '@/components/InvoicePrintModal.vue';

const router = useRouter();
const toast = useToast();

const {
    invoices,
    loading,
    error,
    pagination,
    canViewAny,
    canCreate,
    canViewDraft,
    fetchInvoices,
    deleteInvoice,
    downloadMarkdown,
    downloadPdf,
    canEditInvoice,
    canDeleteInvoice,
} = useInvoices();

const { clients, fetchClients } = useClients();

// ─── Filters & Search State ──────────────────────────────────────────────────
const showFilters = ref(true);
const searchQuery = ref('');
const sortBy = ref('issue_date');
const sortDirection = ref<'asc' | 'desc'>('desc');
const perPage = ref(15);

const filters = ref({
    client_id: null as number | null,
    status: null as string | null,
    from_date: '',
    to_date: '',
});

let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

const activeFiltersCount = computed(() => {
    let count = 0;

    if (searchQuery.value.trim()) count++;
    if (filters.value.client_id) count++;
    if (filters.value.status) count++;
    if (filters.value.from_date) count++;
    if (filters.value.to_date) count++;

    return count;
});

const clientOptions = computed(() => {
    return clients.value.map((client) => ({
        value: client.id,
        label: client.name,
    }));
});

const statusOptions = computed(() => {
    const options = [
        { value: 'sent', label: 'Sent' },
        { value: 'paid', label: 'Paid' },
        { value: 'cancelled', label: 'Cancelled' },
    ];

    if (canViewDraft.value) {
        options.unshift({ value: 'draft', label: 'Draft' });
    }

    return options;
});

// ─── Delete Modal State ──────────────────────────────────────────────────────
const showDeleteConfirmModal = ref(false);
const invoiceToDelete = ref<Invoice | null>(null);
const deletingInvoice = ref(false);

function openDeleteModal(invoice: Invoice): void {
    invoiceToDelete.value = invoice;
    showDeleteConfirmModal.value = true;
}

async function handleDeleteConfirm(): Promise<void> {
    if (!invoiceToDelete.value) {
        return;
    }

    deletingInvoice.value = true;

    try {
        await deleteInvoice(invoiceToDelete.value.id);
        toast.success(`Invoice ${formatInvoiceCode(invoiceToDelete.value)} deleted successfully`);
        showDeleteConfirmModal.value = false;
        invoiceToDelete.value = null;
        await loadInvoices();
    } catch {
        toast.error('Failed to delete invoice');
    } finally {
        deletingInvoice.value = false;
    }
}

// ─── Data Fetching ───────────────────────────────────────────────────────────
async function loadInvoices(page = 1): Promise<void> {
    await fetchInvoices({
        search: searchQuery.value.trim() || undefined,
        client_id: filters.value.client_id || undefined,
        status: filters.value.status || undefined,
        from_date: filters.value.from_date || undefined,
        to_date: filters.value.to_date || undefined,
        sort_by: sortBy.value,
        sort_direction: sortDirection.value,
        per_page: perPage.value,
        page,
    });
}

watch(
    () => filters.value.client_id,
    () => {
        loadInvoices(1);
    }
);

watch(searchQuery, () => {
    if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer);
    }

    searchDebounceTimer = setTimeout(() => {
        loadInvoices(1);
    }, 400);
});

function handleSort(column: string): void {
    if (sortBy.value === column) {
        sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
    } else {
        sortBy.value = column;
        sortDirection.value = 'desc';
    }

    loadInvoices(1);
}

function handleClearFilters(): void {
    searchQuery.value = '';
    filters.value = {
        client_id: null,
        status: null,
        from_date: '',
        to_date: '',
    };

    loadInvoices(1);
}

function handlePerPageChange(): void {
    loadInvoices(1);
}

function goToPage(page: number): void {
    loadInvoices(page);
}

function goToInvoice(invoice: Invoice): void {
    router.push({ name: 'invoice-detail', params: { id: invoice.id } });
}

function goToEdit(invoice: Invoice): void {
    router.push({ name: 'invoice-edit', params: { id: invoice.id } });
}

function goToCreate(): void {
    router.push({ name: 'invoice-create' });
}

const showPrintModal = ref(false);
const printModalInvoice = ref<Invoice | null>(null);

function openPrintModal(invoice: Invoice): void {
    printModalInvoice.value = invoice;
    showPrintModal.value = true;
}

function closePrintModal(): void {
    showPrintModal.value = false;
    printModalInvoice.value = null;
}

async function handleDownloadMarkdown(invoice: Invoice): Promise<void> {
    try {
        const markdown = await downloadMarkdown(invoice.id);
        const blob = new Blob([markdown], { type: 'text/markdown' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = getInvoiceDownloadFilename(invoice, 'md');
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success('Markdown downloaded successfully');
    } catch {
        toast.error('Failed to download markdown');
    }
}

async function handleDownloadPdf(invoice: Invoice): Promise<void> {
    try {
        const filename = getInvoiceDownloadFilename(invoice, 'pdf');
        await downloadPdf(invoice.id, filename);
        toast.success('PDF downloaded successfully');
    } catch {
        toast.error('Failed to download PDF');
    }
}

onMounted(async () => {
    await loadInvoices();

    if (canViewAny.value) {
        await fetchClients();
    }
});
</script>

<template>
    <div class="container mx-auto px-4 py-8 max-w-7xl">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 shadow-xs">
                    <Icon icon="mdi:receipt-text-outline" class="w-6 h-6 text-red-600" />
                </div>
                <div>
                    <h1 class="text-2xl font-bold text-gray-900">Invoices</h1>
                    <p class="text-sm text-gray-500">Manage client invoices, billing, and services</p>
                </div>
            </div>

            <div class="flex items-center gap-3">
                <button
                    type="button"
                    @click="showFilters = !showFilters"
                    :class="[
                        'inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors cursor-pointer',
                        {
                            'bg-red-50 text-red-700 border-red-200': showFilters,
                            'bg-white text-gray-700 border-gray-300 hover:bg-gray-50': !showFilters,
                        },
                    ]"
                >
                    <Icon icon="mdi:filter-outline" class="w-4 h-4" />
                    Filters
                    <span
                        v-if="activeFiltersCount > 0"
                        class="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-semibold bg-red-600 text-white"
                    >
                        {{ activeFiltersCount }}
                    </span>
                </button>

                <button
                    type="button"
                    @click="loadInvoices(pagination.currentPage)"
                    :disabled="loading"
                    class="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors cursor-pointer"
                >
                    <Icon icon="mdi:refresh" :class="['w-4 h-4', { 'animate-spin': loading }]" />
                    Refresh
                </button>

                <CButton v-if="canCreate" preset="primary-md" @click="goToCreate">
                    <Icon icon="mdi:plus" class="w-4 h-4 mr-1.5" />
                    New Invoice
                </CButton>
            </div>
        </div>

        <!-- Error state -->
        <div v-if="error" class="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
            {{ error }}
        </div>

        <!-- Filter panel -->
        <div v-if="showFilters" class="mb-5 rounded-xl border border-gray-200 bg-white shadow-sm p-5">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <!-- Search -->
                <div class="space-y-1 sm:col-span-2">
                    <label class="block text-xs font-medium text-gray-600 uppercase tracking-wide">Search</label>
                    <div class="relative">
                        <Icon
                            icon="mdi:magnify"
                            class="w-5 h-5 absolute left-3 top-2.5 text-gray-400 pointer-events-none"
                        />
                        <input
                            v-model="searchQuery"
                            type="text"
                            placeholder="Search by #C12-I005, client, notes, item..."
                            class="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                    </div>
                </div>

                <!-- Client filter -->
                <div v-if="canViewAny" class="space-y-1">
                    <CTypeahead
                        label="Client"
                        v-model="filters.client_id"
                        :initialOptions="clientOptions"
                        placeholder="All Clients"
                        clearable
                        label-classes="block text-xs font-medium text-gray-600 uppercase tracking-wide"
                    />
                </div>

                <!-- Status filter -->
                <div class="space-y-1">
                    <label class="block text-xs font-medium text-gray-600 uppercase tracking-wide">Status</label>
                    <select
                        v-model="filters.status"
                        @change="loadInvoices(1)"
                        class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                        <option :value="null">All Statuses</option>
                        <option v-for="s in statusOptions" :key="s.value" :value="s.value">
                            {{ s.label }}
                        </option>
                    </select>
                </div>

                <!-- Clear filters button -->
                <div class="flex items-end">
                    <button
                        v-if="activeFiltersCount > 0"
                        type="button"
                        @click="handleClearFilters"
                        class="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-red-600 transition-colors cursor-pointer"
                    >
                        <Icon icon="mdi:filter-off-outline" class="w-4 h-4" />
                        Clear all
                    </button>
                </div>
            </div>
        </div>

        <!-- Table Card -->
        <div class="relative bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <!-- Loading overlay -->
            <div
                v-if="loading"
                class="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center pointer-events-none"
            >
                <div
                    class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white shadow-md border border-gray-200 text-sm font-medium text-gray-700"
                >
                    <Icon icon="mdi:loading" class="w-4 h-4 animate-spin text-red-600" />
                    Updating…
                </div>
            </div>

            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead>
                        <tr class="bg-gray-50">
                            <!-- Invoice Code -->
                            <th
                                class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none"
                                @click="handleSort('client_invoice_number')"
                            >
                                <div class="inline-flex items-center gap-1">
                                    Invoice
                                    <Icon
                                        v-if="sortBy === 'client_invoice_number'"
                                        :icon="sortDirection === 'asc' ? 'mdi:arrow-up' : 'mdi:arrow-down'"
                                        class="w-3.5 h-3.5 text-red-600"
                                    />
                                </div>
                            </th>

                            <!-- Client -->
                            <th
                                v-if="canViewAny"
                                class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                            >
                                Client
                            </th>

                            <!-- Issue Date -->
                            <th
                                class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none"
                                @click="handleSort('issue_date')"
                            >
                                <div class="inline-flex items-center gap-1">
                                    Issue Date
                                    <Icon
                                        v-if="sortBy === 'issue_date'"
                                        :icon="sortDirection === 'asc' ? 'mdi:arrow-up' : 'mdi:arrow-down'"
                                        class="w-3.5 h-3.5 text-red-600"
                                    />
                                </div>
                            </th>

                            <!-- Due Date -->
                            <th
                                class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none"
                                @click="handleSort('due_date')"
                            >
                                <div class="inline-flex items-center gap-1">
                                    Due Date
                                    <Icon
                                        v-if="sortBy === 'due_date'"
                                        :icon="sortDirection === 'asc' ? 'mdi:arrow-up' : 'mdi:arrow-down'"
                                        class="w-3.5 h-3.5 text-red-600"
                                    />
                                </div>
                            </th>

                            <!-- Total -->
                            <th
                                class="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none"
                                @click="handleSort('total')"
                            >
                                <div class="inline-flex items-center gap-1">
                                    Total
                                    <Icon
                                        v-if="sortBy === 'total'"
                                        :icon="sortDirection === 'asc' ? 'mdi:arrow-up' : 'mdi:arrow-down'"
                                        class="w-3.5 h-3.5 text-red-600"
                                    />
                                </div>
                            </th>

                            <!-- Status -->
                            <th
                                class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none"
                                @click="handleSort('status')"
                            >
                                <div class="inline-flex items-center gap-1">
                                    Status
                                    <Icon
                                        v-if="sortBy === 'status'"
                                        :icon="sortDirection === 'asc' ? 'mdi:arrow-up' : 'mdi:arrow-down'"
                                        class="w-3.5 h-3.5 text-red-600"
                                    />
                                </div>
                            </th>

                            <!-- Actions -->
                            <th
                                class="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider"
                            >
                                Actions
                            </th>
                        </tr>
                    </thead>

                    <tbody class="divide-y divide-gray-100">
                        <tr
                            v-for="inv in invoices"
                            :key="inv.id"
                            class="hover:bg-gray-50 transition-colors cursor-pointer"
                            @click="goToInvoice(inv)"
                        >
                            <!-- Invoice Code -->
                            <td class="px-4 py-3.5 whitespace-nowrap">
                                <span
                                    class="font-mono text-sm font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200/80 inline-flex items-center gap-1"
                                >
                                    {{ formatInvoiceCode(inv) }}
                                </span>
                            </td>

                            <!-- Client -->
                            <td
                                v-if="canViewAny"
                                class="px-4 py-3.5 text-sm text-gray-900 whitespace-nowrap font-medium"
                            >
                                {{ inv.client?.name || '—' }}
                            </td>

                            <!-- Issue Date -->
                            <td class="px-4 py-3.5 text-sm text-gray-600 whitespace-nowrap">
                                {{ formatInvoiceDate(inv.issue_date) }}
                            </td>

                            <!-- Due Date -->
                            <td class="px-4 py-3.5 text-sm text-gray-600 whitespace-nowrap">
                                {{ formatInvoiceDate(inv.due_date) }}
                            </td>

                            <!-- Total -->
                            <td class="px-4 py-3.5 text-sm font-semibold text-gray-900 text-right whitespace-nowrap">
                                {{ formatCurrency(inv.total, inv.currency) }}
                            </td>

                            <!-- Status -->
                            <td class="px-4 py-3.5 whitespace-nowrap">
                                <span
                                    :class="[
                                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border',
                                        getInvoiceStatusBadgeClass(inv.status),
                                    ]"
                                >
                                    {{ inv.status }}
                                </span>
                            </td>

                            <!-- Actions -->
                            <td class="px-4 py-3.5 text-right whitespace-nowrap" @click.stop>
                                <div class="inline-flex items-center gap-1.5 justify-end">
                                    <button
                                        type="button"
                                        @click="goToInvoice(inv)"
                                        class="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                        title="View Details"
                                    >
                                        <Icon icon="mdi:eye-outline" class="w-4 h-4" />
                                    </button>

                                    <button
                                        v-if="canEditInvoice(inv)"
                                        type="button"
                                        @click="goToEdit(inv)"
                                        class="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                        title="Edit Invoice"
                                    >
                                        <Icon icon="mdi:pencil-outline" class="w-4 h-4" />
                                    </button>

                                    <!-- Print / PDF Preview -->
                                    <button
                                        type="button"
                                        @click="openPrintModal(inv)"
                                        class="p-1.5 text-gray-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                        title="Print / PDF Preview"
                                    >
                                        <Icon icon="mdi:printer-outline" class="w-4 h-4" />
                                    </button>

                                    <!-- Download PDF -->
                                    <button
                                        type="button"
                                        @click="handleDownloadPdf(inv)"
                                        class="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                        title="Download PDF"
                                    >
                                        <Icon icon="mdi:file-pdf-box" class="w-4 h-4" />
                                    </button>

                                    <!-- Download Markdown -->
                                    <button
                                        type="button"
                                        @click="handleDownloadMarkdown(inv)"
                                        class="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                        title="Download Markdown"
                                    >
                                        <Icon icon="mdi:language-markdown" class="w-4 h-4" />
                                    </button>

                                    <button
                                        v-if="canDeleteInvoice(inv)"
                                        type="button"
                                        @click="openDeleteModal(inv)"
                                        class="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                        title="Delete Invoice"
                                    >
                                        <Icon icon="mdi:trash-can-outline" class="w-4 h-4" />
                                    </button>
                                </div>
                            </td>
                        </tr>

                        <!-- Empty state -->
                        <tr v-if="invoices.length === 0 && !loading">
                            <td :colspan="canViewAny ? 7 : 6" class="px-6 py-12 text-center">
                                <Icon icon="mdi:receipt-text-outline" class="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <h3 class="text-base font-semibold text-gray-900">No invoices found</h3>
                                <p class="text-sm text-gray-500 mt-1">Try adjusting your filters or search keywords.</p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Footer & Pagination -->
            <div
                class="px-5 py-3.5 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-3"
            >
                <div class="flex items-center gap-4 text-xs text-gray-500">
                    <span>Showing {{ invoices.length }} of {{ pagination.total }} invoices</span>

                    <div class="flex items-center gap-1.5">
                        <span>Per page:</span>
                        <select
                            v-model.number="perPage"
                            @change="handlePerPageChange"
                            class="bg-white border border-gray-300 rounded px-2 py-0.5 text-xs text-gray-700 focus:outline-none"
                        >
                            <option :value="10">10</option>
                            <option :value="15">15</option>
                            <option :value="25">25</option>
                            <option :value="50">50</option>
                        </select>
                    </div>
                </div>

                <div v-if="pagination.lastPage > 1" class="flex items-center gap-1.5">
                    <button
                        type="button"
                        :disabled="pagination.currentPage <= 1 || loading"
                        @click="goToPage(pagination.currentPage - 1)"
                        class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                        <Icon icon="mdi:chevron-left" class="w-4 h-4" />
                        Previous
                    </button>

                    <span class="text-xs text-gray-600 px-2">
                        Page {{ pagination.currentPage }} of {{ pagination.lastPage }}
                    </span>

                    <button
                        type="button"
                        :disabled="pagination.currentPage >= pagination.lastPage || loading"
                        @click="goToPage(pagination.currentPage + 1)"
                        class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                        Next
                        <Icon icon="mdi:chevron-right" class="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>

        <!-- Delete Confirmation Modal -->
        <ConfirmModal
            v-model:isOpen="showDeleteConfirmModal"
            title="Delete Invoice?"
            :message="`Are you sure you want to delete invoice ${formatInvoiceCode(invoiceToDelete)}? This action cannot be undone.`"
            confirmText="Yes, Delete"
            cancelText="Keep Invoice"
            variant="danger"
            @confirm="handleDeleteConfirm"
        />

        <!-- Print & PDF Preview Modal -->
        <InvoicePrintModal
            :show="showPrintModal"
            :invoice="printModalInvoice"
            @close="closePrintModal"
            @download-pdf="handleDownloadPdf"
            @download-markdown="handleDownloadMarkdown"
        />
    </div>
</template>

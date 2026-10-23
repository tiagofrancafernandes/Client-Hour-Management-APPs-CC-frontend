<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';
import { useInvoices } from '@composables/useInvoices';
import { useToast } from '@composables/useToast';
import {
    formatInvoiceCode,
    getInvoiceStatusBadgeClass,
    formatInvoiceDate,
    getInvoiceDownloadFilename,
} from '@utils/invoice-helpers';
import { formatCurrency } from '@utils/payment-helpers';
import InvoicePrintModal from '@/components/InvoicePrintModal.vue';

const route = useRoute();
const router = useRouter();
const toast = useToast();

const {
    invoice,
    loading,
    error,
    fetchInvoice,
    deleteInvoice,
    downloadMarkdown,
    downloadPdf,
    canEditInvoice,
    canDeleteInvoice,
} = useInvoices();

const showDeleteConfirmModal = ref(false);
const deletingInvoice = ref(false);
const showPrintModal = ref(false);

function handleEdit(): void {
    router.push({ name: 'invoice-edit', params: { id: route.params.id } });
}

function openPrintModal(): void {
    showPrintModal.value = true;
}

function closePrintModal(): void {
    showPrintModal.value = false;
}

async function handleDownloadMarkdown(): Promise<void> {
    if (!invoice.value) {
        return;
    }

    try {
        const markdown = await downloadMarkdown(invoice.value.id);
        const blob = new Blob([markdown], { type: 'text/markdown' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = getInvoiceDownloadFilename(invoice.value, 'md');
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success('Markdown downloaded successfully');
    } catch {
        toast.error('Failed to download markdown');
    }
}

async function handleDownloadPdf(): Promise<void> {
    if (!invoice.value) {
        return;
    }

    try {
        const filename = getInvoiceDownloadFilename(invoice.value, 'pdf');
        await downloadPdf(invoice.value.id, filename);
        toast.success('PDF downloaded successfully');
    } catch {
        toast.error('Failed to download PDF');
    }
}

function openDeleteModal(): void {
    showDeleteConfirmModal.value = true;
}

async function handleDeleteConfirm(): Promise<void> {
    if (!invoice.value) {
        return;
    }

    deletingInvoice.value = true;

    try {
        await deleteInvoice(invoice.value.id);
        toast.success(`Invoice ${formatInvoiceCode(invoice.value)} deleted successfully`);
        router.push({ name: 'invoices' });
    } catch {
        toast.error('Failed to delete invoice');
    } finally {
        deletingInvoice.value = false;
        showDeleteConfirmModal.value = false;
    }
}

onMounted(async () => {
    await fetchInvoice(Number(route.params.id));
});
</script>

<template>
    <div class="container mx-auto px-4 py-8 max-w-5xl">
        <!-- Loading state -->
        <div v-if="loading" class="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
            <Icon icon="mdi:loading" class="w-8 h-8 animate-spin text-red-600 mx-auto mb-2" />
            <p class="text-sm text-gray-500">Loading invoice details...</p>
        </div>

        <!-- Error state -->
        <div v-else-if="error" class="rounded-xl bg-red-50 border border-red-200 p-6 text-red-700">
            <div class="flex items-center gap-3">
                <Icon icon="mdi:alert-circle-outline" class="w-6 h-6 shrink-0" />
                <div>
                    <h3 class="text-base font-semibold">Failed to load invoice</h3>
                    <p class="text-sm mt-0.5">{{ error }}</p>
                </div>
            </div>
            <button
                type="button"
                @click="router.push({ name: 'invoices' })"
                class="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-red-700 hover:text-red-900 cursor-pointer"
            >
                <Icon icon="mdi:arrow-left" class="w-4 h-4" />
                Back to invoices
            </button>
        </div>

        <!-- Content -->
        <div v-else-if="invoice" class="space-y-6">
            <!-- Header bar -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div class="flex items-center gap-3">
                    <button
                        type="button"
                        @click="router.push({ name: 'invoices' })"
                        class="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Back to invoices"
                    >
                        <Icon icon="mdi:arrow-left" class="w-5 h-5" />
                    </button>
                    <div>
                        <div class="flex items-center gap-2">
                            <h1 class="text-lg sm:text-xl font-semibold text-slate-900 tracking-tight">Invoice</h1>
                            <span
                                class="font-mono text-xs font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs"
                            >
                                {{ formatInvoiceCode(invoice) }}
                            </span>
                        </div>
                        <p class="text-xs text-slate-500 mt-0.5">
                            Issued for
                            <span class="font-medium text-slate-800">{{ invoice.client?.name }}</span>
                        </p>
                    </div>
                </div>

                <div class="flex items-center gap-1.5 flex-wrap justify-end">
                    <button
                        v-if="canEditInvoice(invoice)"
                        type="button"
                        @click="handleEdit"
                        class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                    >
                        <Icon icon="mdi:pencil-outline" class="w-3.5 h-3.5" />
                        Edit
                    </button>

                    <!-- Print -->
                    <button
                        type="button"
                        @click="openPrintModal"
                        class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                    >
                        <Icon icon="mdi:printer-outline" class="w-3.5 h-3.5" />
                        Print
                    </button>

                    <!-- Download PDF -->
                    <button
                        type="button"
                        @click="handleDownloadPdf"
                        class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                    >
                        <Icon icon="mdi:file-pdf-box" class="w-3.5 h-3.5 text-red-600" />
                        Download PDF
                    </button>

                    <!-- Download Markdown -->
                    <button
                        type="button"
                        @click="handleDownloadMarkdown"
                        class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                    >
                        <Icon icon="mdi:language-markdown" class="w-3.5 h-3.5 text-slate-600" />
                        Markdown
                    </button>

                    <button
                        v-if="canDeleteInvoice(invoice)"
                        type="button"
                        @click="openDeleteModal"
                        class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors cursor-pointer"
                    >
                        <Icon icon="mdi:trash-can-outline" class="w-3.5 h-3.5" />
                        Delete
                    </button>
                </div>
            </div>

            <!-- Details Card -->
            <div class="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs space-y-5">
                <!-- Summary Meta Grid -->
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-5 border-b border-gray-100">
                    <div>
                        <span class="block text-2xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                            Client
                        </span>
                        <p class="text-xs font-semibold text-slate-900">{{ invoice.client?.name || '—' }}</p>
                    </div>

                    <div>
                        <span class="block text-2xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                            Issue Date
                        </span>
                        <p class="text-xs font-medium text-slate-800">{{ formatInvoiceDate(invoice.issue_date) }}</p>
                    </div>

                    <div>
                        <span class="block text-2xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                            Due Date
                        </span>
                        <p class="text-xs font-medium text-slate-800">{{ formatInvoiceDate(invoice.due_date) }}</p>
                    </div>

                    <div>
                        <span class="block text-2xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                            Status
                        </span>
                        <span
                            :class="[
                                'inline-flex items-center px-2 py-0.5 rounded-md text-2xs font-medium border capitalize',
                                getInvoiceStatusBadgeClass(invoice.status),
                            ]"
                        >
                            {{ invoice.status }}
                        </span>
                    </div>
                </div>

                <!-- Line Items Table -->
                <div>
                    <h3 class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Line Items</h3>
                    <div class="overflow-x-auto border border-gray-200 rounded-lg">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th
                                        class="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                                    >
                                        #
                                    </th>
                                    <th
                                        class="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                                    >
                                        Description
                                    </th>
                                    <th
                                        class="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                                    >
                                        Unit
                                    </th>
                                    <th
                                        class="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider"
                                    >
                                        Quantity
                                    </th>
                                    <th
                                        class="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider"
                                    >
                                        Unit Price
                                    </th>
                                    <th
                                        class="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider"
                                    >
                                        Total
                                    </th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-100 bg-white">
                                <tr v-for="(item, idx) in invoice.items" :key="item.id || idx">
                                    <td class="px-4 py-3 text-xs text-gray-400 font-mono">{{ idx + 1 }}</td>
                                    <td class="px-4 py-3 text-sm text-gray-900 font-medium">
                                        {{ item.description }}
                                    </td>
                                    <td class="px-4 py-3 text-xs text-gray-600">{{ item.unit || 'unit' }}</td>
                                    <td class="px-4 py-3 text-sm text-gray-800 text-right">{{ item.quantity }}</td>
                                    <td class="px-4 py-3 text-sm text-gray-800 text-right">
                                        {{ formatCurrency(item.unit_price, invoice.currency) }}
                                    </td>
                                    <td class="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                                        {{ formatCurrency(item.line_total, invoice.currency) }}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Bottom Grid: Notes & Totals -->
                <div class="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
                    <!-- Notes -->
                    <div class="md:col-span-7">
                        <div v-if="invoice.notes" class="rounded-xl bg-gray-50 border border-gray-200 p-4 space-y-1.5">
                            <h4 class="text-xs font-bold uppercase tracking-wider text-gray-500">
                                Notes & Instructions
                            </h4>
                            <p class="text-sm text-gray-700 whitespace-pre-wrap">{{ invoice.notes }}</p>
                        </div>
                    </div>

                    <!-- Totals Box -->
                    <div class="md:col-span-5">
                        <div class="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2.5 text-sm">
                            <div class="flex justify-between text-slate-600">
                                <span>Subtotal</span>
                                <span class="font-medium text-slate-900">
                                    {{ formatCurrency(invoice.subtotal, invoice.currency) }}
                                </span>
                            </div>

                            <div v-if="Number(invoice.tax_percentage) > 0" class="flex justify-between text-slate-600">
                                <span>Tax ({{ invoice.tax_percentage }}%)</span>
                                <span class="font-medium text-slate-900">
                                    + {{ formatCurrency(invoice.tax_amount, invoice.currency) }}
                                </span>
                            </div>

                            <div v-if="Number(invoice.discount_amount) > 0" class="flex justify-between text-slate-600">
                                <span>Discount</span>
                                <span class="font-medium text-red-600">
                                    - {{ formatCurrency(invoice.discount_amount, invoice.currency) }}
                                </span>
                            </div>

                            <div class="border-t border-slate-200 pt-2 flex justify-between items-baseline">
                                <span class="text-base font-bold text-slate-900">Total Due</span>
                                <div class="text-right">
                                    <span class="text-xl font-extrabold text-red-600 tracking-tight">
                                        {{ formatCurrency(invoice.total, invoice.currency) }}
                                    </span>
                                    <span class="text-xs text-slate-400 block font-medium">{{ invoice.currency }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Delete Confirmation Modal -->
        <ConfirmModal
            v-model:isOpen="showDeleteConfirmModal"
            title="Delete Invoice?"
            :message="`Are you sure you want to delete invoice ${formatInvoiceCode(invoice)}? This action cannot be undone.`"
            confirmText="Yes, Delete"
            cancelText="Keep Invoice"
            variant="danger"
            @confirm="handleDeleteConfirm"
        />

        <!-- Print & PDF Preview Modal -->
        <InvoicePrintModal
            :show="showPrintModal"
            :invoice="invoice"
            @close="closePrintModal"
            @download-pdf="handleDownloadPdf"
            @download-markdown="handleDownloadMarkdown"
        />
    </div>
</template>

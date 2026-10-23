<script setup lang="ts">
import { computed } from 'vue';
import { Icon } from '@iconify/vue';
import type { Invoice } from '@/types';
import { formatCurrency } from '@utils/payment-helpers';
import { formatInvoiceCode, formatInvoiceDate } from '@utils/invoice-helpers';
import CButton from '@/components/CButton.vue';

interface Props {
    show: boolean;
    invoice: Invoice | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
    close: [];
    'download-pdf': [invoice: Invoice];
    'download-markdown': [invoice: Invoice];
}>();

const invoiceCode = computed(() => {
    return formatInvoiceCode(props.invoice);
});

function handlePrint(): void {
    window.print();
}

function handleClose(): void {
    emit('close');
}
</script>

<template>
    <div
        v-if="show && invoice"
        class="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150 print:p-0 print:bg-white print:static print:inset-auto"
    >
        <!-- Modal Card Container -->
        <div
            class="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden border border-slate-200 print:border-none print:shadow-none print:max-h-none print:w-full print:rounded-none"
        >
            <!-- Fixed Modal Action Header (hidden on print) -->
            <div
                class="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden"
            >
                <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-bold">
                        <Icon icon="mdi:receipt-text-outline" class="w-5 h-5" />
                    </div>
                    <div>
                        <h2 class="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                            Print & PDF Preview
                            <span class="font-mono text-red-600 font-bold">{{ invoiceCode }}</span>
                        </h2>
                        <p class="text-xs text-slate-500">Ready to print or export as PDF document</p>
                    </div>
                </div>

                <div class="flex items-center gap-2">
                    <!-- Print Button -->
                    <CButton preset="red" type="button" @click="handlePrint">
                        <Icon icon="mdi:printer" class="w-4 h-4 mr-1.5" />
                        <span>Print / Save as PDF</span>
                    </CButton>

                    <!-- Download PDF Button -->
                    <CButton
                        preset="outlined-black"
                        type="button"
                        @click="emit('download-pdf', invoice)"
                        title="Download standard PDF file"
                    >
                        <Icon icon="mdi:file-pdf-box" class="w-4 h-4 mr-1 text-red-600" />
                        <span>Download PDF</span>
                    </CButton>

                    <!-- Download Markdown Button -->
                    <CButton
                        preset="outlined-black"
                        type="button"
                        @click="emit('download-markdown', invoice)"
                        title="Download Markdown file"
                    >
                        <Icon icon="mdi:language-markdown" class="w-4 h-4 mr-1 text-slate-600" />
                        <span>Markdown</span>
                    </CButton>

                    <button
                        type="button"
                        @click="handleClose"
                        class="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer ml-1"
                        title="Close preview"
                    >
                        <Icon icon="mdi:close" class="w-5 h-5" />
                    </button>
                </div>
            </div>

            <!-- Scrollable Document Preview Body -->
            <div
                class="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100/60 print:p-0 print:overflow-visible print:bg-white"
            >
                <!-- Printable Sheet -->
                <div
                    id="invoicePrintSheet"
                    class="bg-white rounded-xl shadow-xs border border-slate-200/90 p-8 sm:p-10 max-w-3xl mx-auto print:border-none print:shadow-none print:p-0 print:max-w-none text-slate-800"
                >
                    <!-- Invoice Header -->
                    <div class="flex justify-between items-start border-b-2 border-slate-200 pb-6 mb-6">
                        <div>
                            <span class="text-xs font-bold tracking-widest uppercase text-slate-400">Invoice</span>
                            <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">
                                {{ invoiceCode }}
                            </h1>
                            <div class="mt-2 flex items-center gap-2">
                                <span
                                    class="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border"
                                    :class="[
                                        {
                                            'bg-emerald-50 text-emerald-700 border-emerald-200':
                                                invoice.status === 'paid',
                                            'bg-blue-50 text-blue-700 border-blue-200': invoice.status === 'sent',
                                            'bg-slate-100 text-slate-700 border-slate-200': invoice.status === 'draft',
                                            'bg-red-50 text-red-700 border-red-200': invoice.status === 'cancelled',
                                        },
                                    ]"
                                >
                                    {{ invoice.status }}
                                </span>
                                <span class="text-xs font-mono text-slate-400">Ref: {{ invoice.invoice_number }}</span>
                            </div>
                        </div>

                        <!-- Issuer Details -->
                        <div class="text-right text-xs text-slate-600 space-y-1">
                            <div class="text-base font-bold text-slate-900">
                                {{ invoice.issued_by?.name || 'Hour Ledger System' }}
                            </div>
                            <div v-if="invoice.issued_by?.address" class="whitespace-pre-line text-slate-500">
                                {{ invoice.issued_by.address }}
                            </div>
                            <div v-if="invoice.issued_by?.email" class="text-slate-500">
                                {{ invoice.issued_by.email }}
                            </div>
                        </div>
                    </div>

                    <!-- Client & Details Grid -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 text-xs">
                        <!-- Bill To -->
                        <div class="bg-slate-50/70 rounded-xl p-4 border border-slate-200/80">
                            <span class="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                                Bill To
                            </span>
                            <div class="text-sm font-bold text-slate-900">
                                {{ invoice.bill_to?.name || invoice.client?.name || 'Client' }}
                            </div>
                            <div v-if="invoice.bill_to?.attention" class="text-slate-600 mt-0.5">
                                Attn: {{ invoice.bill_to.attention }}
                            </div>
                            <div v-if="invoice.bill_to?.address" class="text-slate-500 whitespace-pre-line mt-1">
                                {{ invoice.bill_to.address }}
                            </div>
                            <div v-if="invoice.bill_to?.email" class="text-slate-500 mt-1">
                                {{ invoice.bill_to.email }}
                            </div>
                        </div>

                        <!-- Meta Info -->
                        <div class="bg-slate-50/70 rounded-xl p-4 border border-slate-200/80 space-y-2">
                            <span class="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                                Invoice Details
                            </span>
                            <div class="flex justify-between">
                                <span class="text-slate-500">Invoice Code:</span>
                                <span class="font-mono font-bold text-slate-900">{{ invoiceCode }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-slate-500">Issue Date:</span>
                                <span class="font-semibold text-slate-900">
                                    {{ formatInvoiceDate(invoice.issue_date) }}
                                </span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-slate-500">Due Date:</span>
                                <span class="font-semibold text-slate-900">
                                    {{ formatInvoiceDate(invoice.due_date) }}
                                </span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-slate-500">Currency:</span>
                                <span class="font-bold text-slate-900">{{ invoice.currency }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Line Items Table -->
                    <div class="overflow-x-auto mb-6">
                        <table class="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr
                                    class="border-y border-slate-200 bg-slate-50/80 text-xs font-bold text-slate-600 uppercase tracking-wider"
                                >
                                    <th class="py-2.5 px-3 w-10 text-center">#</th>
                                    <th class="py-2.5 px-3">Description</th>
                                    <th class="py-2.5 px-3 w-20 text-center">Unit</th>
                                    <th class="py-2.5 px-3 w-20 text-center">Qty</th>
                                    <th class="py-2.5 px-3 w-28 text-right">Unit Price</th>
                                    <th class="py-2.5 px-3 w-28 text-right">Line Total</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100">
                                <tr v-for="(item, idx) in invoice.items" :key="item.id || idx">
                                    <td class="py-3 px-3 text-center text-slate-400 font-mono">{{ idx + 1 }}</td>
                                    <td class="py-3 px-3">
                                        <div class="font-bold text-slate-900">{{ item.description }}</div>
                                        <div v-if="item.product_service?.name" class="text-xs text-slate-500 mt-0.5">
                                            Preset: {{ item.product_service.name }} ({{ item.product_service.type }})
                                        </div>
                                    </td>
                                    <td class="py-3 px-3 text-center text-slate-600 font-mono">
                                        {{ item.unit || 'unit' }}
                                    </td>
                                    <td class="py-3 px-3 text-center font-mono">
                                        {{ Number(item.quantity).toFixed(2) }}
                                    </td>
                                    <td class="py-3 px-3 text-right font-mono">
                                        {{ formatCurrency(item.unit_price, invoice.currency) }}
                                    </td>
                                    <td class="py-3 px-3 text-right font-mono font-bold text-slate-900">
                                        {{
                                            formatCurrency(
                                                Number(item.quantity) * Number(item.unit_price),
                                                invoice.currency
                                            )
                                        }}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Totals Summary -->
                    <div class="flex justify-end mb-8">
                        <div class="w-full sm:w-72 space-y-2 text-xs">
                            <div class="flex justify-between py-1 border-b border-slate-100">
                                <span class="text-slate-500">Subtotal:</span>
                                <span class="font-mono font-semibold text-slate-800">
                                    {{ formatCurrency(invoice.subtotal, invoice.currency) }}
                                </span>
                            </div>

                            <div
                                v-if="Number(invoice.tax_percentage) > 0"
                                class="flex justify-between py-1 border-b border-slate-100"
                            >
                                <span class="text-slate-500">
                                    Tax ({{ Number(invoice.tax_percentage).toFixed(1) }}%):
                                </span>
                                <span class="font-mono font-semibold text-slate-800">
                                    {{ formatCurrency(invoice.tax_amount, invoice.currency) }}
                                </span>
                            </div>

                            <div
                                v-if="Number(invoice.discount_amount) > 0"
                                class="flex justify-between py-1 border-b border-slate-100"
                            >
                                <span class="text-slate-500">Discount:</span>
                                <span class="font-mono font-semibold text-red-600">
                                    - {{ formatCurrency(invoice.discount_amount, invoice.currency) }}
                                </span>
                            </div>

                            <div
                                class="flex justify-between py-2 border-t-2 border-slate-900 text-sm font-bold text-slate-900"
                            >
                                <span>Total Due:</span>
                                <span class="font-mono text-base">
                                    {{ formatCurrency(invoice.total, invoice.currency) }}
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Notes & Payment Terms -->
                    <div
                        v-if="invoice.notes"
                        class="bg-amber-50/60 border border-amber-200/80 rounded-xl p-4 text-xs text-amber-900 mb-8"
                    >
                        <span class="text-xs font-bold uppercase tracking-wider text-amber-800 block mb-1">
                            Notes & Payment Instructions
                        </span>
                        <p class="whitespace-pre-line leading-relaxed">{{ invoice.notes }}</p>
                    </div>

                    <!-- Document Footer -->
                    <div class="border-t border-slate-200 pt-6 text-center text-xs text-slate-400">
                        Thank you for your business! Generated on
                        {{ formatInvoiceDate(new Date().toISOString()) }} &bull; Hour Ledger System
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style>
@media print {
    body * {
        visibility: hidden;
    }
    #invoicePrintSheet,
    #invoicePrintSheet * {
        visibility: visible;
    }
    #invoicePrintSheet {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        margin: 0;
        padding: 0;
        border: none !important;
        box-shadow: none !important;
    }
}
</style>

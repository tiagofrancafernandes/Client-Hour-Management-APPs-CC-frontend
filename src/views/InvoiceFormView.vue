<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';
import { useInvoices } from '@composables/useInvoices';
import { useClients } from '@composables/useClients';
import { useProductsServices } from '@composables/useProductsServices';
import { useToast } from '@composables/useToast';
import type { InvoiceForm, ProductService } from '@/types';
import InvoiceItemRow from '@components/InvoiceItemRow.vue';
import InvoiceTotalsSummary from '@components/InvoiceTotalsSummary.vue';

const route = useRoute();
const router = useRouter();
const toast = useToast();

const { invoice, loading, fetchInvoice, createInvoice, updateInvoice, getNextInvoiceNumber, canHide } = useInvoices();
const { clients, fetchClients } = useClients();
const { productsServices, fetchProductsServices } = useProductsServices();

const isEditing = computed(() => !!route.params.id);

const clientOptions = computed(() => {
    const list = clients.value.map((client) => ({
        value: client.id,
        label: client.name,
    }));

    if (invoice.value?.client && !list.some((c) => c.value === invoice.value?.client_id)) {
        list.unshift({
            value: invoice.value.client.id,
            label: invoice.value.client.name,
        });
    }

    return list;
});

const form = ref<InvoiceForm>({
    client_id: 0,
    client_invoice_number: null,
    issue_date: new Date().toISOString().split('T')[0] as string,
    due_date: null,
    currency: 'BRL',
    tax_percentage: 0,
    discount_amount: 0,
    status: 'draft',
    hidden: false,
    notes: null,
    items: [
        {
            description: '',
            unit: 'unit',
            quantity: 1,
            unit_price: 0,
            product_service_id: null,
        },
    ],
});

const nextNumberInfo = ref<{
    client_id: number;
    next_client_invoice_number: number;
    code: string;
    formatted_code: string;
} | null>(null);

const fetchingNextNumber = ref(false);
const showCancelConfirmModal = ref(false);

const computedPreviewCode = computed(() => {
    if (!form.value.client_id) {
        return '—';
    }

    if (form.value.client_invoice_number) {
        const padded = String(form.value.client_invoice_number).padStart(3, '0');
        return `#C${form.value.client_id}-I${padded}`;
    }

    if (nextNumberInfo.value && nextNumberInfo.value.client_id === form.value.client_id) {
        return nextNumberInfo.value.formatted_code;
    }

    return `#C${form.value.client_id}-I...`;
});

const subtotal = computed(() => {
    return form.value.items.reduce((acc, item) => {
        const qty = Number(item.quantity) || 0;
        const price = Number(item.unit_price) || 0;
        return acc + qty * price;
    }, 0);
});

async function handleClientChange(): Promise<void> {
    if (!form.value.client_id) {
        nextNumberInfo.value = null;
        return;
    }

    if (isEditing.value) {
        return;
    }

    fetchingNextNumber.value = true;

    try {
        const result = await getNextInvoiceNumber(form.value.client_id);
        nextNumberInfo.value = result;
    } catch {
        nextNumberInfo.value = null;
    } finally {
        fetchingNextNumber.value = false;
    }
}

watch(
    () => form.value.client_id,
    () => {
        handleClientChange();
    }
);

function addItem(): void {
    form.value.items.push({
        description: '',
        unit: 'unit',
        quantity: 1,
        unit_price: 0,
        product_service_id: null,
    });
}

function removeItem(index: number): void {
    form.value.items.splice(index, 1);
}

function handleAddPreset(preset: ProductService): void {
    form.value.items.push({
        description: preset.name,
        unit: preset.unit || 'unit',
        quantity: Number(preset.default_quantity) || 1,
        unit_price: Number(preset.default_price) || 0,
        product_service_id: preset.id,
    });
}

async function handleSubmit(): Promise<void> {
    if (!form.value.client_id) {
        toast.error('Please select a client');
        return;
    }

    if (form.value.items.length === 0) {
        toast.error('Invoice must contain at least one line item');
        return;
    }

    for (const item of form.value.items) {
        if (!item.description.trim()) {
            toast.error('All line items must have a description');
            return;
        }

        if (Number(item.quantity) <= 0) {
            toast.error('Item quantity must be greater than zero');
            return;
        }
    }

    try {
        const payload: InvoiceForm = {
            ...form.value,
            issue_date: form.value.issue_date ? String(form.value.issue_date).substring(0, 10) : '',
            due_date: form.value.due_date ? String(form.value.due_date).substring(0, 10) : null,
            client_invoice_number: form.value.client_invoice_number || undefined,
        };

        if (isEditing.value) {
            await updateInvoice(Number(route.params.id), payload);
            toast.success('Invoice updated successfully');
        } else {
            const created = await createInvoice(payload);
            toast.success(`Invoice ${created.formatted_code || ''} created successfully`);
        }

        router.push({ name: 'invoices' });
    } catch (err: any) {
        toast.error(err?.message || 'Failed to save invoice');
    }
}

function handleCancelClick(): void {
    showCancelConfirmModal.value = true;
}

function handleCancelConfirm(): void {
    showCancelConfirmModal.value = false;
    router.push({ name: 'invoices' });
}

onMounted(async () => {
    await Promise.all([fetchClients(1, ''), fetchProductsServices({ all: true, is_active: true })]);

    if (isEditing.value) {
        await fetchInvoice(Number(route.params.id));

        if (invoice.value) {
            form.value = {
                client_id: invoice.value.client_id,
                client_invoice_number: invoice.value.client_invoice_number,
                issue_date: invoice.value.issue_date ? String(invoice.value.issue_date).substring(0, 10) : '',
                due_date: invoice.value.due_date ? String(invoice.value.due_date).substring(0, 10) : null,
                currency: invoice.value.currency,
                tax_percentage: Number(invoice.value.tax_percentage) || 0,
                discount_amount: Number(invoice.value.discount_amount) || 0,
                status: invoice.value.status,
                hidden: invoice.value.hidden ?? false,
                notes: invoice.value.notes,
                items:
                    invoice.value.items?.map((item) => ({
                        id: item.id,
                        description: item.description,
                        unit: item.unit || 'unit',
                        quantity: Number(item.quantity) || 1,
                        unit_price: Number(item.unit_price) || 0,
                        product_service_id: item.product_service_id,
                    })) || [],
            };
        }
    }
});
</script>

<template>
    <div class="container mx-auto px-4 py-8 max-w-5xl">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-3">
                <button
                    type="button"
                    @click="router.push({ name: 'invoices' })"
                    class="p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Back to invoices"
                >
                    <Icon icon="mdi:arrow-left" class="w-4 h-4" />
                </button>
                <div>
                    <h1 class="text-lg sm:text-xl font-semibold tracking-tight text-slate-900">
                        {{ isEditing ? 'Edit Invoice' : 'Create New Invoice' }}
                    </h1>
                    <p class="text-xs text-slate-500 mt-0.5">
                        {{
                            isEditing ? `Editing ${computedPreviewCode}` : 'Fill in the details to generate an invoice'
                        }}
                    </p>
                </div>
            </div>

            <!-- Preview badge -->
            <div class="flex items-center gap-2">
                <span class="text-xs text-slate-500 font-medium">Invoice Code:</span>
                <span
                    class="font-mono text-xs font-semibold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200/90 shadow-2xs"
                >
                    {{ computedPreviewCode }}
                </span>
            </div>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-6">
            <!-- Top Card: Client & Invoice Info -->
            <div class="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-5">
                <h2
                    class="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 pb-2 border-b border-gray-100"
                >
                    <Icon icon="mdi:account-details-outline" class="w-4 h-4 text-slate-500" />
                    Invoice & Client Details
                </h2>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-4 items-start">
                    <!-- Client Selection -->
                    <div class="flex flex-col col-span-2">
                        <div class="flex items-center justify-between h-5 mb-1.5">
                            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                                Client
                                <span class="text-red-500">*</span>
                            </label>
                        </div>
                        <CTypeahead
                            v-model="form.client_id"
                            :initialOptions="clientOptions"
                            placeholder="Select a client..."
                            :disabled="isEditing"
                            required
                        />
                    </div>

                    <!-- Client Invoice Number (Optional Counter) -->
                    <div class="flex flex-col col-span-2">
                        <div class="flex items-center justify-between h-5 mb-1.5">
                            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                                Invoice number (sequence)
                            </label>
                            <span class="text-2xs text-slate-400 font-medium">Optional</span>
                        </div>
                        <input
                            v-model.number="form.client_invoice_number"
                            type="number"
                            min="1"
                            :placeholder="nextNumberInfo ? String(nextNumberInfo.next_client_invoice_number) : 'Auto'"
                            class="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                        />
                        <p class="text-2xs text-slate-500 mt-1">
                            {{
                                nextNumberInfo
                                    ? `Suggested: #${nextNumberInfo.next_client_invoice_number} (leave empty to use auto-sequence)`
                                    : 'Auto-generated sequence if left blank'
                            }}
                        </p>
                    </div>

                    <!-- Currency -->
                    <div class="flex flex-col">
                        <div class="flex items-center justify-between h-5 mb-1.5">
                            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                                Currency
                                <span class="text-red-500">*</span>
                            </label>
                        </div>
                        <select
                            v-model="form.currency"
                            required
                            class="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all cursor-pointer"
                        >
                            <option value="BRL">BRL (R$)</option>
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EUR (€)</option>
                            <option value="GBP">GBP (£)</option>
                        </select>
                    </div>

                    <!-- Issue Date -->
                    <div class="flex flex-col">
                        <div class="flex items-center justify-between h-5 mb-1.5">
                            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                                Issue Date
                                <span class="text-red-500">*</span>
                            </label>
                        </div>
                        <input
                            v-model="form.issue_date"
                            type="date"
                            required
                            class="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                        />
                    </div>

                    <!-- Due Date -->
                    <div class="flex flex-col">
                        <div class="flex items-center justify-between h-5 mb-1.5">
                            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                                Due Date
                            </label>
                            <span class="text-2xs text-slate-400 font-medium">Optional</span>
                        </div>
                        <input
                            v-model="form.due_date"
                            type="date"
                            class="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                        />
                    </div>

                    <!-- Status -->
                    <div class="flex flex-col">
                        <div class="flex items-center justify-between h-5 mb-1.5">
                            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                                Status
                                <span class="text-red-500">*</span>
                            </label>
                        </div>
                        <select
                            v-model="form.status"
                            class="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all cursor-pointer"
                        >
                            <option value="draft">Draft</option>
                            <option value="sent">Sent</option>
                            <option value="paid">Paid</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>

                <!-- Hidden from customer toggle -->
                <div v-if="canHide" class="flex items-center gap-2 pt-1">
                    <input
                        id="hidden-invoice"
                        v-model="form.hidden"
                        type="checkbox"
                        class="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <label for="hidden-invoice" class="text-xs font-medium text-gray-700 cursor-pointer">
                        Hidden from customer portal
                    </label>
                </div>
            </div>

            <!-- Middle Card: Line Items -->
            <div class="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
                <div
                    class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100"
                >
                    <div>
                        <h2 class="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                            <Icon icon="mdi:format-list-bulleted" class="w-4 h-4 text-slate-500" />
                            Line Items (Products & Services)
                        </h2>
                        <p class="text-xs text-slate-500 mt-0.5">
                            Select catalog services/products or type custom inline items
                        </p>
                    </div>

                    <div class="flex items-center gap-2">
                        <!-- Quick Add preset dropdown -->
                        <div v-if="productsServices.length > 0" class="relative inline-block text-left">
                            <select
                                @change="
                                    (e) => {
                                        const id = Number((e.target as HTMLSelectElement).value);
                                        const found = productsServices.find((p) => p.id === id);
                                        if (found) handleAddPreset(found);
                                        (e.target as HTMLSelectElement).value = '';
                                    }
                                "
                                class="text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg border border-slate-300 focus:outline-none transition-colors cursor-pointer"
                            >
                                <option value="">+ Add from Catalog...</option>
                                <option v-for="ps in productsServices" :key="ps.id" :value="ps.id">
                                    {{ ps.name }} ({{ ps.type }})
                                </option>
                            </select>
                        </div>

                        <button
                            type="button"
                            @click="addItem"
                            class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-700 shadow-2xs transition-colors cursor-pointer"
                        >
                            <Icon icon="mdi:plus" class="w-4 h-4" />
                            Add Custom Item
                        </button>
                    </div>
                </div>

                <!-- Items list -->
                <div class="space-y-3">
                    <InvoiceItemRow
                        v-for="(item, index) in form.items"
                        :key="index"
                        :item="item"
                        :index="index"
                        :currency="form.currency"
                        :products-services="productsServices"
                        :can-remove="form.items.length > 1"
                        @remove="removeItem"
                    />
                </div>
            </div>

            <!-- Bottom Section: Notes & Totals Summary -->
            <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
                <!-- Notes -->
                <div class="md:col-span-7 bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-2">
                    <label class="block text-xs font-bold text-gray-700 uppercase tracking-wide">
                        Invoice Notes & Payment Terms
                    </label>
                    <textarea
                        v-model="form.notes"
                        rows="4"
                        placeholder="Add optional notes, bank instructions, or thank you message for the customer..."
                        class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all resize-none"
                    ></textarea>
                </div>

                <!-- Summary Totals Box -->
                <div class="md:col-span-5">
                    <InvoiceTotalsSummary
                        :currency="form.currency"
                        :subtotal="subtotal"
                        v-model:tax-percentage="form.tax_percentage"
                        v-model:discount-amount="form.discount_amount"
                    />
                </div>
            </div>

            <!-- Form Actions -->
            <div class="flex items-center justify-between border-t border-gray-200 pt-5">
                <CButton preset="outlined-black" type="button" @click="handleCancelClick">Cancel</CButton>

                <CButton preset="primary-md" type="submit" :disabled="loading">
                    <Icon icon="mdi:content-save-outline" class="w-4 h-4 mr-1.5" />
                    {{ isEditing ? 'Update Invoice' : 'Create Invoice' }}
                </CButton>
            </div>
        </form>

        <!-- Cancel Confirmation Modal -->
        <ConfirmModal
            v-model:isOpen="showCancelConfirmModal"
            title="Discard Changes?"
            message="Are you sure you want to cancel? Any unsaved changes will be lost."
            confirmText="Yes, Discard"
            cancelText="Keep Editing"
            variant="warning"
            @confirm="handleCancelConfirm"
        />
    </div>
</template>

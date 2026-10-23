<script setup lang="ts">
import { computed } from 'vue';
import { Icon } from '@iconify/vue';
import type { InvoiceItemForm, ProductService, TypeaheadOption } from '@/types';
import { formatCurrency } from '@utils/payment-helpers';
import CTypeahead from '@/components/CTypeahead.vue';

interface Props {
    item: InvoiceItemForm;
    index: number;
    currency: string;
    productsServices: ProductService[];
    canRemove: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
    remove: [index: number];
}>();

const lineTotal = computed(() => {
    const qty = Number(props.item.quantity) || 0;
    const price = Number(props.item.unit_price) || 0;
    return qty * price;
});

const productServiceOptions = computed<TypeaheadOption[]>(() => {
    return props.productsServices.map((ps) => ({
        value: ps.id,
        label: `${ps.name} (${ps.type === 'service' ? 'Service' : 'Product'}) · ${formatCurrency(ps.default_price, props.currency)}`,
    }));
});

function onProductServiceSelect(value: unknown): void {
    const selectedId = Number(value);

    if (!selectedId) {
        props.item.product_service_id = null;
        return;
    }

    const selected = props.productsServices.find((ps) => ps.id === selectedId);

    if (!selected) {
        return;
    }

    props.item.product_service_id = selected.id;
    props.item.description = selected.name;
    props.item.unit = selected.unit || 'unit';
    props.item.unit_price = Number(selected.default_price) || 0;

    if (!props.item.quantity || Number(props.item.quantity) <= 0) {
        props.item.quantity = Number(selected.default_quantity) || 1;
    }
}
</script>

<template>
    <div
        class="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 transition-all hover:border-slate-300 shadow-2xs space-y-3.5"
    >
        <!-- Row Header -->
        <div class="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div class="flex items-center gap-2">
                <span
                    class="w-6 h-6 rounded-md bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 flex items-center justify-center shadow-2xs"
                >
                    {{ index + 1 }}
                </span>
                <span class="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Line Item #{{ index + 1 }}
                </span>
                <span
                    v-if="item.product_service_id"
                    class="text-2xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200"
                >
                    Catalog Preset
                </span>
                <span
                    v-else
                    class="text-2xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200"
                >
                    Custom Item
                </span>
            </div>

            <button
                v-if="canRemove"
                type="button"
                @click="emit('remove', index)"
                class="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
            >
                <Icon icon="mdi:trash-can-outline" class="w-3.5 h-3.5" />
                Remove
            </button>
        </div>

        <!-- Line 1: Preset Product / Service (Typeahead) -->
        <div>
            <CTypeahead
                label="Preset Product / Service (Optional)"
                v-model="item.product_service_id"
                :initialOptions="productServiceOptions"
                placeholder="Search and pick from catalog or leave empty for custom..."
                clearable
                @change="(payload) => onProductServiceSelect(payload.value)"
                @update:model-value="onProductServiceSelect"
            />
        </div>

        <!-- Line 2: Description (Full Width) -->
        <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Description
                <span class="text-red-500">*</span>
            </label>
            <input
                v-model="item.description"
                type="text"
                required
                placeholder="Enter detailed item or service description..."
                class="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
            />
        </div>

        <!-- Line 3: Numeric Breakdown (Unit, Quantity, Price, Total) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            <!-- Unit -->
            <div>
                <label class="block text-2xs font-bold text-slate-600 uppercase tracking-wider mb-1">Unit</label>
                <input
                    v-model="item.unit"
                    type="text"
                    placeholder="unit, hour, month..."
                    class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                />
            </div>

            <!-- Quantity -->
            <div>
                <label class="block text-2xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Quantity
                    <span class="text-red-500">*</span>
                </label>
                <input
                    v-model.number="item.quantity"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                />
            </div>

            <!-- Unit Price -->
            <div>
                <label class="block text-2xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Unit Price ({{ currency }})
                    <span class="text-red-500">*</span>
                </label>
                <input
                    v-model.number="item.unit_price"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                />
            </div>

            <!-- Total Preview -->
            <div class="flex flex-col justify-end">
                <label class="block text-2xs font-bold text-slate-500 uppercase tracking-wider mb-1">Line Total</label>
                <div
                    class="w-full rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-sm font-bold text-slate-900 flex items-center justify-between"
                >
                    <span class="text-xs text-slate-400 font-normal">{{ currency }}</span>
                    <span class="font-mono">{{ formatCurrency(lineTotal, currency) }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

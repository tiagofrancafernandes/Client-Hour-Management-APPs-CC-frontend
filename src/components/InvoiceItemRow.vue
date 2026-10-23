<script setup lang="ts">
import { computed } from 'vue';
import { Icon } from '@iconify/vue';
import type { InvoiceItemForm, ProductService } from '@/types';
import { formatCurrency } from '@utils/payment-helpers';

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

function handleProductServiceSelect(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const selectedId = Number(target.value);

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
        class="bg-slate-50/70 border border-slate-200/90 rounded-xl p-4 transition-all hover:border-slate-300 hover:bg-slate-50"
    >
        <div class="flex items-center justify-between mb-3 border-b border-slate-200/60 pb-2.5">
            <div class="flex items-center gap-2">
                <span
                    class="w-6 h-6 rounded-md bg-white border border-slate-200 text-xs font-bold text-slate-700 flex items-center justify-center shadow-2xs"
                >
                    {{ index + 1 }}
                </span>
                <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">Line Item</span>
            </div>

            <button
                v-if="canRemove"
                type="button"
                @click="emit('remove', index)"
                class="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-md transition-colors cursor-pointer"
            >
                <Icon icon="mdi:trash-can-outline" class="w-3.5 h-3.5" />
                Remove
            </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-12 gap-3.5">
            <!-- Product/Service Presets Dropdown -->
            <div class="md:col-span-4">
                <label class="block text-2xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Preset Product / Service (Optional)
                </label>
                <select
                    :value="item.product_service_id || ''"
                    @change="handleProductServiceSelect"
                    class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                >
                    <option value="">Custom / Inline Item</option>
                    <option v-for="ps in productsServices" :key="ps.id" :value="ps.id">
                        {{ ps.name }} ({{ ps.type === 'service' ? 'Service' : 'Product' }}) -
                        {{ formatCurrency(ps.default_price, currency) }}
                    </option>
                </select>
            </div>

            <!-- Description -->
            <div class="md:col-span-8">
                <label class="block text-2xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Description
                    <span class="text-red-500">*</span>
                </label>
                <input
                    v-model="item.description"
                    type="text"
                    required
                    placeholder="Enter item or service description..."
                    class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                />
            </div>

            <!-- Unit -->
            <div class="md:col-span-3">
                <label class="block text-2xs font-bold text-slate-600 uppercase tracking-wider mb-1">Unit</label>
                <input
                    v-model="item.unit"
                    type="text"
                    placeholder="unit, hour, month..."
                    class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                />
            </div>

            <!-- Quantity -->
            <div class="md:col-span-3">
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
                    class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                />
            </div>

            <!-- Unit Price -->
            <div class="md:col-span-3">
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
                    class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                />
            </div>

            <!-- Total Preview -->
            <div class="md:col-span-3 flex flex-col justify-end">
                <label class="block text-2xs font-bold text-slate-500 uppercase tracking-wider mb-1">Line Total</label>
                <div
                    class="w-full rounded-lg bg-white border border-slate-200/80 px-3 py-2 text-sm font-bold text-slate-900 flex items-center justify-between"
                >
                    <span class="text-xs text-slate-400 font-normal">{{ currency }}</span>
                    <span>{{ formatCurrency(lineTotal, currency) }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Icon } from '@iconify/vue';
import { formatCurrency } from '@utils/payment-helpers';

interface Props {
    currency: string;
    subtotal: number;
    taxPercentage: number;
    discountAmount: number;
}

const props = defineProps<Props>();

const emit = defineEmits<{
    'update:taxPercentage': [value: number];
    'update:discountAmount': [value: number];
}>();

const taxAmount = computed(() => {
    return (props.subtotal * (Number(props.taxPercentage) || 0)) / 100;
});

const totalDue = computed(() => {
    return Math.max(0, props.subtotal + taxAmount.value - (Number(props.discountAmount) || 0));
});
</script>

<template>
    <div class="rounded-xl border border-slate-200 bg-slate-50/60 p-5 shadow-2xs space-y-4">
        <h3
            class="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 pb-2 border-b border-slate-200"
        >
            <Icon icon="mdi:calculator-variant-outline" class="w-4 h-4 text-slate-500" />
            Invoice Summary
        </h3>

        <div class="space-y-3 text-sm">
            <!-- Subtotal -->
            <div class="flex items-center justify-between text-slate-600">
                <span>Subtotal</span>
                <span class="font-semibold text-slate-900">
                    {{ formatCurrency(subtotal, currency) }}
                </span>
            </div>

            <!-- Tax Rate & Amount -->
            <div class="flex items-center justify-between gap-4">
                <div class="flex items-center gap-2">
                    <span class="text-slate-600">Tax</span>
                    <div class="inline-flex items-center">
                        <input
                            :value="taxPercentage"
                            @input="emit('update:taxPercentage', Number(($event.target as HTMLInputElement).value))"
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            class="w-16 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-red-500"
                        />
                        <span class="text-xs text-slate-500 ml-1">%</span>
                    </div>
                </div>
                <span class="font-medium text-slate-700">+ {{ formatCurrency(taxAmount, currency) }}</span>
            </div>

            <!-- Discount Amount -->
            <div class="flex items-center justify-between gap-4">
                <div class="flex items-center gap-2">
                    <span class="text-slate-600">Discount</span>
                    <div class="inline-flex items-center">
                        <input
                            :value="discountAmount"
                            @input="emit('update:discountAmount', Number(($event.target as HTMLInputElement).value))"
                            type="number"
                            min="0"
                            step="0.01"
                            class="w-24 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-red-500"
                        />
                    </div>
                </div>
                <span class="font-medium text-red-600">- {{ formatCurrency(discountAmount, currency) }}</span>
            </div>

            <!-- Total Due -->
            <div class="border-t border-slate-200 pt-3 flex items-baseline justify-between">
                <span class="text-base font-bold text-slate-900">Total Due</span>
                <div class="text-right">
                    <span class="text-xl font-extrabold text-red-600 tracking-tight">
                        {{ formatCurrency(totalDue, currency) }}
                    </span>
                    <span class="text-xs text-slate-400 block font-normal">{{ currency }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

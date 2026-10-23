<script setup lang="ts">
import { ref } from 'vue';
import { Icon } from '@iconify/vue';
import type { CreditPurchase, CreditPurchasePayment } from '@/types';
import { useToast } from '@composables/useToast';
import { formatCurrency, formatExpiresAt, isPaymentExpired, getPaymentMethodIcon } from '@utils/payment-helpers';

interface Props {
    show: boolean;
    modalPayment: CreditPurchasePayment | null;
    selectedPurchase: CreditPurchase | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
    close: [];
}>();

const toast = useToast();
const copiedInstructionKey = ref<string | null>(null);
const copiedAllInstructions = ref(false);

function handleClose(): void {
    emit('close');
}

function copyInstructionToClipboard(key: string, value: string): void {
    if (!value) {
        return;
    }

    navigator.clipboard.writeText(value);
    copiedInstructionKey.value = key;
    toast.success(`Copied "${key}" to clipboard`);

    setTimeout(() => {
        if (copiedInstructionKey.value === key) {
            copiedInstructionKey.value = null;
        }
    }, 2000);
}

function copyAllInstructionsToClipboard(): void {
    if (!props.modalPayment?.payment_method?.instructions?.length) {
        return;
    }

    const lines: string[] = [];
    lines.push(`Method: ${props.modalPayment.payment_method.label}`);

    if (props.selectedPurchase) {
        lines.push(
            `Amount: ${formatCurrency(props.selectedPurchase.total_price, props.selectedPurchase.currency_code)}`
        );
    }

    lines.push('---');

    for (const instruction of props.modalPayment.payment_method.instructions) {
        lines.push(`${instruction.key}: ${instruction.value}`);
    }

    navigator.clipboard.writeText(lines.join('\n'));
    copiedAllInstructions.value = true;
    toast.success('All payment instructions copied to clipboard');

    setTimeout(() => {
        copiedAllInstructions.value = false;
    }, 2000);
}
</script>

<template>
    <Teleport to="body">
        <div
            v-if="show && modalPayment?.payment_method"
            class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            @click="handleClose"
        >
            <div
                class="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all border border-slate-200/80 flex flex-col max-h-[90vh]"
                @click.stop
            >
                <!-- Header -->
                <div
                    class="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-6 py-5 flex items-center justify-between text-white shrink-0"
                >
                    <div class="flex items-center gap-3">
                        <div
                            class="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center border border-white/20 shadow-xs"
                        >
                            <Icon
                                :icon="getPaymentMethodIcon(modalPayment.payment_method.key)"
                                class="w-5 h-5 text-white"
                            />
                        </div>
                        <div>
                            <h2 class="text-lg font-bold tracking-tight text-white leading-tight">
                                Payment Instructions
                            </h2>
                            <p class="text-xs text-blue-100 mt-0.5 flex items-center gap-1.5">
                                <span>{{ modalPayment.payment_method.label }}</span>
                                <span>•</span>
                                <span
                                    class="inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-semibold bg-white/20 text-white uppercase tracking-wider"
                                >
                                    {{ modalPayment.payment_status }}
                                </span>
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        class="rounded-full p-1.5 text-white/80 hover:text-white hover:bg-white/20 transition-colors focus:outline-hidden"
                        @click="handleClose"
                        title="Close"
                    >
                        <Icon icon="mdi:close" class="w-5 h-5" />
                    </button>
                </div>

                <!-- Scrollable Content -->
                <div class="p-6 overflow-y-auto space-y-5 divide-y divide-slate-100">
                    <!-- Top Summary Cards -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-1">
                        <!-- Total Amount -->
                        <div
                            class="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-100 p-4 flex flex-col justify-between"
                        >
                            <span class="text-xs font-medium text-blue-700 uppercase tracking-wider">
                                Amount to Pay
                            </span>
                            <div class="mt-1 flex items-baseline gap-2">
                                <span class="text-2xl font-extrabold text-blue-900 tracking-tight">
                                    {{
                                        selectedPurchase
                                            ? formatCurrency(
                                                  selectedPurchase.total_price,
                                                  selectedPurchase.currency_code
                                              )
                                            : '—'
                                    }}
                                </span>
                            </div>
                            <span v-if="selectedPurchase?.total_hours" class="text-2xs text-blue-600 mt-1">
                                {{ selectedPurchase.total_hours }} hours credit
                            </span>
                        </div>

                        <!-- Expiration / Status Card -->
                        <div
                            :class="[
                                'rounded-xl border p-4 flex flex-col justify-between',
                                {
                                    'bg-red-50 border-red-200 text-red-900': isPaymentExpired(modalPayment),
                                    'bg-amber-50/80 border-amber-200 text-amber-900': !isPaymentExpired(modalPayment),
                                },
                            ]"
                        >
                            <span class="text-xs font-medium uppercase tracking-wider flex items-center gap-1">
                                <Icon icon="mdi:clock-outline" class="w-3.5 h-3.5" />
                                Expiration
                            </span>
                            <div class="mt-1">
                                <div class="text-lg font-bold">
                                    {{
                                        modalPayment.expires_at
                                            ? formatExpiresAt(modalPayment.expires_at)
                                            : 'No expiration'
                                    }}
                                </div>
                                <span v-if="modalPayment.expires_at" class="text-2xs opacity-80 block mt-0.5">
                                    Until {{ new Date(modalPayment.expires_at).toLocaleString() }}
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Payment Instructions Details -->
                    <div class="pt-5 space-y-3">
                        <div class="flex items-center justify-between">
                            <div>
                                <h3 class="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                                    <Icon icon="mdi:receipt-text-outline" class="w-4 h-4 text-blue-600" />
                                    Transfer & Deposit Information
                                </h3>
                                <p class="text-xs text-slate-500 mt-0.5">
                                    Copy the fields below to complete your payment:
                                </p>
                            </div>

                            <button
                                v-if="
                                    modalPayment.payment_method.instructions &&
                                    modalPayment.payment_method.instructions.length > 1
                                "
                                type="button"
                                @click="copyAllInstructionsToClipboard"
                                class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 hover:text-blue-800 border border-blue-200 transition-all shrink-0 cursor-pointer"
                            >
                                <Icon
                                    :icon="copiedAllInstructions ? 'mdi:check' : 'mdi:content-copy'"
                                    class="w-3.5 h-3.5"
                                />
                                {{ copiedAllInstructions ? 'All Copied!' : 'Copy All' }}
                            </button>
                        </div>

                        <!-- List of Instructions -->
                        <div
                            v-if="
                                modalPayment.payment_method.instructions &&
                                modalPayment.payment_method.instructions.length > 0
                            "
                            class="space-y-2.5"
                        >
                            <div
                                v-for="(instruction, index) in modalPayment.payment_method.instructions"
                                :key="index"
                                class="group relative bg-slate-50 hover:bg-white border border-slate-200 hover:border-blue-300 rounded-xl p-3.5 transition-all shadow-2xs hover:shadow-sm"
                            >
                                <div class="flex items-start justify-between gap-3">
                                    <div class="min-w-0 flex-1">
                                        <span
                                            class="text-2xs font-bold uppercase tracking-wider text-slate-500 block mb-1"
                                        >
                                            {{ instruction.key }}
                                        </span>
                                        <div
                                            class="font-mono text-sm font-semibold text-slate-900 break-all select-all bg-white group-hover:bg-blue-50/40 px-2.5 py-1.5 rounded-lg border border-slate-200/60 inline-block w-full"
                                        >
                                            {{ instruction.value }}
                                        </div>
                                    </div>

                                    <button
                                        v-if="instruction.value"
                                        type="button"
                                        @click="copyInstructionToClipboard(instruction.key, instruction.value)"
                                        :class="[
                                            'inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 mt-4 cursor-pointer',
                                            {
                                                'bg-green-100 text-green-700 font-semibold border border-green-200':
                                                    copiedInstructionKey === instruction.key,
                                                'bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 shadow-2xs':
                                                    copiedInstructionKey !== instruction.key,
                                            },
                                        ]"
                                        :title="'Copy ' + instruction.key"
                                    >
                                        <Icon
                                            :icon="
                                                copiedInstructionKey === instruction.key
                                                    ? 'mdi:check'
                                                    : 'mdi:content-copy'
                                            "
                                            class="w-3.5 h-3.5"
                                        />
                                        <span>
                                            {{ copiedInstructionKey === instruction.key ? 'Copied' : 'Copy' }}
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Empty Instructions State -->
                        <div v-else class="rounded-xl bg-amber-50 border border-amber-200/80 p-4 text-center">
                            <Icon icon="mdi:information-outline" class="w-6 h-6 text-amber-500 mx-auto mb-1" />
                            <p class="text-xs font-medium text-amber-800">
                                No payment instructions configured. Please contact support for payment assistance.
                            </p>
                        </div>
                    </div>

                    <!-- 3-Step Guide -->
                    <div class="pt-5">
                        <h4
                            class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5"
                        >
                            <Icon icon="mdi:help-circle-outline" class="w-3.5 h-3.5 text-slate-400" />
                            How to complete your payment
                        </h4>
                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            <div
                                class="bg-slate-50/80 border border-slate-200/60 rounded-xl p-3 flex flex-col items-center text-center"
                            >
                                <div
                                    class="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center mb-1.5"
                                >
                                    1
                                </div>
                                <span class="text-xs font-semibold text-slate-800">Make Payment</span>
                                <span class="text-2xs text-slate-500 mt-0.5">
                                    Use the data above in your banking app
                                </span>
                            </div>
                            <div
                                class="bg-slate-50/80 border border-slate-200/60 rounded-xl p-3 flex flex-col items-center text-center"
                            >
                                <div
                                    class="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center mb-1.5"
                                >
                                    2
                                </div>
                                <span class="text-xs font-semibold text-slate-800">Save Receipt</span>
                                <span class="text-2xs text-slate-500 mt-0.5">Save proof (PDF, JPG, PNG)</span>
                            </div>
                            <div
                                class="bg-slate-50/80 border border-slate-200/60 rounded-xl p-3 flex flex-col items-center text-center"
                            >
                                <div
                                    class="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center mb-1.5"
                                >
                                    3
                                </div>
                                <span class="text-xs font-semibold text-slate-800">Upload Receipt</span>
                                <span class="text-2xs text-slate-500 mt-0.5">Attach receipt for admin approval</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Footer -->
                <div
                    class="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex items-center justify-between shrink-0"
                >
                    <span class="text-2xs text-slate-500 flex items-center gap-1">
                        <Icon icon="mdi:shield-check-outline" class="w-4 h-4 text-emerald-600" />
                        Secure manual payment
                    </span>
                    <CButton preset="outlined-black" @click="handleClose">Close</CButton>
                </div>
            </div>
        </div>
    </Teleport>
</template>

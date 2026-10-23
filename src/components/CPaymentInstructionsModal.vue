<script setup lang="ts">
import { ref, computed } from 'vue';
import { Icon } from '@iconify/vue';
import type { PaymentInstruction } from '@/types';

interface CPaymentInstructionsModalProps {
    show: boolean;
    methodLabel: string;
    instructions: string | PaymentInstruction[] | null;
    totalAmount: number;
    currencyCode: string;
    expiresAt: string | null;
}

const props = defineProps<CPaymentInstructionsModalProps>();

const emit = defineEmits<{
    close: [];
}>();

const copied = ref(false);
const displayInstructionsRef = ref<HTMLElement | null>(null);

const displayInstructions = computed<string | PaymentInstruction[]>(() => {
    if (!props.instructions || (Array.isArray(props.instructions) && props.instructions.length === 0)) {
        return 'No instructions available for this method.';
    }
    return props.instructions;
});

function handleClose(): void {
    emit('close');
    copied.value = false;
}

function copyToClipboard(): void {
    let element = displayInstructionsRef.value || null;
    let elementText = String(element?.innerText || '')?.trim();

    if (!elementText) {
        return;
    }

    // navigator.clipboard.writeText(displayInstructions.value);
    navigator.clipboard.writeText(elementText);

    copied.value = true;
    setTimeout(() => {
        copied.value = false;
    }, 2000);
}
</script>

<template>
    <Teleport to="body">
        <div
            v-if="show"
            class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            @click.self="handleClose"
        >
            <div class="bg-white rounded-lg shadow-xl w-full max-w-md transform transition-all" @click.stop>
                <!-- Header -->
                <div class="bg-linear-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-lg">
                    <div class="flex items-center justify-between">
                        <h2 class="text-xl font-bold text-white">{{ methodLabel }}</h2>
                        <button @click="handleClose" class="text-white hover:text-blue-100 transition-colors">
                            <Icon icon="mdi:close" class="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <!-- Content -->
                <div class="p-6 space-y-6">
                    <!-- Amount Info -->
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div class="text-sm text-gray-600 mb-1">Amount to pay</div>
                        <div class="text-2xl font-bold text-gray-900">
                            {{
                                new Intl.NumberFormat('en-US', {
                                    style: 'currency',
                                    currency: currencyCode,
                                }).format(totalAmount)
                            }}
                        </div>
                    </div>

                    <!-- Expiration Info -->
                    <div v-if="expiresAt" class="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <div class="text-sm text-gray-600 mb-1">Expires at</div>
                        <div class="font-semibold text-amber-700">{{ expiresAt }}</div>
                    </div>

                    <!-- Instructions -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Payment Instructions</label>
                        <div
                            class="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap min-h-32"
                            ref="displayInstructionsRef"
                        >
                            <ul v-if="Array.isArray(displayInstructions)">
                                <template
                                    v-for="(dataItem, dataItemIndex) in displayInstructions"
                                    :key="dataItemIndex"
                                >
                                    <li v-if="dataItem && (dataItem.key || dataItem.value)" class="flex gap-2">
                                        <span class="font-bold">{{ dataItem.key }}</span>
                                        <span class="font-normal">{{ dataItem.value }}</span>
                                    </li>
                                </template>
                            </ul>
                            <div v-else>
                                {{ displayInstructions }}
                            </div>
                        </div>
                    </div>

                    <!-- Copy Button -->
                    <button
                        @click="copyToClipboard"
                        :class="[
                            'w-full px-4 py-2 rounded-lg font-medium transition-all',
                            {
                                'bg-green-600 text-white hover:bg-green-700': !copied,
                                'bg-green-100 text-green-700': copied,
                            },
                        ]"
                    >
                        <span v-if="!copied" class="flex items-center justify-center gap-2">
                            <Icon icon="mdi:content-copy" class="w-4 h-4" />
                            Copy Instructions
                        </span>
                        <span v-else class="flex items-center justify-center gap-2">
                            <Icon icon="mdi:check-circle" class="w-4 h-4" />
                            Copied!
                        </span>
                    </button>
                </div>

                <!-- Footer -->
                <div class="bg-gray-50 px-6 py-4 rounded-b-lg border-t border-gray-200">
                    <CButton preset="outlined-black" class="w-full" @click="handleClose">Close</CButton>
                </div>
            </div>
        </div>
    </Teleport>
</template>

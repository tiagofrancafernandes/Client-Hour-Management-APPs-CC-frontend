<script setup lang="ts">
import { ref, watch } from 'vue';
import { Icon } from '@iconify/vue';
import CPaymentMethodSetupFields from '@/components/CPaymentMethodSetupFields.vue';
import CPaymentMethodPixOfflineDisplay from '@/components/CPaymentMethodPixOfflineDisplay.vue';
import type { PaymentMethodConfig } from '@/types';

interface InstructionPair {
    key: string;
    value: string;
}

interface Props {
    isOpen: boolean;
    label: string;
    instructions: InstructionPair[];
    config?: PaymentMethodConfig;
}

interface Emits {
    (e: 'close'): void;
    (e: 'save', instructions: InstructionPair[]): void;
}

const props = withDefaults(defineProps<Props>(), {
    config: undefined,
});
const emit = defineEmits<Emits>();

const localInstructions = ref<InstructionPair[]>([]);
const showSetupFields = ref(false);

watch(
    () => props.instructions,
    (newInstructions) => {
        localInstructions.value = JSON.parse(JSON.stringify(newInstructions || []));
        if (localInstructions.value.length === 0) {
            localInstructions.value = [{ key: '', value: '' }];
        }
    },
    { immediate: true }
);

function addPair(): void {
    localInstructions.value.push({ key: '', value: '' });
}

function removePair(index: number): void {
    localInstructions.value.splice(index, 1);
    if (localInstructions.value.length === 0) {
        localInstructions.value.push({ key: '', value: '' });
    }
}

function copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text);
}

function handleSave(): void {
    const validPairs = localInstructions.value.filter((pair) => pair.key.trim() || pair.value.trim());
    emit('save', validPairs);
}
</script>

<template>
    <teleport to="body">
        <div
            v-if="isOpen"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            @click="emit('close')"
        >
            <div
                data-testid="payment-method-modal"
                class="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl"
                @click.stop
            >
                <!-- Header -->
                <div class="sticky top-0 border-b border-gray-200 bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
                    <div class="flex items-center justify-between">
                        <div>
                            <h2 class="text-lg font-bold text-white">Edit Payment Instructions</h2>
                            <p class="text-sm text-red-100">{{ label }}</p>
                        </div>

                        <button
                            type="button"
                            class="rounded-full p-1 hover:bg-red-500 transition"
                            @click="emit('close')"
                        >
                            <Icon icon="mdi:close" class="w-6 h-6 text-white" />
                        </button>
                    </div>
                </div>

                <!-- Content -->
                <div class="p-6">
                    <div class="space-y-4">
                        <!-- Instructions Help -->
                        <div class="rounded-lg bg-blue-50 p-3 border border-blue-200">
                            <p class="text-xs text-blue-900">
                                <strong>Tip:</strong>
                                Add key fields such as "PIX Key", "Agency", "Account", "Holder", etc. Each field will
                                appear on a line with the key in bold.
                            </p>
                        </div>

                        <!-- Key-Value Pairs -->
                        <div class="space-y-3">
                            <div v-for="(pair, index) in localInstructions" :key="index" class="flex gap-2">
                                <!-- Key Input -->
                                <div class="flex-1">
                                    <input
                                        v-model="pair.key"
                                        type="text"
                                        placeholder="Ex: PIX Key"
                                        class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                    />
                                </div>

                                <!-- Value Input -->
                                <div class="flex-[2]">
                                    <input
                                        v-model="pair.value"
                                        type="text"
                                        placeholder="Ex: 123.456.789-10"
                                        class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                    />
                                </div>

                                <!-- Remove Button -->
                                <button
                                    type="button"
                                    :disabled="localInstructions.length === 1"
                                    class="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    @click="removePair(index)"
                                >
                                    <Icon icon="mdi:trash-outline" class="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <!-- Add Button -->
                        <button
                            type="button"
                            class="flex items-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-600 hover:border-red-500 hover:text-red-600 transition"
                            @click="addPair"
                        >
                            <Icon icon="mdi:plus" class="w-4 h-4" />
                            Add input
                        </button>

                        <!-- Setup Button (if gateway has setupFieldRules) -->
                        <div
                            v-if="props.config?.setup_field_rules && props.config.setup_field_rules.length > 0"
                            class="border-t pt-4 mt-4"
                        >
                            <button
                                data-testid="setup-button"
                                type="button"
                                @click="showSetupFields = !showSetupFields"
                                :class="[
                                    'px-4 py-2 rounded-lg text-white font-medium transition inline-flex items-center gap-2',
                                    {
                                        'bg-green-600 hover:bg-green-700': showSetupFields,
                                        'bg-blue-600 hover:bg-blue-700': !showSetupFields,
                                    },
                                ]"
                            >
                                <Icon :icon="showSetupFields ? 'mdi:check' : 'mdi:cog'" class="w-4 h-4" />
                                {{ showSetupFields ? 'Setup Configurado' : 'Setup' }}
                            </button>
                        </div>

                        <!-- Setup Fields Form -->
                        <div
                            v-if="showSetupFields && props.config?.setup_field_rules"
                            data-testid="setup-fields-form"
                            class="border-t pt-4 mt-4"
                        >
                            <CPaymentMethodSetupFields :config="props.config" />
                        </div>

                        <!-- PIX Offline Display (if pix_offline and configured) -->
                        <CPaymentMethodPixOfflineDisplay
                            v-if="props.config?.payment_method_key === 'pix_offline'"
                            :pix-key="props.config.setup_fields?.pix_key"
                            :is-configured="props.config.is_setup_complete"
                        />
                    </div>

                    <!-- Preview -->
                    <div v-if="localInstructions.some((p) => p.key || p.value)" class="mt-6 pt-6 border-t">
                        <p class="mb-3 text-sm font-semibold text-gray-700">Preview:</p>
                        <div class="rounded-lg bg-gray-50 p-4 space-y-2">
                            <div
                                v-for="(pair, index) in localInstructions"
                                :key="index"
                                class="text-sm flex items-center justify-between group"
                            >
                                <div>
                                    <span v-if="pair.key" class="font-bold text-gray-900">{{ pair.key }}:</span>
                                    <span v-if="pair.value" class="text-gray-700 ml-2">{{ pair.value }}</span>
                                </div>
                                <button
                                    v-if="pair.value"
                                    type="button"
                                    @click="copyToClipboard(pair.value)"
                                    class="ml-2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-gray-200 transition text-gray-500 hover:text-gray-700"
                                    title="Copy to clipboard"
                                >
                                    <Icon icon="mdi:content-copy" class="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Footer -->
                <div class="sticky bottom-0 border-t border-gray-200 bg-gray-50 px-6 py-3 flex gap-2 justify-end">
                    <CButton preset="outlined-black" class="text-sm" @click="emit('close')">Cancel</CButton>

                    <CButton data-testid="save-payment-config" preset="primary" class="text-sm" @click="handleSave">
                        Save
                    </CButton>
                </div>
            </div>
        </div>
    </teleport>
</template>

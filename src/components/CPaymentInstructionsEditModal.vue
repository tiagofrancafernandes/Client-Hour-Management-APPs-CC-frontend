<script setup lang="ts">
import { ref, watch } from 'vue';
import { Icon } from '@iconify/vue';

interface InstructionPair {
    key: string;
    value: string;
}

interface Props {
    isOpen: boolean;
    label: string;
    instructions: InstructionPair[];
}

interface Emits {
    (e: 'close'): void;
    (e: 'save', instructions: InstructionPair[]): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const localInstructions = ref<InstructionPair[]>([]);

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

function handleSave(): void {
    const validPairs = localInstructions.value.filter((pair) => pair.key.trim() || pair.value.trim());
    emit('save', validPairs);
}
</script>

<template>
    <teleport to="body">
        <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click="emit('close')">
            <div
                class="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl"
                @click.stop
            >
                <!-- Header -->
                <div class="sticky top-0 border-b border-gray-200 bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
                    <div class="flex items-center justify-between">
                        <div>
                            <h2 class="text-lg font-bold text-white">Editar Instruções de Pagamento</h2>
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
                                <strong>Dica:</strong> Adicione campos-chave como "Chave PIX", "Agência", "Conta",
                                "Titular", etc. Cada campo aparecerá em uma linha com a chave em negrito.
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
                                        placeholder="Ex: Chave PIX"
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
                            Adicionar campo
                        </button>
                    </div>

                    <!-- Preview -->
                    <div v-if="localInstructions.some((p) => p.key || p.value)" class="mt-6 pt-6 border-t">
                        <p class="mb-3 text-sm font-semibold text-gray-700">Pré-visualização:</p>
                        <div class="rounded-lg bg-gray-50 p-4 space-y-2">
                            <div v-for="(pair, index) in localInstructions" :key="index" class="text-sm">
                                <span v-if="pair.key" class="font-bold text-gray-900">{{ pair.key }}:</span>
                                <span v-if="pair.value" class="text-gray-700 ml-2">{{ pair.value }}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Footer -->
                <div class="sticky bottom-0 border-t border-gray-200 bg-gray-50 px-6 py-3 flex gap-2 justify-end">
                    <CButton preset="outlined-black" class="text-sm" @click="emit('close')">
                        Cancelar
                    </CButton>

                    <CButton preset="primary" class="text-sm" @click="handleSave">
                        Salvar Instruções
                    </CButton>
                </div>
            </div>
        </div>
    </teleport>
</template>

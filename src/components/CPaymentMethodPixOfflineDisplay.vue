<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Icon } from '@iconify/vue';
import { generatePixQRCode } from '@/utils/qr-code';

interface Props {
    pixKey?: string;
    isConfigured?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    pixKey: '',
    isConfigured: false,
});

const qrCodeBase64 = ref<string>('');
const copied = ref(false);
const isLoading = ref(false);

const showDisplay = computed(() => {
    return props.isConfigured && props.pixKey;
});

const pixKey = computed(() => props.pixKey || '');

const copyToClipboard = async () => {
    try {
        await navigator.clipboard.writeText(pixKey.value);
        copied.value = true;

        setTimeout(() => {
            copied.value = false;
        }, 2000);
    } catch (error) {
        console.error('Erro ao copiar:', error);
    }
};

onMounted(async () => {
    if (showDisplay.value && pixKey.value) {
        isLoading.value = true;

        try {
            qrCodeBase64.value = await generatePixQRCode(pixKey.value);
        } catch (error) {
            console.error('Erro ao gerar QR code:', error);
        } finally {
            isLoading.value = false;
        }
    }
});
</script>

<template>
    <div v-if="showDisplay" data-testid="setup-status" class="space-y-4 border-t pt-4 mt-4">
        <h3 class="text-lg font-semibold text-gray-900">Dados de Pagamento PIX</h3>

        <!-- QR Code Display -->
        <div class="flex justify-center">
            <div
                v-if="isLoading"
                class="w-48 h-48 flex items-center justify-center border border-gray-300 rounded-lg bg-gray-50"
            >
                <Icon icon="mdi:loading" class="w-8 h-8 text-gray-400 animate-spin" />
            </div>

            <img
                v-else-if="qrCodeBase64"
                data-testid="pix-qr-code"
                :src="qrCodeBase64"
                alt="QR Code PIX"
                class="w-48 h-48 border border-gray-300 rounded-lg p-2 bg-white"
            />

            <div v-else class="w-48 h-48 flex items-center justify-center border border-gray-300 rounded-lg bg-gray-50">
                <span class="text-sm text-gray-500">QR Code não disponível</span>
            </div>
        </div>

        <!-- Copia e Cola -->
        <div class="space-y-2">
            <label class="text-sm font-medium text-gray-700">Copia e Cola</label>

            <div class="relative">
                <textarea
                    data-testid="pix-copia-cola"
                    :value="pixKey"
                    readonly
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono bg-gray-50 resize-none overflow-hidden overflow-x-auto h-20"
                ></textarea>

                <button
                    data-testid="pix-copy-button"
                    type="button"
                    @click="copyToClipboard"
                    :class="[
                        'absolute right-2 top-2 px-3 py-1 text-sm rounded transition',
                        {
                            'bg-green-600 text-white hover:bg-green-700': copied,
                            'bg-blue-600 text-white hover:bg-blue-700': !copied,
                        },
                    ]"
                >
                    {{ copied ? '✓ Copiado' : 'Copy' }}
                </button>
            </div>
        </div>
    </div>
</template>

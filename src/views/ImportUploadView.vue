<template>
    <div class="container mx-auto px-4 py-8">
        <div class="mb-8">
            <h1 class="text-3xl font-bold text-gray-900">Importar Registros</h1>
            <p class="mt-2 text-gray-600">
                Faça upload de um arquivo CSV ou XLSX para importar múltiplos registros de horas
            </p>
        </div>

        <div class="grid gap-6 lg:grid-cols-2">
            <div class="bg-white rounded-lg shadow p-6">
                <h2 class="text-xl font-semibold text-gray-900 mb-4">Upload de Arquivo</h2>

                <form @submit.prevent="handleUpload">
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Selecione a Carteira
                            </label>

                            <select
                                v-model="selectedWalletId"
                                required
                                class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            >
                                <option :value="undefined">Selecione uma carteira</option>
                                <option
                                    v-for="wallet in wallets"
                                    :key="wallet.id"
                                    :value="wallet.id"
                                >
                                    {{ wallet.name }}
                                    <span v-if="wallet.client">({{ wallet.client.name }})</span>
                                </option>
                            </select>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Arquivo (CSV ou XLSX)
                            </label>

                            <div
                                class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer"
                                :class="{'border-blue-500 bg-blue-50': isDragging}"
                                @dragover.prevent="isDragging = true"
                                @dragleave.prevent="isDragging = false"
                                @drop.prevent="handleFileDrop"
                                @click="$refs.fileInput?.click()"
                            >
                                <input
                                    ref="fileInput"
                                    type="file"
                                    accept=".csv,.xlsx"
                                    class="hidden"
                                    @change="handleFileSelect"
                                />

                                <div v-if="!selectedFile">
                                    <Icon icon="mdi:file-upload-outline" class="w-12 h-12 mx-auto text-gray-400 mb-2" />
                                    <p class="text-sm text-gray-600">
                                        Arraste e solte um arquivo aqui ou clique para selecionar
                                    </p>
                                    <p class="text-xs text-gray-500 mt-1">CSV ou XLSX (máx. 10MB)</p>
                                </div>

                                <div v-else class="flex items-center justify-center gap-2">
                                    <Icon icon="mdi:file-document-outline" class="w-6 h-6 text-blue-600" />
                                    <span class="text-sm text-gray-700">{{ selectedFile.name }}</span>
                                    <button
                                        type="button"
                                        class="text-red-600 hover:text-red-800"
                                        @click.stop="clearFile"
                                    >
                                        <Icon icon="mdi:close-circle-outline" class="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div v-if="uploadError" class="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p class="text-sm text-red-800">{{ uploadError }}</p>
                        </div>

                        <div class="flex gap-3">
                            <CButton
                                type="submit"
                                preset="primary"
                                :disabled="!selectedWalletId || !selectedFile || uploading"
                                class="flex-1"
                            >
                                <Icon v-if="uploading" icon="mdi:loading" class="w-5 h-5 animate-spin" />
                                <span v-else>Fazer Upload e Validar</span>
                            </CButton>

                            <CButton
                                type="button"
                                preset="outlined-black"
                                @click="$router.push('/imports')"
                            >
                                Cancelar
                            </CButton>
                        </div>
                    </div>
                </form>
            </div>

            <div class="bg-white rounded-lg shadow p-6">
                <h2 class="text-xl font-semibold text-gray-900 mb-4">Como Usar</h2>

                <div class="space-y-4 text-sm text-gray-600">
                    <div>
                        <h3 class="font-medium text-gray-900 mb-2">1. Baixe o Template</h3>
                        <p class="mb-2">
                            Use nosso template para garantir que o arquivo está no formato correto.
                        </p>

                        <div class="flex gap-2">
                            <CButton
                                preset="outlined-black"
                                size="sm"
                                :disabled="downloading"
                                @click="handleDownloadTemplate('csv')"
                            >
                                <Icon v-if="downloading" icon="mdi:loading" class="w-4 h-4 animate-spin" />
                                <Icon v-else icon="mdi:file-delimited-outline" class="w-4 h-4" />
                                Baixar CSV
                            </CButton>

                            <CButton
                                preset="outlined-black"
                                size="sm"
                                :disabled="downloading"
                                @click="handleDownloadTemplate('xlsx')"
                            >
                                <Icon v-if="downloading" icon="mdi:loading" class="w-4 h-4 animate-spin" />
                                <Icon v-else icon="mdi:file-excel-outline" class="w-4 h-4" />
                                Baixar XLSX
                            </CButton>
                        </div>
                    </div>

                    <div>
                        <h3 class="font-medium text-gray-900 mb-2">2. Preencha os Dados</h3>
                        <p>
                            Complete o arquivo com seus dados. Campos obrigatórios:
                        </p>

                        <ul class="list-disc list-inside mt-2 space-y-1">
                            <li><strong>reference_date</strong>: Data de referência (YYYY-MM-DD)</li>
                            <li><strong>hours</strong>: Horas (positivo = crédito, negativo = débito)</li>
                            <li><strong>title</strong>: Título do registro</li>
                        </ul>

                        <p class="mt-2">
                            Campos opcionais: <strong>description</strong>, <strong>tags</strong> (separadas por vírgula)
                        </p>
                    </div>

                    <div>
                        <h3 class="font-medium text-gray-900 mb-2">3. Validação</h3>
                        <p>
                            Após o upload, o sistema irá validar todos os registros. Você poderá revisar e corrigir
                            erros antes de confirmar a importação.
                        </p>
                    </div>

                    <div>
                        <h3 class="font-medium text-gray-900 mb-2">4. Confirmação</h3>
                        <p>
                            Uma vez confirmada, a importação criará entradas no ledger. Esta ação não pode ser desfeita.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, type Ref } from 'vue';
import { useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';
import { useImport } from '@/composables/useImport';
import { useWallets } from '@/composables/useWallets';
import { useToast } from '@/composables/useToast';
import type { Wallet } from '@/types';

const router = useRouter();
const { uploadFile, downloadTemplate } = useImport();
const { wallets, fetchWallets } = useWallets();
const toast = useToast();

const selectedWalletId: Ref<number | undefined> = ref(undefined);
const selectedFile: Ref<File | null> = ref(null);
const fileInput: Ref<HTMLInputElement | null> = ref(null);
const isDragging: Ref<boolean> = ref(false);
const uploading: Ref<boolean> = ref(false);
const downloading: Ref<boolean> = ref(false);
const uploadError: Ref<string | null> = ref(null);

onMounted(async () => {
    await fetchWallets();
});

function handleFileSelect(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (file) {
        validateAndSetFile(file);
    }
}

function handleFileDrop(event: DragEvent): void {
    isDragging.value = false;

    const file = event.dataTransfer?.files?.[0];

    if (file) {
        validateAndSetFile(file);
    }
}

function validateAndSetFile(file: File): void {
    uploadError.value = null;

    const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    const maxSize = 10 * 1024 * 1024;

    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
        uploadError.value = 'Apenas arquivos CSV e XLSX são permitidos.';
        return;
    }

    if (file.size > maxSize) {
        uploadError.value = 'O arquivo não pode exceder 10MB.';
        return;
    }

    selectedFile.value = file;
}

function clearFile(): void {
    selectedFile.value = null;
    uploadError.value = null;

    if (fileInput.value) {
        fileInput.value.value = '';
    }
}

async function handleUpload(): Promise<void> {
    if (!selectedWalletId.value || !selectedFile.value) {
        return;
    }

    uploading.value = true;
    uploadError.value = null;

    try {
        const importPlan = await uploadFile({
            wallet_id: selectedWalletId.value,
            file: selectedFile.value,
        });

        toast.success('Arquivo enviado com sucesso! Redirecionando para revisão...');

        setTimeout(() => {
            router.push(`/imports/${importPlan.id}/review`);
        }, 1000);
    } catch (err) {
        uploadError.value = err instanceof Error ? err.message : 'Erro ao fazer upload do arquivo.';
        toast.error('Erro ao fazer upload do arquivo');
    } finally {
        uploading.value = false;
    }
}

async function handleDownloadTemplate(format: 'csv' | 'xlsx'): Promise<void> {
    downloading.value = true;

    try {
        await downloadTemplate(format);
        toast.success(`Template ${format.toUpperCase()} baixado com sucesso`);
    } catch (err) {
        toast.error('Erro ao baixar template');
    } finally {
        downloading.value = false;
    }
}
</script>

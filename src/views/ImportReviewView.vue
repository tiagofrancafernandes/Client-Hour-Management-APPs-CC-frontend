<template>
    <div class="container mx-auto px-4 py-8">
        <div v-if="loading && !currentPlan" class="text-center py-12">
            <Icon icon="mdi:loading" class="w-12 h-12 animate-spin text-blue-600 mx-auto" />
            <p class="mt-4 text-gray-600">Carregando plano de importação...</p>
        </div>

        <div v-else-if="currentPlan" class="space-y-6">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-3xl font-bold text-gray-900">Revisar Importação</h1>
                    <p class="mt-2 text-gray-600">
                        Arquivo: <strong>{{ currentPlan.original_filename }}</strong>
                    </p>
                </div>

                <div class="flex items-center gap-2">
                    <span
                        :class="[
                            'px-3 py-1 rounded-full text-sm font-medium',
                            {
                                'bg-yellow-100 text-yellow-800': currentPlan.status === 'pending',
                                'bg-green-100 text-green-800': currentPlan.status === 'validated',
                                'bg-blue-100 text-blue-800': currentPlan.status === 'confirmed',
                                'bg-gray-100 text-gray-800': currentPlan.status === 'cancelled',
                            }
                        ]"
                    >
                        {{ statusLabels[currentPlan.status] }}
                    </span>
                </div>
            </div>

            <div v-if="currentPlan.summary" class="grid gap-4 md:grid-cols-4">
                <div class="bg-white rounded-lg shadow p-4">
                    <p class="text-sm text-gray-600">Total de Linhas</p>
                    <p class="text-2xl font-bold text-gray-900">{{ currentPlan.summary.total_rows }}</p>
                </div>

                <div class="bg-white rounded-lg shadow p-4">
                    <p class="text-sm text-gray-600">Linhas Válidas</p>
                    <p class="text-2xl font-bold text-green-600">{{ currentPlan.summary.valid_rows }}</p>
                </div>

                <div class="bg-white rounded-lg shadow p-4">
                    <p class="text-sm text-gray-600">Linhas com Erros</p>
                    <p class="text-2xl font-bold text-red-600">{{ currentPlan.summary.invalid_rows }}</p>
                </div>

                <div class="bg-white rounded-lg shadow p-4">
                    <p class="text-sm text-gray-600">Total de Horas</p>
                    <p class="text-2xl font-bold text-blue-600">{{ currentPlan.summary.total_hours }}</p>
                </div>
            </div>

            <div v-if="currentPlan.summary && currentPlan.summary.invalid_rows > 0" class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div class="flex items-start gap-3">
                    <Icon icon="mdi:alert-outline" class="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 class="font-medium text-yellow-900">Atenção: Linhas com Erros</h3>
                        <p class="text-sm text-yellow-800 mt-1">
                            Existem {{ currentPlan.summary.invalid_rows }} linha(s) com erros de validação.
                            Corrija os erros ou remova as linhas inválidas antes de confirmar a importação.
                        </p>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-lg shadow">
                <div class="p-4 border-b border-gray-200 flex items-center justify-between">
                    <h2 class="text-lg font-semibold text-gray-900">Registros a Importar</h2>

                    <div class="flex gap-2">
                        <CButton
                            v-if="currentPlan.status !== 'confirmed'"
                            preset="outlined-black"
                            size="sm"
                            @click="handleAddRow"
                        >
                            <Icon icon="mdi:plus" class="w-4 h-4" />
                            Adicionar Linha
                        </CButton>
                    </div>
                </div>

                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Horas</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Título</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tags</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                            </tr>
                        </thead>

                        <tbody class="divide-y divide-gray-200">
                            <tr
                                v-for="row in currentPlan.rows"
                                :key="row.id"
                                :class="{'bg-red-50': !row.is_valid}"
                            >
                                <td class="px-4 py-3 text-sm text-gray-900">{{ row.row_number }}</td>
                                <td class="px-4 py-3 text-sm text-gray-900">{{ formatDate(row.reference_date) }}</td>
                                <td class="px-4 py-3 text-sm">
                                    <span
                                        :class="{
                                            'text-green-600 font-medium': row.hours > 0,
                                            'text-red-600 font-medium': row.hours < 0,
                                        }"
                                    >
                                        {{ row.hours > 0 ? '+' : '' }}{{ row.hours }}h
                                    </span>
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-900">
                                    {{ row.title || '-' }}
                                </td>
                                <td class="px-4 py-3 text-sm">
                                    <div v-if="row.tags && row.tags.length > 0" class="flex flex-wrap gap-1">
                                        <span
                                            v-for="(tag, index) in row.tags"
                                            :key="index"
                                            class="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                                        >
                                            {{ tag }}
                                        </span>
                                    </div>
                                    <span v-else class="text-gray-400">-</span>
                                </td>
                                <td class="px-4 py-3">
                                    <div v-if="row.is_valid" class="flex items-center gap-1 text-green-600">
                                        <Icon icon="mdi:check-circle" class="w-5 h-5" />
                                        <span class="text-xs">Válido</span>
                                    </div>
                                    <div v-else class="flex items-center gap-1 text-red-600">
                                        <Icon icon="mdi:alert-circle" class="w-5 h-5" />
                                        <span class="text-xs">{{ row.validation_errors.length }} erro(s)</span>
                                    </div>
                                </td>
                                <td class="px-4 py-3">
                                    <div v-if="currentPlan.status !== 'confirmed'" class="flex gap-2">
                                        <button
                                            class="text-blue-600 hover:text-blue-800"
                                            @click="handleEditRow(row)"
                                        >
                                            <Icon icon="mdi:pencil" class="w-5 h-5" />
                                        </button>
                                        <button
                                            class="text-red-600 hover:text-red-800"
                                            @click="handleDeleteRow(row)"
                                        >
                                            <Icon icon="mdi:delete" class="w-5 h-5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div v-if="currentPlan.status !== 'confirmed' && currentPlan.status !== 'cancelled'" class="flex gap-3 justify-end">
                <CButton
                    preset="outlined-black"
                    @click="handleCancel"
                >
                    Cancelar Importação
                </CButton>

                <CButton
                    preset="primary"
                    :disabled="!canConfirm || confirming"
                    @click="handleConfirm"
                >
                    <Icon v-if="confirming" icon="mdi:loading" class="w-5 h-5 animate-spin" />
                    <span v-else>Confirmar e Criar Lançamentos</span>
                </CButton>
            </div>

            <div v-else-if="currentPlan.status === 'confirmed'" class="bg-green-50 border border-green-200 rounded-lg p-4">
                <div class="flex items-start gap-3">
                    <Icon icon="mdi:check-circle" class="w-6 h-6 text-green-600 flex-shrink-0" />
                    <div>
                        <h3 class="font-medium text-green-900">Importação Confirmada</h3>
                        <p class="text-sm text-green-800 mt-1">
                            Todos os registros foram importados com sucesso em {{ formatDate(currentPlan.confirmed_at!) }}.
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <div v-else class="text-center py-12">
            <Icon icon="mdi:file-alert-outline" class="w-16 h-16 text-gray-400 mx-auto" />
            <p class="mt-4 text-gray-600">Plano de importação não encontrado</p>
            <CButton preset="outlined-black" class="mt-4" @click="$router.push('/imports')">
                Voltar para Importações
            </CButton>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, type Ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';
import { useImport } from '@/composables/useImport';
import { useConfirm } from '@/composables/useConfirm';
import { useToast } from '@/composables/useToast';
import type { ImportPlanRow } from '@/types';

const route = useRoute();
const router = useRouter();
const { currentPlan, loading, fetchImportPlan, confirmImportPlan, cancelImportPlan, deleteRow } = useImport();
const { confirm } = useConfirm();
const toast = useToast();

const confirming: Ref<boolean> = ref(false);

const statusLabels: Record<string, string> = {
    pending: 'Pendente',
    validated: 'Validado',
    confirmed: 'Confirmado',
    cancelled: 'Cancelado',
};

const canConfirm = computed(() => {
    if (!currentPlan.value || !currentPlan.value.summary) {
        return false;
    }

    return currentPlan.value.summary.invalid_rows === 0 && currentPlan.value.summary.valid_rows > 0;
});

onMounted(async () => {
    const planId = Number(route.params.id);

    if (planId) {
        await fetchImportPlan(planId);
    }
});

function formatDate(dateString: string): string {
    if (!dateString) {
        return '-';
    }

    const date = new Date(dateString);

    return date.toLocaleDateString('pt-BR');
}

function handleEditRow(row: ImportPlanRow): void {
    console.log('Edit row', row);
}

async function handleDeleteRow(row: ImportPlanRow): Promise<void> {
    const confirmed = await confirm({
        title: 'Excluir Linha',
        message: `Tem certeza que deseja excluir a linha ${row.row_number}?`,
        confirmText: 'Excluir',
        cancelText: 'Cancelar',
        variant: 'danger',
    });

    if (!confirmed) {
        return;
    }

    try {
        await deleteRow(row.id);
        toast.success('Linha excluída com sucesso');
    } catch (err) {
        toast.error('Erro ao excluir linha');
    }
}

function handleAddRow(): void {
    console.log('Add row');
}

async function handleConfirm(): Promise<void> {
    if (!currentPlan.value || !canConfirm.value) {
        return;
    }

    const confirmed = await confirm({
        title: 'Confirmar Importação',
        message: `Confirmar a importação de ${currentPlan.value.summary?.valid_rows} registro(s)? Esta ação não pode ser desfeita.`,
        confirmText: 'Confirmar',
        cancelText: 'Cancelar',
        variant: 'warning',
    });

    if (!confirmed) {
        return;
    }

    confirming.value = true;

    try {
        await confirmImportPlan(currentPlan.value.id);
        toast.success('Importação confirmada com sucesso!');

        setTimeout(() => {
            router.push('/imports');
        }, 2000);
    } catch (err) {
        toast.error('Erro ao confirmar importação');
    } finally {
        confirming.value = false;
    }
}

async function handleCancel(): Promise<void> {
    if (!currentPlan.value) {
        return;
    }

    const confirmed = await confirm({
        title: 'Cancelar Importação',
        message: 'Tem certeza que deseja cancelar esta importação? O arquivo será removido.',
        confirmText: 'Sim, Cancelar',
        cancelText: 'Não',
        variant: 'danger',
    });

    if (!confirmed) {
        return;
    }

    try {
        await cancelImportPlan(currentPlan.value.id);
        toast.success('Importação cancelada');

        setTimeout(() => {
            router.push('/imports');
        }, 1000);
    } catch (err) {
        toast.error('Erro ao cancelar importação');
    }
}
</script>

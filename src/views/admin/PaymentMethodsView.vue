<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { Icon } from '@iconify/vue';
import { usePaymentMethodAdmin } from '@/composables/usePaymentMethodAdmin';
import { useConfirm } from '@/composables/useConfirm';
import CPaymentInstructionsEditModal from '@/components/CPaymentInstructionsEditModal.vue';

const { configs, loading, updating, pagination, fetchConfigs, updateConfig, toggleConfig } = usePaymentMethodAdmin();
const { state: confirmState, confirm, handleConfirm, handleCancel } = useConfirm();

// ─── Filters ──────────────────────────────────────────────────────────────────

const search = ref('');
const statusFilter = ref<'all' | 'active' | 'inactive'>('all');
const searchTimer = ref<ReturnType<typeof setTimeout> | null>(null);

function buildFilterParams(page = 1): Record<string, unknown> {
    const params: Record<string, unknown> = { page, per_page: 15 };

    if (search.value.trim()) {
        params.search = search.value.trim();
    }

    if (statusFilter.value === 'active') {
        params.active = true;
    }

    if (statusFilter.value === 'inactive') {
        params.active = false;
    }

    return params;
}

async function loadConfigs(page = 1): Promise<void> {
    await fetchConfigs(buildFilterParams(page));
}

function resetFilters(): void {
    search.value = '';
    statusFilter.value = 'all';
}

watch(search, () => {
    if (searchTimer.value) {
        clearTimeout(searchTimer.value);
    }

    searchTimer.value = setTimeout(() => {
        loadConfigs(1);
    }, 350);
});

watch(statusFilter, () => {
    loadConfigs(1);
});

// ─── Inline Edit ──────────────────────────────────────────────────────────────

const editingId = ref<number | null>(null);
const editingInstructionsId = ref<number | null>(null);

const editForm = ref({
    label: '',
    display_order: 0,
});

const editingInstructionsForm = ref<Array<{ key: string; value: string }>>([]);

function startEditing(config: { id: number; label: string; display_order: number }): void {
    editingId.value = config.id;
    editForm.value = {
        label: config.label,
        display_order: config.display_order,
    };
}

function cancelEditing(): void {
    editingId.value = null;
    editForm.value = { label: '', display_order: 0 };
}

function openInstructionsEditor(config: any): void {
    console.log('Opening instructions editor for:', config);

    editingInstructionsId.value = config.id;

    let instructions: Array<{ key: string; value: string }> = [];

    if (config.instructions) {
        try {
            if (typeof config.instructions === 'string') {
                instructions = JSON.parse(config.instructions);
            } else {
                instructions = config.instructions;
            }
        } catch (err) {
            console.error('Failed to parse instructions:', err);
            instructions = [];
        }
    }

    editingInstructionsForm.value = instructions.length > 0 ? instructions : [{ key: '', value: '' }];

    console.log('Editing ID set to:', editingInstructionsId.value);
    console.log('Instructions form:', editingInstructionsForm.value);
}

function closeInstructionsEditor(): void {
    editingInstructionsId.value = null;
    editingInstructionsForm.value = [];
}

async function saveInstructions(instructions: Array<{ key: string; value: string }>): Promise<void> {
    if (editingInstructionsId.value === null) return;

    const success = await updateConfig(editingInstructionsId.value, {
        instructions: instructions.length > 0 ? instructions : null,
    } as any);

    if (success) {
        closeInstructionsEditor();
    }
}

async function saveEditing(id: number): Promise<void> {
    const trimmedLabel = editForm.value.label.trim();

    if (!trimmedLabel) {
        return;
    }

    const success = await updateConfig(id, {
        label: trimmedLabel,
        display_order: editForm.value.display_order,
    });

    if (success) {
        cancelEditing();
    }
}

const togglePendingId = ref<number | null>(null);

async function requestToggle(id: number, currentStatus: boolean): Promise<void> {
    togglePendingId.value = id;

    const action = currentStatus ? 'desativar' : 'ativar';
    const confirmed = await confirm({
        title: `${action.charAt(0).toUpperCase() + action.slice(1)} Método de Pagamento`,
        message: `Tem certeza que deseja ${action} este método de pagamento?`,
        confirmText: 'Confirmar',
        cancelText: 'Cancelar',
        variant: currentStatus ? 'warning' : 'success',
    });

    if (confirmed) {
        await toggleConfig(id);
    }

    togglePendingId.value = null;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function goToPage(page: number): void {
    if (page < 1 || page > pagination.value.last_page) {
        return;
    }

    loadConfigs(page);
}

// ─── Init ─────────────────────────────────────────────────────────────────────

onMounted(async () => {
    await loadConfigs();
});
</script>

<template>
    <div class="container mx-auto px-4 py-8">
        <!-- Header -->
        <UIPageHeader
            title="Payment Methods"
            description="Manage available payment methods, labels, ordering, and activation status."
        />

        <!-- Filters -->
        <div class="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2 text-sm font-semibold text-gray-800">
                    <Icon icon="mdi:filter-variant" class="w-4 h-4 text-gray-500" />
                    Filters
                </div>

                <button
                    v-if="search.trim() || statusFilter !== 'all'"
                    type="button"
                    class="text-xs font-medium text-gray-600 hover:text-red-600 transition-colors"
                    @click="resetFilters"
                >
                    Clear all
                </button>
            </div>

            <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div class="relative">
                    <Icon icon="mdi:magnify" class="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />

                    <input
                        v-model="search"
                        type="text"
                        placeholder="Search by key or label..."
                        class="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-9 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    />
                </div>

                <select
                    v-model="statusFilter"
                    class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                >
                    <option value="all">All statuses</option>
                    <option value="active">Active only</option>
                    <option value="inactive">Inactive only</option>
                </select>
            </div>
        </div>

        <!-- Initial loading -->
        <div v-if="loading && configs.length === 0" class="flex justify-center py-16">
            <div class="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-red-600"></div>
        </div>

        <!-- Table -->
        <div v-else class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <!-- Reload bar -->
            <div v-if="loading" class="h-0.5 w-full bg-gray-100">
                <div class="h-full w-1/3 animate-pulse bg-red-500"></div>
            </div>

            <table class="w-full text-sm">
                <thead>
                    <tr
                        class="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                    >
                        <th class="px-5 py-3">Key</th>
                        <th class="px-5 py-3">Label</th>
                        <th class="px-5 py-3">Order</th>
                        <th class="px-5 py-3">Status</th>
                        <th class="px-5 py-3 text-right">Actions</th>
                    </tr>
                </thead>

                <tbody class="divide-y divide-gray-100">
                    <!-- Empty -->
                    <tr v-if="configs.length === 0">
                        <td colspan="5" class="px-5 py-12 text-center text-gray-400">
                            <Icon icon="mdi:credit-card-off-outline" class="mx-auto mb-2 text-4xl" />
                            <p>No payment methods found</p>
                        </td>
                    </tr>

                    <tr v-for="config in configs" :key="config.id" class="transition hover:bg-gray-50">
                        <!-- Key -->
                        <td class="px-5 py-3.5">
                            <code class="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700">
                                {{ config.payment_method_key }}
                            </code>
                        </td>

                        <!-- Label -->
                        <td class="px-5 py-3.5">
                            <input
                                v-if="editingId === config.id"
                                v-model="editForm.label"
                                type="text"
                                class="w-full rounded-lg border border-gray-300 px-2 py-1 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                            />

                            <span v-else class="font-medium text-gray-900">{{ config.label }}</span>
                        </td>

                        <!-- Display Order -->
                        <td class="px-5 py-3.5">
                            <input
                                v-if="editingId === config.id"
                                v-model.number="editForm.display_order"
                                type="number"
                                class="w-20 rounded-lg border border-gray-300 px-2 py-1 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                            />

                            <span v-else class="text-gray-700">{{ config.display_order }}</span>
                        </td>

                        <!-- Status Toggle -->
                        <td class="px-5 py-3.5">
                            <button
                                type="button"
                                :disabled="updating || togglePendingId === config.id"
                                :class="[
                                    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50',
                                    {
                                        'bg-green-100 text-green-800 hover:bg-green-200': config.is_active,
                                        'bg-gray-100 text-gray-600 hover:bg-gray-200': !config.is_active,
                                    },
                                ]"
                                @click="requestToggle(config.id, config.is_active)"
                            >
                                <Icon :icon="config.is_active ? 'mdi:check-circle' : 'mdi:close-circle-outline'" />
                                {{ config.is_active ? 'Active' : 'Inactive' }}
                            </button>
                        </td>

                        <!-- Actions -->
                        <td class="px-5 py-3.5 text-right">
                            <div v-if="editingId === config.id" class="inline-flex items-center gap-2">
                                <CButton
                                    preset="primary"
                                    class="text-xs"
                                    icon="mdi:check"
                                    :disabled="updating"
                                    @click="saveEditing(config.id)"
                                >
                                    Save
                                </CButton>

                                <CButton
                                    preset="outlined-black"
                                    class="text-xs"
                                    icon="mdi:close"
                                    :disabled="updating"
                                    @click="cancelEditing"
                                >
                                    Cancel
                                </CButton>
                            </div>

                            <div v-else class="inline-flex items-center gap-2">
                                <CButton
                                    preset="outlined-black"
                                    class="text-xs"
                                    icon="mdi:file-document-outline"
                                    @click="openInstructionsEditor(config)"
                                >
                                    Instructions
                                </CButton>

                                <CButton
                                    preset="outlined-black"
                                    class="text-xs"
                                    icon="mdi:pencil-outline"
                                    @click="startEditing(config)"
                                >
                                    Edit
                                </CButton>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>

            <!-- Pagination -->
            <div
                v-if="pagination.last_page > 1"
                class="flex items-center justify-between border-t border-gray-200 px-5 py-3"
            >
                <p class="text-xs text-gray-500">
                    Page {{ pagination.current_page }} of {{ pagination.last_page }} ({{ pagination.total }} total)
                </p>

                <div class="flex gap-2">
                    <CButton
                        preset="outlined-black"
                        class="text-xs"
                        :disabled="pagination.current_page <= 1"
                        icon="mdi:chevron-left"
                        @click="goToPage(pagination.current_page - 1)"
                    />

                    <CButton
                        preset="outlined-black"
                        class="text-xs"
                        :disabled="pagination.current_page >= pagination.last_page"
                        right-icon="mdi:chevron-right"
                        @click="goToPage(pagination.current_page + 1)"
                    />
                </div>
            </div>
        </div>

        <!-- Instructions Edit Modal -->
        <CPaymentInstructionsEditModal
            :is-open="editingInstructionsId !== null"
            :label="configs.find((c) => c.id === editingInstructionsId)?.label || ''"
            :instructions="editingInstructionsForm"
            @close="closeInstructionsEditor"
            @save="saveInstructions"
        />

        <!-- Confirm Modal for Toggle -->
        <ConfirmModal
            v-model:isOpen="confirmState.isOpen"
            :title="confirmState.title"
            :message="confirmState.message"
            :confirm-text="confirmState.confirmText"
            :cancel-text="confirmState.cancelText"
            :variant="confirmState.variant"
            @confirm="handleConfirm"
            @cancel="handleCancel"
        />
    </div>
</template>

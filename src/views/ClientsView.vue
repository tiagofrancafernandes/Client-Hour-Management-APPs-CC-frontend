<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Icon } from '@iconify/vue';
import { useClients } from '@/composables/useClients';
import { useRouter } from 'vue-router';
import { usePermissions } from '@/composables/usePermissions';
import type { Client } from '@/types';

const router = useRouter();
const { clients, loading, error, pagination, fetchClients, createClient, updateClient, deleteClient } = useClients();
const { canManageClients } = usePermissions();

const showCreateModal = ref(false);
const showEditModal = ref(false);
const editingClient = ref<Client | null>(null);
const newClientName = ref('');
const newClientNotes = ref('');
const searchQuery = ref('');

onMounted(() => {
    fetchClients();
});

async function handleCreate(): Promise<void> {
    if (!newClientName.value.trim()) {
        return;
    }

    try {
        await createClient({
            name: newClientName.value,
            notes: newClientNotes.value || undefined,
        });

        showCreateModal.value = false;
        newClientName.value = '';
        newClientNotes.value = '';
    } catch {
        // Error handled in composable
    }
}

function handleEdit(client: Client): void {
    editingClient.value = { ...client };
    showEditModal.value = true;
}

async function handleUpdate(): Promise<void> {
    if (!editingClient.value || !editingClient.value.name.trim()) {
        return;
    }

    try {
        await updateClient(editingClient.value.id, {
            name: editingClient.value.name,
            notes: editingClient.value.notes || undefined,
        });

        showEditModal.value = false;
        editingClient.value = null;
    } catch {
        // Error handled in composable
    }
}

async function handleDelete(id: number): Promise<void> {
    if (confirm('Are you sure you want to delete this client?')) {
        await deleteClient(id);
    }
}

function handleSearch(): void {
    fetchClients(1, searchQuery.value);
}

function goToClient(id: number): void {
    router.push({ name: 'client-detail', params: { id } });
}
</script>

<template>
    <div class="container mx-auto px-4 py-8">
        <!-- Header -->
        <UIPageHeader title="Clients" description="Manage your clients.">
            <template #actions>
                <CButton v-if="canManageClients" preset="primary-md" icon="mdi:plus" @click="showCreateModal = true">
                    New Client
                </CButton>
            </template>
        </UIPageHeader>

        <!-- Search bar -->
        <div class="mb-5 flex gap-2">
            <input
                v-model="searchQuery"
                type="text"
                placeholder="Search clients..."
                class="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors"
                @keyup.enter="handleSearch"
            />
            <CButton preset="lightgray-md" @click="handleSearch">
                <Icon icon="heroicons:magnifying-glass" class="w-4 h-4" />
            </CButton>
        </div>

        <!-- Error -->
        <div
            v-if="error"
            class="mb-4 flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 p-3.5 text-sm text-red-700"
        >
            <Icon icon="heroicons:exclamation-circle" class="w-4 h-4 mt-0.5 flex-shrink-0" />
            {{ error }}
        </div>

        <!-- Loading -->
        <div v-if="loading" class="py-12 text-center text-sm text-gray-500">
            <Icon icon="heroicons:arrow-path" class="w-5 h-5 animate-spin mx-auto mb-2 text-gray-400" />
            Loading...
        </div>

        <!-- Table -->
        <div v-else class="overflow-hidden rounded-xl bg-white border border-gray-200 shadow-sm">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                            Name
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                            Notes
                        </th>
                        <th class="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 bg-white">
                    <tr
                        v-for="client in clients"
                        :key="client.id"
                        class="cursor-pointer hover:bg-gray-50 transition-colors"
                        @click="goToClient(client.id)"
                    >
                        <td class="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900">
                            {{ client.name }}
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                            {{ client.notes || '—' }}
                        </td>
                        <td class="whitespace-nowrap px-6 py-4 text-right text-sm">
                            <div v-if="canManageClients" class="flex justify-end gap-1">
                                <button
                                    class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                                    @click.stop="handleEdit(client)"
                                >
                                    <Icon icon="heroicons:pencil-square" class="w-3.5 h-3.5" />
                                    Edit
                                </button>
                                <button
                                    class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                                    @click.stop="handleDelete(client.id)"
                                >
                                    <Icon icon="heroicons:trash" class="w-3.5 h-3.5" />
                                    Delete
                                </button>
                            </div>
                        </td>
                    </tr>

                    <!-- Empty state -->
                    <tr v-if="!clients.length">
                        <td colspan="3" class="px-6 py-12 text-center">
                            <Icon icon="heroicons:users" class="w-10 h-10 text-gray-300 mx-auto mb-2" />
                            <p class="text-sm font-medium text-gray-500">No clients found</p>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Pagination -->
        <div v-if="pagination.lastPage > 1" class="mt-4 flex items-center justify-center gap-2">
            <button
                :disabled="pagination.currentPage === 1"
                class="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                @click="fetchClients(pagination.currentPage - 1, searchQuery)"
            >
                <Icon icon="heroicons:chevron-left" class="w-4 h-4" />
                Previous
            </button>
            <span class="text-sm text-gray-500">Page {{ pagination.currentPage }} of {{ pagination.lastPage }}</span>
            <button
                :disabled="pagination.currentPage === pagination.lastPage"
                class="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                @click="fetchClients(pagination.currentPage + 1, searchQuery)"
            >
                Next
                <Icon icon="heroicons:chevron-right" class="w-4 h-4" />
            </button>
        </div>

        <!-- Create Modal -->
        <Teleport to="body">
            <div
                v-if="showCreateModal"
                class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
                @click.self="showCreateModal = false"
            >
                <div class="w-full max-w-md rounded-2xl bg-white shadow-xl">
                    <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                        <h2 class="text-base font-semibold text-gray-900">New Client</h2>
                        <button
                            class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                            @click="showCreateModal = false"
                        >
                            <Icon icon="heroicons:x-mark" class="w-4 h-4" />
                        </button>
                    </div>

                    <div class="px-6 py-5 space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
                            <input
                                v-model="newClientName"
                                type="text"
                                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors"
                                placeholder="Client name"
                            />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                            <textarea
                                v-model="newClientNotes"
                                rows="3"
                                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors resize-none"
                                placeholder="Optional notes..."
                            ></textarea>
                        </div>
                    </div>

                    <div class="flex justify-end gap-2 px-6 py-4 bg-gray-50 rounded-b-2xl border-t border-gray-100">
                        <CButton preset="lightgray-md" @click="showCreateModal = false">Cancel</CButton>
                        <CButton preset="primary-md" @click="handleCreate">Create Client</CButton>
                    </div>
                </div>
            </div>
        </Teleport>

        <!-- Edit Modal -->
        <Teleport to="body">
            <div
                v-if="showEditModal && editingClient"
                class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
                @click.self="showEditModal = false"
            >
                <div class="w-full max-w-md rounded-2xl bg-white shadow-xl">
                    <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                        <h2 class="text-base font-semibold text-gray-900">Edit Client</h2>
                        <button
                            class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                            @click="showEditModal = false"
                        >
                            <Icon icon="heroicons:x-mark" class="w-4 h-4" />
                        </button>
                    </div>

                    <div class="px-6 py-5 space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
                            <input
                                v-model="editingClient.name"
                                type="text"
                                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors"
                            />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                            <textarea
                                v-model="editingClient.notes"
                                rows="3"
                                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors resize-none"
                            ></textarea>
                        </div>
                    </div>

                    <div class="flex justify-end gap-2 px-6 py-4 bg-gray-50 rounded-b-2xl border-t border-gray-100">
                        <CButton preset="lightgray-md" @click="showEditModal = false">Cancel</CButton>
                        <CButton preset="primary-md" @click="handleUpdate">Save Changes</CButton>
                    </div>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
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

async function handleCreate() {
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

function handleEdit(client: Client) {
    editingClient.value = { ...client };
    showEditModal.value = true;
}

async function handleUpdate() {
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

async function handleDelete(id: number) {
    if (confirm('Are you sure you want to delete this client?')) {
        await deleteClient(id);
    }
}

function handleSearch() {
    fetchClients(1, searchQuery.value);
}

function goToClient(id: number) {
    router.push({ name: 'client-detail', params: { id } });
}
</script>

<template>
    <div class="container mx-auto px-4 py-8">
        <!-- Header -->
        <UIPageHeader title="Clients" description="Manage your clients.">
            <template v-slot:actions>
                <CButton v-if="canManageClients" preset="primary" @click="showCreateModal = true" icon="mdi:plus">
                    New Client
                </CButton>
            </template>
        </UIPageHeader>

        <div class="mb-6">
            <div class="flex gap-2">
                <input
                    v-model="searchQuery"
                    type="text"
                    placeholder="Search clients..."
                    class="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                    @keyup.enter="handleSearch"
                />
                <button class="rounded-lg bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200" @click="handleSearch">
                    Search
                </button>
            </div>
        </div>

        <div v-if="error" class="mb-4 rounded-lg bg-red-100 p-4 text-red-700">
            {{ error }}
        </div>

        <div v-if="loading" class="py-8 text-center">Loading...</div>

        <div v-else class="overflow-hidden rounded-lg bg-white shadow">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Name
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Notes
                        </th>
                        <th class="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 bg-white">
                    <tr
                        v-for="client in clients"
                        :key="client.id"
                        class="cursor-pointer hover:bg-gray-50"
                        @click="goToClient(client.id)"
                    >
                        <td class="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                            {{ client.name }}
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-500">
                            {{ client.notes || '-' }}
                        </td>
                        <td class="whitespace-nowrap px-6 py-4 text-right text-sm">
                            <div v-if="canManageClients" class="flex justify-end gap-2">
                                <button class="text-blue-600 hover:text-blue-900" @click.stop="handleEdit(client)">
                                    Edit
                                </button>
                                <button class="text-red-600 hover:text-red-900" @click.stop="handleDelete(client.id)">
                                    Delete
                                </button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div v-if="pagination.lastPage > 1" class="mt-4 flex justify-center gap-2">
            <button
                :disabled="pagination.currentPage === 1"
                class="rounded px-3 py-1 disabled:opacity-50"
                :class="{
                    'bg-gray-200': pagination.currentPage === 1,
                    'bg-blue-600 text-white': pagination.currentPage !== 1,
                }"
                @click="fetchClients(pagination.currentPage - 1, searchQuery)"
            >
                Previous
            </button>
            <span class="px-3 py-1">Page {{ pagination.currentPage }} of {{ pagination.lastPage }}</span>
            <button
                :disabled="pagination.currentPage === pagination.lastPage"
                class="rounded px-3 py-1 disabled:opacity-50"
                :class="{
                    'bg-gray-200': pagination.currentPage === pagination.lastPage,
                    'bg-blue-600 text-white': pagination.currentPage !== pagination.lastPage,
                }"
                @click="fetchClients(pagination.currentPage + 1, searchQuery)"
            >
                Next
            </button>
        </div>

        <!-- Create Modal -->
        <div v-if="showCreateModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div class="w-full max-w-md rounded-lg bg-white p-6">
                <h2 class="mb-4 text-lg font-semibold">New Client</h2>
                <div class="mb-4">
                    <label class="mb-1 block text-sm font-medium text-gray-700">Name</label>
                    <input
                        v-model="newClientName"
                        type="text"
                        class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                    />
                </div>
                <div class="mb-4">
                    <label class="mb-1 block text-sm font-medium text-gray-700">Notes</label>
                    <textarea
                        v-model="newClientNotes"
                        rows="3"
                        class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                    ></textarea>
                </div>
                <div class="flex justify-end gap-2">
                    <button
                        class="rounded-lg bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200"
                        @click="showCreateModal = false"
                    >
                        Cancel
                    </button>
                    <CButton @click="handleCreate">Create</CButton>
                </div>
            </div>
        </div>

        <!-- Edit Modal -->
        <div
            v-if="showEditModal && editingClient"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        >
            <div class="w-full max-w-md rounded-lg bg-white p-6">
                <h2 class="mb-4 text-lg font-semibold">Edit Client</h2>
                <div class="mb-4">
                    <label class="mb-1 block text-sm font-medium text-gray-700">Name</label>
                    <input
                        v-model="editingClient.name"
                        type="text"
                        class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                    />
                </div>
                <div class="mb-4">
                    <label class="mb-1 block text-sm font-medium text-gray-700">Notes</label>
                    <textarea
                        v-model="editingClient.notes"
                        rows="3"
                        class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                    ></textarea>
                </div>
                <div class="flex justify-end gap-2">
                    <button
                        class="rounded-lg bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200"
                        @click="showEditModal = false"
                    >
                        Cancel
                    </button>
                    <CButton @click="handleUpdate">Update</CButton>
                </div>
            </div>
        </div>
    </div>
</template>

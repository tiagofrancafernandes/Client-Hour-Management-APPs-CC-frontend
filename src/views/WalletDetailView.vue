<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useWallets } from '@/composables/useWallets';
import { useLedger } from '@/composables/useLedger';
import { useTags } from '@/composables/useTags';
import { usePermissions } from '@/composables/usePermissions';
import TagInput from '@/components/TagInput.vue';
import type { LedgerEntryForm } from '@/types';

const route = useRoute();
const router = useRouter();
const walletId = Number(route.params.id);

const {
    wallet,
    entries,
    loading: walletLoading,
    error: walletError,
    pagination,
    fetchWallet,
    fetchWalletEntries,
} = useWallets();

const { createEntry, loading: entryLoading } = useLedger();
const { fetchTags } = useTags();
const { canAddCredits, canAddDebits, canAddAdjustments } = usePermissions();

const canAddEntry = computed(() => {
    return canAddCredits.value || canAddDebits.value || canAddAdjustments.value;
});

const showEntryModal = ref(false);
const entryForm = ref<LedgerEntryForm>({
    wallet_id: walletId,
    type: 'debit',
    hours: 0,
    title: '',
    description: '',
    reference_date: new Date().toISOString().split('T')[0],
    tags: [],
});

const currentBalance = computed(() => wallet.value?.balance || '0');

onMounted(async () => {
    await Promise.all([fetchWallet(walletId), fetchWalletEntries(walletId), fetchTags()]);
});

async function handleCreateEntry() {
    if (entryForm.value.hours <= 0) {
        return;
    }

    try {
        const response = await createEntry(entryForm.value);

        showEntryModal.value = false;
        entryForm.value = {
            wallet_id: walletId,
            type: 'debit',
            hours: 0,
            title: '',
            description: '',
            reference_date: new Date().toISOString().split('T')[0],
            tags: [],
        };

        if (wallet.value) {
            wallet.value.balance = response.new_balance;
        }

        fetchWalletEntries(walletId);
    } catch {
        // Error handled in composable
    }
}

function formatBalance(balance: string): string {
    const num = parseFloat(balance);

    if (num > 0) {
        return `+${balance}h`;
    }

    return `${balance}h`;
}

function getBalanceColor(balance: string): string {
    const num = parseFloat(balance);

    if (num > 0) {
        return 'text-green-600';
    }

    if (num < 0) {
        return 'text-red-600';
    }

    return 'text-gray-600';
}

function formatHours(hours: string): string {
    const num = parseFloat(hours);

    if (num > 0) {
        return `+${hours}h`;
    }

    return `${hours}h`;
}

function getHoursColor(hours: string): string {
    const num = parseFloat(hours);

    if (num > 0) {
        return 'text-green-600';
    }

    return 'text-red-600';
}

function formatDate(date: string | null): string {
    if (!date) {
        return '-';
    }

    return new Date(date).toLocaleDateString();
}
</script>

<template>
    <div class="container mx-auto px-4 py-8">
        <button class="mb-4 text-blue-600 hover:text-blue-800" @click="router.back()">← Back</button>

        <div v-if="walletError" class="mb-4 rounded-lg bg-red-100 p-4 text-red-700">
            {{ walletError }}
        </div>

        <div v-if="walletLoading && !wallet" class="py-8 text-center">Loading...</div>

        <div v-else-if="wallet">
            <div class="mb-6 rounded-lg bg-white p-6 shadow">
                <div class="flex items-start justify-between">
                    <div>
                        <p class="text-sm text-gray-500">{{ wallet.client?.name }}</p>
                        <h1 class="text-2xl font-bold text-gray-900">{{ wallet.name }}</h1>
                        <p v-if="wallet.description" class="mt-1 text-gray-600">
                            {{ wallet.description }}
                        </p>
                        <p v-if="wallet.hourly_rate_reference" class="mt-1 text-sm text-gray-500">
                            Rate: ${{ wallet.hourly_rate_reference }}/h
                        </p>
                    </div>
                    <div class="text-right">
                        <p class="text-sm text-gray-500">Current Balance</p>
                        <p class="text-3xl font-bold" :class="getBalanceColor(currentBalance)">
                            {{ formatBalance(currentBalance) }}
                        </p>
                    </div>
                </div>
            </div>

            <div class="mb-4 flex items-center justify-between">
                <h2 class="text-xl font-semibold text-gray-900">Ledger Entries</h2>
                <CButton v-if="canAddEntry" @click="showEntryModal = true">Add Entry</CButton>
            </div>

            <div class="overflow-hidden rounded-lg bg-white shadow">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                Date
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                Title
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                Tags
                            </th>
                            <th class="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                Hours
                            </th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200 bg-white">
                        <tr v-for="entry in entries" :key="entry.id">
                            <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                {{ formatDate(entry.reference_date) }}
                            </td>
                            <td class="px-6 py-4 text-sm text-gray-900">
                                <div>{{ entry.title || '-' }}</div>
                                <div v-if="entry.description" class="text-xs text-gray-500">
                                    {{ entry.description }}
                                </div>
                            </td>
                            <td class="px-6 py-4 text-sm">
                                <div class="flex flex-wrap gap-1">
                                    <span
                                        v-for="tag in entry.tags"
                                        :key="tag.id"
                                        class="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                                    >
                                        {{ tag.name }}
                                    </span>
                                </div>
                            </td>
                            <td
                                class="whitespace-nowrap px-6 py-4 text-right text-sm font-medium"
                                :class="getHoursColor(entry.hours)"
                            >
                                {{ formatHours(entry.hours) }}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div v-if="!entries.length" class="py-8 text-center text-gray-500">No entries yet.</div>

            <div v-if="pagination.lastPage > 1" class="mt-4 flex justify-center gap-2">
                <button
                    :disabled="pagination.currentPage === 1"
                    class="rounded px-3 py-1 disabled:opacity-50"
                    :class="{
                        'bg-gray-200': pagination.currentPage === 1,
                        'bg-blue-600 text-white': pagination.currentPage !== 1,
                    }"
                    @click="fetchWalletEntries(walletId, pagination.currentPage - 1)"
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
                    @click="fetchWalletEntries(walletId, pagination.currentPage + 1)"
                >
                    Next
                </button>
            </div>
        </div>

        <!-- Add Entry Modal -->
        <div v-if="showEntryModal" class="fixed inset-0 flex items-center justify-center bg-black/50">
            <div class="w-full max-w-md rounded-lg bg-white p-6">
                <h2 class="mb-4 text-lg font-semibold">Add Ledger Entry</h2>

                <div class="mb-4">
                    <label class="mb-1 block text-sm font-medium text-gray-700">Type</label>
                    <select
                        v-model="entryForm.type"
                        class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                    >
                        <option v-if="canAddDebits" value="debit">Debit (consume hours)</option>
                        <option v-if="canAddCredits" value="credit">Credit (add hours)</option>
                        <option v-if="canAddAdjustments" value="adjustment">Adjustment</option>
                    </select>
                </div>

                <div class="mb-4">
                    <label class="mb-1 block text-sm font-medium text-gray-700">Hours</label>
                    <input
                        v-model.number="entryForm.hours"
                        type="number"
                        step="0.25"
                        min="0"
                        class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                    />
                </div>

                <div class="mb-4">
                    <label class="mb-1 block text-sm font-medium text-gray-700">Title</label>
                    <input
                        v-model="entryForm.title"
                        type="text"
                        class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                    />
                </div>

                <div class="mb-4">
                    <label class="mb-1 block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                        v-model="entryForm.description"
                        rows="2"
                        class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                    ></textarea>
                </div>

                <div class="mb-4">
                    <label class="mb-1 block text-sm font-medium text-gray-700">Reference Date</label>
                    <input
                        v-model="entryForm.reference_date"
                        type="date"
                        class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                    />
                </div>

                <div class="mb-4">
                    <label class="mb-1 block text-sm font-medium text-gray-700">Tags</label>
                    <TagInput v-model="entryForm.tags" placeholder="Add tags..." :allow-create="true" />
                </div>

                <div class="flex justify-end gap-2">
                    <button
                        class="rounded-lg bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200"
                        @click="showEntryModal = false"
                    >
                        Cancel
                    </button>
                    <button
                        :disabled="entryLoading"
                        class="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                        @click="handleCreateEntry"
                    >
                        {{ entryLoading ? 'Saving...' : 'Save' }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

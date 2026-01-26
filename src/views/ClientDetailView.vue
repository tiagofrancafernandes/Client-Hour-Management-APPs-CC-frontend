<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useClients } from '@/composables/useClients';
import { useWallets } from '@/composables/useWallets';

const route = useRoute();
const router = useRouter();
const clientId = Number(route.params.id);

const { client, loading: clientLoading, error: clientError, fetchClient } = useClients();
const { createWallet } = useWallets();

const showCreateWalletModal = ref(false);
const newWalletName = ref('');
const newWalletDescription = ref('');
const newWalletHourlyRate = ref<number | undefined>(undefined);

onMounted(() => {
    fetchClient(clientId);
});

async function handleCreateWallet() {
    if (!newWalletName.value.trim()) {
        return;
    }

    try {
        await createWallet({
            client_id: clientId,
            name: newWalletName.value,
            description: newWalletDescription.value || undefined,
            hourly_rate_reference: newWalletHourlyRate.value,
        });

        showCreateWalletModal.value = false;
        newWalletName.value = '';
        newWalletDescription.value = '';
        newWalletHourlyRate.value = undefined;
        fetchClient(clientId);
    } catch {
        // Error handled in composable
    }
}

function goToWallet(walletId: number) {
    router.push({ name: 'wallet-detail', params: { id: walletId } });
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
</script>

<template>
    <div class="container mx-auto px-4 py-8">
        <button
            class="mb-4 text-blue-600 hover:text-blue-800"
            @click="router.push({ name: 'clients' })"
        >
            ← Back to Clients
        </button>

        <div
            v-if="clientError"
            class="mb-4 rounded-lg bg-red-100 p-4 text-red-700"
        >
            {{ clientError }}
        </div>

        <div
            v-if="clientLoading"
            class="py-8 text-center"
        >
            Loading...
        </div>

        <div v-else-if="client">
            <div class="mb-6 rounded-lg bg-white p-6 shadow">
                <div class="flex items-start justify-between">
                    <div>
                        <h1 class="text-2xl font-bold text-gray-900">{{ client.name }}</h1>
                        <p
                            v-if="client.notes"
                            class="mt-1 text-gray-600"
                        >
                            {{ client.notes }}
                        </p>
                    </div>
                    <div class="text-right">
                        <p class="text-sm text-gray-500">Total Balance</p>
                        <p
                            class="text-2xl font-bold"
                            :class="getBalanceColor(client.total_balance || '0')"
                        >
                            {{ formatBalance(client.total_balance || '0') }}
                        </p>
                    </div>
                </div>
            </div>

            <div class="mb-4 flex items-center justify-between">
                <h2 class="text-xl font-semibold text-gray-900">Wallets</h2>
                <button
                    class="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                    @click="showCreateWalletModal = true"
                >
                    New Wallet
                </button>
            </div>

            <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div
                    v-for="wallet in client.wallets"
                    :key="wallet.id"
                    class="cursor-pointer rounded-lg bg-white p-4 shadow transition-shadow hover:shadow-md"
                    @click="goToWallet(wallet.id)"
                >
                    <div class="flex items-start justify-between">
                        <div>
                            <h3 class="font-semibold text-gray-900">{{ wallet.name }}</h3>
                            <p
                                v-if="wallet.description"
                                class="mt-1 text-sm text-gray-500"
                            >
                                {{ wallet.description }}
                            </p>
                        </div>
                        <div class="text-right">
                            <p
                                class="text-lg font-bold"
                                :class="getBalanceColor(wallet.balance)"
                            >
                                {{ formatBalance(wallet.balance) }}
                            </p>
                        </div>
                    </div>
                    <div
                        v-if="wallet.hourly_rate_reference"
                        class="mt-2 text-sm text-gray-500"
                    >
                        Rate: ${{ wallet.hourly_rate_reference }}/h
                    </div>
                </div>
            </div>

            <div
                v-if="!client.wallets?.length"
                class="py-8 text-center text-gray-500"
            >
                No wallets yet. Create one to start tracking hours.
            </div>
        </div>

        <!-- Create Wallet Modal -->
        <div
            v-if="showCreateWalletModal"
            class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
        >
            <div class="w-full max-w-md rounded-lg bg-white p-6">
                <h2 class="mb-4 text-lg font-semibold">New Wallet</h2>
                <div class="mb-4">
                    <label class="mb-1 block text-sm font-medium text-gray-700">Name</label>
                    <input
                        v-model="newWalletName"
                        type="text"
                        class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                    />
                </div>
                <div class="mb-4">
                    <label class="mb-1 block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                        v-model="newWalletDescription"
                        rows="2"
                        class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                    ></textarea>
                </div>
                <div class="mb-4">
                    <label class="mb-1 block text-sm font-medium text-gray-700">
                        Hourly Rate Reference (optional)
                    </label>
                    <input
                        v-model.number="newWalletHourlyRate"
                        type="number"
                        step="0.01"
                        min="0"
                        class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                    />
                </div>
                <div class="flex justify-end gap-2">
                    <button
                        class="rounded-lg bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200"
                        @click="showCreateWalletModal = false"
                    >
                        Cancel
                    </button>
                    <button
                        class="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                        @click="handleCreateWallet"
                    >
                        Create
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

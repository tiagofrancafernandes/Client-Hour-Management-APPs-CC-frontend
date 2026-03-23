<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@/composables/useAuth';
import { useCustomerData } from '@/composables/useCustomerData';
import { useToast } from '@/composables/useToast';
import type { Wallet } from '@/types';

const router = useRouter();
const toast = useToast();
const { myClient, myWallets, loading, error, myWalletsSummary, fetchMyClient, fetchMyWallets } = useCustomerData();

onMounted(async () => {
    try {
        await fetchMyClient();
        await fetchMyWallets();
    } catch (e) {
        toast.error('Erro ao carregar dados do cliente');
    }
});

function goToWallet(wallet: Wallet) {
    router.push({ name: 'wallet-detail', params: { id: wallet.id } });
}

function goToReports() {
    router.push({ name: 'reports' });
}

function formatBalance(balance: string | number): string {
    const num = typeof balance === 'string' ? parseFloat(balance) : balance;

    return num.toFixed(2).replace('.', ',');
}

function formatMonthYear(dateString: string | null | undefined): string {
    if (!dateString) {
        return '-';
    }

    const date = new Date(dateString);

    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

function getClientSinceDate(): string {
    if (myClient.value?.customer_since) {
        return formatMonthYear(myClient.value.customer_since);
    }

    return formatMonthYear(myClient.value?.created_at);
}
</script>

<template>
    <div class="container mx-auto px-4 py-8">
        <!-- Header -->
        <UIPageHeader title="Meu Dashboard" description="Visualize seus dados de carteira e relatórios.">
            <template v-slot:actions>
                <CButton preset="primary" @click="goToReports" icon="mdi:chart-line">Relatórios</CButton>
            </template>
        </UIPageHeader>

        <!-- Loading State -->
        <div v-if="loading" class="flex justify-center py-12">
            <div class="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-red-600"></div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="rounded-lg border border-red-300 bg-red-50 p-4 text-red-800">
            {{ error }}
        </div>

        <!-- Main Content -->
        <div v-else class="space-y-8">
            <!-- Client Info Section -->
            <div v-if="myClient" class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <h2 class="mb-4 text-2xl font-bold text-gray-900">{{ myClient.name }}</h2>

                <div class="space-y-2 text-gray-700">
                    <p v-if="myClient.notes">
                        <strong>Notas:</strong>
                        {{ myClient.notes }}
                    </p>

                    <p>
                        <strong>Cliente desde:</strong>
                        {{ getClientSinceDate() }}
                    </p>
                </div>
            </div>

            <!-- Wallets Summary Section -->
            <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <p class="text-sm text-gray-600">Total de Carteiras</p>
                    <p class="mt-2 text-3xl font-bold text-gray-900">{{ myWalletsSummary.totalWallets }}</p>
                </div>

                <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <p class="text-sm text-gray-600">Saldo Total</p>
                    <p class="mt-2 text-3xl font-bold text-gray-900">
                        {{ formatBalance(myWalletsSummary.totalBalance) }}h
                    </p>
                </div>

                <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <p class="text-sm text-gray-600">Média por Carteira</p>
                    <p class="mt-2 text-3xl font-bold text-gray-900">
                        {{
                            formatBalance(
                                myWalletsSummary.totalWallets > 0
                                    ? myWalletsSummary.totalBalance / myWalletsSummary.totalWallets
                                    : 0
                            )
                        }}h
                    </p>
                </div>
            </div>

            <!-- Wallets List Section -->
            <div class="space-y-4">
                <h3 class="text-xl font-bold text-gray-900">Minhas Carteiras</h3>

                <div v-if="myWallets.length === 0" class="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
                    <p class="text-gray-600">Nenhuma carteira disponível</p>
                </div>

                <div v-else class="space-y-3">
                    <div
                        v-for="wallet in myWallets"
                        :key="wallet.id"
                        class="cursor-pointer rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md"
                        @click="goToWallet(wallet)"
                    >
                        <div class="flex items-start justify-between">
                            <div class="flex-1">
                                <h4 class="font-semibold text-gray-900">{{ wallet.name }}</h4>

                                <p v-if="wallet.description" class="mt-1 text-sm text-gray-600">
                                    {{ wallet.description }}
                                </p>

                                <div v-if="wallet.hourly_rate_reference" class="mt-2 text-xs text-gray-500">
                                    Taxa: R$ {{ parseFloat(wallet.hourly_rate_reference).toFixed(2) }}/hora
                                </div>
                            </div>

                            <div class="text-right">
                                <p
                                    :class="[
                                        'text-lg font-bold',
                                        {
                                            'text-green-600': parseFloat(wallet.balance) >= 0,
                                            'text-red-600': parseFloat(wallet.balance) < 0,
                                        },
                                    ]"
                                >
                                    {{ formatBalance(wallet.balance) }}h
                                </p>

                                <p class="mt-1 text-xs text-gray-500">Saldo</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

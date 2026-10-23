<script setup lang="ts">
import { Icon } from '@iconify/vue';
import type { TypeaheadOption } from '@/types';

export interface PaymentHistoryFilterState {
    dateFrom: string | number | Date;
    dateTo: string | number | Date;
    purchaseStatus: string;
    paymentStatus: string;
    paymentMethod: string;
    walletId: number | null;
    clientId: number | null;
}

interface Props {
    show: boolean;
    filters: PaymentHistoryFilterState;
    walletOptions: TypeaheadOption[];
    clientOptions: TypeaheadOption[];
    canViewAnyReports: boolean;
    activeFiltersCount: number;
    refreshWalletOptions: (params: { searchTerm: string }) => Promise<TypeaheadOption[]>;
    refreshClientOptions: (params: { searchTerm: string }) => Promise<TypeaheadOption[]>;
}

defineProps<Props>();

const emit = defineEmits<{
    reset: [];
}>();
</script>

<template>
    <div v-if="show" class="mb-5 rounded-xl border border-gray-200 bg-white shadow-sm p-5">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <!-- Date from -->
            <div class="space-y-1">
                <label class="block text-xs font-medium text-gray-600 uppercase tracking-wide">From</label>
                <input
                    v-model="filters.dateFrom"
                    type="date"
                    class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
            </div>

            <!-- Date to -->
            <div class="space-y-1">
                <label class="block text-xs font-medium text-gray-600 uppercase tracking-wide">To</label>
                <input
                    v-model="filters.dateTo"
                    type="date"
                    class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
            </div>

            <!-- Purchase status -->
            <div class="space-y-1">
                <label class="block text-xs font-medium text-gray-600 uppercase tracking-wide">Purchase Status</label>
                <select
                    v-model="filters.purchaseStatus"
                    class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                    <option value="">All statuses</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="cancelled">Cancelled</option>
                </select>
            </div>

            <!-- Payment status -->
            <div class="space-y-1">
                <label class="block text-xs font-medium text-gray-600 uppercase tracking-wide">Payment Status</label>
                <select
                    v-model="filters.paymentStatus"
                    class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                    <option value="">All statuses</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="completed">Completed</option>
                </select>
            </div>

            <!-- Payment method -->
            <div class="space-y-1">
                <label class="block text-xs font-medium text-gray-600 uppercase tracking-wide">Payment Method</label>
                <select
                    v-model="filters.paymentMethod"
                    class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                    <option value="">All methods</option>
                    <option value="pix_offline">PIX Offline</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="none">Not selected</option>
                </select>
            </div>

            <CTypeahead
                label="Wallet"
                v-model="filters.walletId"
                :initialOptions="walletOptions"
                :refreshOptions="refreshWalletOptions"
                placeholder="All Wallets"
                clearable
            />

            <CTypeahead
                v-if="canViewAnyReports"
                label="Client"
                v-model="filters.clientId"
                :initialOptions="clientOptions"
                :refreshOptions="refreshClientOptions"
                placeholder="All Clients"
                clearable
            />

            <!-- Reset filters -->
            <div class="flex items-end">
                <button
                    v-if="activeFiltersCount > 0"
                    type="button"
                    @click="emit('reset')"
                    class="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-red-600 transition-colors cursor-pointer"
                >
                    <Icon icon="mdi:filter-off-outline" class="w-4 h-4" />
                    Clear all
                </button>
            </div>
        </div>
    </div>
</template>

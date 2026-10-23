<script setup lang="ts">
import { Icon } from '@iconify/vue';
import type { CreditPurchase } from '@/types';
import {
    formatCurrency,
    formatDate,
    isPaymentExpired,
    getPaymentStatusColor,
    getPurchaseStatusColor,
} from '@utils/payment-helpers';

interface Props {
    purchases: CreditPurchase[];
    totalCount: number;
    loading: boolean;
    canViewAnyReports: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
    select: [purchase: CreditPurchase];
    'clear-filters': [];
}>();
</script>

<template>
    <!-- Loading skeleton -->
    <div
        v-if="loading && totalCount === 0"
        class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
    >
        <div class="animate-pulse">
            <div class="h-10 bg-gray-100 border-b border-gray-200"></div>
            <div v-for="i in 5" :key="i" class="p-4 border-b border-gray-100 flex items-center gap-4">
                <div class="h-4 bg-gray-200 rounded w-24"></div>
                <div class="h-4 bg-gray-200 rounded w-32"></div>
                <div class="h-4 bg-gray-200 rounded w-28"></div>
                <div class="h-4 bg-gray-200 rounded w-20 ml-auto"></div>
            </div>
        </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="totalCount === 0" class="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
        <Icon icon="mdi:cash-multiple" class="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 class="text-base font-semibold text-gray-900">No purchases found</h3>
        <p class="text-sm text-gray-500 mt-1">There are no credit purchase records yet.</p>
    </div>

    <!-- Empty filtered state -->
    <div
        v-else-if="purchases.length === 0"
        class="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center"
    >
        <Icon icon="mdi:filter-remove-outline" class="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 class="text-base font-semibold text-gray-900">No matching purchases</h3>
        <p class="text-sm text-gray-500 mt-1">Try adjusting or clearing your filters to see results.</p>
        <button
            type="button"
            @click="emit('clear-filters')"
            class="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-800 cursor-pointer"
        >
            Clear all filters
        </button>
    </div>

    <!-- Table -->
    <div v-else class="relative bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <!-- Loading overlay -->
        <div
            v-if="loading"
            class="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center pointer-events-none"
        >
            <div
                class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white shadow-md border border-gray-200 text-sm font-medium text-gray-700"
            >
                <Icon icon="mdi:loading" class="w-4 h-4 animate-spin text-red-600" />
                Updating…
            </div>
        </div>

        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
                <thead>
                    <tr class="bg-gray-50">
                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            #
                        </th>
                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Date
                        </th>
                        <th
                            v-if="canViewAnyReports"
                            class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                        >
                            Client
                        </th>
                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Wallet
                        </th>
                        <th class="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Hours
                        </th>
                        <th class="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Amount
                        </th>
                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Method
                        </th>
                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Tags
                        </th>
                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Receipt
                        </th>
                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Payment
                        </th>
                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Purchase
                        </th>
                        <th class="px-4 py-3 w-12"></th>
                    </tr>
                </thead>

                <tbody class="divide-y divide-gray-100">
                    <tr
                        v-for="purchase in purchases"
                        :key="purchase.id"
                        class="hover:bg-gray-50 transition-colors cursor-pointer"
                        @click="emit('select', purchase)"
                    >
                        <!-- ID -->
                        <td class="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                            {{ purchase?.id ? `#${purchase?.id}` : '' }}
                        </td>

                        <!-- Date -->
                        <td class="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                            {{ formatDate(purchase.created_at) }}
                        </td>

                        <!-- Client -->
                        <td v-if="canViewAnyReports" class="px-4 py-3 text-sm text-gray-800 whitespace-nowrap">
                            {{ purchase.wallet?.client?.name ?? '—' }}
                        </td>

                        <!-- Wallet -->
                        <td class="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                            {{ purchase.wallet?.name ?? '—' }}
                        </td>

                        <!-- Hours -->
                        <td class="px-4 py-3 text-sm text-right text-gray-800 whitespace-nowrap font-medium">
                            {{ purchase.total_hours }}h
                        </td>

                        <!-- Amount -->
                        <td class="px-4 py-3 text-sm text-right text-gray-800 whitespace-nowrap">
                            {{ formatCurrency(purchase.total_price, purchase.currency_code) }}
                        </td>

                        <!-- Payment method -->
                        <td class="px-4 py-3 whitespace-nowrap">
                            <span
                                v-if="purchase.payments?.[0]?.payment_method"
                                class="inline-flex items-center gap-1 text-xs font-medium text-gray-700"
                            >
                                <Icon
                                    :icon="
                                        purchase.payments[0].payment_method.key === 'pix_offline'
                                            ? 'mdi:qrcode'
                                            : 'mdi:bank-outline'
                                    "
                                    class="w-3.5 h-3.5 text-gray-400"
                                />
                                {{ purchase.payments[0].payment_method.label }}
                            </span>
                            <span v-else-if="purchase.payments?.length" class="text-xs text-gray-400 italic">
                                Not selected
                            </span>
                            <span v-else class="text-xs text-gray-300">—</span>
                        </td>

                        <!-- Payment tags -->
                        <td class="px-4 py-3 whitespace-nowrap">
                            <span
                                v-if="purchase.payments?.[0]?.payment_method"
                                class="inline-flex items-center gap-1 text-xs font-medium text-gray-700"
                            >
                                {{
                                    [
                                        purchase.payments[0].payment_method.key,
                                        purchase.payments[0].payment_method.is_offline ? 'offline' : '',
                                        purchase.payments[0].payment_method.currency,
                                    ]
                                        .filter(Boolean)
                                        .join('|')
                                }}
                            </span>
                        </td>

                        <!-- Payment receipt -->
                        <td class="px-4 py-3 whitespace-nowrap">
                            <span
                                v-if="purchase.payments?.[0]?.payment_method"
                                class="inline-flex items-center gap-1 text-xs font-medium text-gray-700"
                            >
                                <template
                                    v-if="
                                        purchase.payments[0].payment_method.is_offline &&
                                        purchase.payments[0].pix_receipt_path
                                    "
                                >
                                    <Icon icon="flowbite:file-check-solid" class="w-3.5 h-3.5 text-gray-400" />
                                </template>
                            </span>
                        </td>

                        <!-- Payment status -->
                        <td class="px-4 py-3 whitespace-nowrap">
                            <template v-if="purchase.payments?.[0]">
                                <span
                                    v-if="isPaymentExpired(purchase.payments[0])"
                                    class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600"
                                >
                                    Expired
                                </span>
                                <span
                                    v-else
                                    :class="[
                                        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                                        getPaymentStatusColor(purchase.payments[0].payment_status),
                                    ]"
                                >
                                    {{ purchase.payments[0].payment_status }}
                                </span>
                            </template>
                            <span v-else class="text-xs text-gray-300">—</span>
                        </td>

                        <!-- Purchase status -->
                        <td class="px-4 py-3 whitespace-nowrap">
                            <span
                                :class="[
                                    'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                                    getPurchaseStatusColor(purchase.status),
                                ]"
                            >
                                {{ purchase.status }}
                            </span>
                        </td>

                        <!-- Action -->
                        <td class="px-4 py-3 text-right">
                            <button
                                type="button"
                                @click.stop="emit('select', purchase)"
                                class="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                aria-label="View details"
                            >
                                <Icon icon="mdi:open-in-new" class="w-4 h-4" />
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Table footer -->
        <div class="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <p class="text-xs text-gray-500">Showing {{ purchases.length }} of {{ totalCount }} purchases</p>
        </div>
    </div>
</template>

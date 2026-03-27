<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { Icon } from '@iconify/vue';
import type { CreditPurchase, CreditPurchasePayment } from '@/types';
import { useCreditPurchases } from '@/composables/useCreditPurchases';
import { useToast } from '@/composables/useToast';

type TypeaheadOption = {
    value: unknown;
    label: string;
};

const { purchases, loading, error, fetchPurchases, getReceiptUrl } = useCreditPurchases();
const toast = useToast();

type PendingPayment = CreditPurchasePayment & {
    creditPurchase: CreditPurchase;
};

const selectedPayment = ref<PendingPayment | null>(null);
const showApprovalModal = ref(false);
const approvalNotes = ref('');
const approvalAction = ref<'approve' | 'reject' | null>(null);
const isSubmitting = ref(false);

const offlinePaymentMethodKeys = new Set<string>(['pix_offline', 'bank_transfer']);

// Filter pending payments
const pendingPayments = ref<PendingPayment[]>([]);

const selectedClientId = ref<number | null>(null);
const selectedWalletId = ref<number | null>(null);
const selectedPaymentMethodKey = ref<string | null>(null);

onMounted(async () => {
    await loadPendingPayments();
});

function isOfflinePaymentMethod(method: CreditPurchasePayment['payment_method']): boolean {
    if (!method) {
        return false;
    }

    if (typeof method === 'string') {
        if (method.includes('offline')) {
            return true;
        }

        return offlinePaymentMethodKeys.has(method);
    }

    if (method.is_offline) {
        return true;
    }

    return offlinePaymentMethodKeys.has(method.key);
}

async function loadPendingPayments(): Promise<void> {
    await fetchPurchases();

    // Extract pending offline payments
    const pending: PendingPayment[] = [];

    purchases.value.forEach((purchase) => {
        if (purchase.payments) {
            purchase.payments.forEach((payment) => {
                if (isOfflinePaymentMethod(payment.payment_method) && payment.payment_status === 'pending') {
                    pending.push({
                        ...payment,
                        creditPurchase: purchase,
                    });
                }
            });
        }
    });

    pendingPayments.value = pending;
}

function getPaymentMethodKey(method: CreditPurchasePayment['payment_method']): string | null {
    if (!method) {
        return null;
    }

    if (typeof method === 'string') {
        return method;
    }

    return method.key;
}

const filteredPendingPayments = computed(() => {
    let filtered = pendingPayments.value;

    if (selectedClientId.value) {
        filtered = filtered.filter((payment) => {
            return payment.creditPurchase.wallet?.client?.id === selectedClientId.value;
        });
    }

    if (selectedWalletId.value) {
        filtered = filtered.filter((payment) => {
            return payment.creditPurchase.wallet?.id === selectedWalletId.value;
        });
    }

    if (selectedPaymentMethodKey.value) {
        filtered = filtered.filter((payment) => {
            return getPaymentMethodKey(payment.payment_method) === selectedPaymentMethodKey.value;
        });
    }

    return filtered;
});

const activeFiltersCount = computed(() => {
    let count = 0;

    if (selectedClientId.value) {
        count += 1;
    }

    if (selectedWalletId.value) {
        count += 1;
    }

    if (selectedPaymentMethodKey.value) {
        count += 1;
    }

    return count;
});

async function waitForPurchases(): Promise<void> {
    if (!loading.value) {
        return;
    }

    await new Promise<void>((resolve) => {
        const stop = watch(
            () => loading.value,
            (isLoading) => {
                if (isLoading) {
                    return;
                }

                stop();
                resolve();
            }
        );
    });
}

async function ensurePurchasesLoaded(): Promise<void> {
    if (purchases.value.length > 0) {
        return;
    }

    if (!loading.value) {
        await fetchPurchases();
        return;
    }

    await waitForPurchases();
}

function buildClientOptions(): TypeaheadOption[] {
    const map = new Map<number, string>();

    purchases.value.forEach((purchase) => {
        const client = purchase.wallet?.client;

        if (!client || map.has(client.id)) {
            return;
        }

        map.set(client.id, client.name);
    });

    return Array.from(map.entries()).map(([id, name]) => {
        return {
            value: id,
            label: name,
        };
    });
}

function buildWalletOptions(): TypeaheadOption[] {
    const map = new Map<number, string>();

    purchases.value.forEach((purchase) => {
        const wallet = purchase.wallet;

        if (!wallet || map.has(wallet.id)) {
            return;
        }

        map.set(wallet.id, wallet.name);
    });

    return Array.from(map.entries()).map(([id, name]) => {
        return {
            value: id,
            label: name,
        };
    });
}

function buildPaymentMethodOptions(): TypeaheadOption[] {
    const map = new Map<string, string>();

    purchases.value.forEach((purchase) => {
        purchase.payments?.forEach((payment) => {
            const methodKey = getPaymentMethodKey(payment.payment_method);

            if (!methodKey || map.has(methodKey)) {
                return;
            }

            const methodLabel =
                typeof payment.payment_method === 'string'
                    ? payment.payment_method
                    : (payment.payment_method?.label ?? methodKey);

            map.set(methodKey, methodLabel);
        });
    });

    return Array.from(map.entries()).map(([key, label]) => {
        return {
            value: key,
            label,
        };
    });
}

async function loadClientOptions(): Promise<TypeaheadOption[]> {
    await ensurePurchasesLoaded();

    return buildClientOptions();
}

async function loadWalletOptions(): Promise<TypeaheadOption[]> {
    await ensurePurchasesLoaded();

    return buildWalletOptions();
}

async function loadPaymentMethodOptions(): Promise<TypeaheadOption[]> {
    await ensurePurchasesLoaded();

    return buildPaymentMethodOptions();
}

function resetFilters(): void {
    selectedClientId.value = null;
    selectedWalletId.value = null;
    selectedPaymentMethodKey.value = null;
}

function openApprovalModal(payment: PendingPayment, action: 'approve' | 'reject'): void {
    selectedPayment.value = payment;
    approvalAction.value = action;
    approvalNotes.value = '';
    showApprovalModal.value = true;
}

async function handleApprovalSubmit(): Promise<void> {
    if (!selectedPayment.value || !approvalAction.value) {
        return;
    }

    if (approvalAction.value === 'reject' && !approvalNotes.value.trim()) {
        toast.error('Please provide a reason for rejection');
        return;
    }

    isSubmitting.value = true;

    try {
        // Call API endpoint based on action
        const endpoint =
            approvalAction.value === 'approve'
                ? `/payments/${selectedPayment.value.id}/approve`
                : `/payments/${selectedPayment.value.id}/reject`;

        const method = 'POST';
        const body = {
            notes: approvalNotes.value || undefined,
        };

        // Make the request through the API
        const response = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
            method,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            throw new Error('Failed to process approval');
        }

        const message =
            approvalAction.value === 'approve' ? 'Payment approved and credits applied!' : 'Payment rejected';

        toast.success(message);

        showApprovalModal.value = false;
        selectedPayment.value = null;
        approvalNotes.value = '';
        approvalAction.value = null;

        // Reload pending payments
        await loadPendingPayments();
    } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to process approval');
    } finally {
        isSubmitting.value = false;
    }
}

async function handleDownloadReceipt(): Promise<void> {
    if (!selectedPayment.value?.pix_receipt_path) {
        toast.error('No receipt available');
        return;
    }

    try {
        const url = await getReceiptUrl(selectedPayment.value.id);

        window.open(url, '_blank');
    } catch {
        toast.error('Failed to download receipt');
    }
}

function formatCurrency(amount: string | number, currencyCode: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
    }).format(typeof amount === 'string' ? parseFloat(amount) : amount);
}

function formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function getPaymentBadgeColor(status: string): string {
    const colors: Record<string, string> = {
        pending: 'bg-yellow-100 text-yellow-800',
        approved: 'bg-green-100 text-green-800',
        rejected: 'bg-red-100 text-red-800',
    };

    return colors[status] || 'bg-gray-100 text-gray-800';
}
</script>

<template>
    <div class="container mx-auto px-4 py-8">
        <div class="mb-6">
            <h1 class="text-3xl font-bold text-gray-900 mb-2">Payment Approvals</h1>
            <p class="text-gray-600">Review and approve offline payments</p>
        </div>

        <!-- Error State -->
        <div v-if="error" class="mb-6 rounded-lg bg-red-100 p-4 text-red-700">
            {{ error }}
        </div>

        <!-- Filters -->
        <div class="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2 text-sm font-semibold text-gray-800">
                    <Icon icon="mdi:filter-variant" class="w-4 h-4 text-gray-500" />
                    Filters
                </div>

                <button
                    v-if="activeFiltersCount > 0"
                    type="button"
                    class="text-xs font-medium text-gray-600 hover:text-red-600 transition-colors"
                    @click="resetFilters"
                >
                    Clear all
                </button>
            </div>

            <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
                <CTypeahead
                    v-model="selectedClientId"
                    label="Client"
                    placeholder="Select a client"
                    clearable
                    loading-text="Loading clients..."
                    empty-text="No clients found"
                    :initial-options="loadClientOptions"
                />

                <CTypeahead
                    v-model="selectedWalletId"
                    label="Wallet"
                    placeholder="Select a wallet"
                    clearable
                    loading-text="Loading wallets..."
                    empty-text="No wallets found"
                    :initial-options="loadWalletOptions"
                />

                <CTypeahead
                    v-model="selectedPaymentMethodKey"
                    label="Payment Method"
                    placeholder="Select a method"
                    clearable
                    loading-text="Loading methods..."
                    empty-text="No methods found"
                    :initial-options="loadPaymentMethodOptions"
                />
            </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading && pendingPayments.length === 0" class="py-12 text-center">
            <div class="inline-flex items-center gap-2">
                <div class="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-red-600"></div>
                <span class="text-gray-600">Loading pending approvals...</span>
            </div>
        </div>

        <!-- Empty State -->
        <div
            v-else-if="filteredPendingPayments.length === 0"
            class="rounded-lg border border-green-200 bg-green-50 p-12 text-center"
        >
            <Icon icon="mdi:check-circle" class="w-12 h-12 text-green-600 mx-auto mb-4" />
            <p class="text-green-900 font-semibold mb-2">
                {{ activeFiltersCount > 0 ? 'No Results Found' : 'No Pending Approvals' }}
            </p>
            <p class="text-sm text-green-700">
                {{
                    activeFiltersCount > 0
                        ? 'No pending approvals match the current filters'
                        : 'All offline payments have been reviewed'
                }}
            </p>
        </div>

        <!-- Pending Payments List -->
        <div v-else class="space-y-3">
            <div
                v-for="payment in filteredPendingPayments"
                :key="payment.id"
                class="rounded-lg border border-yellow-200 bg-yellow-50 p-6"
            >
                <div v-if="payment.creditPurchase" class="space-y-4">
                    <!-- Header -->
                    <div class="flex items-start justify-between mb-4">
                        <div class="flex-1">
                            <div class="flex items-center gap-3 mb-2">
                                <Icon icon="mdi:alert-circle" class="w-5 h-5 text-yellow-600" />
                                <h3 class="font-semibold text-gray-900">
                                    {{ payment.creditPurchase.total_hours }}h Purchase
                                </h3>

                                <span
                                    :class="[
                                        'px-2 py-1 rounded-full text-xs font-medium',
                                        getPaymentBadgeColor(payment.payment_status),
                                    ]"
                                >
                                    Pending
                                </span>
                            </div>

                            <p class="text-sm text-gray-600">
                                <strong>Customer:</strong>
                                {{ payment.creditPurchase.customer?.name }}
                            </p>

                            <p class="text-sm text-gray-600 mt-1">
                                <strong>Submitted:</strong>
                                {{ formatDate(payment.created_at) }}
                            </p>
                        </div>

                        <div class="text-right">
                            <p class="text-2xl font-bold text-yellow-700">
                                {{
                                    formatCurrency(
                                        payment.creditPurchase.total_price,
                                        payment.creditPurchase.currency_code
                                    )
                                }}
                            </p>

                            <p class="text-xs text-gray-600 mt-1">
                                {{ payment.payment_method?.label ?? 'Offline' }}
                            </p>
                        </div>
                    </div>

                    <!-- Details -->
                    <div class="border-t border-yellow-200 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <p class="text-gray-600 mb-1">Wallet</p>
                            <p class="font-semibold text-gray-900">
                                {{ payment.creditPurchase.wallet?.name }}
                            </p>
                        </div>

                        <div>
                            <p class="text-gray-600 mb-1">Hours to Credit</p>
                            <p class="font-semibold text-gray-900">{{ payment.creditPurchase.total_hours }}h</p>
                        </div>

                        <div>
                            <p class="text-gray-600 mb-1">Hourly Rate</p>
                            <p class="font-semibold text-gray-900">
                                {{
                                    formatCurrency(
                                        payment.creditPurchase.wallet?.hourly_rate_reference || 0,
                                        payment.creditPurchase.currency_code
                                    )
                                }}/h
                            </p>
                        </div>

                        <div>
                            <p class="text-gray-600 mb-1">Currency</p>
                            <p class="font-semibold text-gray-900">
                                {{ payment.creditPurchase.currency_code }}
                            </p>
                        </div>
                    </div>

                    <!-- Receipt Link -->
                    <div v-if="payment.pix_receipt_path" class="border-t border-yellow-200 pt-4">
                        <button
                            @click="
                                selectedPayment = payment;
                                handleDownloadReceipt();
                            "
                            class="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                        >
                            <Icon icon="mdi:file-pdf-box" class="w-4 h-4" />
                            View Receipt
                        </button>
                    </div>

                    <!-- Action Buttons -->
                    <div class="border-t border-yellow-200 pt-4 flex gap-2 justify-end">
                        <CButton preset="danger" @click="openApprovalModal(payment, 'reject')" icon="mdi:close-circle">
                            Reject
                        </CButton>

                        <CButton
                            preset="success"
                            @click="openApprovalModal(payment, 'approve')"
                            icon="mdi:check-circle"
                        >
                            Approve & Apply Credits
                        </CButton>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Approval Modal -->
    <Teleport to="body">
        <div
            v-if="showApprovalModal && selectedPayment && approvalAction"
            class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            @click.self="showApprovalModal = false"
        >
            <div class="bg-white rounded-lg shadow-xl w-full max-w-md" @click.stop>
                <!-- Header -->
                <div
                    :class="[
                        'px-6 py-4 rounded-t-lg',
                        {
                            'bg-green-600': approvalAction === 'approve',
                            'bg-red-600': approvalAction === 'reject',
                        },
                    ]"
                >
                    <h2 class="text-xl font-bold text-white">
                        {{ approvalAction === 'approve' ? 'Approve Payment' : 'Reject Payment' }}
                    </h2>
                </div>

                <!-- Content -->
                <div class="px-4 py-4 space-y-4">
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <p class="text-sm text-gray-600 mb-2">
                            {{ selectedPayment.creditPurchase?.customer?.name }}
                        </p>

                        <p class="text-lg font-bold text-gray-900">
                            {{ selectedPayment.creditPurchase?.total_hours }}h for
                            {{
                                formatCurrency(
                                    selectedPayment.creditPurchase?.total_price || 0,
                                    selectedPayment.creditPurchase?.currency_code
                                )
                            }}
                        </p>
                    </div>

                    <!-- Notes Field -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            {{ approvalAction === 'reject' ? 'Reason for Rejection' : 'Admin Notes (Optional)' }}
                        </label>

                        <textarea
                            v-model="approvalNotes"
                            :placeholder="
                                approvalAction === 'reject'
                                    ? 'Explain why this payment is being rejected...'
                                    : 'Add any notes...'
                            "
                            rows="3"
                            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-600 focus:outline-none"
                        ></textarea>
                    </div>
                </div>

                <!-- Footer -->
                <div class="bg-gray-50 px-6 py-4 flex gap-3 justify-end rounded-b-lg border-t border-gray-200">
                    <CButton preset="outlined-black" @click="showApprovalModal = false" :disabled="isSubmitting">
                        Cancel
                    </CButton>

                    <CButton
                        :preset="approvalAction === 'approve' ? 'success' : 'danger'"
                        @click="handleApprovalSubmit"
                        :disabled="isSubmitting || (approvalAction === 'reject' && !approvalNotes.trim())"
                        :loading="isSubmitting"
                    >
                        {{ approvalAction === 'approve' ? 'Approve' : 'Reject' }}
                    </CButton>
                </div>
            </div>
        </div>
    </Teleport>
</template>

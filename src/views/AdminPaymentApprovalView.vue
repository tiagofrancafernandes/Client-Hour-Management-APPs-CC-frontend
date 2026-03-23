<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Icon } from '@iconify/vue';
import type { CreditPurchasePayment } from '@/types';
import { useCreditPurchases } from '@/composables/useCreditPurchases';
import { useToast } from '@/composables/useToast';

const { purchases, loading, error, fetchPurchases, getReceiptUrl } = useCreditPurchases();
const toast = useToast();

const selectedPayment = ref<CreditPurchasePayment | null>(null);
const showApprovalModal = ref(false);
const approvalNotes = ref('');
const approvalAction = ref<'approve' | 'reject' | null>(null);
const isSubmitting = ref(false);

// Filter pending payments
const pendingPayments = ref<CreditPurchasePayment[]>([]);

onMounted(async () => {
    await loadPendingPayments();
});

async function loadPendingPayments(): Promise<void> {
    await fetchPurchases();

    // Extract pending PIX Offline payments
    const pending: CreditPurchasePayment[] = [];

    purchases.value.forEach((purchase) => {
        if (purchase.payments) {
            purchase.payments.forEach((payment) => {
                if (payment.payment_method === 'pix_offline' && payment.payment_status === 'pending') {
                    pending.push(payment);
                }
            });
        }
    });

    pendingPayments.value = pending;
}

function openApprovalModal(payment: CreditPurchasePayment, action: 'approve' | 'reject'): void {
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
            <p class="text-gray-600">Review and approve PIX Offline payments</p>
        </div>

        <!-- Error State -->
        <div v-if="error" class="mb-6 rounded-lg bg-red-100 p-4 text-red-700">
            {{ error }}
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
            v-else-if="pendingPayments.length === 0"
            class="rounded-lg border border-green-200 bg-green-50 p-12 text-center"
        >
            <Icon icon="mdi:check-circle" class="w-12 h-12 text-green-600 mx-auto mb-4" />
            <p class="text-green-900 font-semibold mb-2">No Pending Approvals</p>
            <p class="text-sm text-green-700">All PIX payments have been reviewed</p>
        </div>

        <!-- Pending Payments List -->
        <div v-else class="space-y-3">
            <div
                v-for="payment in pendingPayments"
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

                            <p class="text-xs text-gray-600 mt-1">PIX Offline</p>
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
                <div class="px-6 py-6 space-y-4">
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

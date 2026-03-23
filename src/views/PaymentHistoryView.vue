<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { Icon } from '@iconify/vue';
import type { CreditPurchase, CreditPurchasePayment } from '@/types';
import { useCreditPurchases } from '@/composables/useCreditPurchases';
import { useToast } from '@/composables/useToast';

const { purchases, loading, error, fetchPurchases, setPaymentMethod, uploadReceipt, getReceiptUrl } =
    useCreditPurchases();
const toast = useToast();

const expandedPurchaseId = ref<number | null>(null);
const selectedWalletId = ref<number | null>(null);

// Per-payment inline action state
const settingMethodForPaymentId = ref<number | null>(null);
const uploadingReceiptForPaymentId = ref<number | null>(null);
const pendingMethodSelection = ref<Record<number, 'pix_offline' | 'bank_transfer' | ''>>({});
const pendingReceiptFiles = ref<Record<number, File | null>>({});
const submittingPaymentId = ref<number | null>(null);

const wallets = computed(() => {
    const uniqueWallets = new Map();

    purchases.value.forEach((purchase) => {
        if (purchase.wallet && !uniqueWallets.has(purchase.wallet.id)) {
            uniqueWallets.set(purchase.wallet.id, purchase.wallet);
        }
    });

    return Array.from(uniqueWallets.values());
});

const filteredPurchases = computed(() => {
    if (!selectedWalletId.value) {
        return purchases.value;
    }

    return purchases.value.filter((p) => p.wallet_id === selectedWalletId.value);
});

onMounted(async () => {
    await fetchPurchases();
});

function getPaymentStatusColor(status: string): string {
    const colors: Record<string, string> = {
        pending: 'bg-yellow-100 text-yellow-800',
        approved: 'bg-green-100 text-green-800',
        rejected: 'bg-red-100 text-red-800',
        completed: 'bg-blue-100 text-blue-800',
        expired: 'bg-gray-100 text-gray-600',
    };

    return colors[status] || 'bg-gray-100 text-gray-800';
}

function getPurchaseStatusColor(status: string): string {
    const colors: Record<string, string> = {
        pending: 'bg-yellow-100 text-yellow-800',
        approved: 'bg-green-100 text-green-800',
        rejected: 'bg-red-100 text-red-800',
        cancelled: 'bg-gray-100 text-gray-800',
    };

    return colors[status] || 'bg-gray-100 text-gray-800';
}

function getPaymentStatusIcon(status: string): string {
    const icons: Record<string, string> = {
        pending: 'mdi:clock-outline',
        approved: 'mdi:check-circle-outline',
        rejected: 'mdi:alert-circle-outline',
        completed: 'mdi:check-circle',
        expired: 'mdi:timer-off-outline',
    };

    return icons[status] || 'mdi:circle-outline';
}

function isPaymentExpired(payment: CreditPurchasePayment): boolean {
    if (!payment.expires_at) {
        return false;
    }

    return new Date(payment.expires_at) < new Date();
}

function getPaymentMethodLabel(method: string | null): string {
    if (!method) {
        return 'No method selected';
    }

    const labels: Record<string, string> = {
        pix_offline: 'PIX Offline',
        bank_transfer: 'Bank Transfer',
    };

    return labels[method] || method;
}

function togglePurchaseDetails(purchaseId: number): void {
    if (expandedPurchaseId.value === purchaseId) {
        expandedPurchaseId.value = null;
    } else {
        expandedPurchaseId.value = purchaseId;
    }
}

function startSettingMethod(payment: CreditPurchasePayment): void {
    settingMethodForPaymentId.value = payment.id;
    pendingMethodSelection.value[payment.id] = '';
}

function cancelSettingMethod(): void {
    settingMethodForPaymentId.value = null;
}

function startUploadingReceipt(payment: CreditPurchasePayment): void {
    uploadingReceiptForPaymentId.value = payment.id;
    pendingReceiptFiles.value[payment.id] = null;
}

function cancelUploadingReceipt(): void {
    uploadingReceiptForPaymentId.value = null;
}

async function handleSetMethod(purchase: CreditPurchase, payment: CreditPurchasePayment): Promise<void> {
    const method = pendingMethodSelection.value[payment.id];

    if (!method) {
        toast.error('Please select a payment method');
        return;
    }

    submittingPaymentId.value = payment.id;

    try {
        await setPaymentMethod(purchase.id, payment.id, method);
        toast.success('Payment method updated successfully');
        settingMethodForPaymentId.value = null;
        await fetchPurchases();
    } catch {
        toast.error('Failed to update payment method');
    } finally {
        submittingPaymentId.value = null;
    }
}

function handleReceiptFileSelect(event: Event, paymentId: number): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;

    if (!files || files.length === 0) {
        return;
    }

    const file = files[0];
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg'];

    if (!validTypes.includes(file.type)) {
        toast.error('Invalid file type. Please upload PDF, PNG, or JPG');
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        toast.error('File is too large. Maximum size is 5MB');
        return;
    }

    pendingReceiptFiles.value[paymentId] = file;
}

async function handleUploadReceipt(purchase: CreditPurchase, payment: CreditPurchasePayment): Promise<void> {
    const file = pendingReceiptFiles.value[payment.id];

    if (!file) {
        toast.error('Please select a file to upload');
        return;
    }

    submittingPaymentId.value = payment.id;

    try {
        await uploadReceipt(purchase.id, payment.id, file);
        toast.success('Receipt uploaded successfully');
        uploadingReceiptForPaymentId.value = null;
        await fetchPurchases();
    } catch {
        toast.error('Failed to upload receipt');
    } finally {
        submittingPaymentId.value = null;
    }
}

async function handleDownloadReceipt(payment: CreditPurchasePayment): Promise<void> {
    if (!payment.pix_receipt_path) {
        toast.error('No receipt uploaded for this payment');
        return;
    }

    try {
        const url = await getReceiptUrl(payment.id);
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
    });
}

function formatExpiresAt(expiresAt: string): string {
    const date = new Date(expiresAt);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();

    if (diffMs <= 0) {
        return 'Expired';
    }

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
        return `Expires in ${diffDays}d ${diffHours % 24}h`;
    }

    if (diffHours > 0) {
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        return `Expires in ${diffHours}h ${diffMinutes}m`;
    }

    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return `Expires in ${diffMinutes}m`;
}
</script>

<template>
    <div class="container mx-auto px-4 py-8">
        <div class="mb-6">
            <h1 class="text-3xl font-bold text-gray-900 mb-2">Payment History</h1>
            <p class="text-gray-600">View your credit purchase history and payment status</p>
        </div>

        <!-- Error State -->
        <div v-if="error" class="mb-6 rounded-lg bg-red-100 p-4 text-red-700">
            {{ error }}
        </div>

        <!-- Loading State -->
        <div v-if="loading && purchases.length === 0" class="py-12 text-center">
            <div class="inline-flex items-center gap-2">
                <div class="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-red-600"></div>
                <span class="text-gray-600">Loading payment history...</span>
            </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="purchases.length === 0" class="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
            <Icon icon="mdi:wallet-outline" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p class="text-gray-600 mb-4">No credit purchases yet</p>
            <p class="text-sm text-gray-500">Start buying credits from your wallet details page</p>
        </div>

        <!-- Wallet Filter -->
        <div v-else class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">Filter by Wallet</label>
            <select
                v-model.number="selectedWalletId"
                class="rounded-lg border border-gray-300 px-3 py-2 focus:border-red-600 focus:outline-none"
            >
                <option :value="null">All Wallets</option>
                <option v-for="wallet in wallets" :key="wallet.id" :value="wallet.id">
                    {{ wallet.name }}
                </option>
            </select>
        </div>

        <!-- Payment History List -->
        <div v-if="filteredPurchases.length > 0" class="space-y-3">
            <div
                v-for="purchase in filteredPurchases"
                :key="purchase.id"
                class="rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow"
            >
                <!-- Purchase Header (Clickable) -->
                <button
                    @click="togglePurchaseDetails(purchase.id)"
                    class="w-full text-left px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                    <div class="flex items-center justify-between">
                        <div class="flex-1">
                            <div class="flex items-center gap-3 mb-2">
                                <h3 class="font-semibold text-gray-900">
                                    {{ purchase.total_hours }}h @ {{ purchase.wallet?.name }}
                                </h3>

                                <span
                                    :class="[
                                        'px-2 py-1 rounded-full text-xs font-medium',
                                        getPurchaseStatusColor(purchase.status),
                                    ]"
                                >
                                    {{ purchase.status }}
                                </span>
                            </div>

                            <p class="text-sm text-gray-500">
                                {{ formatDate(purchase.created_at) }} •
                                {{ formatCurrency(purchase.total_price, purchase.currency_code) }}
                            </p>
                        </div>

                        <Icon
                            :icon="expandedPurchaseId === purchase.id ? 'mdi:chevron-up' : 'mdi:chevron-down'"
                            class="w-5 h-5 text-gray-400"
                        />
                    </div>
                </button>

                <!-- Purchase Details (Expandable) -->
                <div v-if="expandedPurchaseId === purchase.id" class="border-t border-gray-200">
                    <!-- Pricing Details -->
                    <div class="px-6 py-4 bg-gray-50 space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span class="text-gray-600">Total Price:</span>
                            <span class="font-semibold text-gray-900">
                                {{ formatCurrency(purchase.total_price, purchase.currency_code) }}
                            </span>
                        </div>
                    </div>

                    <!-- Payment Information -->
                    <div v-if="purchase.payments && purchase.payments.length > 0" class="px-6 py-4 space-y-4">
                        <h4 class="font-semibold text-gray-900">Payment Details</h4>

                        <div
                            v-for="payment in purchase.payments"
                            :key="payment.id"
                            class="border border-gray-200 rounded-lg p-4"
                        >
                            <!-- Payment header -->
                            <div class="flex items-start justify-between mb-3">
                                <div>
                                    <div class="flex items-center gap-2 mb-1">
                                        <Icon
                                            :icon="
                                                isPaymentExpired(payment)
                                                    ? 'mdi:timer-off-outline'
                                                    : getPaymentStatusIcon(payment.payment_status)
                                            "
                                            class="w-5 h-5"
                                            :class="{
                                                'text-yellow-600':
                                                    payment.payment_status === 'pending' && !isPaymentExpired(payment),
                                                'text-green-600':
                                                    payment.payment_status === 'approved' ||
                                                    payment.payment_status === 'completed',
                                                'text-red-600': payment.payment_status === 'rejected',
                                                'text-gray-400': isPaymentExpired(payment),
                                            }"
                                        />

                                        <span class="font-medium text-gray-900">
                                            {{ getPaymentMethodLabel(payment.payment_method) }}
                                        </span>
                                    </div>

                                    <div class="flex items-center gap-2 flex-wrap">
                                        <span
                                            :class="[
                                                'inline-block px-2 py-1 rounded text-xs font-medium',
                                                isPaymentExpired(payment)
                                                    ? 'bg-gray-100 text-gray-600'
                                                    : getPaymentStatusColor(payment.payment_status),
                                            ]"
                                        >
                                            {{ isPaymentExpired(payment) ? 'Expired' : payment.payment_status }}
                                        </span>

                                        <!-- Expiration badge -->
                                        <span
                                            v-if="
                                                payment.expires_at &&
                                                !isPaymentExpired(payment) &&
                                                payment.payment_status === 'pending'
                                            "
                                            class="inline-block px-2 py-1 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200"
                                        >
                                            {{ formatExpiresAt(payment.expires_at) }}
                                        </span>
                                    </div>
                                </div>

                                <div class="text-right">
                                    <p class="text-xs text-gray-500">{{ formatDate(payment.created_at) }}</p>
                                </div>
                            </div>

                            <!-- Set Payment Method inline form -->
                            <div
                                v-if="
                                    !payment.payment_method &&
                                    payment.payment_status === 'pending' &&
                                    !isPaymentExpired(payment)
                                "
                                class="mt-3 pt-3 border-t border-gray-200"
                            >
                                <div v-if="settingMethodForPaymentId === payment.id" class="space-y-3">
                                    <p class="text-sm font-medium text-gray-700">Select payment method:</p>

                                    <div class="flex flex-col gap-2">
                                        <label class="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                :value="'bank_transfer'"
                                                v-model="pendingMethodSelection[payment.id]"
                                                class="text-green-600"
                                            />
                                            <span class="text-sm text-gray-700">Bank Transfer</span>
                                            <span class="text-xs text-amber-600">(expires in 7 days)</span>
                                        </label>

                                        <label class="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                :value="'pix_offline'"
                                                v-model="pendingMethodSelection[payment.id]"
                                                class="text-green-600"
                                            />
                                            <span class="text-sm text-gray-700">PIX Offline</span>
                                            <span class="text-xs text-amber-600">(expires in 48h)</span>
                                        </label>
                                    </div>

                                    <div class="flex gap-2">
                                        <CButton
                                            preset="primary"
                                            size="sm"
                                            :disabled="
                                                !pendingMethodSelection[payment.id] ||
                                                submittingPaymentId === payment.id
                                            "
                                            @click="handleSetMethod(purchase, payment)"
                                        >
                                            Confirm
                                        </CButton>

                                        <CButton
                                            preset="outlined-black"
                                            size="sm"
                                            :disabled="submittingPaymentId === payment.id"
                                            @click="cancelSettingMethod"
                                        >
                                            Cancel
                                        </CButton>
                                    </div>
                                </div>

                                <button
                                    v-else
                                    @click="startSettingMethod(payment)"
                                    class="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                >
                                    <Icon icon="mdi:credit-card-outline" class="w-4 h-4" />
                                    Select payment method
                                </button>
                            </div>

                            <!-- Upload Receipt inline form -->
                            <div
                                v-if="
                                    payment.payment_method &&
                                    !payment.pix_receipt_path &&
                                    payment.payment_status === 'pending' &&
                                    !isPaymentExpired(payment)
                                "
                                class="mt-3 pt-3 border-t border-gray-200"
                            >
                                <div v-if="uploadingReceiptForPaymentId === payment.id" class="space-y-3">
                                    <p class="text-sm font-medium text-gray-700">Upload payment receipt:</p>

                                    <label
                                        class="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-green-400 hover:bg-green-50 transition-all"
                                    >
                                        <input
                                            type="file"
                                            accept=".pdf,.png,.jpg,.jpeg"
                                            class="hidden"
                                            @change="(e) => handleReceiptFileSelect(e, payment.id)"
                                        />

                                        <div v-if="!pendingReceiptFiles[payment.id]" class="text-center">
                                            <Icon icon="mdi:cloud-upload" class="w-6 h-6 text-gray-400 mx-auto mb-1" />
                                            <p class="text-xs text-gray-500">PDF, PNG or JPG (max 5MB)</p>
                                        </div>

                                        <div v-else class="text-center text-green-600">
                                            <Icon icon="mdi:check-circle" class="w-6 h-6 mx-auto mb-1" />
                                            <p class="text-xs font-medium">
                                                {{ pendingReceiptFiles[payment.id]?.name }}
                                            </p>
                                        </div>
                                    </label>

                                    <div class="flex gap-2">
                                        <CButton
                                            preset="primary"
                                            size="sm"
                                            :disabled="
                                                !pendingReceiptFiles[payment.id] || submittingPaymentId === payment.id
                                            "
                                            @click="handleUploadReceipt(purchase, payment)"
                                        >
                                            Upload
                                        </CButton>

                                        <CButton
                                            preset="outlined-black"
                                            size="sm"
                                            :disabled="submittingPaymentId === payment.id"
                                            @click="cancelUploadingReceipt"
                                        >
                                            Cancel
                                        </CButton>
                                    </div>
                                </div>

                                <button
                                    v-else
                                    @click="startUploadingReceipt(payment)"
                                    class="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                >
                                    <Icon icon="mdi:file-upload-outline" class="w-4 h-4" />
                                    Upload receipt
                                </button>
                            </div>

                            <!-- Receipt Download -->
                            <div v-if="payment.pix_receipt_path" class="mt-3 pt-3 border-t border-gray-200">
                                <button
                                    @click="handleDownloadReceipt(payment)"
                                    class="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                >
                                    <Icon icon="mdi:download" class="w-4 h-4" />
                                    Download Receipt
                                </button>
                            </div>

                            <!-- Admin Notes -->
                            <div v-if="payment.notes" class="mt-3 pt-3 border-t border-gray-200">
                                <p class="text-xs text-gray-600 font-medium mb-1">Admin Notes:</p>
                                <p class="text-sm text-gray-700 bg-gray-100 rounded px-3 py-2">
                                    {{ payment.notes }}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Empty Filtered State -->
        <div
            v-else-if="selectedWalletId !== null"
            class="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center"
        >
            <Icon icon="mdi:magnify" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p class="text-gray-600">No purchases found for selected wallet</p>
        </div>
    </div>
</template>

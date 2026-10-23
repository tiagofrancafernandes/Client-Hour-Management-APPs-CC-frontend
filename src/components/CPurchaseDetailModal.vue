<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Icon } from '@iconify/vue';
import type { CreditPurchase, CreditPurchasePayment } from '@/types';
import { useToast } from '@composables/useToast';
import {
    formatCurrency,
    formatDate,
    formatExpiresAt,
    isPaymentExpired,
    getPaymentMethodLabel,
    getPaymentStatusColor,
    getPurchaseStatusColor,
} from '@utils/payment-helpers';

interface Props {
    isOpen: boolean;
    purchase: CreditPurchase | null;
    canViewAnyReports: boolean;
    canApprovePayments: boolean;
    submittingMethod?: boolean;
    submittingReceipt?: boolean;
    submittingApproval?: boolean;
    cancellingPurchase?: boolean;
    deletingReceipt?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    submittingMethod: false,
    submittingReceipt: false,
    submittingApproval: false,
    cancellingPurchase: false,
    deletingReceipt: false,
});

const emit = defineEmits<{
    close: [];
    'set-method': [method: 'bank_transfer' | 'pix_offline'];
    'upload-receipt': [file: File];
    'download-receipt': [];
    'delete-receipt': [];
    approve: [notes: string];
    reject: [notes: string];
    'cancel-purchase': [];
    'view-instructions': [];
}>();

const toast = useToast();

const showSetMethodForm = ref(false);
const pendingMethod = ref<'pix_offline' | 'bank_transfer' | ''>('');
const showUploadForm = ref(false);
const pendingReceiptFile = ref<File | null>(null);
const showRejectForm = ref(false);
const approveNotes = ref('');
const rejectNotes = ref('');

const showDeleteReceiptConfirmModal = ref(false);
const showCancelConfirmModal = ref(false);

const modalPayment = computed<CreditPurchasePayment | null>(() => {
    return props.purchase?.payments?.[0] ?? null;
});

watch(
    () => props.isOpen,
    (open) => {
        if (!open) {
            resetForms();
        }
    }
);

function resetForms(): void {
    showSetMethodForm.value = false;
    showUploadForm.value = false;
    showRejectForm.value = false;
    pendingMethod.value = '';
    pendingReceiptFile.value = null;
    approveNotes.value = '';
    rejectNotes.value = '';
    showDeleteReceiptConfirmModal.value = false;
    showCancelConfirmModal.value = false;
}

function handleClose(): void {
    resetForms();
    emit('close');
}

function handleReceiptFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
        return;
    }

    const validTypes = ['application/pdf', 'image/png', 'image/jpeg'];

    if (!validTypes.includes(file.type)) {
        toast.error('Invalid file type. Please upload a PDF, PNG, or JPG.');
        input.value = '';
        return;
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
        toast.error('File size exceeds the 5MB limit.');
        input.value = '';
        return;
    }

    pendingReceiptFile.value = file;
}

function handleSetMethodSubmit(): void {
    if (!pendingMethod.value) {
        return;
    }

    emit('set-method', pendingMethod.value as 'bank_transfer' | 'pix_offline');
}

function handleUploadReceiptSubmit(): void {
    if (!pendingReceiptFile.value) {
        return;
    }

    emit('upload-receipt', pendingReceiptFile.value);
}

function handleApproveSubmit(): void {
    emit('approve', approveNotes.value);
}

function handleRejectSubmit(): void {
    if (!rejectNotes.value.trim()) {
        toast.error('Reason is required for rejection');
        return;
    }

    emit('reject', rejectNotes.value);
}

function openDeleteReceiptConfirmModal(): void {
    showDeleteReceiptConfirmModal.value = true;
}

function handleDeleteReceiptConfirm(): void {
    emit('delete-receipt');
    showDeleteReceiptConfirmModal.value = false;
}

function openCancelConfirmModal(): void {
    showCancelConfirmModal.value = true;
}

function handleCancelPurchaseConfirm(): void {
    emit('cancel-purchase');
    showCancelConfirmModal.value = false;
}
</script>

<template>
    <Teleport to="body">
        <div v-if="isOpen && purchase" class="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
            <!-- Backdrop -->
            <div class="fixed inset-0 bg-black/40 backdrop-blur-sm" @click="handleClose" />

            <!-- Panel -->
            <div class="flex min-h-full items-center justify-center p-4">
                <div class="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl">
                    <!-- Modal header -->
                    <div class="flex items-start justify-between px-6 py-5 border-b border-gray-200">
                        <div>
                            <h2 class="text-lg font-semibold text-gray-900">Purchase Details</h2>
                            <p class="text-sm text-gray-500 mt-0.5">
                                #{{ purchase.id }} · {{ formatDate(purchase.created_at) }}
                            </p>
                        </div>
                        <button
                            @click="handleClose"
                            class="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                            aria-label="Close modal"
                        >
                            <Icon icon="mdi:close" class="w-5 h-5" />
                        </button>
                    </div>

                    <div class="px-6 py-5 space-y-6 overflow-y-auto max-h-[calc(90vh-10rem)]">
                        <!-- Purchase summary -->
                        <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            <div class="bg-gray-50 rounded-lg p-3">
                                <p class="text-xs text-gray-500 mb-1">Hours</p>
                                <p class="text-lg font-bold text-gray-900">{{ purchase.total_hours }}h</p>
                            </div>
                            <div class="bg-gray-50 rounded-lg p-3">
                                <p class="text-xs text-gray-500 mb-1">Amount</p>
                                <p class="text-lg font-bold text-gray-900">
                                    {{ formatCurrency(purchase.total_price, purchase.currency_code) }}
                                </p>
                            </div>
                            <div class="bg-gray-50 rounded-lg p-3">
                                <p class="text-xs text-gray-500 mb-1">Status</p>
                                <span
                                    :class="[
                                        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold',
                                        getPurchaseStatusColor(purchase.status),
                                    ]"
                                >
                                    {{ purchase.status }}
                                </span>
                            </div>
                            <div class="bg-gray-50 rounded-lg p-3">
                                <p class="text-xs text-gray-500 mb-1">Wallet</p>
                                <p class="text-sm font-medium text-gray-800 truncate">
                                    {{ purchase.wallet?.name ?? '—' }}
                                </p>
                            </div>
                            <div v-if="canViewAnyReports" class="bg-gray-50 rounded-lg p-3">
                                <p class="text-xs text-gray-500 mb-1">Client</p>
                                <p class="text-sm font-medium text-gray-800 truncate">
                                    {{ purchase.wallet?.client?.name ?? '—' }}
                                </p>
                            </div>
                            <div v-if="canViewAnyReports" class="bg-gray-50 rounded-lg p-3">
                                <p class="text-xs text-gray-500 mb-1">Customer</p>
                                <p class="text-sm font-medium text-gray-800 truncate">
                                    {{ purchase.customer?.name ?? '—' }}
                                </p>
                            </div>
                        </div>

                        <!-- Payment section -->
                        <div v-if="modalPayment" class="space-y-4">
                            <h3
                                class="text-sm font-semibold text-gray-700 uppercase tracking-wide border-b border-gray-100 pb-2"
                            >
                                Payment
                            </h3>

                            <!-- Payment info row -->
                            <div class="flex flex-wrap items-center gap-3">
                                <!-- Method badge -->
                                <div class="flex items-center gap-1.5">
                                    <Icon
                                        :icon="
                                            modalPayment.payment_method?.key === 'pix_offline'
                                                ? 'mdi:qrcode'
                                                : modalPayment.payment_method
                                                  ? 'mdi:bank-outline'
                                                  : 'mdi:help-circle-outline'
                                        "
                                        class="w-4 h-4 text-gray-500"
                                    />
                                    <span class="text-sm font-medium text-gray-800">
                                        {{ getPaymentMethodLabel(modalPayment.payment_method) }}
                                    </span>
                                </div>

                                <!-- Payment status badge -->
                                <span
                                    v-if="isPaymentExpired(modalPayment)"
                                    class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600"
                                >
                                    <Icon icon="mdi:timer-off-outline" class="w-3.5 h-3.5 mr-1" />
                                    Expired
                                </span>
                                <span
                                    v-else
                                    :class="[
                                        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                                        getPaymentStatusColor(modalPayment.payment_status),
                                    ]"
                                >
                                    {{ modalPayment.payment_status }}
                                </span>

                                <!-- Expiry countdown -->
                                <span
                                    v-if="
                                        modalPayment.expires_at &&
                                        !isPaymentExpired(modalPayment) &&
                                        modalPayment.payment_status === 'pending'
                                    "
                                    class="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full"
                                >
                                    <Icon icon="mdi:clock-outline" class="w-3.5 h-3.5" />
                                    {{ formatExpiresAt(modalPayment.expires_at) }}
                                </span>

                                <!-- View instructions button -->
                                <button
                                    v-if="
                                        !isPaymentExpired(modalPayment) &&
                                        modalPayment.payment_method &&
                                        modalPayment.payment_status === 'pending'
                                    "
                                    type="button"
                                    @click="emit('view-instructions')"
                                    class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition border border-blue-200 cursor-pointer"
                                >
                                    <Icon icon="mdi:file-document-outline" class="w-3.5 h-3.5" />
                                    View Instructions
                                </button>
                            </div>

                            <!-- Admin notes -->
                            <div
                                v-if="modalPayment.notes"
                                class="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3"
                            >
                                <p class="text-xs font-semibold text-gray-500 mb-1">Notes</p>
                                <p class="text-sm text-gray-700">{{ modalPayment.notes }}</p>
                            </div>

                            <!-- Customer action: Set method -->
                            <div
                                v-if="
                                    !modalPayment.payment_method &&
                                    modalPayment.payment_status === 'pending' &&
                                    !isPaymentExpired(modalPayment)
                                "
                                class="rounded-lg border border-dashed border-gray-300 p-4"
                            >
                                <div v-if="showSetMethodForm" class="space-y-3">
                                    <p class="text-sm font-medium text-gray-700">Select a payment method:</p>
                                    <div class="flex flex-col gap-2">
                                        <label class="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                value="bank_transfer"
                                                v-model="pendingMethod"
                                                class="accent-red-600"
                                            />
                                            <span class="text-sm text-gray-700">Bank Transfer</span>
                                            <span class="text-xs text-amber-600">(expires in 7 days)</span>
                                        </label>
                                        <label class="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                value="pix_offline"
                                                v-model="pendingMethod"
                                                class="accent-red-600"
                                            />
                                            <span class="text-sm text-gray-700">PIX Offline</span>
                                            <span class="text-xs text-amber-600">(expires in 48h)</span>
                                        </label>
                                    </div>
                                    <div class="flex gap-2 pt-1">
                                        <CButton
                                            preset="primary"
                                            size="sm"
                                            :disabled="!pendingMethod || submittingMethod"
                                            @click="handleSetMethodSubmit"
                                        >
                                            Submit
                                        </CButton>
                                        <CButton
                                            preset="outlined-black"
                                            size="sm"
                                            :disabled="submittingMethod"
                                            @click="showSetMethodForm = false"
                                        >
                                            Cancel
                                        </CButton>
                                    </div>
                                </div>
                                <button
                                    v-else
                                    type="button"
                                    @click="showSetMethodForm = true"
                                    class="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-800 font-medium cursor-pointer"
                                >
                                    <Icon icon="mdi:credit-card-outline" class="w-4 h-4" />
                                    Select payment method
                                </button>
                            </div>

                            <!-- Customer action: Upload receipt -->
                            <div
                                v-if="
                                    modalPayment.payment_method &&
                                    !modalPayment.pix_receipt_path &&
                                    modalPayment.payment_status === 'pending' &&
                                    !isPaymentExpired(modalPayment)
                                "
                                class="rounded-lg border border-dashed border-gray-300 p-4"
                            >
                                <div v-if="showUploadForm" class="space-y-3">
                                    <p class="text-sm font-medium text-gray-700">Upload payment receipt:</p>
                                    <label
                                        class="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-red-400 hover:bg-red-50 transition-all"
                                    >
                                        <input
                                            type="file"
                                            accept=".pdf,.png,.jpg,.jpeg"
                                            class="hidden"
                                            @change="handleReceiptFileSelect"
                                        />
                                        <div v-if="!pendingReceiptFile" class="text-center">
                                            <Icon
                                                icon="mdi:cloud-upload-outline"
                                                class="w-7 h-7 text-gray-400 mx-auto mb-1"
                                            />
                                            <p class="text-xs text-gray-500">PDF, PNG or JPG (max 5MB)</p>
                                        </div>
                                        <div v-else class="text-center text-green-600">
                                            <Icon icon="mdi:check-circle" class="w-7 h-7 mx-auto mb-1" />
                                            <p class="text-xs font-medium">{{ pendingReceiptFile.name }}</p>
                                        </div>
                                    </label>
                                    <div class="flex gap-2">
                                        <CButton
                                            preset="primary"
                                            size="sm"
                                            :disabled="!pendingReceiptFile || submittingReceipt"
                                            @click="handleUploadReceiptSubmit"
                                        >
                                            Upload
                                        </CButton>
                                        <CButton
                                            preset="outlined-black"
                                            size="sm"
                                            :disabled="submittingReceipt"
                                            @click="
                                                showUploadForm = false;
                                                pendingReceiptFile = null;
                                            "
                                        >
                                            Cancel
                                        </CButton>
                                    </div>
                                </div>
                                <button
                                    v-else
                                    type="button"
                                    @click="showUploadForm = true"
                                    class="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-800 font-medium cursor-pointer"
                                >
                                    <Icon icon="mdi:file-upload-outline" class="w-4 h-4" />
                                    Upload receipt
                                </button>
                            </div>

                            <!-- Receipt actions: Download & Delete receipt -->
                            <div v-if="modalPayment.pix_receipt_path" class="flex items-center gap-3">
                                <button
                                    type="button"
                                    @click="emit('download-receipt')"
                                    class="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-red-600 font-medium transition-colors cursor-pointer"
                                >
                                    <Icon icon="mdi:file-download-outline" class="w-4 h-4" />
                                    Download receipt
                                </button>

                                <button
                                    v-if="modalPayment.payment_status === 'pending' && !isPaymentExpired(modalPayment)"
                                    type="button"
                                    @click="openDeleteReceiptConfirmModal"
                                    :disabled="deletingReceipt"
                                    class="inline-flex items-center gap-1.5 text-sm text-red-600 hover:text-red-800 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    <Icon icon="mdi:trash-outline" class="w-4 h-4" />
                                    Delete receipt
                                </button>
                            </div>

                            <!-- Admin approval actions -->
                            <div
                                v-if="
                                    canApprovePayments &&
                                    modalPayment.payment_status === 'pending' &&
                                    !isPaymentExpired(modalPayment)
                                "
                                class="rounded-lg bg-amber-50 border border-amber-200 p-4 space-y-3"
                            >
                                <p class="text-sm font-semibold text-amber-800 flex items-center gap-1.5">
                                    <Icon icon="mdi:shield-check-outline" class="w-4 h-4" />
                                    Approval
                                </p>

                                <!-- Reject form -->
                                <div v-if="showRejectForm" class="space-y-3">
                                    <div class="space-y-1">
                                        <label for="reject-notes" class="block text-xs font-medium text-gray-700">
                                            Reason for rejection
                                            <span class="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            id="reject-notes"
                                            v-model="rejectNotes"
                                            rows="3"
                                            placeholder="Describe why this payment is being rejected…"
                                            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                                        />
                                    </div>
                                    <div class="flex gap-2">
                                        <CButton
                                            preset="danger"
                                            size="sm"
                                            :disabled="!rejectNotes.trim() || submittingApproval"
                                            @click="handleRejectSubmit"
                                        >
                                            Confirm Rejection
                                        </CButton>
                                        <CButton
                                            preset="outlined-black"
                                            size="sm"
                                            :disabled="submittingApproval"
                                            @click="showRejectForm = false"
                                        >
                                            Cancel
                                        </CButton>
                                    </div>
                                </div>

                                <!-- Approve / Reject buttons -->
                                <div v-else class="space-y-3">
                                    <div class="space-y-1">
                                        <label for="approve-notes" class="block text-xs font-medium text-gray-700">
                                            Notes (optional)
                                        </label>
                                        <input
                                            id="approve-notes"
                                            v-model="approveNotes"
                                            type="text"
                                            placeholder="Add a note…"
                                            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div class="flex gap-2">
                                        <CButton
                                            preset="success"
                                            size="sm"
                                            :disabled="submittingApproval"
                                            @click="handleApproveSubmit"
                                        >
                                            <Icon icon="mdi:check" class="w-4 h-4 mr-1" />
                                            Approve & Add Credits
                                        </CButton>
                                        <CButton
                                            preset="outlined-black"
                                            size="sm"
                                            :disabled="submittingApproval"
                                            @click="showRejectForm = true"
                                        >
                                            <Icon icon="mdi:close" class="w-4 h-4 mr-1" />
                                            Reject
                                        </CButton>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- No payment yet -->
                        <div v-else class="rounded-lg bg-gray-50 border border-gray-200 p-4 text-center">
                            <Icon icon="mdi:credit-card-off-outline" class="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            <p class="text-sm text-gray-500">No payment registered yet for this purchase</p>
                        </div>
                    </div>

                    <!-- Modal footer -->
                    <div class="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                        <div>
                            <CButton
                                v-if="purchase.status !== 'approved'"
                                preset="danger"
                                size="sm"
                                :disabled="cancellingPurchase"
                                @click="openCancelConfirmModal"
                                class="inline-flex items-center gap-1.5"
                            >
                                <Icon icon="mdi:close-circle-outline" class="w-4 h-4" />
                                Cancel Purchase
                            </CButton>
                        </div>
                        <CButton preset="outlined-black" @click="handleClose">Close</CButton>
                    </div>
                </div>
            </div>
        </div>

        <!-- Cancel Purchase Confirmation Modal -->
        <ConfirmModal
            v-model:isOpen="showCancelConfirmModal"
            title="Cancel Purchase?"
            message="This action cannot be undone. Are you sure you want to cancel this purchase?"
            confirmText="Yes, Cancel"
            cancelText="Keep Purchase"
            variant="danger"
            @confirm="handleCancelPurchaseConfirm"
        />

        <!-- Delete Receipt Confirmation Modal -->
        <ConfirmModal
            v-model:isOpen="showDeleteReceiptConfirmModal"
            title="Delete Receipt?"
            message="This will delete the uploaded receipt from storage. Are you sure you want to proceed?"
            confirmText="Yes, Delete"
            cancelText="Keep Receipt"
            variant="danger"
            @confirm="handleDeleteReceiptConfirm"
        />
    </Teleport>
</template>

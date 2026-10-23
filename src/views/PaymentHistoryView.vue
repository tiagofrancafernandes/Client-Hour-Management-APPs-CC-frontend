<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';
import type { CreditPurchase, CreditPurchasePayment, TypeaheadOption } from '@/types';
import { useCreditPurchases } from '@composables/useCreditPurchases';
import { usePermissions } from '@composables/usePermissions';
import { useClients } from '@composables/useClients';
import { useWallets } from '@composables/useWallets';
import { useToast } from '@composables/useToast';
import CPaymentHistoryFilters, {
    type PaymentHistoryFilterState,
} from '@components/CPaymentHistoryFilters.vue';
import CPaymentHistoryTable from '@components/CPaymentHistoryTable.vue';
import CPurchaseDetailModal from '@components/CPurchaseDetailModal.vue';
import CPaymentHistoryInstructionsModal from '@components/CPaymentHistoryInstructionsModal.vue';

const {
    purchases,
    loading,
    error,
    fetchPurchases,
    setPaymentMethod,
    uploadReceipt,
    downloadReceipt,
    deleteReceipt,
    cancelPurchase,
    approvePayment,
    rejectPayment,
} = useCreditPurchases();

const route = useRoute();
const router = useRouter();
const { canApprovePayments, canViewAnyReports, canViewClients } = usePermissions();
const { clients, fetchClients } = useClients();
const { wallets, fetchWallets } = useWallets();
const toast = useToast();

// ─── Auto-open item on mount ────────────────────────────────────────────────
const itemToOpen = ref<number | null>(null);

// ─── Filters ────────────────────────────────────────────────────────────────
const showFilters = ref(true);

const filters = ref<PaymentHistoryFilterState>({
    dateFrom: '',
    dateTo: '',
    purchaseStatus: '',
    paymentStatus: 'pending',
    paymentMethod: '',
    walletId: null,
    clientId: null,
});

let filterDebounceTimer: ReturnType<typeof setTimeout> | null = null;

async function fetchPurchasesXd(): Promise<void> {
    const params = Object.fromEntries(
        Object.entries(filters.value || {}).filter(([, value]) => value !== null && value !== '' && value !== undefined)
    );

    await fetchPurchases(params);
}

watch(
    filters,
    () => {
        updateUrlFromFilters();

        if (filterDebounceTimer !== null) {
            clearTimeout(filterDebounceTimer);
        }

        filterDebounceTimer = setTimeout(async () => {
            await fetchPurchasesXd();
        }, 400);
    },
    { deep: true }
);

// ─── Typeahead options ───────────────────────────────────────────────────────
const walletOptions = computed<TypeaheadOption[]>(() => {
    return wallets.value.map((wallet) => ({
        value: wallet.id,
        label: wallet.name,
    }));
});

const clientOptions = computed<TypeaheadOption[]>(() => {
    return clients.value.map((client) => ({
        value: client.id,
        label: client.name,
    }));
});

async function refreshWalletOptions(): Promise<TypeaheadOption[]> {
    await fetchWallets(undefined, 1);
    return walletOptions.value;
}

async function refreshClientOptions({ searchTerm }: { searchTerm: string }): Promise<TypeaheadOption[]> {
    if (!canViewClients.value) {
        return [];
    }

    await fetchClients(1, searchTerm || '');
    return clientOptions.value;
}

function resetFilters(): void {
    filters.value = {
        dateFrom: '',
        dateTo: '',
        purchaseStatus: '',
        paymentStatus: '',
        paymentMethod: '',
        walletId: null,
        clientId: null,
    };
}

// ─── Filtered data ───────────────────────────────────────────────────────────
const filteredPurchases = computed(() => {
    return purchases.value.filter((purchase) => {
        if (filters.value.dateFrom) {
            if (new Date(purchase.created_at) < new Date(filters.value.dateFrom)) {
                return false;
            }
        }

        if (filters.value.dateTo) {
            const to = new Date(filters.value.dateTo);
            to.setHours(23, 59, 59, 999);

            if (new Date(purchase.created_at) > to) {
                return false;
            }
        }

        if (filters.value.purchaseStatus && purchase.status !== filters.value.purchaseStatus) {
            return false;
        }

        if (filters.value.walletId && purchase.wallet_id !== filters.value.walletId) {
            return false;
        }

        if (filters.value.clientId && purchase.wallet?.client?.id !== filters.value.clientId) {
            return false;
        }

        const payment = purchase.payments?.[0];

        if (filters.value.paymentStatus) {
            if (!payment || payment.payment_status !== filters.value.paymentStatus) {
                return false;
            }
        }

        if (filters.value.paymentMethod) {
            if (filters.value.paymentMethod === 'none') {
                if (payment?.payment_method !== null) {
                    return false;
                }
            } else {
                if (payment?.payment_method?.key !== filters.value.paymentMethod) {
                    return false;
                }
            }
        }

        return true;
    });
});

const activeFiltersCount = computed(() => {
    let count = 0;

    if (filters.value.dateFrom) count++;
    if (filters.value.dateTo) count++;
    if (filters.value.purchaseStatus) count++;
    if (filters.value.paymentStatus) count++;
    if (filters.value.paymentMethod) count++;
    if (filters.value.walletId) count++;
    if (filters.value.clientId) count++;

    return count;
});

// ─── Modals State ────────────────────────────────────────────────────────────
const modalOpen = ref(false);
const selectedPurchase = ref<CreditPurchase | null>(null);
const showPaymentInstructions = ref(false);

const modalPayment = computed<CreditPurchasePayment | null>(() => {
    return selectedPurchase.value?.payments?.[0] ?? null;
});

function openModal(purchase: CreditPurchase): void {
    selectedPurchase.value = purchase;
    modalOpen.value = true;
}

function closeModal(): void {
    modalOpen.value = false;
    selectedPurchase.value = null;
}

// ─── Modal actions ───────────────────────────────────────────────────────────
const submittingMethod = ref(false);
const submittingReceipt = ref(false);
const submittingApproval = ref(false);
const deletingReceipt = ref(false);
const cancellingPurchase = ref(false);

async function reloadPurchase(): Promise<void> {
    await fetchPurchasesXd();

    if (selectedPurchase.value) {
        const refreshed = purchases.value.find((p) => p.id === selectedPurchase.value?.id);

        if (refreshed) {
            selectedPurchase.value = refreshed;
        }
    }
}

async function handleSetMethod(method: 'bank_transfer' | 'pix_offline'): Promise<void> {
    if (!selectedPurchase.value || !modalPayment.value || !method) {
        return;
    }

    submittingMethod.value = true;

    try {
        await setPaymentMethod(selectedPurchase.value.id, modalPayment.value.id, method);
        toast.success('Payment method updated successfully');
        await reloadPurchase();
    } catch {
        toast.error('Failed to update payment method');
    } finally {
        submittingMethod.value = false;
    }
}

async function handleUploadReceipt(file: File): Promise<void> {
    if (!selectedPurchase.value || !modalPayment.value || !file) {
        return;
    }

    submittingReceipt.value = true;

    try {
        await uploadReceipt(selectedPurchase.value.id, modalPayment.value.id, file);
        toast.success('Receipt uploaded successfully');
        await reloadPurchase();
    } catch {
        toast.error('Failed to upload receipt');
    } finally {
        submittingReceipt.value = false;
    }
}

async function handleDownloadReceipt(): Promise<void> {
    if (!modalPayment.value) {
        return;
    }

    try {
        await downloadReceipt(modalPayment.value.id);
    } catch {
        toast.error('Failed to download receipt');
    }
}

async function handleDeleteReceipt(): Promise<void> {
    if (!selectedPurchase.value || !modalPayment.value) {
        return;
    }

    deletingReceipt.value = true;

    try {
        await deleteReceipt(selectedPurchase.value.id, modalPayment.value.id);
        toast.success('Receipt deleted successfully');
        await reloadPurchase();
    } catch {
        toast.error('Failed to delete receipt');
    } finally {
        deletingReceipt.value = false;
    }
}

async function handleApprove(notes: string): Promise<void> {
    if (!modalPayment.value) {
        return;
    }

    submittingApproval.value = true;

    try {
        await approvePayment(modalPayment.value.id, notes || undefined);
        toast.success('Payment approved and credits added to wallet');
        await reloadPurchase();
    } catch {
        toast.error('Failed to approve payment');
    } finally {
        submittingApproval.value = false;
    }
}

async function handleReject(notes: string): Promise<void> {
    if (!modalPayment.value || !notes.trim()) {
        toast.error('Reason is required for rejection');
        return;
    }

    submittingApproval.value = true;

    try {
        await rejectPayment(modalPayment.value.id, notes);
        toast.success('Payment rejected');
        await reloadPurchase();
    } catch {
        toast.error('Failed to reject payment');
    } finally {
        submittingApproval.value = false;
    }
}

async function handleCancelPurchase(): Promise<void> {
    if (!selectedPurchase.value) {
        return;
    }

    cancellingPurchase.value = true;

    try {
        await cancelPurchase(selectedPurchase.value.id);
        toast.success('Purchase cancelled successfully');
        closeModal();
        await reloadPurchase();
    } catch {
        toast.error('Failed to cancel purchase');
    } finally {
        cancellingPurchase.value = false;
    }
}

async function handleRefreshList(): Promise<void> {
    await fetchPurchasesXd();
}

// ─── Lifecycle ───────────────────────────────────────────────────────────────
onMounted(async () => {
    const toOpenParam = route.query.to_open;
    if (toOpenParam) {
        itemToOpen.value = Number(toOpenParam);
    }

    updateUrlFromFilters();

    await Promise.all([fetchPurchasesXd(), fetchClients(1, ''), fetchWallets()]);

    if (itemToOpen.value && purchases.value.length > 0) {
        const item = purchases.value.find((p) => p.id === itemToOpen.value);
        if (item) {
            selectedPurchase.value = item;
            modalOpen.value = true;
        }
    }
});

// ─── URL Synchronization ────────────────────────────────────────────────────
function updateUrlFromFilters(): void {
    const query: Record<string, any> = {};

    if (filters.value.dateFrom) query.dateFrom = filters.value.dateFrom;
    if (filters.value.dateTo) query.dateTo = filters.value.dateTo;
    if (filters.value.purchaseStatus) query.purchaseStatus = filters.value.purchaseStatus;
    if (filters.value.paymentStatus) query.paymentStatus = filters.value.paymentStatus;
    if (filters.value.paymentMethod) query.paymentMethod = filters.value.paymentMethod;
    if (filters.value.walletId) query.walletId = filters.value.walletId;
    if (filters.value.clientId) query.clientId = filters.value.clientId;

    if (itemToOpen.value) {
        query.to_open = itemToOpen.value;
        query.ids = itemToOpen.value;
    }

    router.replace({ query });
}
</script>

<template>
    <div class="container mx-auto px-4 py-6 max-w-7xl">
        <!-- Page header -->
        <div class="flex items-center justify-between mb-5">
            <div>
                <h1 class="text-lg sm:text-xl font-semibold tracking-tight text-slate-900">Payment History</h1>
                <p class="text-xs text-slate-500 mt-0.5">Track and manage credit purchases and payment statuses</p>
            </div>

            <div class="flex items-center gap-2">
                <button
                    type="button"
                    @click="showFilters = !showFilters"
                    :class="[
                        'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors cursor-pointer',
                        {
                            'bg-red-50 text-red-700 border-red-200': showFilters,
                            'bg-white text-slate-700 border-slate-300 hover:bg-slate-50': !showFilters,
                        },
                    ]"
                >
                    <Icon icon="mdi:filter-outline" class="w-3.5 h-3.5" />
                    Filters
                    <span
                        v-if="activeFiltersCount > 0"
                        class="inline-flex items-center justify-center px-1.5 py-0.2 rounded-full text-2xs font-semibold bg-red-600 text-white"
                    >
                        {{ activeFiltersCount }}
                    </span>
                </button>

                <button
                    type="button"
                    @click="handleRefreshList"
                    :disabled="loading"
                    class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors cursor-pointer"
                >
                    <Icon icon="mdi:refresh" :class="['w-3.5 h-3.5', { 'animate-spin': loading }]" />
                    Refresh
                </button>
            </div>
        </div>

        <!-- Error state -->
        <div v-if="error" class="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
            {{ error }}
        </div>

        <!-- Filter panel component -->
        <CPaymentHistoryFilters
            :show="showFilters"
            :filters="filters"
            :wallet-options="walletOptions"
            :client-options="clientOptions"
            :can-view-any-reports="canViewAnyReports"
            :active-filters-count="activeFiltersCount"
            :refresh-wallet-options="refreshWalletOptions"
            :refresh-client-options="refreshClientOptions"
            @reset="resetFilters"
        />

        <!-- Table and list component -->
        <CPaymentHistoryTable
            :purchases="filteredPurchases"
            :total-count="purchases.length"
            :loading="loading"
            :can-view-any-reports="canViewAnyReports"
            @select="openModal"
            @clear-filters="resetFilters"
        />

        <!-- ─── Purchase Detail Modal Component ─────────────────────────────── -->
        <CPurchaseDetailModal
            :is-open="modalOpen"
            :purchase="selectedPurchase"
            :can-view-any-reports="canViewAnyReports"
            :can-approve-payments="canApprovePayments"
            :submitting-method="submittingMethod"
            :submitting-receipt="submittingReceipt"
            :submitting-approval="submittingApproval"
            :cancelling-purchase="cancellingPurchase"
            :deleting-receipt="deletingReceipt"
            @close="closeModal"
            @set-method="handleSetMethod"
            @upload-receipt="handleUploadReceipt"
            @download-receipt="handleDownloadReceipt"
            @delete-receipt="handleDeleteReceipt"
            @approve="handleApprove"
            @reject="handleReject"
            @cancel-purchase="handleCancelPurchase"
            @view-instructions="showPaymentInstructions = true"
        />

        <!-- ─── Payment Instructions Modal Component ───────────────────────── -->
        <CPaymentHistoryInstructionsModal
            :show="showPaymentInstructions"
            :modal-payment="modalPayment"
            :selected-purchase="selectedPurchase"
            @close="showPaymentInstructions = false"
        />
    </div>
</template>

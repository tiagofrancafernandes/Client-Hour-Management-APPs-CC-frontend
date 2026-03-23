import { ref } from 'vue';
import api from '@/services/api';
import type { CreditPurchase, CreditPurchasePayment } from '@/types';

export function useCreditPurchases() {
    const purchases = ref<CreditPurchase[]>([]);
    const purchase = ref<CreditPurchase | null>(null);
    const payment = ref<CreditPurchasePayment | null>(null);
    const loading = ref(false);
    const error = ref<string | null>(null);

    async function fetchPurchases(walletId?: number) {
        loading.value = true;
        error.value = null;

        try {
            const params = walletId ? { wallet_id: walletId } : {};
            const response = await api.get<{ data: CreditPurchase[] }>('/credit-purchases', { params });
            purchases.value = response.data;
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Failed to fetch credit purchases';
        } finally {
            loading.value = false;
        }
    }

    async function createPurchase(walletId: number, totalHours: number, totalPrice: number) {
        loading.value = true;
        error.value = null;

        try {
            const response = await api.post<{ data: CreditPurchase }>('/credit-purchases', {
                wallet_id: walletId,
                total_hours: totalHours,
                total_price: totalPrice,
            });

            purchases.value.push(response.data);
            purchase.value = response.data;

            return response.data;
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Failed to create credit purchase';
            throw e;
        } finally {
            loading.value = false;
        }
    }

    async function getPurchase(purchaseId: number) {
        loading.value = true;
        error.value = null;

        try {
            const response = await api.get<CreditPurchase>(`/credit-purchases/${purchaseId}`);
            purchase.value = response;
            return response;
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Failed to fetch credit purchase';
            throw e;
        } finally {
            loading.value = false;
        }
    }

    async function createPayment(purchaseId: number, paymentMethod: 'pix_offline' | 'bank_transfer') {
        loading.value = true;
        error.value = null;

        try {
            const response = await api.post<{ data: CreditPurchasePayment }>(
                `/credit-purchases/${purchaseId}/payments`,
                {
                    payment_method: paymentMethod,
                }
            );

            payment.value = response.data;

            return response.data;
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Failed to create payment';
            throw e;
        } finally {
            loading.value = false;
        }
    }

    async function uploadReceipt(purchaseId: number, paymentId: number, file: File) {
        loading.value = true;
        error.value = null;

        try {
            const formData = new FormData();
            formData.append('receipt', file);

            const response = await api.post<{ data: CreditPurchasePayment }>(
                `/credit-purchases/${purchaseId}/payments/${paymentId}/upload-receipt`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            payment.value = response.data;

            return response.data;
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Failed to upload receipt';
            throw e;
        } finally {
            loading.value = false;
        }
    }

    async function getReceiptUrl(paymentId: number) {
        loading.value = true;
        error.value = null;

        try {
            const response = await api.get<{ url: string }>(`/payments/${paymentId}/receipt-url`);

            return response.url;
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Failed to get receipt URL';
            throw e;
        } finally {
            loading.value = false;
        }
    }

    return {
        purchases,
        purchase,
        payment,
        loading,
        error,
        fetchPurchases,
        createPurchase,
        getPurchase,
        createPayment,
        uploadReceipt,
        getReceiptUrl,
    };
}

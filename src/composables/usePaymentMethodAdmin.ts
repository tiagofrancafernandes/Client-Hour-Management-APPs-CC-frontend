import { ref, computed } from 'vue';
import { api } from '@/services/api';
import { useToast } from '@/composables/useToast';

interface PaymentMethodConfig {
    id: number;
    payment_method_key: string;
    label: string;
    is_active: boolean;
    instructions: string | null;
    display_order: number;
    created_at: string;
    updated_at: string;
}

interface FetchConfigsParams {
    search?: string;
    active?: boolean;
    per_page?: number;
    page?: number;
}

interface PaginatedResponse {
    data: PaymentMethodConfig[];
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
    from: number | null;
    to: number | null;
}

export function usePaymentMethodAdmin() {
    const toast = useToast();
    const configs = ref<PaymentMethodConfig[]>([]);
    const loading = ref(false);
    const updating = ref(false);
    const error = ref<string | null>(null);
    const pagination = ref({
        current_page: 1,
        last_page: 1,
        total: 0,
    });

    async function fetchConfigs(params: FetchConfigsParams = {}): Promise<void> {
        loading.value = true;
        error.value = null;

        try {
            const queryParams = new URLSearchParams();

            if (params.search) {
                queryParams.append('search', params.search);
            }

            if (params.active !== undefined) {
                queryParams.append('active', String(params.active));
            }

            if (params.per_page) {
                queryParams.append('per_page', String(params.per_page));
            }

            if (params.page) {
                queryParams.append('page', String(params.page));
            }

            const response = await api.get<PaginatedResponse>(
                `/admin/payment-method-configs?${queryParams.toString()}`
            );

            configs.value = response.data.data;
            pagination.value = {
                current_page: response.data.current_page,
                last_page: response.data.last_page,
                total: response.data.total,
            };
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Erro ao carregar métodos de pagamento';
            toast.error(error.value);
        } finally {
            loading.value = false;
        }
    }

    async function updateConfig(
        id: number,
        data: Partial<PaymentMethodConfig>
    ): Promise<boolean> {
        updating.value = true;

        try {
            const response = await api.put<PaymentMethodConfig>(
                `/admin/payment-method-configs/${id}`,
                data
            );

            const index = configs.value.findIndex((c) => c.id === id);
            if (index !== -1) {
                configs.value[index] = response.data;
            }

            toast.success('Método de pagamento atualizado com sucesso');
            return true;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao atualizar método de pagamento';
            toast.error(message);
            return false;
        } finally {
            updating.value = false;
        }
    }

    async function toggleConfig(id: number): Promise<boolean> {
        updating.value = true;

        try {
            const response = await api.post<{ payment_method_config: PaymentMethodConfig }>(
                `/admin/payment-method-configs/${id}/toggle`
            );

            const index = configs.value.findIndex((c) => c.id === id);
            if (index !== -1) {
                configs.value[index] = response.data.payment_method_config;
            }

            const newStatus = response.data.payment_method_config.is_active ? 'ativado' : 'desativado';
            toast.success(`Método de pagamento ${newStatus}`);
            return true;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao alternar método de pagamento';
            toast.error(message);
            return false;
        } finally {
            updating.value = false;
        }
    }

    return {
        configs,
        loading,
        updating,
        error,
        pagination,
        fetchConfigs,
        updateConfig,
        toggleConfig,
    };
}

import { ref, computed } from 'vue';
import { api } from '@/services/api';

interface PaymentMethod {
    key: string;
    name: string;
    label: string;
    is_active: boolean;
    is_offline: boolean;
    currency: string | null;
    instructions: string | null;
    display_order: number;
    expires_time: string | null;
}

export function usePaymentMethodConfigs() {
    const methods = ref<PaymentMethod[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    const activeMethods = computed(() => {
        return methods.value.filter((m) => m.is_active);
    });

    async function fetchMethods(): Promise<void> {
        loading.value = true;
        error.value = null;

        try {
            const response = await api.get<{ methods: PaymentMethod[] }>('/payment-methods');
            methods.value = response.data.methods;
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Failed to fetch payment methods';
        } finally {
            loading.value = false;
        }
    }

    function getInstructionsFor(key: string): string | null {
        const method = methods.value.find((m) => m.key === key);
        return method?.instructions ?? null;
    }

    function getMethodBy(key: string): PaymentMethod | undefined {
        return methods.value.find((m) => m.key === key);
    }

    return {
        methods,
        activeMethods,
        loading,
        error,
        fetchMethods,
        getInstructionsFor,
        getMethodBy,
    };
}

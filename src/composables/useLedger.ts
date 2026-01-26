import { ref } from 'vue';
import api from '@/services/api';
import type { LedgerEntry, LedgerEntryForm } from '@/types';

interface CreateEntryResponse {
    entry: LedgerEntry;
    new_balance: string;
}

export function useLedger() {
    const loading = ref(false);
    const error = ref<string | null>(null);

    async function createEntry(data: LedgerEntryForm): Promise<CreateEntryResponse> {
        loading.value = true;
        error.value = null;

        try {
            const response = await api.post<CreateEntryResponse>('/ledger-entries', data);

            return response;
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Failed to create entry';

            throw e;
        } finally {
            loading.value = false;
        }
    }

    async function fetchEntry(id: number): Promise<LedgerEntry> {
        loading.value = true;
        error.value = null;

        try {
            return await api.get<LedgerEntry>(`/ledger-entries/${id}`);
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Failed to fetch entry';

            throw e;
        } finally {
            loading.value = false;
        }
    }

    return {
        loading,
        error,
        createEntry,
        fetchEntry,
    };
}

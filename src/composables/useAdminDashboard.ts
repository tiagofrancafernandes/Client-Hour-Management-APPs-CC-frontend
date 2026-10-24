import { ref } from 'vue';
import api from '@/services/api';
import { useToast } from '@/composables/useToast';
import type {
    DashboardStats,
    DashboardRecentEntry,
    DashboardRecentClient,
    DashboardRecentInvoice,
} from '@/types/dashboard';

export function useAdminDashboard() {
    const toast = useToast();

    // Stats State
    const stats = ref<DashboardStats | null>(null);
    const statsLoading = ref(false);

    // Recent Entries State
    const recentEntries = ref<DashboardRecentEntry[]>([]);
    const entriesLoading = ref(false);
    const entriesOrderBy = ref<'created_at' | 'reference_date' | 'hours'>('created_at');
    const entriesOrderDirection = ref<'asc' | 'desc'>('desc');
    const entriesLimit = ref(5);

    // Recent Clients State
    const recentClients = ref<DashboardRecentClient[]>([]);
    const clientsLoading = ref(false);
    const clientsOrderBy = ref<'created_at' | 'name'>('created_at');
    const clientsOrderDirection = ref<'asc' | 'desc'>('desc');
    const clientsLimit = ref(5);

    // Recent Invoices State
    const recentInvoices = ref<DashboardRecentInvoice[]>([]);
    const invoicesLoading = ref(false);
    const invoicesOrderBy = ref<'created_at' | 'issue_date' | 'total'>('created_at');
    const invoicesOrderDirection = ref<'asc' | 'desc'>('desc');
    const invoicesLimit = ref(5);

    // Global loading state
    const globalLoading = ref(false);

    /**
     * Fetch aggregated statistics with optional cache invalidation.
     */
    async function fetchStats(refresh = false): Promise<void> {
        statsLoading.value = true;

        try {
            const query = refresh ? '?refresh=true' : '';
            const res: any = await api.get(`/dashboard/stats${query}`);
            stats.value = res?.data || null;

            if (refresh) {
                toast.success('Stats cache refreshed successfully');
            }
        } catch (err: any) {
            toast.error(err?.message || 'Failed to load dashboard stats');
        } finally {
            statsLoading.value = false;
        }
    }

    /**
     * Fetch recent ledger entries with optional sorting and cache invalidation.
     */
    async function fetchRecentEntries(refresh = false): Promise<void> {
        entriesLoading.value = true;

        try {
            const params = new URLSearchParams({
                order_by: entriesOrderBy.value,
                order_direction: entriesOrderDirection.value,
                limit: String(entriesLimit.value),
            });

            if (refresh) {
                params.set('refresh', 'true');
            }

            const res: any = await api.get(`/dashboard/recent-entries?${params.toString()}`);
            recentEntries.value = Array.isArray(res?.data) ? res.data : [];

            if (refresh) {
                toast.success('Recent entries cache refreshed');
            }
        } catch (err: any) {
            toast.error(err?.message || 'Failed to load recent ledger entries');
        } finally {
            entriesLoading.value = false;
        }
    }

    /**
     * Fetch recent clients with optional sorting and cache invalidation.
     */
    async function fetchRecentClients(refresh = false): Promise<void> {
        clientsLoading.value = true;

        try {
            const params = new URLSearchParams({
                order_by: clientsOrderBy.value,
                order_direction: clientsOrderDirection.value,
                limit: String(clientsLimit.value),
            });

            if (refresh) {
                params.set('refresh', 'true');
            }

            const res: any = await api.get(`/dashboard/recent-clients?${params.toString()}`);
            recentClients.value = Array.isArray(res?.data) ? res.data : [];

            if (refresh) {
                toast.success('Recent clients cache refreshed');
            }
        } catch (err: any) {
            toast.error(err?.message || 'Failed to load recent clients');
        } finally {
            clientsLoading.value = false;
        }
    }

    /**
     * Fetch recent invoices with optional sorting and cache invalidation.
     */
    async function fetchRecentInvoices(refresh = false): Promise<void> {
        invoicesLoading.value = true;

        try {
            const params = new URLSearchParams({
                order_by: invoicesOrderBy.value,
                order_direction: invoicesOrderDirection.value,
                limit: String(invoicesLimit.value),
            });

            if (refresh) {
                params.set('refresh', 'true');
            }

            const res: any = await api.get(`/dashboard/recent-invoices?${params.toString()}`);
            recentInvoices.value = Array.isArray(res?.data) ? res.data : [];

            if (refresh) {
                toast.success('Recent invoices cache refreshed');
            }
        } catch (err: any) {
            toast.error(err?.message || 'Failed to load recent invoices');
        } finally {
            invoicesLoading.value = false;
        }
    }

    /**
     * Refresh all dashboard widgets in parallel.
     */
    async function refreshAll(clearCache = false): Promise<void> {
        globalLoading.value = true;

        try {
            if (clearCache) {
                await api.post('/dashboard/clear-cache');
            }

            await Promise.all([
                fetchStats(clearCache),
                fetchRecentEntries(clearCache),
                fetchRecentClients(clearCache),
                fetchRecentInvoices(clearCache),
            ]);

            if (clearCache) {
                toast.success('All dashboard caches cleared and reloaded');
            }
        } catch (err: any) {
            toast.error(err?.message || 'Failed to refresh dashboard');
        } finally {
            globalLoading.value = false;
        }
    }

    return {
        // Stats
        stats,
        statsLoading,
        fetchStats,

        // Entries
        recentEntries,
        entriesLoading,
        entriesOrderBy,
        entriesOrderDirection,
        entriesLimit,
        fetchRecentEntries,

        // Clients
        recentClients,
        clientsLoading,
        clientsOrderBy,
        clientsOrderDirection,
        clientsLimit,
        fetchRecentClients,

        // Invoices
        recentInvoices,
        invoicesLoading,
        invoicesOrderBy,
        invoicesOrderDirection,
        invoicesLimit,
        fetchRecentInvoices,

        // Global
        globalLoading,
        refreshAll,
    };
}

<script setup lang="ts">
import { onMounted, watch } from 'vue';
import AdminLayout from '@/layouts/AdminLayout.vue';
import DashboardHeader from '@/components/dashboard/DashboardHeader.vue';
import DashboardStatsGrid from '@/components/dashboard/DashboardStatsGrid.vue';
import DashboardRecentEntriesCard from '@/components/dashboard/DashboardRecentEntriesCard.vue';
import DashboardRecentClientsCard from '@/components/dashboard/DashboardRecentClientsCard.vue';
import DashboardRecentInvoicesCard from '@/components/dashboard/DashboardRecentInvoicesCard.vue';
import { useAdminDashboard } from '@/composables/useAdminDashboard';

const {
    stats,
    statsLoading,
    fetchStats,

    recentEntries,
    entriesLoading,
    entriesOrderBy,
    entriesOrderDirection,
    fetchRecentEntries,

    recentClients,
    clientsLoading,
    clientsOrderBy,
    clientsOrderDirection,
    fetchRecentClients,

    recentInvoices,
    invoicesLoading,
    invoicesOrderBy,
    invoicesOrderDirection,
    fetchRecentInvoices,

    globalLoading,
    refreshAll,
} = useAdminDashboard();

// Watch sort order changes to automatically refetch
watch([entriesOrderBy, entriesOrderDirection], () => {
    fetchRecentEntries(false);
});

watch([clientsOrderBy, clientsOrderDirection], () => {
    fetchRecentClients(false);
});

watch([invoicesOrderBy, invoicesOrderDirection], () => {
    fetchRecentInvoices(false);
});

onMounted(() => {
    refreshAll(false);
});
</script>

<template>
    <AdminLayout>
        <div class="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
            <!-- Dashboard Header -->
            <DashboardHeader
                :cached-at="stats?.cached_at"
                :loading="globalLoading"
                @refresh-all="refreshAll(true)"
            />

            <!-- Top Resource Stats Grid (6 cards) -->
            <DashboardStatsGrid
                :stats="stats"
                :loading="statsLoading"
                @clear-cache="fetchStats(true)"
            />

            <!-- Recent Activity Sections -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- 1. Recent Ledger Entries (Spans 2 columns on 2xl or 1 on lg) -->
                <div class="lg:col-span-2">
                    <DashboardRecentEntriesCard
                        v-model:order-by="entriesOrderBy"
                        v-model:order-direction="entriesOrderDirection"
                        :entries="recentEntries"
                        :loading="entriesLoading"
                        @clear-cache="fetchRecentEntries(true)"
                    />
                </div>

                <!-- 2. Recent Clients -->
                <div>
                    <DashboardRecentClientsCard
                        v-model:order-by="clientsOrderBy"
                        v-model:order-direction="clientsOrderDirection"
                        :clients="recentClients"
                        :loading="clientsLoading"
                        @clear-cache="fetchRecentClients(true)"
                    />
                </div>

                <!-- 3. Recent Invoices -->
                <div>
                    <DashboardRecentInvoicesCard
                        v-model:order-by="invoicesOrderBy"
                        v-model:order-direction="invoicesOrderDirection"
                        :invoices="recentInvoices"
                        :loading="invoicesLoading"
                        @clear-cache="fetchRecentInvoices(true)"
                    />
                </div>
            </div>
        </div>
    </AdminLayout>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { DashboardStats } from '@/types/dashboard';
import DashboardStatCard from './DashboardStatCard.vue';
import { formatHoursDisplay } from '@/utils/timeFormatters';

const props = defineProps<{
    stats: DashboardStats | null;
    loading: boolean;
}>();

const emit = defineEmits<{
    (e: 'clear-cache'): void;
}>();

const formattedHours = computed(() => {
    if (!props.stats) {
        return '00:00';
    }

    return formatHoursDisplay(props.stats.ledger.net_hours, true);
});

const formattedHoursThisMonth = computed(() => {
    if (!props.stats) {
        return '+0h this month';
    }

    const net = props.stats.ledger.hours_this_month;
    const sign = net >= 0 ? '+' : '';
    return `${sign}${net.toFixed(1)}h this month`;
});
</script>

<template>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <!-- 1. Total Clients -->
        <DashboardStatCard
            title="Clients"
            :value="stats?.clients.total ?? 0"
            :secondary-label="`+${stats?.clients.this_month ?? 0} this month`"
            secondary-type="positive"
            icon="heroicons:users"
            icon-color="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400"
            to="/clients"
            :loading="loading"
            @clear-cache="emit('clear-cache')"
        />

        <!-- 2. Total Wallets -->
        <DashboardStatCard
            title="Wallets"
            :value="stats?.wallets.total ?? 0"
            :secondary-label="`+${stats?.wallets.this_month ?? 0} this month`"
            secondary-type="positive"
            icon="heroicons:wallet"
            icon-color="bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400"
            to="/clients"
            :loading="loading"
            @clear-cache="emit('clear-cache')"
        />

        <!-- 3. Net Ledger Hours -->
        <DashboardStatCard
            title="Net Hours"
            :value="formattedHours"
            :secondary-label="formattedHoursThisMonth"
            :secondary-type="(stats?.ledger.hours_this_month ?? 0) >= 0 ? 'positive' : 'negative'"
            icon="heroicons:clock"
            icon-color="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
            to="/reports"
            :loading="loading"
            @clear-cache="emit('clear-cache')"
        />

        <!-- 4. Invoices -->
        <DashboardStatCard
            title="Invoices"
            :value="stats?.invoices.total ?? 0"
            :secondary-label="`+${stats?.invoices.this_month ?? 0} this month`"
            secondary-type="info"
            icon="heroicons:document-text"
            icon-color="bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
            to="/invoices"
            :loading="loading"
            @clear-cache="emit('clear-cache')"
        />

        <!-- 5. Products & Services -->
        <DashboardStatCard
            title="Products / Services"
            :value="stats?.products_services.total ?? 0"
            :secondary-label="`${stats?.products_services.active ?? 0} active`"
            secondary-type="neutral"
            icon="heroicons:cube"
            icon-color="bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400"
            to="/products-services"
            :loading="loading"
            @clear-cache="emit('clear-cache')"
        />

        <!-- 6. Active Timers -->
        <DashboardStatCard
            title="Active Timers"
            :value="stats?.timers.active_count ?? 0"
            secondary-label="Running right now"
            :secondary-type="(stats?.timers.active_count ?? 0) > 0 ? 'positive' : 'neutral'"
            icon="heroicons:play"
            icon-color="bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"
            to="/timers"
            :loading="loading"
            @clear-cache="emit('clear-cache')"
        />
    </div>
</template>

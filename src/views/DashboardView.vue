<script setup lang="ts">
import { useAuth } from '@/composables/useAuth';
import CustomerDashboardView from '@/views/CustomerDashboardView.vue';
import AdminDashboardView from '@/views/AdminDashboardView.vue';

const { isCustomer } = useAuth();
</script>

<template>
    <CustomerDashboardView v-if="isCustomer" />
    <AdminDashboardView v-else />
</template>


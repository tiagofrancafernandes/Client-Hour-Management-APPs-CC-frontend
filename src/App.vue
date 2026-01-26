<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router';
</script>

<template>
    <div class="min-h-screen bg-gray-100">
        <nav class="bg-white shadow">
            <div class="container mx-auto px-4">
                <div class="flex h-16 items-center justify-between">
                    <div class="flex items-center gap-8">
                        <span class="text-xl font-bold text-gray-900">Hours Ledger</span>
                        <div class="flex gap-4">
                            <RouterLink
                                to="/clients"
                                class="text-gray-600 hover:text-gray-900"
                                active-class="text-blue-600 font-medium"
                            >
                                Clients
                            </RouterLink>
                            <RouterLink
                                to="/reports"
                                class="text-gray-600 hover:text-gray-900"
                                active-class="text-blue-600 font-medium"
                            >
                                Reports
                            </RouterLink>
                            <RouterLink
                                to="/tags"
                                class="text-gray-600 hover:text-gray-900"
                                active-class="text-blue-600 font-medium"
                            >
                                Tags
                            </RouterLink>
                        </div>
                    </div>
                </div>
            </div>
        </nav>

        <main>
            <RouterView />
        </main>
    </div>
</template>
